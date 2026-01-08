/* eslint-disable @typescript-eslint/require-await */
import type { FetchFunction } from "@vot.js/core/types/client";
import type { BaseHelperInterface } from "@vot.js/core/types/helpers/base";
import { fetchWithTimeout } from "@vot.js/shared/utils/utils";

import type { MinimalVideoData } from "../types/client";
import type { BaseHelperOpts } from "../types/helpers/base";
import type { ServiceConf, VideoService } from "../types/service";

export class VideoHelperError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VideoHelper";
    this.message = message;
  }
}

export class BaseHelper
  implements BaseHelperInterface<VideoService, ServiceConf>
{
  API_ORIGIN = window.location.origin;
  fetch: FetchFunction;
  extraInfo: boolean;
  referer: string;
  origin: string;
  service?: ServiceConf;
  video?: HTMLVideoElement;
  language: string;

  constructor({
    fetchFn = fetchWithTimeout,
    extraInfo = true,
    referer = document.referrer ?? `${window.location.origin}/`,
    origin = window.location.origin,
    service,
    video,
    language = "en",
  }: BaseHelperOpts = {}) {
    this.fetch = fetchFn;
    this.extraInfo = extraInfo;
    this.referer = referer;
    this.origin = /^(http(s)?):\/\//.test(String(origin))
      ? origin
      : window.location.origin;
    this.service = service;
    this.video = video;
    this.language = language;
  }

  async getVideoData(
    _videoId: string,
    _opts?: unknown,
  ): Promise<MinimalVideoData | undefined> {
    return undefined;
  }

  async getVideoId(_url: URL): Promise<string | undefined> {
    return undefined;
  }

  protected getBaseUrl(): string | undefined {
    const base = this.service?.url;
    if (!base) {
      return undefined;
    }

    if (base === "stub") {
      return this.origin || this.API_ORIGIN;
    }

    return base;
  }

  protected buildUrl(baseUrl: string, videoId: string): string {
    if (/^https?:\/\//i.test(videoId)) {
      return videoId;
    }

    if (this.service?.host === "peertube") {
      const origin = (this.origin || baseUrl).replace(/\/$/, "");
      return `${origin}/videos/watch/${videoId}`;
    }

    if (baseUrl.includes("?")) {
      return baseUrl + videoId;
    }

    if (baseUrl.endsWith("/") && videoId.startsWith("/")) {
      return baseUrl + videoId.slice(1);
    }
    if (!baseUrl.endsWith("/") && !videoId.startsWith("/")) {
      return `${baseUrl}/${videoId}`;
    }

    return baseUrl + videoId;
  }

  returnBaseData(
    videoId: string,
    _durationOrSourceUrl?: number | URL,
    _maybeSourceUrl?: URL,
  ): MinimalVideoData {
    if (!this.service) {
      throw new VideoHelperError("BaseHelper requires service");
    }

    const baseUrl = this.getBaseUrl();
    if (!baseUrl) {
      throw new VideoHelperError("BaseHelper requires base URL");
    }

    return {
      url: this.buildUrl(baseUrl, videoId),
      videoId,
      host: this.service.host,
      duration: undefined,
    };
  }
}
