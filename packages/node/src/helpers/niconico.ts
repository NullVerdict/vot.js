import Logger from "@vot.js/shared/utils/logger";

import type { MinimalVideoData } from "../types/client";
import { BaseHelper, VideoHelperError } from "./base";

type NiconicoWatchApiResponse = {
  meta?: { status?: number; errorCode?: string; errorMessage?: string };
  data?: any;
};

type DmsAccessRightsResponse = {
  meta?: { status?: number; errorCode?: string; errorMessage?: string };
  data?: { contentUrl?: string };
};

type DmcSessionResponse = {
  data?: { session?: { content_uri?: string } };
};

type DmcSource = {
  id?: string;
  isAvailable?: boolean;
  metadata?: {
    bitrate?: number;
    resolution?: { height?: number; width?: number };
  };
};


const FRONTEND_ID = "6";
const FRONTEND_VERSION = "0";
const BASE_URL = "https://www.nicovideo.jp";
const NVAPI_BASE = "https://nvapi.nicovideo.jp";

const WATCH_HEADERS: Record<string, string> = {
  "X-Frontend-ID": FRONTEND_ID,
  "X-Frontend-Version": FRONTEND_VERSION,
  Accept: "application/json",
  Referer: `${BASE_URL}/`,
  Origin: BASE_URL,
};

const NVAPI_HEADERS: Record<string, string> = {
  "X-Frontend-ID": FRONTEND_ID,
  "X-Frontend-Version": FRONTEND_VERSION,
  Accept: "application/json;charset=utf-8",
  Referer: `${BASE_URL}/`,
  Origin: BASE_URL,
  // This header is used by the web app for nvapi calls
  "X-Request-With": BASE_URL,
};

function randomAlphaNum(len: number) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  // Browser / modern Node
  const cryptoObj: any = (globalThis as any).crypto;
  if (cryptoObj?.getRandomValues) {
    const arr = new Uint8Array(len);
    cryptoObj.getRandomValues(arr);
    return Array.from(arr, (b) => chars[b % chars.length]).join("");
  }

  // Fallback
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function makeActionTrackId() {
  // Expected shape: <10 alnum>_<unixMillis>
  return `${randomAlphaNum(10)}_${Date.now()}`;
}

function yesno(v: unknown) {
  return v ? "yes" : "no";
}

function pickBestBy<T>(items: T[], score: (t: T) => number): T | undefined {
  let best: T | undefined;
  let bestScore = -Infinity;
  for (const it of items) {
    const s = score(it);
    if (s > bestScore) {
      bestScore = s;
      best = it;
    }
  }
  return best;
}

