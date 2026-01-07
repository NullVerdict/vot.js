import { BaseHelper } from "./base";

export default class DailymotionHelper extends BaseHelper {
  // eslint-disable-next-line @typescript-eslint/require-await
  async getVideoId(url: URL) {
    // Supported URL shapes (examples):
    //  - https://dai.ly/<video-id>
    //  - https://www.dailymotion.com/video/<video-id>_<slug>
    //  - https://www.dailymotion.com/embed/video/<video-id>
    const fromHash = /(?:^|[&#])video=([^&#_]+)/.exec(url.hash)?.[1];
    if (fromHash) return fromHash;

    const raw =
      url.hostname === "dai.ly"
        ? url.pathname.replace(/^\//, "")
        : /\/video\/([^/?#]+)/.exec(url.pathname)?.[1] ||
          /\/embed\/video\/([^/?#]+)/.exec(url.pathname)?.[1];

    if (!raw) return undefined;
    // Dailymotion often appends a slug after an underscore
    return raw.split("_")[0];
  }
}
