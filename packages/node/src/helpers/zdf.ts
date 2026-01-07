import { BaseHelper } from "./base";

export default class ZdfHelper extends BaseHelper {
  // eslint-disable-next-line @typescript-eslint/require-await
  async getVideoId(url: URL) {
    // For ZDF it's safest to forward the full path (yt-dlp can extract from the page URL)
    // Keep the pathname + query so we can rebuild a valid URL using the service base.
    const id = `${url.pathname}${url.search}`;
    return id.startsWith("/") ? id : `/${id}`;
  }
}
