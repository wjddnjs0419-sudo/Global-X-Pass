import type React from "react";
import { isImage } from "./file";
import { supabase } from "../lib/supabaseClient";
import { isWideMediaCategory } from "../app/constants/mediaCategories";
import { getExternalMediaThumbnailUrl, isVideoArchiveTag, parseMediaMeta } from "./mediaPost";

export type ThumbnailAspect = "7/1" | "4/1" | "16/10" | "16/9" | "10/9" | "1/1" | "540/675";

export interface ThumbnailCrop {
  x: number;
  y: number;
  zoom: number;
  aspect: ThumbnailAspect;
  sourceAspect?: number;
}

export interface ThumbnailCandidate {
  url: string;
  label: string;
  source: "content" | "attachment" | "external";
}

export interface ResolvedPostThumbnail {
  url: string | null;
  crop: ThumbnailCrop | null;
  coverCrop: ThumbnailCrop | null;
}

const DEFAULT_POSITION = 50;
const DEFAULT_ZOOM = 1;
export const MIN_THUMBNAIL_ZOOM = 0.35;
export const MAX_THUMBNAIL_ZOOM = 3;
export const ZOOM_STEP = 0.05;
export const DEFAULT_PORTRAIT_MEDIA_THUMBNAIL_ASPECT: ThumbnailAspect = "540/675";
export const THUMBNAIL_OUTPUT_WIDTH: Record<ThumbnailAspect, number> = {
  "7/1": 1400,
  "4/1": 1600,
  "16/10": 1280,
  "16/9": 1280,
  "10/9": 1000,
  "1/1": 800,
  "540/675": 1080,
};

// 행사 신청 상단 cover 박스는 실제 렌더와 동일하게 4:1 고정 비율을 사용한다.
export const EVENT_COVER_THUMBNAIL_ASPECT: ThumbnailAspect = "4/1";

export const POST_THUMBNAIL_ASPECT: Record<string, ThumbnailAspect> = {
  events: "10/9",
  "events-archive": "16/10",
  news: "10/9",
};

