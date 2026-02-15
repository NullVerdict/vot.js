import { BaseHelper } from "./base";

export default class DailymotionHelper extends BaseHelper {
  async getVideoId(_url: URL): Promise<string | undefined> {
    return new Promise((resolve) => {
      const origin = "https://www.dailymotion.com";
      const timeout = setTimeout(() => resolve(undefined), 3000);

      window.addEventListener("message", (e) => {
        if (e.origin !== origin) return;
        if (typeof e.data !== "object" || e.data?.type !== "dailymotionVideoId")
          return;

        clearTimeout(timeout);
        resolve(e.data.videoId);
      });

      window.top?.postMessage({ type: "getDailymotionVideoId" }, origin);
    });
  }
}
