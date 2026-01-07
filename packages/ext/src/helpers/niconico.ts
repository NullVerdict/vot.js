import type { MinimalVideoData } from "@vot.js/core/types/helpers/base";
import BaseHelper from "./base";

function extractIdFromUrl(url: URL): string | undefined {
  const host = url.hostname.replace(/^www\./, "");

  if (host === "nico.ms") {
    const id = url.pathname.split("/").filter(Boolean)[0];
    return id || undefined;
  }

  if (host.endsWith("nicovideo.jp")) {
    const m = url.pathname.match(/^\/watch\/([^/?#]+)/);
    if (m?.[1]) return m[1];
  }

  return undefined;
}

export default class NicoNicoHelper extends BaseHelper {
  async getVideoId(url: URL): Promise<string | undefined> {
    const direct = extractIdFromUrl(url);
    if (direct) return direct;

    // Fallback to DOM (requested selector: #MainVideoPlayer)
    try {
      const el = document.querySelector("#MainVideoPlayer") as HTMLElement | null;
      if (el) {
        const id =
          el.getAttribute("data-video-id") ||
          el.getAttribute("data-videoid") ||
          el.getAttribute("data-id") ||
          el.getAttribute("data-video") ||
          (el as any).dataset?.videoId ||
          (el as any).dataset?.videoid ||
          (el as any).dataset?.id;

        if (typeof id === "string" && id.length > 0) return id;
      }
    } catch {
      // ignore
    }

    // Try canonical/og url
    try {
      const canonical =
        document.querySelector('link[rel="canonical"]')?.getAttribute("href") ||
        document
          .querySelector('meta[property="og:url"]')
          ?.getAttribute("content");
      if (canonical) {
        const u = new URL(canonical, url.origin);
        const id = extractIdFromUrl(u);
        if (id) return id;
      }
    } catch {
      // ignore
    }

    return undefined;
  }

  async getVideoData(videoId: string): Promise<MinimalVideoData> {
    return this.returnBaseData(videoId);
  }
}
