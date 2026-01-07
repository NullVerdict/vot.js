import { BaseHelper } from "./base";

export default class PeertubeHelper extends BaseHelper {
  // eslint-disable-next-line @typescript-eslint/require-await
  async getVideoId(url: URL) {
    // Return a canonical watch path so the server (yt-dlp) gets a stable URL.
    // PeerTube common URL shapes:
    //  - /w/<id>
    //  - /videos/watch/<uuid>
    //  - /videos/embed/<uuid>
    const id =
      /\/w\/([^/]+)/.exec(url.pathname)?.[1] ||
      /\/videos\/(?:watch|embed)\/([^/]+)/.exec(url.pathname)?.[1];
    return id ? `/w/${id}` : undefined;
  }
}
