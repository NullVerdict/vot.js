import type * as VideoJS from "../types/helpers/videojs";
import { BaseHelper } from "./base";

import type { VideoDataSubtitle } from "@vot.js/core/types/client";
import Logger from "@vot.js/shared/utils/logger";
import { normalizeLang } from "@vot.js/shared/utils/utils";

/**
 * Shared class for all videojs players
 */
export default class VideoJSHelper extends BaseHelper {
  SUBTITLE_SOURCE = "videojs";
  SUBTITLE_FORMAT = "vtt";

  static getPlayer<T extends VideoJS.PlayerOptions = VideoJS.PlayerOptions>() {
    const vjs = (window as any).videojs;

    const root = document.querySelector<HTMLElement>(".video-js");
    const el =
      (root?.matches("video, video-js") ? root : root?.querySelector("video, video-js")) ??
      document.querySelector<HTMLElement>("video.video-js, video-js");

    const legacyPlayer = (el as any)?.player;
    if (legacyPlayer) return legacyPlayer as VideoJS.Player<T>;

    const byGetPlayer =
      vjs?.getPlayer?.((el as any)?.id ?? el) ??
      vjs?.getPlayer?.((root as any)?.id ?? root);
    if (byGetPlayer) return byGetPlayer as VideoJS.Player<T>;

    const players = vjs?.getPlayers?.() ?? vjs?.players;
    if (players && typeof players === "object") {
      for (const p of Object.values(players)) {
        if (p) return p as VideoJS.Player<T>;
      }
    }

    return undefined;
  }

  getVideoDataByPlayer(videoId: string) {
    try {
      const player = VideoJSHelper.getPlayer();
      if (!player) {
        throw new Error(
          `Video player doesn't have player option, videoId ${videoId}`,
        );
      }

      const duration = player.duration();
      const sources = Array.isArray(player.currentSources)
        ? player.currentSources
        : player.getCache()?.sources;
      const { tracks_: tracks } = player.textTracks();
      const videoUrl = sources.find(
        (source) => source.type === "video/mp4" || source.type === "video/webm",
      );
      if (!videoUrl) {
        throw new Error(`Failed to find video url for videoID ${videoId}`);
      }

      const subtitles: VideoDataSubtitle[] = tracks
        .filter((track) => track.src && track.kind !== "metadata")
        .map(
          (track) =>
            ({
              language: normalizeLang(track.language),
              source: this.SUBTITLE_SOURCE,
              format: this.SUBTITLE_FORMAT,
              url: track.src,
            }) as VideoDataSubtitle,
        );

      return {
        url: videoUrl.src,
        duration,
        subtitles,
      };
    } catch (err) {
      Logger.error("Failed to get videojs video data", (err as Error).message);
      return undefined;
    }
  }
}
