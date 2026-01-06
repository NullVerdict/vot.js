import type { MinimalVideoData } from "../types/client";
import { BaseHelper, VideoHelperError } from "./base";

type ArteConfigResponse = {
  data?: {
    attributes?: {
      metadata?: any;
      streams?: Array<any>;
      rights?: any;
      restriction?: any;
      live?: boolean;
    };
  };
};

const API_BASE = "https://api.arte.tv/api/player/v2";

const LANG_MAP: Record<string, string> = {
  fr: "F",
  de: "A",
  en: "E[ANG]",
  es: "E[ESP]",
  it: "E[ITA]",
  pl: "E[POL]",
};

function normLang(l?: string) {
  const ll = (l ?? "").toLowerCase();
  return /^[a-z]{2}$/.test(ll) ? ll : undefined;
}

function pickBestStream(
  streams: any[],
  preferredLangCode?: string,
): { url: string; isHls: boolean } | undefined {
  const scored = streams
    .map((s) => {
      const url = String(s?.url ?? "");
      if (!url) return null;
      const protocol = String(s?.protocol ?? "").toUpperCase();
      const versionCode = String(s?.versions?.[0]?.eStat?.ml5 ?? "");
      const shortLabel = String(s?.versions?.[0]?.shortLabel ?? "");

      let score = 0;
      const isHls = protocol.includes("HLS");
      const isHttps = protocol === "HTTPS" || protocol.includes("HTTPS");

      if (isHttps) score += 40;
      if (isHls) score += 30;

      if (preferredLangCode && (versionCode.includes(preferredLangCode) || shortLabel.includes(preferredLangCode))) {
        score += 10;
      }

      // Prefer non-subtitle-only streams (best effort)
      if (!/^(cc|OGsub)/i.test(shortLabel)) score += 3;

      return { url, isHls, score };
    })
    .filter(Boolean) as Array<{ url: string; isHls: boolean; score: number }>;

  scored.sort((a, b) => b.score - a.score);
  return scored[0];
}

export default class ArteHelper extends BaseHelper {
  async getVideoId(url: URL): Promise<string | undefined> {
    // 1) https://www.arte.tv/<lang>/videos/<id>/...
    const m = url.pathname.match(/^\/(?<lang>[a-z]{2})\/videos\/(?<id>[^/]+)\//i);
    if (m?.groups?.lang && m?.groups?.id) {
      return `${m.groups.lang.toLowerCase()}/videos/${m.groups.id}`;
    }

    // 2) https://api.arte.tv/api/player/v2/config/<lang>/<id>
    const m2 = url.pathname.match(/\/api\/player\/v\d+\/config\/(?<lang>[a-z]{2})\/(?<id>[^/?#]+)/i);
    if (m2?.groups?.lang && m2?.groups?.id) {
      return `${m2.groups.lang.toLowerCase()}/videos/${m2.groups.id}`;
    }

    // 3) https://www.arte.tv/player/vX/index.php?json_url=...
    const jsonUrl = url.searchParams.get("json_url");
    if (jsonUrl) {
      try {
        const parsed = new URL(jsonUrl);
        const m3 = parsed.pathname.match(
          /\/api\/player\/v\d+\/config\/(?<lang>[a-z]{2})\/(?<id>[^/?#]+)/i,
        );
        if (m3?.groups?.lang && m3?.groups?.id) {
          return `${m3.groups.lang.toLowerCase()}/videos/${m3.groups.id}`;
        }
      } catch {
        // ignore
      }
    }

    return undefined;
  }

  private async fetchJson<T>(url: string, init?: any): Promise<T> {
    const res = await this.fetch(url, init);
    const text = await res.text();

    try {
      return (text ? (JSON.parse(text) as T) : ({} as T));
    } catch (err) {
      if (!res.ok) {
        throw new VideoHelperError(`Arte request failed: ${res.status} ${res.statusText}`);
      }
      throw new VideoHelperError(`Arte: failed to parse JSON response (${res.status})`);
    }
  }

  private parseArteVideoId(videoId: string): { lang: string; id: string } {
    // expected: <lang>/videos/<id>
    const m = videoId.match(/^(?<lang>[a-z]{2})\/videos\/(?<id>[^/?#]+)/i);
    if (!m?.groups?.lang || !m?.groups?.id) {
      // fallback to opts.language if videoId is already a pure providerId
      const lang = normLang(this.language) ?? "en";
      return { lang, id: videoId };
    }
    return { lang: m.groups.lang.toLowerCase(), id: m.groups.id };
  }

  async getVideoData(videoId: string): Promise<MinimalVideoData | undefined> {
    if (!this.extraInfo) {
      // videoId is already a path segment for arte.tv
      return { url: `https://www.arte.tv/${videoId}` };
    }

    const { lang, id } = this.parseArteVideoId(videoId);
    const preferredLangCode = LANG_MAP[lang] ?? LANG_MAP[normLang(this.language) ?? ""];

    const configUrl = `${API_BASE}/config/${lang}/${id}`;
    const cfg = await this.fetchJson<ArteConfigResponse>(configUrl, {
      headers: {
        "x-validated-age": "18",
        Accept: "application/json",
      },
    });

    const attrs = cfg?.data?.attributes;
    if (!attrs) {
      throw new VideoHelperError("Arte: invalid API response");
    }

    // Rights check (similar to yt-dlp): if no rights, the video is not available
    if (!attrs.rights) {
      throw new VideoHelperError(
        "Arte: video is not available in this language edition or rights expired",
      );
    }

    const streams = Array.isArray(attrs.streams) ? attrs.streams : [];
    if (!streams.length) {
      throw new VideoHelperError("Arte: no streams found");
    }

    const best = pickBestStream(streams, preferredLangCode);
    if (!best?.url) {
      throw new VideoHelperError("Arte: failed to choose a playable stream");
    }

    const metadata = attrs.metadata ?? {};
    const title =
      metadata?.subtitle?.title ??
      (typeof metadata?.subtitle === "string" ? metadata.subtitle : undefined) ??
      metadata?.title;
    const duration =
      typeof metadata?.duration?.seconds === "number" ? metadata.duration.seconds : undefined;

    return {
      url: best.url,
      title,
      duration,
      isStream: best.isHls || /\.m3u8(\?|$)/i.test(best.url),
    };
  }
}
