export const NAVER_IMPORT_META_PREFIX = "<!--GXP_BLOG_IMPORT_META:";
export const NAVER_IMPORT_CONTAINER_MARKER = "se-main-container";

const NAVER_IMPORT_META_PATTERN = /<!--GXP_BLOG_IMPORT_META:[A-Za-z0-9+/=]+-->\s*/i;
const NAVER_STYLE_ATTR_PATTERN = / style="([^"]*)"/gi;
const NAVER_IMAGE_TAG_PATTERN = /<img\b[^>]*>/gi;
const NAVER_PARAGRAPH_PATTERN = /<p\b[^>]*>[\s\S]*?<\/p>/giu;
const NAVER_EMPTY_TEXT_COMPONENT_PATTERN =
  /<div class="se-component se-text[^"]*"[^>]*>\s*<div class="se-component-content">\s*<div class="se-section se-section-text[^"]*"[^>]*>\s*<div class="se-module se-module-text">\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/giu;
const NAVER_TABLE_ROW_PATTERN = /<tr class="se-tr"[\s\S]*?<\/tr>/giu;
const NAVER_TABLE_PATTERN = /<table\b[^>]*>[\s\S]*?<\/table>/gi;
const NAVER_EMPTY_TABLE_COMPONENT_PATTERN =
  /<div class="se-component se-table[^"]*"[^>]*>[\s\S]*?<table[^>]*>\s*<tbody>\s*<\/tbody>\s*<\/table>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/giu;
const NAVER_SPACER_ENTITY_PATTERN = /(?:&nbsp;|&#160;|&#8203;|&#65279;|\u200B|\uFEFF)/gu;
const NAVER_MEANINGFUL_EMBED_PATTERN = /<(?:img|video|iframe|object|embed|svg|canvas)\b/i;
const NAVER_DIV_WITH_CLASS_PATTERN = /<div\b[^>]*class="([^"]*)"[^>]*>/gi;
const NAVER_STRIPPED_STYLE_PROPS = new Set([
  "font-family",
  "color",
  "background-color",
  "background",
  "font-size",
  "letter-spacing",
  "line-height",
  "margin",
  "margin-top",
  "margin-right",
  "margin-bottom",
  "margin-left",
  "padding",
  "padding-top",
  "padding-right",
  "padding-bottom",
  "padding-left",
  "height",
  "min-height",
  "max-height",
]);

function asHtmlString(value) {
  return typeof value === "string" ? value : "";
}

function getAttr(tag, attrName) {
  const escaped = attrName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = tag.match(new RegExp(`${escaped}="([^"]*)"`, "i"));
  return match?.[1] ?? "";
}

function setAttr(tag, attrName, value) {
  if (!value) return tag;
  const escaped = attrName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (new RegExp(`\\b${escaped}="[^"]*"`, "i").test(tag)) {
    return tag.replace(new RegExp(`${escaped}="[^"]*"`, "i"), `${attrName}="${value}"`);
  }
  return tag.replace(/^<([a-z0-9:-]+)/i, `<$1 ${attrName}="${value}"`);
}

function removeAttr(tag, attrName) {
  const escaped = attrName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return tag.replace(new RegExp(`\\s${escaped}="[^"]*"`, "gi"), "");
}

function stripCanonicalAttrs(tag) {
  return tag
    .replace(/\sdata-gxp-se(?:-[a-z]+)?="[^"]*"/gi, "")
    .replace(/\sdata-gxp-se-root="[^"]*"/gi, "")
    .replace(/\sdata-gxp-se-source="[^"]*"/gi, "");
}

function annotateTag(tag, attrs) {
  let nextTag = stripCanonicalAttrs(tag);

  for (const [attrName, value] of Object.entries(attrs)) {
    if (!value) continue;
    nextTag = setAttr(nextTag, attrName, value);
  }

  return nextTag;
}

function stripNaverStyleProps(styleValue) {
  if (!styleValue) return "";

  const kept = styleValue
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => {
      const [rawProp] = part.split(":");
      const prop = rawProp?.trim().toLowerCase();
      return prop ? !NAVER_STRIPPED_STYLE_PROPS.has(prop) : false;
    });

  return kept.join("; ");
}

