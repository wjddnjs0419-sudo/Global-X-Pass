import type React from "react";
import { isImage } from "./file";
import { supabase } from "../lib/supabaseClient";

export type ThumbnailAspect = "7/1" | "16/10" | "10/9" | "1/1";

export interface ThumbnailCrop {
  x: number;
  y: number;
  zoom: number;
  aspect: ThumbnailAspect;
}

export interface ThumbnailCandidate {
  url: string;
  label: string;
  source: "content" | "attachment";
}

export interface ResolvedPostThumbnail {
  url: string | null;
  crop: ThumbnailCrop | null;
}

const DEFAULT_POSITION = 50;
const DEFAULT_ZOOM = 1;
export const MIN_THUMBNAIL_ZOOM = 0.35;
export const MAX_THUMBNAIL_ZOOM = 3;
export const ZOOM_STEP = 0.05;
export const THUMBNAIL_OUTPUT_WIDTH: Record<ThumbnailAspect, number> = {
  "7/1": 1400,
  "16/10": 1280,
  "10/9": 1000,
  "1/1": 800,
};

export const POST_THUMBNAIL_ASPECT: Record<string, ThumbnailAspect> = {
  "events-archive": "16/10",
  news: "10/9",
};

const IMG_SRC_PATTERN = /<img\b[^>]*\bsrc=(["'])(.*?)\1/gi;

const uniqueUrls = (urls: string[]) => Array.from(new Set(urls.map(url => url.trim()).filter(Boolean)));

const clamp = (value: unknown, min: number, max: number, fallback: number) => {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(max, Math.max(min, numeric));
};

export const getPostThumbnailAspect = (category: string): ThumbnailAspect =>
  POST_THUMBNAIL_ASPECT[category] ?? "16/10";

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
  };
};

export const getThumbnailImageStyle = (crop: ThumbnailCrop | null): React.CSSProperties => ({
  width: "100%",
  height: "100%",
  objectFit: "cover",
  objectPosition: crop ? `${crop.x}% ${crop.y}%` : "50% 50%",
  transform: crop && crop.zoom > 1 ? `scale(${crop.zoom})` : undefined,
  transformOrigin: crop ? `${crop.x}% ${crop.y}%` : "50% 50%",
  display: "block",
});

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

export const resolvePostThumbnail = (
  post: {
    category?: string | null;
    content?: string | null;
    image_url?: string | null;
    thumbnail_url?: string | null;
    thumbnail_crop?: unknown;
  },
): ResolvedPostThumbnail => {
  const aspect = getPostThumbnailAspect(post.category ?? "");
  const candidates = getThumbnailCandidates(post.content ?? "", post.image_url);
  const candidateUrls = new Set(candidates.map(candidate => candidate.url));
  const manualUrl = post.thumbnail_url?.trim();

  if (manualUrl) {
    return {
      url: manualUrl,
      crop: (!post.thumbnail_crop || isDataImageUrl(manualUrl))
        ? null
        : normalizeThumbnailCrop(post.thumbnail_crop, aspect),
    };
  }

  return {
    url: candidates[0]?.url ?? null,
    crop: null,
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
}: {
  supportsManualThumbnail: boolean;
  nextThumbnailUrl: string | null | undefined;
  previousThumbnailUrl?: string | null;
  previousThumbnailCrop?: unknown;
}) => {
  if (!supportsManualThumbnail) {
    return {
      thumbnail_url: null,
      thumbnail_crop: null,
    };
  }

  const trimmedNextThumbnailUrl = nextThumbnailUrl?.trim() || null;
  if (!trimmedNextThumbnailUrl) {
    return {
      thumbnail_url: null,
      thumbnail_crop: null,
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
  };
};
