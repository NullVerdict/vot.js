import { BaseHelper } from "./base";

export default class ZdfHelper extends BaseHelper {
  // eslint-disable-next-line @typescript-eslint/require-await
  async getVideoId(url: URL) {
    const pathname = url.pathname.replace(/\/+$/, "");
    const last = pathname.split("/").filter(Boolean).pop();
    if (!last) {
      return undefined;
    }

    return last.replace(/\.html$/i, "");
  }
}
