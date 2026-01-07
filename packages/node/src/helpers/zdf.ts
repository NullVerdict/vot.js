import type { MinimalVideoData } from "@vot.js/core/types/helpers/base";

import { BaseHelperError } from "./base";
import BaseHelper from "./base";

function normalizeZdfUrl(u: URL): URL {
  const url = new URL(u.href);
  url.hash = "";
  if (url.pathname.startsWith("/video/") && !url.pathname.endsWith(".html")) {
    const last = url.pathname.split("/").filter(Boolean).pop() || "";
    if (last && !last.includes(".") && !url.pathname.endsWith("/")) {
      url.pathname += ".html";
    }
  }
  return url;
}

export default class ZDFHelper extends BaseHelper {
  getVideoId(url: URL): string {
    if (!/^https?:$/i.test(url.protocol)) {
      throw new BaseHelperError("Invalid ZDF URL");
    }
    return normalizeZdfUrl(url).href;
  }

  async getVideoData(videoId: string): Promise<MinimalVideoData> {
    return this.returnBaseData(videoId);
  }
}
