import type { MinimalVideoData } from "../types/client";
import { BaseHelper, VideoHelperError } from "./base";

import Logger from "@vot.js/shared/utils/logger";

export default class RedditHelper extends BaseHelper {
  API_ORIGIN = "https://www.reddit.com";

  private unescapeHtml(s: string) {
    return s.replaceAll("&amp;", "&").replaceAll("&quot;", '"');
  }

  private pickBestMp4FromPackagedMediaJson(raw: string): string | undefined {
    try {
      const json = JSON.parse(this.unescapeHtml(raw));
      const perms = json?.playbackMp4s?.permutations;
      if (!Array.isArray(perms) || perms.length === 0) return undefined;

      const best = perms
        .slice()
        .sort((a, b) => {
          const aw = a?.source?.dimensions?.width ?? 0;
          const bw = b?.source?.dimensions?.width ?? 0;
          return bw - aw;
        })[0];

      return best?.source?.url ? this.unescapeHtml(best.source.url) : undefined;
    } catch {
      return undefined;
    }
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async getContentUrl(_videoId: string) {
    const player = document.querySelector<HTMLElement>(
      "shreddit-player, shreddit-player-2",
    );

    if (player) {
      const hls =
        player.getAttribute("src") ??
        player
          .querySelector<HTMLSourceElement>(
            'source[type="application/vnd.apple.mpegURL"]',
          )
          ?.getAttribute("src");

      if (hls) return this.unescapeHtml(hls);

      const preview = player.getAttribute("preview");
      if (preview) return this.unescapeHtml(preview);

      const packaged = player.getAttribute("packaged-media-json");
      if (packaged) {
        const bestMp4 = this.pickBestMp4FromPackagedMediaJson(packaged);
        if (bestMp4) return bestMp4;
      }
    }

    const oldPlayerEl = document.querySelector<HTMLElement>("[data-hls-url]");
    const old = oldPlayerEl?.dataset.hlsUrl;
    if (old) return this.unescapeHtml(old);

    return undefined;
  }

  async getVideoData(videoId: string): Promise<MinimalVideoData | undefined> {
    try {
      const contentUrl = await this.getContentUrl(videoId);
      if (!contentUrl) throw new VideoHelperError("Failed to find content url");

      return { url: contentUrl };
    } catch (err) {
      Logger.error(
        `Failed to get reddit video data by video ID: ${videoId}`,
        (err as Error).message,
      );
      return undefined;
    }
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async getVideoId(url: URL) {
    const postId = /\/comments\/([a-z0-9]+)(?:\/|$)/i.exec(url.pathname)?.[1];
    return postId ?? undefined;
  }
}
