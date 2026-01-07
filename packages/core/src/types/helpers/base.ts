import type { FetchFunction, MinimalVideoData } from "../client";
import type { ServiceConf, VideoService } from "../service";

export type { MinimalVideoData };

export type BaseHelperOpts<T = ServiceConf> = {
  /**
   * Fetch function
   *
   * e.g. GM_fetch, ofetch.native and etc
   */
  fetchFn?: FetchFunction;
  /**
   * Get extra info about video (title, description, subtitles) if available
   */
  extraInfo?: boolean;
  referer?: string;
  /**
   * Domain from url, it's used e.g. for api domain
   */
  origin?: string;
  language?: string;
  service?: T;
};

/**
 * Helper call options (same shape as BaseHelperOpts but without `service`,
 * which is provided by the library).
 */
export type GetVideoDataOpts<T extends object = BaseHelperOpts> = Omit<
  T,
  "service"
>;

export interface BaseHelperInterface<
  T extends string = VideoService,
  S = ServiceConf,
> {
  API_ORIGIN: string;
  fetch: FetchFunction;
  extraInfo: boolean;
  referer: string;
  origin: string;
  service?: S;
  language: string;

  getVideoData(
    videoId: string,
    opts?: GetVideoDataOpts,
  ): Promise<MinimalVideoData<T> | undefined>;
  getVideoId(url: URL): Promise<string | undefined>;
  /**
   * Returns a minimal, canonical representation of the video.
   *
   * Backward compatible: second argument may be duration OR sourceUrl.
   */
  returnBaseData(
    videoId: string,
    durationOrSourceUrl?: number | URL,
    maybeSourceUrl?: URL,
  ): MinimalVideoData<T>;
}
