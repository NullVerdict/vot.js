import type { GetVideoDataOpts, VideoData } from "@vot.js/core/types/client";
import {
  VideoService as CoreVideoService,
  type ServiceMatch,
} from "@vot.js/core/types/service";
import { localLinkRe, VideoDataError } from "@vot.js/core/utils/videoData";
import Logger from "@vot.js/shared/utils/logger";
import { buildVkVideoUrl } from "@vot.js/shared/utils/utils";

import sites from "../data/sites";
import VideoHelper, {
  type AvailableVideoHelpers,
  availableHelpers,
} from "../helpers";
import type { ServiceConf, VideoService } from "../types/service";

function hasHelper(host: string): host is keyof AvailableVideoHelpers {
  return host in availableHelpers;
}

export function getService(videoUrl: string) {
  if (localLinkRe.exec(videoUrl)) {
    return false;
  }

  let enteredURL: URL;
  try {
    enteredURL = new URL(videoUrl);
  } catch {
    Logger.error(`Invalid URL: ${videoUrl}. Have you forgotten https?`);
    return false;
  }

  const hostname = enteredURL.hostname;
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

  return sites.find((e) => {
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
  videoURL: string | URL,
  opts: GetVideoDataOpts = {},
): Promise<string | undefined> {
  const url = typeof videoURL === "string" ? new URL(videoURL) : videoURL;
  const serviceHost = service.host;
  if (hasHelper(serviceHost)) {
    const helper = new VideoHelper(opts).getHelper(serviceHost);
    return await helper.getVideoId(url);
  }

  return serviceHost === CoreVideoService.custom ? url.href : undefined;
}

export async function getVideoData(
  url: string,
  opts: GetVideoDataOpts = {},
): Promise<VideoData<VideoService>> {
  const enteredURL = new URL(url);
  const service = getService(url);
  if (!service) {
    throw new VideoDataError(`URL: "${url}" is unknown service`);
  }

  const videoId = await getVideoID(service, enteredURL, opts);
  if (!videoId) {
    throw new VideoDataError(`Entered unsupported link: "${url}"`);
  }

  const origin = enteredURL.origin;
  if (
    [
      CoreVideoService.peertube,
      CoreVideoService.coursehunterLike,
      CoreVideoService.cloudflarestream,
    ].includes(service.host)
  ) {
    service.url = origin; // set the url of the current site for peertube
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
        url: buildVkVideoUrl(videoId, enteredURL),
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
        ? buildVkVideoUrl(videoId, enteredURL)
        : result.url,
    videoId,
    host: service.host,
  };
}
