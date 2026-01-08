import { BaseHelper } from "./base";

export default class DailymotionHelper extends BaseHelper {
  // eslint-disable-next-line @typescript-eslint/require-await
  async getVideoId(url: URL) {
    const qpVideo = url.searchParams.get("video");
    if (qpVideo) {
      return qpVideo;
    }

    if (url.pathname.startsWith("/player/")) {
      return url.href;
    }

    if (url.hostname === "dai.ly") {
      return url.pathname.replace(/^\//, "").split("/")[0];
    }

    return /\/(?:embed\/)?video\/([^/?#]+)/.exec(url.pathname)?.[1];
  }
}
