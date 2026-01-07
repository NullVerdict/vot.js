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
  getVideoId(url: URL): string {
    const id = extractIdFromUrl(url);
    if (!id || !looksLikeVideoId(id)) {
      throw new BaseHelperError("Failed to extract Dailymotion video id");
    }
    return id;
  }

  async getVideoData(videoId: string): Promise<MinimalVideoData> {
    return this.returnBaseData(videoId);
  }
}
