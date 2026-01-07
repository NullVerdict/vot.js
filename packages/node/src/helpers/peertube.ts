import type { MinimalVideoData } from "@vot.js/core/types/helpers/base";

import { BaseHelperError } from "./base";
import BaseHelper from "./base";

/**
 * PeerTube is federated/self-hosted. The instance domain is required for yt-dlp,
 * so we send the full URL as videoId (backend can pass it directly).
 */
export default class PeertubeHelper extends BaseHelper {
  async getVideoId(url: URL): Promise<string | undefined> {
    if (!/^https?:$/i.test(url.protocol)) {
      throw new BaseHelperError("Invalid PeerTube URL");
    }
    // Strip hash (not useful for downloading)
    const u = new URL(url.href);
    u.hash = "";
    return u.href;
  }

  async getVideoData(videoId: string): Promise<MinimalVideoData> {
    return this.returnBaseData(videoId);
  }
}
