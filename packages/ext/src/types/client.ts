import type {
  GetVideoDataOpts as CoreGetVideoDataOpts,
  VideoData,
} from "@vot.js/core/types/client";
import type { AtLeast } from "@vot.js/shared/types/utils";
import type { BaseHelperOpts } from "./helpers/base";
import type { VideoService } from "./service";

export type MinimalVideoData<T extends string = VideoService> = AtLeast<
  VideoData<T>,
  "url"
>;

export type GetVideoDataOpts = CoreGetVideoDataOpts<BaseHelperOpts>;
