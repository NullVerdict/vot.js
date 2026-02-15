import type { BaseHelperOpts as CoreBaseHelperOpts } from "@vot.js/core/types/helpers/base";

import type { ServiceConf } from "../service";

export interface BaseHelperOpts extends CoreBaseHelperOpts<ServiceConf> {
  video?: HTMLVideoElement;
}
