import type { VideoData } from "@vot.js/core/types/client";
import type { AtLeast } from "@vot.js/shared/types/utils";

import type { VideoService } from "./service";

export type MinimalVideoData<T extends string = VideoService> = AtLeast<
  VideoData<T>,
  "url"
>;
