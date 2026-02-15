/**
 * Why is this needed?
 *
 * Undici (Node's fetch implementation) adds certain fetch metadata headers
 * that some upstreams reject. See: https://github.com/nodejs/undici/issues/1305
 */

import { Agent, ProxyAgent } from "undici";
import DispatcherBase from "undici/lib/dispatcher/dispatcher-base.js";
import type Dispatcher from "undici/types/dispatcher";

/** Partial pasted from undici/lib/dispatcher/proxy-agent.js */
export class VOTAgent extends DispatcherBase {
  private readonly proxyAgent: Agent;

  constructor() {
    super();
    this.proxyAgent = new Agent();
  }

  dispatch(
    opts: Dispatcher.DispatchOptions,
    handler: Dispatcher.DispatchHandler,
  ) {
    if (opts.headers && typeof opts.headers === "object") {
      delete (opts.headers as Record<string, string>)["sec-fetch-mode"];
    }

    return this.proxyAgent.dispatch(opts, handler);
  }
}

export class VOTProxyAgent extends ProxyAgent {
  dispatch(
    opts: Dispatcher.DispatchOptions,
    handler: Dispatcher.DispatchHandler,
  ) {
    if (opts.headers && typeof opts.headers === "object") {
      delete (opts.headers as Record<string, string>)["sec-fetch-mode"];
    }
    return super.dispatch(opts, handler);
  }
}
