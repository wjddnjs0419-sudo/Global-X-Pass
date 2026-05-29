import { supabase } from "../../lib/supabaseClient";
import { isDataImageUrl } from "./parser";

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
