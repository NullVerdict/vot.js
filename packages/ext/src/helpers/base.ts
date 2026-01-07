import type { ServiceConf } from "../types/service";

import type {
  BaseHelperOpts,
  GetVideoDataOpts,
  MinimalVideoData,
} from "@vot.js/core/types/helpers/base";
import { VideoService as CoreVideoService } from "@vot.js/core/types/service";
import { fetchWithTimeout } from "@vot.js/shared/utils/utils";

/**
 * Legacy error name used by most helpers.
 */
export class VideoHelperError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = "VideoHelperError";
  }
}

/**
 * Newer alias used by some helpers.
 */
export class BaseHelperError extends VideoHelperError {
  constructor(message?: string) {
    super(message);
    this.name = "BaseHelperError";
  }
}

function isAbsoluteUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}

function safeJoinUrl(prefix: string, id: string): string {
  const p = prefix.trim();
  const v = id.trim();
  if (!p) return v;

  // If prefix is a plain query prefix (e.g. https://vk.com/video?z=) just concat.
  const shouldConcatDirectly =
    p.endsWith("/") || p.endsWith("=") || p.endsWith("?") || p.includes("?");

  if (shouldConcatDirectly) {
    if (p.endsWith("/") && v.startsWith("/")) return p + v.slice(1);
    if (!p.endsWith("/") && p.includes("?") && v.startsWith("/")) {
      return p + v.slice(1);
    }
    return p + v;
  }

  // Otherwise, ensure single slash.
  if (v.startsWith("/")) return p + v;
  return p + "/" + v;
}

/**
 * Base class for all extension helpers.
 *
 * Important:
 * - We MUST receive `opts.service` to correctly build canonical URLs.
 * - Many helpers rely on `this.fetch` and `this.API_ORIGIN`.
 */
export class BaseHelper {
  public readonly service: ServiceConf;
  public readonly fetchFn: typeof fetchWithTimeout;
  public readonly extraInfo: boolean;
  public readonly referer: string;
  public readonly origin: string;
  public readonly language: string;

  // Many helpers override this; default is origin.
  public API_ORIGIN: string;

  constructor(opts: BaseHelperOpts<ServiceConf> = {}) {
    if (!opts.service) {
      throw new BaseHelperError("BaseHelper requires opts.service");
    }
    this.service = opts.service;
    this.fetchFn = opts.fetchFn || fetchWithTimeout;
    this.extraInfo = opts.extraInfo ?? true;
    this.referer = opts.referer ?? "";
    this.origin =
      opts.origin ??
      (typeof window !== "undefined" ? window.location.origin : "");
    this.language = opts.language ?? "en";

    this.API_ORIGIN = this.origin;
  }

  getHeaders(): HeadersInit {
    return {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:135.0) Gecko/20100101 Firefox/135.0",
      ...(this.referer ? { Referer: this.referer } : {}),
    };
  }

  /**
   * Fetch wrapper that injects headers consistently.
   */
  fetch(input: string | URL | Request, init: Record<string, any> = {}) {
    const headers = {
      ...this.getHeaders(),
      ...(init.headers ?? {}),
    };

    return this.fetchFn(input, {
      ...init,
      headers,
    });
  }

  /**
   * Build a canonical URL that is safe for UI and (when required) for yt-dlp.
   * Some services MUST be normalized to avoid wrong player URLs.
   */
  protected buildCanonicalUrl(videoId: string, sourceUrl?: URL): string {
    const id = (videoId || "").trim();
    if (!id) return "";

    // If the helper already returns a URL, keep it.
    if (isAbsoluteUrl(id)) return id;

    switch (this.service.host) {
      case CoreVideoService.dailymotion:
        return `https://www.dailymotion.com/video/${id}`;
      case CoreVideoService.niconico:
        return `https://www.nicovideo.jp/watch/${id}`;
      case CoreVideoService.arte: {
        const lang = (this.language || "en").toLowerCase();
        return `https://www.arte.tv/${lang}/videos/${id}/`;
      }
      case CoreVideoService.peertube: {
        // PeerTube is instance-based.
        const base = sourceUrl?.origin || this.origin;
        return id.startsWith("/") ? base + id : safeJoinUrl(base, id);
      }
      case CoreVideoService.zdf: {
        const base = "https://www.zdf.de";
        return id.startsWith("/") ? base + id : safeJoinUrl(base, id);
      }
      default:
        break;
    }

    if (this.service.url) {
      return safeJoinUrl(this.service.url, id);
    }

    // Fallback: rebuild using the source origin.
    if (sourceUrl?.origin) {
      return id.startsWith("/")
        ? sourceUrl.origin + id
        : safeJoinUrl(sourceUrl.origin, id);
    }

    return id;
  }

  /**
   * Backward compatible: second arg may be duration OR sourceUrl.
   */
  returnBaseData(
    videoId: string,
    durationOrSourceUrl?: number | URL,
    maybeSourceUrl?: URL,
  ): MinimalVideoData {
    const duration =
      typeof durationOrSourceUrl === "number" ? durationOrSourceUrl : undefined;
    const sourceUrl =
      durationOrSourceUrl instanceof URL ? durationOrSourceUrl : maybeSourceUrl;

    return {
      url: this.buildCanonicalUrl(videoId, sourceUrl),
      videoId,
      host: this.service.host,
      duration,
    };
  }

  // Default implementations (override in subclasses)
  // eslint-disable-next-line @typescript-eslint/require-await
  async getVideoData(
    videoId: string,
    _opts?: GetVideoDataOpts,
  ): Promise<MinimalVideoData | undefined> {
    return this.returnBaseData(videoId);
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async getVideoId(_url: URL): Promise<string | undefined> {
    return undefined;
  }
}

export default BaseHelper;
