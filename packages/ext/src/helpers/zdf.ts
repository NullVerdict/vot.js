import { BaseHelper } from "./base";

export default class ZdfHelper extends BaseHelper {
  // eslint-disable-next-line @typescript-eslint/require-await
  async getVideoId(url: URL) {
    const id = `${url.pathname}${url.search}`;
    return id.startsWith("/") ? id : `/${id}`;
  }
}
