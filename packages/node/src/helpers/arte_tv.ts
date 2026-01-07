import { BaseHelper } from "./base";

const ARTE_LANGS = new Set(["fr", "de", "en", "es", "it", "pl"]);

export default class ArteTVHelper extends BaseHelper {
  // eslint-disable-next-line @typescript-eslint/require-await
  async getVideoId(url: URL) {
    const parts = url.pathname.split("/").filter(Boolean);

    // https://www.arte.tv/<lang>/videos/<id>[/...]
    if (parts.length >= 3 && ARTE_LANGS.has(parts[0]) && parts[1] === "videos") {
      const lang = parts[0];
      const id = parts[2];

      if (/^(?:\d{6}-\d{3}-[AF]|LIVE)$/.test(id)) {
        return `${lang}/videos/${id}`;
      }
    }

    // https://api.arte.tv/api/player/v2/config/<lang>/<id>
    if (
      parts.length >= 6 &&
      parts[0] === "api" &&
      parts[1] === "player" &&
      /^v\d+$/.test(parts[2]) &&
      parts[3] === "config" &&
      ARTE_LANGS.has(parts[4])
    ) {
      const lang = parts[4];
      const id = parts[5];

      if (/^(?:\d{6}-\d{3}-[AF]|LIVE)$/.test(id)) {
        return `${lang}/videos/${id}`;
      }
    }

    return undefined;
  }
}
