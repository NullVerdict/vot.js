import { BaseHelper } from "./base";

export default class YoutubeHelper extends BaseHelper {
  private static extractVideoId(url: URL): string | undefined {
    // Handle YouTube "share/redirect" wrappers.
    // Example: /attribution_link?u=%2Fwatch%3Fv%3DVIDEO_ID%26feature%3Dshare
    if (url.pathname === "/attribution_link") {
      const u = url.searchParams.get("u");
      if (u) {
        try {
          const decoded = decodeURIComponent(u);
          const inner = decoded.startsWith("http")
            ? new URL(decoded)
            : new URL(decoded, url.origin);
          return YoutubeHelper.extractVideoId(inner);
        } catch {
          // ignore
        }
      }
    }

    // youtu.be/<id>
    if (url.hostname === "youtu.be") {
      const id = url.pathname.replace(/^\/+/, "").split("/")[0];
      return id || undefined;
    }

    // /watch?v=<id>
    const vParam = url.searchParams.get("v");
    if (vParam) return vParam;

    // /shorts/<id>, /embed/<id>, /live/<id>, /v/<id>, /e/<id>
    const pathId =
      /\/(?:shorts|embed|live|v|e)\/([^/?#]+)/.exec(url.pathname)?.[1] ??
      undefined;

    return pathId || undefined;
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async getVideoId(url: URL) {
    return YoutubeHelper.extractVideoId(url);
  }
}
