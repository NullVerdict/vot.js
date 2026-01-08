import { BaseHelper } from "./base";

export default class DailymotionHelper extends BaseHelper {
  // eslint-disable-next-line @typescript-eslint/require-await
  async getVideoId(url: URL) {
    const qpVideo = url.searchParams.get("video");
    if (qpVideo) {
      return qpVideo;
    }

    if (url.pathname.startsWith("/player/")) {
      const dataVideo = (
        document.querySelector<HTMLElement>("[data-video]")?.getAttribute(
          "data-video",
        ) ??
        document
          .querySelector<HTMLScriptElement>("script[data-video]")
          ?.getAttribute("data-video")
      )?.trim();
      if (dataVideo) {
        return dataVideo;
      }

      const scriptWithVideoParam = Array.from(
        document.querySelectorAll<HTMLScriptElement>("script[src]"),
      )
        .map((s) => s.src)
        .find((src) => src.includes("video="));
      if (scriptWithVideoParam) {
        try {
          const sUrl = new URL(scriptWithVideoParam);
          const id = sUrl.searchParams.get("video");
          if (id) {
            return id;
          }
        } catch {
          // ignore
        }
      }

      for (const script of Array.from(
        document.querySelectorAll<HTMLScriptElement>("script:not([src])"),
      )) {
        const txt = script.textContent;
        if (!txt) {
          continue;
        }

        const id =
          /["']video["']\s*[:=]\s*["'](x[0-9a-z]+)["']/i.exec(txt)?.[1] ??
          /["']videoId["']\s*[:=]\s*["'](x[0-9a-z]+)["']/i.exec(txt)?.[1];
        if (id) {
          return id;
        }
      }

      const canonical = document.querySelector<HTMLLinkElement>(
        'link[rel="canonical"]',
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

      const ogUrl = document
        .querySelector<HTMLMetaElement>('meta[property="og:url"]')
        ?.getAttribute("content");
      if (ogUrl) {
        try {
          const og = new URL(ogUrl);
          const id = /\/video\/([^/?#]+)/.exec(og.pathname)?.[1];
          if (id) {
            return id;
          }
        } catch {
          // ignore
        }
      }

      const referrer = document.referrer;
      if (referrer) {
        try {
          const refUrl = new URL(referrer);
          const qpRefVideo = refUrl.searchParams.get("video");
          if (qpRefVideo) {
            return qpRefVideo;
          }

          if (refUrl.hostname === "dai.ly") {
            const id = refUrl.pathname.replace(/^\//, "").split("/")[0];
            if (id) {
              return id;
            }
          }

          if (/^(www\.)?dailymotion\.com$/.test(refUrl.hostname)) {
            const id = /\/video\/([^/?#]+)/.exec(refUrl.pathname)?.[1];
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
