import { BaseHelper } from "./base";

export default class PeertubeHelper extends BaseHelper {
  // eslint-disable-next-line @typescript-eslint/require-await
  async getVideoId(url: URL) {
    const id =
      /\/w\/([^/]+)/.exec(url.pathname)?.[1] ||
      /\/videos\/(?:watch|embed)\/([^/]+)/.exec(url.pathname)?.[1];
    return id ? `/w/${id}` : undefined;
  }
}
