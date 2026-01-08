/* eslint-disable @typescript-eslint/require-await */
import { FetchFunction } from "@vot.js/core/types/client";
import {
  BaseHelperInterface,
  BaseHelperOpts,
} from "@vot.js/core/types/helpers/base";
import { fetchWithTimeout } from "@vot.js/shared/utils/utils";

import type { MinimalVideoData } from "../types/client";
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
  API_ORIGIN = "https://example.com";
  fetch: FetchFunction;
  extraInfo: boolean;
  referer: string;
  origin: string;
  service?: ServiceConf;
  language: string;

  constructor({
    fetchFn = fetchWithTimeout,
    extraInfo = true,
    referer = "",
    origin = "",
    service,
    language = "en",
  }: BaseHelperOpts<ServiceConf> = {}) {
    this.fetch = fetchFn;
    this.extraInfo = extraInfo;
    this.referer = referer;
    this.origin = /^(http(s)?):\/\//.test(String(origin)) ? origin : "";
    this.service = service;
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
      return this.origin || undefined;
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
