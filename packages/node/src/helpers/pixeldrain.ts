import { BaseHelper } from "./base";

export default class PixeldrainHelper extends BaseHelper {
  // eslint-disable-next-line @typescript-eslint/require-await
  async getVideoId(url: URL) {
    // We prefer direct API download URLs so the server (yt-dlp) can treat it as a direct media URL.
    // PixelDrain docs: /api/file/<id> and optional ?download. (We'll always append ?download.)
    const p = url.pathname;

    const fileId =
      /^\/u\/([\w-]+)/.exec(p)?.[1] ||
      /^\/api\/file\/([\w-]+)/.exec(p)?.[1];
    if (fileId) {
      return `file/${fileId}?download`;
    }

    return undefined;
  }
}
