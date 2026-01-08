import { BaseHelper } from "./base";

export default class PeertubeHelper extends BaseHelper {
  // eslint-disable-next-line @typescript-eslint/require-await
  async getVideoId(url: URL) {
    return (
      /\/videos\/watch\/([^/?#]+)/.exec(url.pathname)?.[1] ??
      /\/videos\/embed\/([^/?#]+)/.exec(url.pathname)?.[1] ??
      /\/w\/([^/?#]+)/.exec(url.pathname)?.[1]
    );
  }
}
