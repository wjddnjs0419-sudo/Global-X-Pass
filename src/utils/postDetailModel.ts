import type { Post } from "../lib/types";
import type { MediaCategory } from "../app/constants/mediaCategories";
import {
  getMediaCategoryLabel,
  isWideMediaCategory,
  resolveMediaCategoryId,
} from "../app/constants/mediaCategories";
import {
  getExternalMediaThumbnailUrl,
  isVideoArchiveTag,
  parseMediaMeta,
  stripMediaMeta,
} from "./mediaPost";
import {
  getMediaDetailCoverAspectRatio,
  resolvePostThumbnail,
  type ResolvedPostThumbnail,
  type ThumbnailCrop,
} from "./thumbnail/parser";
import { isImage } from "./file";
import { normalizePublicStorageUrl } from "./urlSecurity";
import { buildNaverRenderModel } from "./htmlSecurity";

export type PostDetailModel = {
  attachmentUrls: string[];
  images: string[];
  files: string[];
  isArchiveVideoType: boolean;
  isMediaWideType: boolean;
  isWideVideoDetail: boolean;
  mediaMeta: { externalUrl: string };
  eventArchiveMeta: { externalUrl: string };
  externalMediaThumbnailUrl: string | null;
  archiveVideoThumbnailUrl: string | null;
  wideVideoExternalUrl: string;
  wideVideoCoverUrl: string | null;
  wideVideoBadgeLabel: string;
  rawBodyContent: string;
  renderedBodyContent: string;
  isNaverImport: boolean;
  bodyImageUrls: string[];
  dedupedImages: string[];
  resolvedMediaThumbnail: ResolvedPostThumbnail | null;
  mediaCoverUrl: string | null;
  portraitMediaAspectRatio: string;
  portraitMediaCoverCrop: ThumbnailCrop | null;
  mediaBodyImages: string[];
};

export function buildPostDetailModel(
  post: Post,
  mediaCategories: MediaCategory[],
): PostDetailModel {
  const attachmentUrls = post.image_url ? post.image_url.split(",") : [];
  const resolvedMediaThumbnail = post.category === "media" ? resolvePostThumbnail(post) : null;
  const mediaMeta = post.category === "media" ? parseMediaMeta(post.content || "") : { externalUrl: "" };
  const eventArchiveMeta = post.category === "events-archive" ? parseMediaMeta(post.content || "") : { externalUrl: "" };
  const isArchiveVideoType = post.category === "events-archive" && isVideoArchiveTag(post.tags);
  const isMediaWideType = post.category === "media" && isWideMediaCategory(post.tags);
  const isWideVideoDetail = isMediaWideType || isArchiveVideoType;
  const externalMediaThumbnailUrl = isMediaWideType ? getExternalMediaThumbnailUrl(mediaMeta.externalUrl) : null;
  const archiveVideoThumbnailUrl = isArchiveVideoType ? getExternalMediaThumbnailUrl(eventArchiveMeta.externalUrl) : null;
  const wideVideoExternalUrl = isArchiveVideoType ? eventArchiveMeta.externalUrl : mediaMeta.externalUrl;
  const wideVideoCoverUrl = isArchiveVideoType
    ? archiveVideoThumbnailUrl ?? attachmentUrls.find(isImage) ?? null
    : null;
  const wideVideoBadgeLabel = isArchiveVideoType
    ? post.tags || "영상"
    : mediaCategories.find((c) => c.id === resolveMediaCategoryId(post.tags))?.label ?? getMediaCategoryLabel(post.tags);

  const images = attachmentUrls.filter(isImage);
  const files = isWideVideoDetail
    ? []
    : attachmentUrls
      .filter((url) => !isImage(url))
      .map(normalizePublicStorageUrl)
      .filter(Boolean);

  const rawBodyContent = post.category === "media" || post.category === "events-archive"
    ? stripMediaMeta(post.content || "")
    : post.content || "";
  const {
    isNaverImport,
    normalizedContent: renderedBodyContent,
    bodyImageUrls,
    dedupedAttachmentUrls: dedupedImages,
  } = buildNaverRenderModel(rawBodyContent, images);

  const mediaCoverUrl = post.category === "media"
    ? (isMediaWideType ? externalMediaThumbnailUrl ?? images[0] ?? null : resolvedMediaThumbnail?.url ?? images[0] ?? null)
    : null;
  const portraitMediaAspectRatio = post.category === "media"
    ? getMediaDetailCoverAspectRatio(post)
    : "540 / 675";
  const portraitMediaCoverCrop = resolvedMediaThumbnail?.coverCrop ?? resolvedMediaThumbnail?.crop ?? null;
  const mediaBodyImages = post.category === "media" ? (isMediaWideType ? [] : images.slice(1)) : images;

  return {
    attachmentUrls,
    images,
    files,
    isArchiveVideoType,
    isMediaWideType,
    isWideVideoDetail,
    mediaMeta,
    eventArchiveMeta,
    externalMediaThumbnailUrl,
    archiveVideoThumbnailUrl,
    wideVideoExternalUrl,
    wideVideoCoverUrl,
    wideVideoBadgeLabel,
    rawBodyContent,
    renderedBodyContent,
    isNaverImport,
    bodyImageUrls,
    dedupedImages,
    resolvedMediaThumbnail,
    mediaCoverUrl,
    portraitMediaAspectRatio,
    portraitMediaCoverCrop,
    mediaBodyImages,
  };
}
