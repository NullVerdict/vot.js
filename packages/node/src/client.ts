import VOTCoreClient, {
  VOTWorkerClient as VOTCoreWorkerClient,
} from "@vot.js/core/client";
import type { VOTOpts } from "@vot.js/core/types/client";
import type { VideoService } from "./types/service";
import { VOTAgent } from "./utils/fetchAgent";

export default class VOTClient<
  V extends string = VideoService,
> extends VOTCoreClient<V> {
  constructor(opts?: VOTOpts) {
    super(opts);
    this.fetchOpts = {
      dispatcher: new VOTAgent(),
      ...this.fetchOpts,
    };
  }
}

export class VOTWorkerClient<
  V extends string = VideoService,
> extends VOTCoreWorkerClient<V> {
  constructor(opts?: VOTOpts) {
    super(opts);
    this.fetchOpts = {
      dispatcher: new VOTAgent(),
      ...this.fetchOpts,
    };
  }
}
