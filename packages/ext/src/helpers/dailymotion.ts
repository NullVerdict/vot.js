import { BaseHelper } from "./base";

export default class DailymotionHelper extends BaseHelper {
  // eslint-disable-next-line @typescript-eslint/require-await
  async getVideoId(url: URL) {
    const qpVideo = url.searchParams.get("video");
    if (qpVideo) {
      return qpVideo;
    }

    if (url.pathname.startsWith("/player/")) {
      const canonical = document.querySelector<HTMLLinkElement>(
        'link[rel="canonical"][href]',
      )?.href;
      if (canonical) {
        try {
          const canonicalUrl = new URL(canonical);
          const id = /\/video\/([^/?#]+)/.exec(canonicalUrl.pathname)?.[1];
          if (id) {
            return id;
          }
        } catch {
          // ignore
        }
      }

      const alternate = document.querySelector<HTMLLinkElement>(
        'link[rel="alternate"][href*="/services/oembed"][href*="url="]',
      )?.href;
      if (alternate) {
        try {
          const altUrl = new URL(alternate);
          const embedded = altUrl.searchParams.get("url");
          if (embedded) {
            const embeddedUrl = new URL(embedded);
            const id = /\/video\/([^/?#]+)/.exec(embeddedUrl.pathname)?.[1];
            if (id) {
              return id;
            }
          }
        } catch {
          // ignore
        }
      }

      return url.href;
    }

    if (url.hostname === "dai.ly") {
      return url.pathname.replace(/^\//, "").split("/")[0];
    }

    return /\/(?:embed\/)?video\/([^/?#]+)/.exec(url.pathname)?.[1];
  }
}
