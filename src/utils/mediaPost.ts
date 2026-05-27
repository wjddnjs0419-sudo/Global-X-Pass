export type MediaMeta = { externalUrl: string };

export const EMPTY_MEDIA_META: MediaMeta = { externalUrl: "" };
export const MEDIA_META_START = "<!--GXP_MEDIA_META:";
export const MEDIA_META_END = "-->";
const ALLOWED_MEDIA_EXTERNAL_PROTOCOLS = new Set(["http:", "https:"]);
const URL_SCHEME_PATTERN = /^[a-z][a-z\d+.-]*:/i;
const YOUTUBE_URL_PATTERN = /(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/[A-Za-z0-9_-]{6,}(?:[^\s"'<>]*)?|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)[A-Za-z0-9_-]{6,}(?:[^\s"'<>]*)?)/i;
const VIDEO_TAG_HINTS = ["영상", "video", "동영상", "vod", "youtube"];

export function normalizeMediaExternalUrl(value?: string | null) {
  const raw = value?.trim();
  if (!raw) return "";
  const hasExplicitScheme = URL_SCHEME_PATTERN.test(raw);
  const candidate = hasExplicitScheme ? raw : `https://${raw.replace(/^\/\//, "")}`;

  try {
    const url = new URL(candidate);
    if (!ALLOWED_MEDIA_EXTERNAL_PROTOCOLS.has(url.protocol)) return "";
    return url.toString();
  } catch {
    return "";
  }
}

export function parseMediaMeta(value: string): MediaMeta {
  const start = value.indexOf(MEDIA_META_START);
  if (start === -1) return EMPTY_MEDIA_META;
  const end = value.indexOf(MEDIA_META_END, start);
  if (end === -1) return EMPTY_MEDIA_META;
  try {
    const encoded = value.slice(start + MEDIA_META_START.length, end);
    const parsed = JSON.parse(decodeURIComponent(atob(encoded))) as Partial<MediaMeta>;
    return { externalUrl: normalizeMediaExternalUrl(parsed.externalUrl) };
  } catch {
    return EMPTY_MEDIA_META;
  }
}

export function stripMediaMeta(value: string) {
  return value.replace(/<!--GXP_MEDIA_META:[\s\S]*?-->/g, "").trim();
}

export function serializeMediaMeta(value: string, meta: MediaMeta) {
  const withoutMeta = stripMediaMeta(value);
  const externalUrl = normalizeMediaExternalUrl(meta.externalUrl);
  if (!externalUrl) return withoutMeta;
  const encoded = btoa(encodeURIComponent(JSON.stringify({ externalUrl })));
  return `${MEDIA_META_START}${encoded}${MEDIA_META_END}${withoutMeta}`;
}

export function getYouTubeVideoId(value?: string | null) {
  const raw = value?.trim();
  if (!raw) return null;

  try {
    const url = new URL(raw);
    if (url.hostname.includes("youtu.be")) {
      return url.pathname.split("/").filter(Boolean)[0] || null;
    }
    if (url.hostname.includes("youtube.com")) {
      if (url.searchParams.get("v")) return url.searchParams.get("v");
      const parts = url.pathname.split("/").filter(Boolean);
      if (["embed", "shorts", "live"].includes(parts[0])) return parts[1] || null;
    }
  } catch {
    const match = raw.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/))([A-Za-z0-9_-]{6,})/);
    return match?.[1] || null;
  }

  return null;
}

export function getExternalMediaThumbnailUrl(value?: string | null) {
  const videoId = getYouTubeVideoId(normalizeMediaExternalUrl(value));
  return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;
}

export function isVideoArchiveTag(value?: string | null) {
  const normalized = (value ?? "").trim().toLowerCase();
  return VIDEO_TAG_HINTS.some((hint) => normalized.includes(hint.toLowerCase()));
}

export function extractFirstYouTubeUrlFromHtml(value: string) {
  if (!value) return "";

  const normalizeCandidate = (candidate?: string | null) => {
    const normalized = normalizeMediaExternalUrl(candidate);
    return getYouTubeVideoId(normalized) ? normalized : "";
  };

  if (typeof DOMParser !== "undefined") {
    const doc = new DOMParser().parseFromString(value, "text/html");
    const nodes = Array.from(doc.querySelectorAll("a[href], iframe[src], embed[src], video[src]"));

    for (const node of nodes) {
      const candidate = normalizeCandidate(node.getAttribute("href") || node.getAttribute("src"));
      if (candidate) return candidate;
    }

    const textCandidate = normalizeCandidate(doc.body?.textContent ?? "");
    if (textCandidate) return textCandidate;
  }

  const rawMatch = value.match(YOUTUBE_URL_PATTERN)?.[0];
  return normalizeCandidate(rawMatch);
}
