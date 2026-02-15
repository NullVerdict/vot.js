import type { VideoData } from "@vot.js/core/types/client";
import {
  VideoService as CoreVideoService,
  type ServiceMatch,
} from "@vot.js/core/types/service";
import { localLinkRe, VideoDataError } from "@vot.js/core/utils/videoData";
import { buildVkVideoUrl } from "@vot.js/shared/utils/utils";

import sites from "../data/sites";
import VideoHelper, {
  type AvailableVideoHelpers,
  availableHelpers,
} from "../helpers";
import type { GetVideoDataOpts } from "../types/client";
import type { ServiceConf, VideoService } from "../types/service";

function hasHelper(host: string): host is keyof AvailableVideoHelpers {
  return host in availableHelpers;
}

export function getService() {
  if (localLinkRe.exec(window.location.href)) {
    return [];
  }

  const hostname = window.location.hostname;
  const enteredURL = new URL(window.location.href);
  const isMatches = (match: ServiceMatch) => {
    if (match instanceof RegExp) {
      return match.test(hostname);
    } else if (typeof match === "string") {
      return hostname.includes(match);
    } else if (typeof match === "function") {
      return match(enteredURL);
    }
    return false;
  };

  return sites.filter((e) => {
    return (
      !!e.match &&
      (Array.isArray(e.match) ? e.match.some(isMatches) : isMatches(e.match)) &&
      e.host &&
      e.url
    );
  });
}

export async function getVideoID(
  service: ServiceConf,
  opts: GetVideoDataOpts = {},
) {
  const url = new URL(window.location.href);
  const serviceHost = service.host;
  if (hasHelper(serviceHost)) {
    const helper = new VideoHelper(opts).getHelper(serviceHost);
    return await helper.getVideoId(url);
  }
  return serviceHost === CoreVideoService.custom ? url.href : undefined;
}

export async function getVideoData(
  service: ServiceConf,
  opts: GetVideoDataOpts = {},
): Promise<VideoData<VideoService>> {
  const currentUrl = new URL(window.location.href);

  const videoId = await getVideoID(service, opts);
  if (!videoId) {
    throw new VideoDataError(`Entered unsupported link: "${service.host}"`);
  }

  const origin = currentUrl.origin;
  if (
    [
      CoreVideoService.peertube,
      CoreVideoService.coursehunterLike,
      CoreVideoService.cloudflarestream,
    ].includes(service.host as CoreVideoService)
  ) {
    service.url = origin; // set the url of the current site
  }

  if (service.rawResult) {
    return {
      url: videoId,
      videoId,
      host: service.host,
      duration: undefined,
    };
  }

  if (!service.needExtraData) {
    if (service.host === CoreVideoService.vk) {
      return {
        url: buildVkVideoUrl(videoId, currentUrl),
        videoId,
        host: service.host,
        duration: undefined,
      };
    }
    return {
      url: service.url + videoId,
      videoId,
      host: service.host,
      duration: undefined,
    };
  }

  if (!hasHelper(service.host)) {
    throw new VideoDataError(`No helper is available for "${service.host}"`);
  }

  const helper = new VideoHelper({
    ...opts,
    service,
    origin,
  }).getHelper(service.host);
  const result = await helper.getVideoData(videoId);
  if (!result) {
    throw new VideoDataError(`Failed to get video raw url for ${service.host}`);
  }

  return {
    ...result,
    url:
      service.host === CoreVideoService.vk
        ? buildVkVideoUrl(videoId, currentUrl)
        : result.url,
    videoId,
    host: service.host,
  };
}