function stripHtmlForSpacerCheck(value) {
  return value
    .replace(/<br\s*\/?>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(NAVER_SPACER_ENTITY_PATTERN, "")
    .trim();
}

function hasClassToken(className = "", token = "") {
  if (!className || !token) return false;
  return className
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .includes(token);
}

function isNaverSpacerParagraph(paragraphHtml) {
  if (NAVER_MEANINGFUL_EMBED_PATTERN.test(paragraphHtml)) return false;
  return stripHtmlForSpacerCheck(paragraphHtml) === "";
}

function isNaverSpacerTableRow(rowHtml) {
  if (NAVER_MEANINGFUL_EMBED_PATTERN.test(rowHtml)) return false;
  return stripHtmlForSpacerCheck(rowHtml) === "";
}

function stripNaverSpacerParagraphs(value) {
  return value.replace(NAVER_PARAGRAPH_PATTERN, (paragraphHtml) => (
    isNaverSpacerParagraph(paragraphHtml) ? "" : paragraphHtml
  ));
}

function stripNaverSpacerTableRows(value) {
  return value.replace(NAVER_TABLE_ROW_PATTERN, (rowHtml) => (
    isNaverSpacerTableRow(rowHtml) ? "" : rowHtml
  ));
}

function unwrapSingleCellNaverTables(value) {
  return value.replace(NAVER_TABLE_PATTERN, (tableHtml) => {
    if (/<th\b/i.test(tableHtml)) return tableHtml;

    const rows = tableHtml.match(/<tr\b[\s\S]*?<\/tr>/gi) || [];
    if (rows.length === 0) return tableHtml;

    const unwrappedRows = [];
    for (const rowHtml of rows) {
      const cells = rowHtml.match(/<td\b[\s\S]*?<\/td>/gi) || [];
      if (cells.length !== 1) return tableHtml;

      unwrappedRows.push(
        cells[0]
          .replace(/^<td\b[^>]*>/i, "")
          .replace(/<\/td>$/i, "")
          .trim(),
      );
    }

    return unwrappedRows.join("");
  });
}

function getCanonicalBlockMeta(className = "") {
  if (hasClassToken(className, "se-imageGroup")) {
    return { block: "imageCollage", flow: "media-stack" };
  }
  if (hasClassToken(className, "se-oglink")) {
    return { block: "linkCard", flow: "default" };
  }
  if (hasClassToken(className, "se-placesMap")) {
    return { block: "placeMap", flow: "default" };
  }
  if (hasClassToken(className, "se-imageStrip")) {
    return { block: "imageStrip", flow: "media-stack" };
  }
  if (hasClassToken(className, "se-image")) {
    return { block: "image", flow: "media-stack" };
  }
  if (hasClassToken(className, "se-sticker")) {
    return { block: "sticker", flow: "default" };
  }
  if (hasClassToken(className, "se-horizontalLine")) {
    return { block: "divider", flow: "divider" };
  }
  if (hasClassToken(className, "se-table")) {
    return { block: "table", flow: "default" };
  }
  if (hasClassToken(className, "se-quotation")) {
    return { block: "quote", flow: "default" };
  }
  if (hasClassToken(className, "se-text")) {
    return { block: "text", flow: "default" };
  }

  return null;
}

function annotateNaverCanonicalBlocks(value) {
  let annotated = value;

  annotated = annotated.replace(/<div\b[^>]*class="[^"]*\bse-main-container\b[^"]*"[^>]*>/i, (tag) => (
    annotateTag(tag, {
      "data-gxp-se-root": "naver",
      "data-gxp-se-source": "naver",
    })
  ));

  annotated = annotated.replace(/<div\b[^>]*class="([^"]*\bse-component\b[^"]*)"[^>]*>/gi, (tag, className) => {
    if (!hasClassToken(className, "se-component")) return tag;
    const meta = getCanonicalBlockMeta(className);
    if (!meta) return stripCanonicalAttrs(tag);

    return annotateTag(tag, {
      "data-gxp-se": meta.block,
      "data-gxp-se-block": meta.block,
      "data-gxp-se-flow": meta.flow,
    });
  });

  annotated = annotated.replace(/<div\b[^>]*class="[^"]*\bse-imageStrip-container\b[^"]*"[^>]*>/gi, (tag) => (
    annotateTag(tag, {
      "data-gxp-se": "image-strip-layout",
      "data-gxp-se-layout": "inline-strip",
    })
  ));

  annotated = annotated.replace(/<div\b[^>]*class="[^"]*\bse-imageGroup-container\b[^"]*"[^>]*>/gi, (tag) => (
    annotateTag(tag, {
      "data-gxp-se": "image-collage-layout",
      "data-gxp-se-layout": "collage",
    })
  ));

  annotated = annotated.replace(/<div\b[^>]*class="[^"]*\bse-imageGroup-item\b[^"]*"[^>]*>/gi, (tag) => (
    annotateTag(tag, {
      "data-gxp-se": "image-collage-row",
    })
  ));

  annotated = annotated.replace(/<div\b[^>]*class="[^"]*\bse-module-oglink\b[^"]*"[^>]*>/gi, (tag) => (
    annotateTag(tag, {
      "data-gxp-se": "link-card-module",
    })
  ));

  annotated = annotated.replace(/<a\b[^>]*class="[^"]*\bse-oglink-info\b[^"]*"[^>]*>/gi, (tag) => (
    annotateTag(tag, {
      "data-gxp-se": "link-card-body",
    })
  ));

  annotated = annotated.replace(/<div\b[^>]*class="[^"]*\bse-oglink-info-container\b[^"]*"[^>]*>/gi, (tag) => (
    annotateTag(tag, {
      "data-gxp-se": "link-card-content",
    })
  ));

  annotated = annotated.replace(/<img\b[^>]*class="[^"]*\bse-oglink-thumbnail-resource\b[^"]*"[^>]*>/gi, (tag) => (
    annotateTag(tag, {
      "data-gxp-se": "link-card-thumb",
    })
  ));

  annotated = annotated.replace(/<strong\b[^>]*class="[^"]*\bse-oglink-title\b[^"]*"[^>]*>/gi, (tag) => (
    annotateTag(tag, {
      "data-gxp-se": "link-card-title",
    })
  ));

  annotated = annotated.replace(/<p\b[^>]*class="[^"]*\bse-oglink-summary\b[^"]*"[^>]*>/gi, (tag) => (
    annotateTag(tag, {
      "data-gxp-se": "link-card-summary",
    })
  ));

  annotated = annotated.replace(/<p\b[^>]*class="[^"]*\bse-oglink-url\b[^"]*"[^>]*>/gi, (tag) => (
    annotateTag(tag, {
      "data-gxp-se": "link-card-url",
    })
  ));

  annotated = annotated.replace(/<div\b[^>]*class="[^"]*\bse-module-image\b[^"]*"[^>]*>/gi, (tag) => (
    annotateTag(tag, {
      "data-gxp-se": getAttr(tag, "data-gxp-se") || "image-slot",
    })
  ));

  annotated = annotated.replace(/<span\b[^>]*class="[^"]*\bse-inline-image\b[^"]*"[^>]*>/gi, (tag) => (
    annotateTag(tag, {
      "data-gxp-se": "inline-image",
    })
  ));

  annotated = annotated.replace(/<div\b[^>]*class="[^"]*\bse-quotation-container\b[^"]*"[^>]*>/gi, (tag) => (
    annotateTag(tag, {
      "data-gxp-se": "quote-shell",
    })
  ));

  return annotated;
}

function getClassTokens(className = "") {
  return className
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

export function getNaverCanonicalDiagnostics(value = "") {
  const diagnostics = {
    hasCanonicalRoot: false,
    seComponentCount: 0,
    canonicalBlockCount: 0,
    markerCoverageRatio: 0,
    unknownComponentCount: 0,
    unknownComponentClassNames: [],
    unknownComponentSamples: [],
    blockCounts: {},
    flowCounts: {},
    layoutCounts: {},
  };

  if (!value) return diagnostics;

  diagnostics.hasCanonicalRoot = /data-gxp-se-root="naver"/i.test(value);

  const blockMatches = value.matchAll(/data-gxp-se-block="([^"]+)"/gi);
  for (const match of blockMatches) {
    const blockName = match[1];
    diagnostics.canonicalBlockCount += 1;
    diagnostics.blockCounts[blockName] = (diagnostics.blockCounts[blockName] ?? 0) + 1;
  }

  const flowMatches = value.matchAll(/data-gxp-se-flow="([^"]+)"/gi);
  for (const match of flowMatches) {
    const flowName = match[1];
    diagnostics.flowCounts[flowName] = (diagnostics.flowCounts[flowName] ?? 0) + 1;
  }

  const layoutMatches = value.matchAll(/data-gxp-se-layout="([^"]+)"/gi);
  for (const match of layoutMatches) {
    const layoutName = match[1];
    diagnostics.layoutCounts[layoutName] = (diagnostics.layoutCounts[layoutName] ?? 0) + 1;
  }

  const unknownClassNameSet = new Set();
  let componentMatch;
  while ((componentMatch = NAVER_DIV_WITH_CLASS_PATTERN.exec(value)) !== null) {
    const tag = componentMatch[0];
    const className = componentMatch[1] ?? "";
    if (!hasClassToken(className, "se-component")) continue;

    diagnostics.seComponentCount += 1;
    const hasCanonicalBlock = /\bdata-gxp-se-block="/i.test(tag);
    if (hasCanonicalBlock) continue;

    diagnostics.unknownComponentCount += 1;
    const tokens = getClassTokens(className).filter((token) => token !== "se-component");
    const summary = tokens.join(" ") || "(no-extra-class)";
    unknownClassNameSet.add(summary);
    if (diagnostics.unknownComponentSamples.length < 8) {
      diagnostics.unknownComponentSamples.push(summary);
    }
  }

  diagnostics.unknownComponentClassNames = [...unknownClassNameSet];
  diagnostics.markerCoverageRatio = diagnostics.seComponentCount > 0
    ? Number((diagnostics.canonicalBlockCount / diagnostics.seComponentCount).toFixed(3))
    : 0;

  return diagnostics;
}

