import { BaseHelper } from "./base";

export default class DailymotionHelper extends BaseHelper {
  // eslint-disable-next-line @typescript-eslint/require-await
  async getVideoId(url: URL) {
    const qpVideo = url.searchParams.get("video");
    if (qpVideo) {
      return qpVideo;
    }

    if (url.pathname.startsWith("/player/")) {
      const extractId = (input: string | undefined | null) => {
        if (!input) {
          return undefined;
        }

        return (
          /\/player\/metadata\/video\/(x[0-9a-z]+)/i.exec(input)?.[1] ??
          /\/metadata\/video\/(x[0-9a-z]+)/i.exec(input)?.[1] ??
          /\bvideo=(x[0-9a-z]+)\b/i.exec(input)?.[1] ??
          /\/video\/(x[0-9a-z]+)\.m3u8\b/i.exec(input)?.[1] ??
          /\/video\/(x[0-9a-z]+)\b/i.exec(input)?.[1]
        );
      };

      const getElUrl = (el: Element): string | undefined => {
        const attr = el.getAttribute("src") ?? el.getAttribute("href");
        if (attr) {
          return attr;
        }

        const anyEl = el as unknown as { src?: unknown; href?: unknown };
        if (typeof anyEl.src === "string") {
          return anyEl.src;
        }
        if (typeof anyEl.href === "string") {
          return anyEl.href;
        }

        return undefined;
      };

      const dataVideo = (
        document.querySelector<HTMLElement>("[data-video]")?.getAttribute(
          "data-video",
        ) ??
        document
          .querySelector<HTMLScriptElement>("script[data-video]")
          ?.getAttribute("data-video")
      )?.trim();
      if (dataVideo) {
        const id = extractId(dataVideo);
        if (id) {
          return id;
        }
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

      const all = document.getElementsByTagName("*");
      for (let i = 0; i < all.length && i < 800; i++) {
        const el = all[i];
        const html = el.innerHTML;
        if (!html || !html.includes(".m3u8")) {
          continue;
        }

        const idFromHtml = extractId(html);
        if (idFromHtml) {
          return idFromHtml;
        }

        const last = el.lastElementChild as unknown as { src?: unknown };
        if (typeof last?.src === "string") {
          const idFromLast = extractId(last.src);
          if (idFromLast) {
            return idFromLast;
          }
        }
      }

      for (const el of Array.from(document.querySelectorAll<Element>("[src],[href]"))) {
        const src = getElUrl(el);
        if (!src) {
          continue;
        }

        if (!src.includes(".m3u8") && !src.includes("metadata/video/") && !src.includes("/video/")) {
          continue;
        }

        const id = extractId(src);
        if (id) {
          return id;
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
          extractId(txt) ??
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

      return url.href;
    }

    if (url.hostname === "dai.ly") {
      return url.pathname.replace(/^\//, "").split("/")[0];
    }

    return /\/(?:embed\/)?video\/([^/?#]+)/.exec(url.pathname)?.[1];
  }
}
