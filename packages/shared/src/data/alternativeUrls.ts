// Sites host Invidious. I tested the performance only on invidious.kevin.rocks, youtu.be and inv.vern.cc
const sitesInvidious = [
  "yewtu.be",
  "inv.nadeko.net",
  "invidious.nerdvpn.de",
  "invidious.protokolla.fi",
  "invidious.materialio.us",
  "iv.melmac.space",
] as const;

// Sites host Piped. I tested the performance only on piped.video
const sitesPiped = [
  "piped.video",
  "piped.kavin.rocks",
  "piped.private.coffee",
] as const;

const sitesProxiTok = [
  "proxitok.pabloferreiro.es",
  "proxitok.pussthecat.org",
  "tok.habedieeh.re",
  "proxitok.esmailelbob.xyz",
  "proxitok.privacydev.net",
  "tok.artemislena.eu",
  "tok.adminforge.de",
  "tt.vern.cc",
  "cringe.whatever.social",
  "proxitok.lunar.icu",
  "proxitok.privacy.com.de",
] as const;

// Sites host Peertube. I tested the performance only on dalek.zone and tube.shanti.cafe
const sitesPeertube = [
  "peertube.tmp.rcp.tf",
  "dalek.zone",
  "video.sadmin.io",
  "videos.viorsan.com",
  "peertube.1312.media",
  "tube.shanti.cafe",
  "bee-tube.fr",
  "video.blender.org",
  "beetoons.tv",
  "makertube.net",
  "peertube.tv",
  "framatube.org",
  "tilvids.com",
  "diode.zone",
  "fedimovie.com",
  "video.hardlimit.com",
  "share.tube",
  "peervideo.club",
] as const;

const sitesMaterialious = ["app.materialio.us"] as const;

// If you know what the correct name of this engine is, let me know so that I change the name
const sitesCoursehunterLike = ["coursehunter.net", "coursetrain.net"] as const;

export {
  sitesInvidious,
  sitesPiped,
  sitesProxiTok,
  sitesPeertube,
  sitesMaterialious,
  sitesCoursehunterLike,
};
