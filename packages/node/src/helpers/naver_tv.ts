import { BaseHelper } from "./base";

export default class NaverTVHelper extends BaseHelper {
  // eslint-disable-next-line @typescript-eslint/require-await
  async getVideoId(url: URL) {
    const clipNo =
      url.searchParams.get("clipNo") ||
      url.searchParams.get("clipno") ||
      url.searchParams.get("clip_no");

    if (clipNo && /^\d+$/.test(clipNo)) {
      return `v/${clipNo}`;
    }

    const match = /^\/(v|embed|l)\/(\d+)/.exec(url.pathname);
    if (!match) return undefined;

    const [, type, id] = match;

    // Prefer canonical /v/ URLs for regular clips
    if (type === "l") return `l/${id}`;
    return `v/${id}`;
  }
}