export default class NiconicoHelper extends BaseHelper {
  async getVideoId(url: URL): Promise<string | undefined> {
    const host = url.hostname.toLowerCase();
    const path = url.pathname;

    // Short links: https://nico.ms/sm9
    if (host === "nico.ms") {
      const id = path.replace(/^\/+/, "").split("/")[0];
      const cleaned = decodeURIComponent(id ?? "").trim();
      return /^(?:[a-z]{2})?\d+$/i.test(cleaned) ? cleaned.toLowerCase() : undefined;
    }

    // Standard watch URLs: https://www.nicovideo.jp/watch/sm9
    // Embed URLs: https://embed.nicovideo.jp/watch/sm9
    const m = path.match(/\/watch\/([^/?#]+)/i);
    const candidate = decodeURIComponent(
      (m?.[1] ?? url.searchParams.get("v") ?? url.searchParams.get("video_id") ?? "").trim(),
    );

    // Align with yt-dlp: (?P<id>(?:[a-z]{2})?\d+)
    return /^(?:[a-z]{2})?\d+$/i.test(candidate) ? candidate.toLowerCase() : undefined;
  }

  private async fetchJson<T>(url: string, init?: any): Promise<T> {
    const res = await this.fetch(url, init);
    const text = await res.text();

    try {
      return (text ? (JSON.parse(text) as T) : ({} as T));
    } catch (err) {
      if (!res.ok) {
        throw new VideoHelperError(
          `NicoNico request failed: ${res.status} ${res.statusText}`,
        );
      }

      throw new VideoHelperError(
        `NicoNico: failed to parse JSON response (${res.status})`,
      );
    }
  }

  private async fetchWatchData(watchId: string): Promise<NiconicoWatchApiResponse> {
    const actionTrackId = makeActionTrackId();
    const apiUrl = new URL(`${BASE_URL}/api/watch/v3_guest/${encodeURIComponent(watchId)}`);
    apiUrl.searchParams.set("actionTrackId", actionTrackId);

    // Undocumented but commonly used by the web player
    apiUrl.searchParams.set("_frontendId", FRONTEND_ID);
    apiUrl.searchParams.set("_frontendVersion", FRONTEND_VERSION);

    return await this.fetchJson<NiconicoWatchApiResponse>(apiUrl.toString(), {
      headers: {
        ...WATCH_HEADERS,
      },
    });
  }

  private async tryExtractDmsHls(watchId: string, apiData: any): Promise<string | undefined> {
    const domand = apiData?.media?.domand;
    const accessRightKey: string | undefined = domand?.accessRightKey;
    const trackId: string | undefined = apiData?.client?.watchTrackId;

    const videos = Array.isArray(domand?.videos)
      ? domand.videos.filter((v: any) => v?.isAvailable && v?.id)
      : [];
    const audios = Array.isArray(domand?.audios)
      ? domand.audios.filter((a: any) => a?.isAvailable && a?.id)
      : [];

    if (!accessRightKey || !trackId || !videos.length || !audios.length) return undefined;

    const outputs: [string, string][] = [];
    for (const v of videos) {
      for (const a of audios) {
        outputs.push([String(v.id), String(a.id)]);
      }
    }

    const accessUrl = new URL(
      `${NVAPI_BASE}/v1/watch/${encodeURIComponent(watchId)}/access-rights/hls`,
    );
    accessUrl.searchParams.set("actionTrackId", trackId);

    const res = await this.fetchJson<DmsAccessRightsResponse>(accessUrl.toString(), {
      method: "POST",
      headers: {
        ...NVAPI_HEADERS,
        "X-Access-Right-Key": accessRightKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ outputs }),
    });

    if (res?.meta?.status && res.meta.status !== 200) {
      Logger.warn(
        `[NicoNico] access-rights/hls failed: ${res.meta.status} ${res.meta.errorCode ?? ""} ${res.meta.errorMessage ?? ""}`,
      );
      return undefined;
    }

    return res?.data?.contentUrl || undefined;
  }

  private async tryExtractDmcUrl(apiData: any): Promise<string | undefined> {
    const movie = apiData?.media?.delivery?.movie;
    const sessionApiData = movie?.session;
    const sessionEndpoint = sessionApiData?.urls?.[0]?.url as string | undefined;
    const isSsl = sessionApiData?.urls?.[0]?.isSsl;
    const isWellKnownPort = sessionApiData?.urls?.[0]?.isWellKnownPort;

    if (!movie || !sessionApiData || !sessionEndpoint) return undefined;

    const videos: DmcSource[] = Array.isArray(movie?.videos)
      ? (movie.videos as any[]).filter((v: any) => v?.isAvailable && v?.id)
      : [];
    const audios: DmcSource[] = Array.isArray(movie?.audios)
      ? (movie.audios as any[]).filter((a: any) => a?.isAvailable && a?.id)
      : [];

    const bestVideo = pickBestBy(
      videos,
      (v) =>
        Number(v?.metadata?.bitrate ?? 0) +
        Number(v?.metadata?.resolution?.height ?? 0) * 1000,
    );
    const bestAudio = pickBestBy(audios, (a) => Number(a?.metadata?.bitrate ?? 0));

    const videoSrcId = bestVideo?.id;
    const audioSrcId = bestAudio?.id;
    if (!videoSrcId || !audioSrcId) return undefined;

    const authTypes = sessionApiData?.authTypes ?? {};
    const authTypeForHttp = authTypes?.http ?? authTypes?.[sessionApiData?.protocols?.[0]];

    const postUrl = new URL(sessionEndpoint);
    postUrl.searchParams.set("_format", "json");

    const payload = {
      session: {
        client_info: { player_id: sessionApiData?.playerId },
        content_auth: {
          auth_type: authTypeForHttp,
          content_key_timeout: sessionApiData?.contentKeyTimeout,
          service_id: "nicovideo",
          service_user_id: String(sessionApiData?.serviceUserId ?? ""),
        },
        content_id: sessionApiData?.contentId,
        content_src_id_sets: [
          {
            content_src_ids: [
              {
                src_id_to_mux: {
                  audio_src_ids: [audioSrcId],
                  video_src_ids: [videoSrcId],
                },
              },
            ],
          },
        ],
        content_type: "movie",
        content_uri: "",
        keep_method: { heartbeat: { lifetime: sessionApiData?.heartbeatLifetime } },
        priority: sessionApiData?.priority,
        protocol: {
          name: "http",
          parameters: {
            http_parameters: {
              parameters: {
                http_output_download_parameters: {
                  use_ssl: yesno(isSsl),
                  use_well_known_port: yesno(isWellKnownPort),
                },
              },
            },
          },
        },
        recipe_id: sessionApiData?.recipeId,
        session_operation_auth: {
          session_operation_auth_by_signature: {
            signature: sessionApiData?.signature,
            token: sessionApiData?.token,
          },
        },
        timing_constraint: "unlimited",
      },
    };

    const res = await this.fetchJson<DmcSessionResponse>(postUrl.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Referer: `${BASE_URL}/`,
        Origin: BASE_URL,
      },
      body: JSON.stringify(payload),
    });

    return res?.data?.session?.content_uri || undefined;
  }

  async getVideoData(videoId: string): Promise<MinimalVideoData | undefined> {
    if (!this.extraInfo) return this.returnBaseData(videoId);

    const watch = await this.fetchWatchData(videoId);
    const status = watch?.meta?.status;

    if (status && status !== 200) {
      throw new VideoHelperError(
        `NicoNico watch API failed: ${status} ${watch?.meta?.errorCode ?? ""} ${watch?.meta?.errorMessage ?? ""}`.trim(),
      );
    }

    const apiData = watch?.data;
    if (!apiData) return this.returnBaseData(videoId);

    const rawUrl =
      (await this.tryExtractDmsHls(videoId, apiData)) ||
      (await this.tryExtractDmcUrl(apiData)) ||
      undefined;

    const title = apiData?.video?.title ?? apiData?.video?.originalTitle;
    const duration =
      typeof apiData?.video?.duration === "number" ? apiData.video.duration : undefined;

    if (!rawUrl) {
      return {
        url: `${BASE_URL}/watch/${videoId}`,
        title,
        duration,
      };
    }

    return {
      url: rawUrl,
      title,
      duration,
      isStream: /\.m3u8(\?|$)/i.test(rawUrl),
    };
  }
}
