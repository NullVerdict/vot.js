import type { MinimalVideoData } from "@vot.js/core/types/helpers/base";
import BaseHelper from "./base";

function extractIdFromUrl(url: URL): string | undefined {
  const host = url.hostname.replace(/^www\./, "");

  if (host === "dai.ly") {
    const id = url.pathname.split("/").filter(Boolean)[0];
    return id || undefined;
  }

  if (host.endsWith("dailymotion.com")) {
    const m = url.pathname.match(/\/(?:video|embed\/video)\/([^/?#]+)/);
    if (m?.[1]) return m[1];
  }

  // geo.dailymotion.com/player/<player>.html?video=<id>
  for (const key of ["video", "videoId", "video_id", "v"]) {
    const v = url.searchParams.get(key);
    if (v) return v;
  }

  return undefined;
}

function looksLikeVideoId(id: string): boolean {
  return /^x[a-zA-Z0-9]{5,}$/.test(id);
}

export default class DailymotionHelper extends BaseHelper {
  async getVideoId(url: URL): Promise<string | undefined> {
    // 1) Direct URL patterns
    const direct = extractIdFromUrl(url);
    if (direct && looksLikeVideoId(direct)) return direct;

    // 2) Query param on player pages (common patterns)
    for (const key of ["video", "videoId", "video_id", "v"]) {
      const v = url.searchParams.get(key);
      if (v && looksLikeVideoId(v)) return v;
    }

    // 3) Server-side HTML fetch for geo-player / embed pages
    const host = url.hostname.replace(/^www\./, "");
    const isPlayerLike =
      host.startsWith("geo.dailymotion.com") ||
      url.pathname.includes("/player/") ||
      url.pathname.endsWith(".html");

    if (!isPlayerLike) return undefined;

    try {
      const res = await this.fetch(url, { method: "GET" });
      if (!res.ok) return undefined;

      const html = await res.text();

      // data-video / data-video-id (official embed script uses data-video)
      const mData =
        html.match(/\bdata-video-id\s*=\s*["']([^"'\s>]+)["']/i) ||
        html.match(/\bdata-video\s*=\s*["']([^"'\s>]+)["']/i);
      if (mData?.[1] && looksLikeVideoId(mData[1])) return mData[1];

      // canonical / og:url / og:video:url
      const mUrl =
        html.match(/rel=["']canonical["'][^>]*href=["']([^"']+)["']/i) ||
        html.match(/property=["']og:url["'][^>]*content=["']([^"']+)["']/i) ||
        html.match(
          /property=["']og:video:url["'][^>]*content=["']([^"']+)["']/i,
        );

      if (mUrl?.[1]) {
        try {
          const u = new URL(mUrl[1], url.origin);
          const id = extractIdFromUrl(u);
          if (id && looksLikeVideoId(id)) return id;
        } catch {
          // ignore
        }
      }

      // Any occurrence of /video/<id> in the HTML
      const mVideo = html.match(/dailymotion\.com\/video\/([a-zA-Z0-9]+)/i);
      if (mVideo?.[1] && looksLikeVideoId(mVideo[1])) return mVideo[1];

      // Fallback: m3u8 occurrences
      const m3u = html.match(/\/video\/([a-zA-Z0-9]+)\.m3u8/i);
      if (m3u?.[1] && looksLikeVideoId(m3u[1])) return m3u[1];
    } catch {
      // ignore
    }

    return undefined;
  }

  async getVideoData(videoId: string): Promise<MinimalVideoData> {
    return this.returnBaseData(videoId);
  }
}
