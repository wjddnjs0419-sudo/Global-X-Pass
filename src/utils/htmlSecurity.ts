import DOMPurify from "dompurify";
import {
  NAVER_IMPORT_CONTAINER_MARKER,
  NAVER_IMPORT_META_PREFIX,
  buildNaverRenderModel,
  extractImageSourcesFromHtml,
  getNaverCanonicalDiagnostics,
  isNaverImportedContent,
  normalizeNaverImportedHtml,
  stripNaverImportMeta,
} from "./naverImportShared.js";

const SAFE_URI_REGEXP =
  /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i;
const NAVER_PARAGRAPH_PATTERN = /<p\b[^>]*>[\s\S]*?<\/p>/giu;
const NAVER_TABLE_ROW_PATTERN = /<tr class="se-tr"[\s\S]*?<\/tr>/giu;
const NAVER_SPACER_ENTITY_PATTERN = /(?:&nbsp;|&#160;|&#8203;|&#65279;|\u200B|\uFEFF)/gu;
const NAVER_MEANINGFUL_EMBED_PATTERN = /<(?:img|video|iframe|object|embed|svg|canvas)\b/i;

function stripHtmlForSpacerCheck(value: string) {
  return value
    .replace(/<br\s*\/?>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(NAVER_SPACER_ENTITY_PATTERN, "")
    .trim();
}

function isNaverSpacerParagraph(paragraphHtml: string) {
  if (NAVER_MEANINGFUL_EMBED_PATTERN.test(paragraphHtml)) return false;
  return stripHtmlForSpacerCheck(paragraphHtml) === "";
}

function isNaverSpacerTableRow(rowHtml: string) {
  if (NAVER_MEANINGFUL_EMBED_PATTERN.test(rowHtml)) return false;
  return stripHtmlForSpacerCheck(rowHtml) === "";
}

export {
  buildNaverRenderModel,
  extractImageSourcesFromHtml,
  getNaverCanonicalDiagnostics,
  isNaverImportedContent,
  normalizeNaverImportedHtml,
  stripNaverImportMeta,
};

export function sanitizeRichHtml(value: string): string {
  return DOMPurify.sanitize(value, {
    ALLOWED_URI_REGEXP: SAFE_URI_REGEXP,
  });
}

export function getNaverImportDiagnostics(content: string, attachmentUrls: string[] = []) {
  const isNaverImport = isNaverImportedContent(content);
  const normalizedContent = isNaverImport ? normalizeNaverImportedHtml(content) : content;
  const bodyImages = extractImageSourcesFromHtml(content);
  const bodyImageSet = new Set(bodyImages);
  const emptyParagraphCount = (content.match(NAVER_PARAGRAPH_PATTERN) || []).filter(isNaverSpacerParagraph).length;
  const emptyTableRowCount = (content.match(NAVER_TABLE_ROW_PATTERN) || []).filter(isNaverSpacerTableRow).length;
  const spacingStyleCount = (content.match(/style="[^"]*(?:margin|padding|height|min-height|max-height)[^"]*"/gi) || []).length;
  const suspiciousSpacingStyles = (content.match(/style="[^"]*(?:margin|padding|height|min-height|max-height)[^"]*"/gi) || []).slice(0, 8);
  const canonical = getNaverCanonicalDiagnostics(normalizedContent);
  const anomalyReasons = [
    !canonical.hasCanonicalRoot && isNaverImport ? "missing-root-marker" : null,
    canonical.unknownComponentCount > 0 ? "unknown-se-component" : null,
    canonical.markerCoverageRatio > 0 && canonical.markerCoverageRatio < 1 ? "partial-marker-coverage" : null,
    spacingStyleCount > 0 ? "raw-spacing-style" : null,
    emptyParagraphCount > 0 ? "spacer-paragraph" : null,
    emptyTableRowCount > 0 ? "spacer-table-row" : null,
  ].filter(Boolean);

  return {
    isNaverImport,
    hasMeta: content.includes(NAVER_IMPORT_META_PREFIX),
    hasSeContainer: content.includes(NAVER_IMPORT_CONTAINER_MARKER),
    paragraphCount: (content.match(/<p\b/gi) || []).length,
    imageCount: bodyImages.length,
    emptyParagraphCount,
    emptyTableRowCount,
    spacingStyleCount,
    suspiciousSpacingStyles,
    firstBodyImage: bodyImages[0] ?? null,
    attachmentCount: attachmentUrls.length,
    firstAttachment: attachmentUrls[0] ?? null,
    duplicateAttachmentUrls: attachmentUrls.filter((url) => bodyImageSet.has(url)),
    canonical,
    anomalyReasons,
  };
}

export function sanitizeSvgMarkup(value: string): string {
  return DOMPurify.sanitize(value, {
    USE_PROFILES: { svg: true, svgFilters: false, html: false },
    FORBID_TAGS: ["foreignObject", "script"],
    FORBID_ATTR: ["onload", "onclick", "onerror"],
    ALLOWED_URI_REGEXP: SAFE_URI_REGEXP,
  });
}
