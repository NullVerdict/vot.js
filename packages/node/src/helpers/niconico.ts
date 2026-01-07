import type { MinimalVideoData } from "../types/client";
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
    const id = extractIdFromUrl(url);
    return id;
  }

  async getVideoData(videoId: string): Promise<MinimalVideoData> {
    return this.returnBaseData(videoId);
  }
}
