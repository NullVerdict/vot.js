import type { MinimalVideoData } from "@vot.js/core/types/helpers/base";

import { BaseHelperError } from "./base";
import BaseHelper from "./base";

function extractIdFromUrl(url: URL): string | undefined {
  const host = url.hostname.replace(/^www\./, "");

  if (host === "dai.ly") {
    const id = url.pathname.split("/").filter(Boolean)[0];
    return id || undefined;
  }

  if (host.endsWith("dailymotion.com")) {
    // /video/<id> or /embed/video/<id>
    const m = url.pathname.match(/\/(?:video|embed\/video)\/([^/?#]+)/);
    if (m?.[1]) return m[1];
  }

  return undefined;
}

function looksLikeVideoId(id: string): boolean {
  // Dailymotion video ids are typically "x" + 5+ chars; player ids like "xtv3w" are shorter
  return /^x[a-zA-Z0-9]{5,}$/.test(id);
}

export default class DailymotionHelper extends BaseHelper {
  getVideoId(url: URL): string {
    // 1) Direct URL patterns
    const direct = extractIdFromUrl(url);
    if (direct && looksLikeVideoId(direct)) return direct;

    // 2) Query param on player pages (common patterns)
    for (const key of ["video", "videoId", "video_id", "v"]) {
      const v = url.searchParams.get(key);
      if (v && looksLikeVideoId(v)) return v;
    }

    // 3) DOM-based extraction (geo player / embeds)
    try {
      const canonical =
        document.querySelector('link[rel="canonical"]')?.getAttribute("href") ||
        document
          .querySelector('meta[property="og:url"]')
          ?.getAttribute("content") ||
        document
          .querySelector('meta[property="og:video:url"]')
          ?.getAttribute("content");

      if (canonical) {
        const u = new URL(canonical, url.origin);
        const id = extractIdFromUrl(u);
        if (id && looksLikeVideoId(id)) return id;
      }

      const attrEl =
        document.querySelector("[data-video],[data-video-id],[data-videoid]") ||
        document.querySelector("script[data-video],script[data-video-id],script[data-videoid]");

      if (attrEl) {
        const id =
          attrEl.getAttribute("data-video") ||
          attrEl.getAttribute("data-video-id") ||
          attrEl.getAttribute("data-videoid");
        if (id && looksLikeVideoId(id)) return id;
      }

      // Try to find any URL on the page that contains /video/<id>
      const urlEls = Array.from(
        document.querySelectorAll("a[href], iframe[src], link[href], meta[content]")
      ).slice(0, 300);

      for (const el of urlEls) {
        const raw =
          (el as HTMLAnchorElement).href ||
          (el as HTMLIFrameElement).src ||
          el.getAttribute("href") ||
          el.getAttribute("content");

        if (!raw) continue;
        try {
          const u = new URL(raw, url.origin);
          const id = extractIdFromUrl(u);
          if (id && looksLikeVideoId(id)) return id;
        } catch {
          // ignore
        }
      }

      // Final fallback: look for m3u8 occurrences
      const html = document.documentElement?.innerHTML || "";
      const m3u = html.match(/\/video\/([a-zA-Z0-9]+)\.m3u8/);
      if (m3u?.[1] && looksLikeVideoId(m3u[1])) return m3u[1];
    } catch {
      // ignore and throw below
    }

    throw new BaseHelperError("Failed to extract Dailymotion video id");
  }

  async getVideoData(videoId: string): Promise<MinimalVideoData> {
    // Dailymotion doesn't require extra info here; canonical URL is built in BaseHelper
    return this.returnBaseData(videoId);
  }
}