const IMG_SRC_PATTERN = /<img\b[^>]*\bsrc=(["'])(.*?)\1/gi;

const uniqueUrls = (urls: string[]) => Array.from(new Set(urls.map(url => url.trim()).filter(Boolean)));
const THUMBNAIL_ASPECTS: ThumbnailAspect[] = ["7/1", "4/1", "16/10", "16/9", "10/9", "1/1", "540/675"];

const isThumbnailAspect = (value: unknown): value is ThumbnailAspect =>
  typeof value === "string" && THUMBNAIL_ASPECTS.includes(value as ThumbnailAspect);

const clamp = (value: unknown, min: number, max: number, fallback: number) => {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(max, Math.max(min, numeric));
};

const normalizeSourceAspect = (value: unknown) => {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return undefined;
  return Math.min(10, Math.max(0.1, numeric));
};

const getStoredThumbnailAspect = (thumbnailCrop?: unknown): ThumbnailAspect | null => {
  if (!thumbnailCrop || typeof thumbnailCrop !== "object") return null;
  const rawAspect = (thumbnailCrop as { aspect?: unknown }).aspect;
  return isThumbnailAspect(rawAspect) ? rawAspect : null;
};

export const getPortraitMediaDetailCoverAspect = (thumbnailCropCover?: unknown): ThumbnailAspect => {
  const storedAspect = getStoredThumbnailAspect(thumbnailCropCover);
  return storedAspect === "1/1" ? "1/1" : DEFAULT_PORTRAIT_MEDIA_THUMBNAIL_ASPECT;
};

export const getPostThumbnailAspect = (
  category: string,
  tags?: string | null,
  _thumbnailCrop?: unknown,
): ThumbnailAspect => {
  if (category === "media") {
    return isWideMediaCategory(tags) ? "16/9" : DEFAULT_PORTRAIT_MEDIA_THUMBNAIL_ASPECT;
  }
  if (category === "events-archive" && isVideoArchiveTag(tags)) {
    return "16/9";
  }

  return POST_THUMBNAIL_ASPECT[category] ?? "16/10";
};

export const getMediaDetailCoverAspectRatio = (
  post: {
    category?: string | null;
    tags?: string | null;
    thumbnail_crop_cover?: unknown;
  },
) => {
  if (isWideMediaCategory(post.tags)) return "16 / 9";
  return toCssAspectRatio(getPortraitMediaDetailCoverAspect(post.thumbnail_crop_cover));
};

export const toCssAspectRatio = (aspect: ThumbnailAspect) => aspect.replace("/", " / ");

export const getThumbnailAspectNumber = (aspect: ThumbnailAspect) => {
  const [width, height] = aspect.split("/").map(Number);
  return width / height;
};

export const getThumbnailOutputSize = (aspect: ThumbnailAspect) => {
  const width = THUMBNAIL_OUTPUT_WIDTH[aspect];
  return {
    width,
    height: Math.round(width / getThumbnailAspectNumber(aspect)),
  };
};

export const isDataImageUrl = (url: string | null | undefined) =>
  typeof url === "string" && /^data:image\/[a-z0-9.+-]+;base64,/i.test(url);

export const createDefaultThumbnailCrop = (aspect: ThumbnailAspect): ThumbnailCrop => ({
  x: DEFAULT_POSITION,
  y: DEFAULT_POSITION,
  zoom: DEFAULT_ZOOM,
  aspect,
});

export const normalizeThumbnailCrop = (
  value: unknown,
  aspect: ThumbnailAspect,
): ThumbnailCrop => {
  const source = value && typeof value === "object" ? value as Partial<ThumbnailCrop> : {};
  return {
    x: clamp(source.x, 0, 100, DEFAULT_POSITION),
    y: clamp(source.y, 0, 100, DEFAULT_POSITION),
    zoom: clamp(source.zoom, MIN_THUMBNAIL_ZOOM, MAX_THUMBNAIL_ZOOM, DEFAULT_ZOOM),
    aspect,
    sourceAspect: normalizeSourceAspect(source.sourceAspect),
  };
};

const getPreciseThumbnailImageStyle = (crop: ThumbnailCrop): React.CSSProperties | null => {
  if (!crop.sourceAspect || crop.zoom < 1) return null;

  const targetAspect = getThumbnailAspectNumber(crop.aspect);
  const verticalScale = targetAspect / crop.sourceAspect;

  return {
    position: "absolute",
    left: `${50 - crop.x * crop.zoom}%`,
    top: `${50 - crop.y * crop.zoom * verticalScale}%`,
    right: "auto",
    bottom: "auto",
    width: `${crop.zoom * 100}%`,
    height: `${crop.zoom * verticalScale * 100}%`,
    maxWidth: "none",
    display: "block",
  };
};

export const getThumbnailImageStyle = (crop: ThumbnailCrop | null): React.CSSProperties => (
  crop ? getPreciseThumbnailImageStyle(crop) ?? {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    objectPosition: `${crop.x}% ${crop.y}%`,
    transform: crop.zoom > 1 ? `scale(${crop.zoom})` : undefined,
    transformOrigin: `${crop.x}% ${crop.y}%`,
    display: "block",
  } : {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    objectPosition: "50% 50%",
    display: "block",
  }
);

export const extractImageUrlsFromHtml = (html: string): string[] => {
  if (!html) return [];

  if (typeof DOMParser !== "undefined") {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return uniqueUrls(Array.from(doc.querySelectorAll("img"))
      .map(img => img.getAttribute("src") ?? ""));
  }

  return uniqueUrls(Array.from(html.matchAll(IMG_SRC_PATTERN)).map(match => match[2] ?? ""));
};

export const getAttachmentImageUrls = (imageUrl: string | null | undefined): string[] =>
  uniqueUrls((imageUrl ?? "").split(",").filter(isImage));

export const getThumbnailCandidates = (
  content: string,
  imageUrl?: string | null,
): ThumbnailCandidate[] => {
  const contentImages = extractImageUrlsFromHtml(content);
  const attachmentImages = getAttachmentImageUrls(imageUrl);
  const seen = new Set<string>();
  const candidates: ThumbnailCandidate[] = [];

  contentImages.forEach((url, index) => {
    if (seen.has(url)) return;
    seen.add(url);
    candidates.push({ url, label: `본문 이미지 ${index + 1}`, source: "content" });
  });

  attachmentImages.forEach((url, index) => {
    if (seen.has(url)) return;
    seen.add(url);
    candidates.push({ url, label: `첨부 이미지 ${index + 1}`, source: "attachment" });
  });

  return candidates;
};

export const getPostThumbnailCandidates = (
  post: {
    category?: string | null;
    content?: string | null;
    image_url?: string | null;
    tags?: string | null;
  },
): ThumbnailCandidate[] => {
  const supportsExternalThumbnail =
    (post.category === "media" && isWideMediaCategory(post.tags))
    || (post.category === "events-archive" && isVideoArchiveTag(post.tags));

  if (!supportsExternalThumbnail) {
    return getThumbnailCandidates(post.content ?? "", post.image_url);
  }

  const contentImages = extractImageUrlsFromHtml(post.content ?? "");
  const attachmentImages = getAttachmentImageUrls(post.image_url);
  const meta = parseMediaMeta(post.content ?? "");
  const externalThumbnail = getExternalMediaThumbnailUrl(meta.externalUrl);
  const seen = new Set<string>();
  const candidates: ThumbnailCandidate[] = [];

  const addCandidate = (url: string | null | undefined, label: string, source: ThumbnailCandidate["source"]) => {
    const trimmed = url?.trim();
    if (!trimmed || seen.has(trimmed)) return;
    seen.add(trimmed);
    candidates.push({ url: trimmed, label, source });
  };

  addCandidate(externalThumbnail, "외부 미디어 썸네일", "external");
  attachmentImages.forEach((url, index) => addCandidate(url, `첨부 이미지 ${index + 1}`, "attachment"));
  contentImages.forEach((url, index) => addCandidate(url, `본문 이미지 ${index + 1}`, "content"));

  return candidates;
};

export const resolvePostThumbnail = (
  post: {
    category?: string | null;
    content?: string | null;
    image_url?: string | null;
    thumbnail_url?: string | null;
    thumbnail_crop?: unknown;
    thumbnail_crop_cover?: unknown;
    tags?: string | null;
  },
): ResolvedPostThumbnail => {
  const aspect = getPostThumbnailAspect(post.category ?? "", post.tags, post.thumbnail_crop);
  const candidates = getPostThumbnailCandidates(post);
  const manualUrl = post.thumbnail_url?.trim();

  if (manualUrl) {
    const isDataUrl = isDataImageUrl(manualUrl);
    const crop = (!post.thumbnail_crop || isDataUrl)
      ? null
      : normalizeThumbnailCrop(post.thumbnail_crop, aspect);
    const coverAspect = post.category === "media" && !isWideMediaCategory(post.tags)
      ? getPortraitMediaDetailCoverAspect(post.thumbnail_crop_cover)
      : EVENT_COVER_THUMBNAIL_ASPECT;
    const coverCrop = (!post.thumbnail_crop_cover || isDataUrl)
      ? null
      : normalizeThumbnailCrop(post.thumbnail_crop_cover, coverAspect);
    return {
      url: manualUrl,
      crop,
      coverCrop,
    };
  }

  return {
    url: candidates[0]?.url ?? null,
    crop: null,
    coverCrop: null,
  };
};

export async function uploadThumbnailIfDataUrl(url: string | null): Promise<string | null> {
  if (!url || !isDataImageUrl(url)) return url;
  const response = await fetch(url);
  const blob = await response.blob();
  const ext = blob.type === "image/jpeg" ? "jpg" : "png";
  const fileName = `thumbnails/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;
  const { error } = await supabase.storage.from("images").upload(fileName, blob, { contentType: blob.type });
  if (error) throw error;
  return supabase.storage.from("images").getPublicUrl(fileName).data.publicUrl;
}

export const getThumbnailSavePayload = ({
  supportsManualThumbnail,
  nextThumbnailUrl,
  previousThumbnailUrl,
  previousThumbnailCrop,
  previousThumbnailCropCover,
}: {
  supportsManualThumbnail: boolean;
  nextThumbnailUrl: string | null | undefined;
  previousThumbnailUrl?: string | null;
  previousThumbnailCrop?: unknown;
  previousThumbnailCropCover?: unknown;
}) => {
  if (!supportsManualThumbnail) {
    return {
      thumbnail_url: null,
      thumbnail_crop: null,
      thumbnail_crop_cover: null,
    };
  }

  const trimmedNextThumbnailUrl = nextThumbnailUrl?.trim() || null;
  if (!trimmedNextThumbnailUrl) {
    return {
      thumbnail_url: null,
      thumbnail_crop: null,
      thumbnail_crop_cover: null,
    };
  }

  const trimmedPreviousThumbnailUrl = previousThumbnailUrl?.trim() || null;
  const shouldPreservePreviousCrop = Boolean(
    trimmedPreviousThumbnailUrl
    && trimmedNextThumbnailUrl === trimmedPreviousThumbnailUrl
    && !isDataImageUrl(trimmedNextThumbnailUrl),
  );

  return {
    thumbnail_url: trimmedNextThumbnailUrl,
    thumbnail_crop: shouldPreservePreviousCrop ? previousThumbnailCrop ?? null : null,
    thumbnail_crop_cover: shouldPreservePreviousCrop ? previousThumbnailCropCover ?? null : null,
  };
};
