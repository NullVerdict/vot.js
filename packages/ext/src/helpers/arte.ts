import type { MinimalVideoData } from "@vot.js/core/types/helpers/base";
import BaseHelper from "./base";

function extractIdFromUrl(url: URL): string | undefined {
  const host = url.hostname.replace(/^www\./, "");
  if (!host.endsWith("arte.tv")) return undefined;

  const m = url.pathname.match(/\/videos\/([^/?#]+)/);
  if (m?.[1]) return m[1];

  return undefined;
}

export default class ArteHelper extends BaseHelper {
  async getVideoId(url: URL): Promise<string | undefined> {
    const direct = extractIdFromUrl(url);
    if (direct) return direct;

    // Fallback: try canonical / og:url
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
