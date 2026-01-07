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
    const id = extractIdFromUrl(url);
    return id;
  }

  async getVideoData(videoId: string): Promise<MinimalVideoData> {
    return this.returnBaseData(videoId);
  }
}
