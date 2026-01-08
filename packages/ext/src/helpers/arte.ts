import { BaseHelper } from "./base";

export default class ArteHelper extends BaseHelper {
  // eslint-disable-next-line @typescript-eslint/require-await
  async getVideoId(url: URL) {
    if (url.hostname === "api.arte.tv") {
      const id = url.pathname.split("/").filter(Boolean).pop();
      return id || undefined;
    }

    if (url.pathname.includes("/player/")) {
      const jsonUrl = url.searchParams.get("json_url");
      if (jsonUrl) {
        try {
          const parsed = new URL(decodeURIComponent(jsonUrl));
          return parsed.pathname.split("/").filter(Boolean).pop() || undefined;
        } catch {
          // ignore
        }
      }
    }

    return url.href;
  }
}
