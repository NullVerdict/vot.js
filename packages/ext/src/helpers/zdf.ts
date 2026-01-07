import type { MinimalVideoData } from "../types/client";

import { BaseHelperError } from "./base";
import BaseHelper from "./base";

function normalizeZdfUrl(u: URL): URL {
  const url = new URL(u.href);
  url.hash = "";

  // Some ZDF pages have modern /video/... URLs where adding .html improves compatibility.
  if (url.pathname.startsWith("/video/") && !url.pathname.endsWith(".html")) {
    const last = url.pathname.split("/").filter(Boolean).pop() || "";
    // Avoid adding ".html" to obvious folder paths
    if (last && !last.includes(".") && !url.pathname.endsWith("/")) {
      url.pathname += ".html";
    }
  }

  return url;
}

export default class ZDFHelper extends BaseHelper {
  async getVideoId(url: URL): Promise<string | undefined> {
    // Prefer canonical URL from the page if present
    try {
      const canonical = document
        .querySelector('link[rel="canonical"]')
        ?.getAttribute("href");
      if (canonical) {
        const u = new URL(canonical, url.origin);
        return normalizeZdfUrl(u).href;
      }
    } catch {
      // ignore
    }

    try {
      const og = document
        .querySelector('meta[property="og:url"]')
        ?.getAttribute("content");
      if (og) {
        const u = new URL(og, url.origin);
        return normalizeZdfUrl(u).href;
      }
    } catch {
      // ignore
    }

    if (!/^https?:$/i.test(url.protocol)) {
      throw new BaseHelperError("Invalid ZDF URL");
    }

    return normalizeZdfUrl(url).href;
  }

  async getVideoData(videoId: string): Promise<MinimalVideoData> {
    // RawResult service; url=videoId is expected
    return this.returnBaseData(videoId);
  }
}