export function stripNaverImportMeta(value = "") {
  return asHtmlString(value).replace(NAVER_IMPORT_META_PATTERN, "");
}

export function isNaverImportedContent(value = "") {
  const safeValue = asHtmlString(value);
  return safeValue.includes(NAVER_IMPORT_META_PREFIX) || safeValue.includes(NAVER_IMPORT_CONTAINER_MARKER);
}

export function extractImageSourcesFromHtml(value = "") {
  const safeValue = asHtmlString(value);
  const sources = [];
  let match;

  while ((match = NAVER_IMAGE_TAG_PATTERN.exec(safeValue)) !== null) {
    const tag = match[0];
    const src = getAttr(tag, "src") || getAttr(tag, "data-lazy-src") || getAttr(tag, "data-src");
    if (src) sources.push(src);
  }

  return sources;
}

export function normalizeNaverImportedHtml(value = "") {
  const safeValue = asHtmlString(value);
  if (!safeValue) return safeValue;

  let normalized = safeValue;

  // Defense-in-depth: strip all script/style blocks and inline event handlers
  // before any structural transformation. The render path also runs DOMPurify
  // via sanitizeRichHtml(), so this is a secondary layer for the parse pipeline.
  normalized = normalized
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/\s+on[a-z]{1,30}\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "");

  normalized = normalized
    .replace(/<script\b[^>]*class="__se_module_data"[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<!--\s*SE-TEXT\s*\{\s*-->/g, "")
    .replace(/<!--\s*\}\s*SE-TEXT\s*-->/g, "");

  normalized = normalized.replace(NAVER_IMAGE_TAG_PATTERN, (imgTag) => {
    const lazySrc = getAttr(imgTag, "data-lazy-src") || getAttr(imgTag, "data-src");
    const src = getAttr(imgTag, "src");
    const finalSrc = lazySrc || src;
    let nextTag = imgTag;

    if (finalSrc) nextTag = setAttr(nextTag, "src", finalSrc);
    nextTag = removeAttr(nextTag, "data-lazy-src");
    nextTag = removeAttr(nextTag, "data-src");
    nextTag = removeAttr(nextTag, "data-width");
    nextTag = removeAttr(nextTag, "data-height");
    nextTag = removeAttr(nextTag, "width");
    nextTag = removeAttr(nextTag, "height");

    return nextTag;
  });

  normalized = normalized.replace(NAVER_STYLE_ATTR_PATTERN, (_, styleValue) => {
    const cleaned = stripNaverStyleProps(styleValue);
    return cleaned ? ` style="${cleaned}"` : "";
  });

  normalized = normalized.replace(/<a\b[^>]*>\s*(<img\b[^>]*>)\s*<\/a>/gi, "$1");
  normalized = stripNaverSpacerParagraphs(normalized);
  normalized = stripNaverSpacerTableRows(normalized);
  normalized = unwrapSingleCellNaverTables(normalized);
  normalized = normalized
    .replace(NAVER_EMPTY_TEXT_COMPONENT_PATTERN, "")
    .replace(NAVER_EMPTY_TABLE_COMPONENT_PATTERN, "");
  normalized = annotateNaverCanonicalBlocks(normalized);

  return normalized.trim();
}

export function buildNaverRenderModel(content = "", attachmentUrls = []) {
  const isNaverImport = isNaverImportedContent(content);
  const normalizedContent = isNaverImport ? normalizeNaverImportedHtml(content) : content;
  const bodyImageUrls = extractImageSourcesFromHtml(normalizedContent);
  const bodyImageUrlSet = new Set(bodyImageUrls);

  return {
    isNaverImport,
    normalizedContent,
    bodyImageUrls,
    dedupedAttachmentUrls: attachmentUrls.filter((url) => !bodyImageUrlSet.has(url)),
  };
}
