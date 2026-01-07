import { BaseHelper } from "./base";

export default class NicoNicoHelper extends BaseHelper {
  // eslint-disable-next-line @typescript-eslint/require-await
  async getVideoId(url: URL) {
    const host = url.hostname.toLowerCase();

    if (/(^|\.)nico\.ms$/.test(host)) {
      return url.pathname.split("/").filter(Boolean)[0];
    }

    return /\/watch\/([^/?#]+)/.exec(url.pathname)?.[1];
  }
}
