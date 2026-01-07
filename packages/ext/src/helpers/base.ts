import type { BaseHelperInterface } from "@vot.js/core/types/helpers/base";
import type { FetchFunction } from "@vot.js/core/types/client";
import { VideoService as CoreVideoService } from "@vot.js/core/types/service";

import type { MinimalVideoData } from "../types/client";
import type { BaseHelperOpts } from "../types/helpers/base";
import type { ServiceConf, VideoService } from "../types/service";

export type VideoHelperErrorData = {
  message: string;
  cause?: unknown;
};

export class VideoHelperError extends Error {
  public readonly data: VideoHelperErrorData;

  constructor(data: VideoHelperErrorData) {
    super(data.message);
    this.data = data;
    this.name = "VideoHelperError";
  }
}

export type BaseHelperErrorCodes =
  | "SERVICE_REQUIRED"
  | "INVALID_VIDEO_ID"
  | "INVALID_URL";

export type BaseHelperErrorData = {
  code: BaseHelperErrorCodes;
  message: string;
  cause?: unknown;
};

export class BaseHelperError extends Error {
  public readonly data: BaseHelperErrorData;

  constructor(data: BaseHelperErrorData) {
    super(data.message);
    this.data = data;
    this.name = "BaseHelperError";
  }
}

type UrlOverrides = {
  /** Override host when the helper proxies another service */
  host?: VideoService;
  /** Override the final canonical URL */
  url?: string | URL;
};

/**
 * Base helper for the browser extension.
 *
 * Notes:
 * - Keep the public surface compatible with existing helpers.
 * - Prefer returning a clean, canonical URL when possible.
 */
export default class BaseHelper
  implements BaseHelperInterface<VideoService, ServiceConf>
{
  public readonly fetch: FetchFunction;
  public readonly opts: BaseHelperOpts;

  public readonly API_ORIGIN: string;

  public readonly origin: string;
  public readonly referer: string;

  public readonly service?: ServiceConf;
  public readonly selectors?: { [key: string]: string };

  /** Used by VideoJS-like helpers */
  public video?: HTMLVideoElement;

  constructor(opts: BaseHelperOpts, fetchFn: FetchFunction) {
    this.opts = opts;
    this.fetch = fetchFn;

    this.service = opts.service;
    this.selectors = opts.selectors;

    this.origin = opts.origin ?? window.location.origin;
    this.referer = opts.referer ?? document.referrer || this.origin;

    // The extension background usually exposes a small API at /api
    const fromOpts = opts.apiOrigin;
    this.API_ORIGIN = fromOpts ?? `${this.origin.replace(/\/$/, "")}/api`;

    this.video = opts.video;
  }

  /**
   * Generic regex-based matcher using the service config. Most helpers override
   * this for edge cases.
   */
  public async getVideoId(url: URL): Promise<string | undefined> {
    if (!this.service) {
      throw new BaseHelperError({
        code: "SERVICE_REQUIRED",
        message: "Service configuration is required",
      });
    }

    const patterns = this.service.patterns ?? [];

    const match = patterns.find(
      (pattern) =>
        url.href.match(new RegExp(pattern[0])) &&
        pattern.find((element) => element === url.host),
    );

    if (!match) return undefined;

    const regex = new RegExp(match[0]);
    const result = url.href.match(regex);
    return result?.[1] || result?.[2] || undefined;
  }

  /**
   * Default implementation returns minimal base data.
   *
   * Many helpers override this to fetch title/duration/etc.
   */
  public async getVideoData(
    videoId: string,
  ): Promise<MinimalVideoData | undefined> {
    return this.returnBaseData(videoId);
  }

  private toCleanUrl(u: URL): URL {
    const clean = new URL(u.toString());
    clean.hash = "";

    // Preserve essential query params for some services (e.g. YouTube watch?v=...)
    // but drop common tracking params.
    const trackingPrefixes = ["utm_", "fbclid", "gclid", "msclkid"];
    for (const key of Array.from(clean.searchParams.keys())) {
      if (trackingPrefixes.some((p) => key.startsWith(p))) {
        clean.searchParams.delete(key);
      }
    }

    // Drop empty ?
    if ([...clean.searchParams.keys()].length === 0) clean.search = "";
    return clean;
  }

  private tryParseAbsoluteUrl(maybeUrl: string): URL | undefined {
    try {
      return new URL(maybeUrl);
    } catch {
      return undefined;
    }
  }

  private buildCanonicalUrl(videoId: string, sourceUrl?: URL): URL {
    // If the ID is actually a URL (some helpers do this), prefer that.
    const asUrl = this.tryParseAbsoluteUrl(videoId);
    if (asUrl) return this.toCleanUrl(asUrl);

    const host = this.service?.host;
    if (host === CoreVideoService.dailymotion) {
      return new URL(`https://www.dailymotion.com/video/${videoId}`);
    }
    if (host === CoreVideoService.niconico) {
      return new URL(`https://www.nicovideo.jp/watch/${videoId}`);
    }
    if (host === CoreVideoService.arte) {
      return new URL(`https://www.arte.tv/videos/${videoId}`);
    }

    if (sourceUrl) return this.toCleanUrl(sourceUrl);

    // Fall back to service url template.
    if (this.service?.url) {
      try {
        return new URL(`${this.service.url}${videoId}`);
      } catch {
        // ignore
      }
    }

    // Last resort: current page.
    return this.toCleanUrl(new URL(window.location.href));
  }

  public returnBaseData(
    videoId: string,
    durationOrSourceUrl?: number | URL,
    urlOverrides: UrlOverrides = {},
  ): MinimalVideoData {
    const duration =
      typeof durationOrSourceUrl === "number"
        ? durationOrSourceUrl
        : undefined;
    const sourceUrl =
      durationOrSourceUrl instanceof URL ? durationOrSourceUrl : undefined;

    const host = urlOverrides.host ?? this.service?.host;

    const url = (() => {
      if (urlOverrides.url) {
        const u =
          urlOverrides.url instanceof URL
            ? urlOverrides.url
            : new URL(urlOverrides.url);
        return this.toCleanUrl(u);
      }
      return this.buildCanonicalUrl(videoId, sourceUrl);
    })();

    return {
      url: url.toString(),
      title: this.service?.name ?? "Untitled",
      duration: duration ?? 0,
      host,
      videoId,
    };
  }
}
