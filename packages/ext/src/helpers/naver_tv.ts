import { BaseHelper } from "./base";

export default class NaverTVHelper extends BaseHelper {
  // eslint-disable-next-line @typescript-eslint/require-await
  async getVideoId(url: URL) {
    // Naver clips
    const clipNo =
      url.searchParams.get("clipNo") ||
      url.searchParams.get("clipno") ||
      url.searchParams.get("clip_no");

    if (clipNo && /^\d+$/.test(clipNo)) {
      return `/v/${clipNo}`;
    }

    // Naver Shorts / Clip links (often on m.naver.com)
    if (url.pathname.startsWith("/shorts")) {
      // Preserve the query string to keep the link working across variants
      // like ?mediaId=...&serviceType=...&h=...
      const qs = url.searchParams.toString();
      return `/shorts/${qs ? `?${qs}` : ""}`;
    }

    const match = /^\/(v|embed|l|h)\/(\d+)/.exec(url.pathname);
    if (!match) return undefined;

    const [, type, id] = match;

    // Prefer canonical /v/ URLs for regular clips
    if (type === "embed") return `/v/${id}`;
    return `/${type}/${id}`;
  }
}
