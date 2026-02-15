import { BaseHelper } from "./base";

const weiboVideoIdRe = /^\d+:(?:[\da-f]{32}|\d{16,})$/i;

export default class WeiboHelper extends BaseHelper {
  // eslint-disable-next-line @typescript-eslint/require-await
  async getVideoId(url: URL) {
    if (url.hostname === "video.weibo.com") {
      const fid = url.searchParams.get("fid");
      if (!fid || !weiboVideoIdRe.test(fid)) {
        return undefined;
      }

      return `tv/show/${fid}`;
    }

    const normalizedPath = url.pathname.replace(/\/+$/, "");
    if (
      /^\/\d+\/[A-Za-z0-9]+$/.test(normalizedPath) ||
      /^\/0\/[A-Za-z0-9]+$/.test(normalizedPath) ||
      /^\/tv\/show\/\d+:(?:[\da-f]{32}|\d{16,})$/i.test(normalizedPath)
    ) {
      return normalizedPath.slice(1);
    }

    return undefined;
  }
}
