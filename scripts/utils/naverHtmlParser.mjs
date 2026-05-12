const IMPORT_META_PREFIX = "<!--GXP_BLOG_IMPORT_META:";
const NAVER_OG_PLACEHOLDER = "https://ssl.pstatic.net/static/blog/icon/og_270x270.png";

function asString(value) {
  return typeof value === "string" ? value : "";
}

export function decodeHtmlEntities(input) {
  if (!input) return "";

  const named = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: " ",
    ldquo: "“",
    rdquo: "”",
    lsquo: "‘",
    rsquo: "’",
    ndash: "–",
    mdash: "—",
    middot: "·",
    hellip: "…",
  };

  return input
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&([a-z]+);/gi, (full, name) => named[name] ?? full);
}

export function escapeHtml(input) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function stripRssTracking(url) {
  if (!url) return "";
  const clean = url.replace(/\?fromRss=true&trackingCode=rss$/, "");
  return clean.replace(/\?$/, "");
}

export function extractTagValue(block, tagName) {
  const cdataPattern = new RegExp(`<${tagName}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tagName}>`, "i");
  const textPattern = new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, "i");
  const cdataMatch = block.match(cdataPattern);
  if (cdataMatch) return decodeHtmlEntities(cdataMatch[1].trim());
  const textMatch = block.match(textPattern);
  if (textMatch) return decodeHtmlEntities(textMatch[1].trim());
  return "";
}

export function parseRssItems(xml) {
  const items = [];
  const matches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g);

  for (const match of matches) {
    const block = match[1];
    items.push({
      category: extractTagValue(block, "category"),
      title: extractTagValue(block, "title"),
      link: stripRssTracking(extractTagValue(block, "link")),
      guid: stripRssTracking(extractTagValue(block, "guid")),
      description: extractTagValue(block, "description"),
      pubDate: extractTagValue(block, "pubDate"),
      tags: extractTagValue(block, "tag"),
    });
  }

  return items;
}

export function extractMetaContent(html, property) {
  const pattern = new RegExp(`<meta\\s+property="${property}"\\s+content="([^"]*)"`, "i");
  const match = html.match(pattern);
  return decodeHtmlEntities(match?.[1] ?? "");
}

export function extractPublishedDateFromHtml(html) {
  const metaDate = extractMetaContent(html, "article:published_time");
  if (metaDate) {
    const d = new Date(metaDate);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }

  const dateMatch = html.match(
    /<(?:span|p)[^>]*class="[^"]*(?:se_publishDate|se-publish-date|date)[^"]*"[^>]*>([^<]+)<\/(?:span|p)>/i,
  );
  if (dateMatch) {
    const raw = dateMatch[1].trim().replace(/\.$/, "").replace(/\./g, "-");
    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }

  return null;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function parseCategoryNoFromHtml(html, targetCategoryName) {
  const safeHtml = asString(html);
  const safeTargetCategoryName = asString(targetCategoryName);
  if (!safeHtml || !safeTargetCategoryName) return null;

  const directPat = new RegExp(
    `categoryNo=(\\d+)[^>]*>\\s*${escapeRegex(safeTargetCategoryName)}\\s*</a>`,
    "i",
  );
  const directMatch = safeHtml.match(directPat);
  if (directMatch) return directMatch[1];

  const jsonPat = /"categoryNo"\s*:\s*(\d+)\s*,\s*"categoryName"\s*:\s*"([^"]+)"/g;
  let m;
  while ((m = jsonPat.exec(safeHtml))) {
    if (decodeHtmlEntities(m[2]) === safeTargetCategoryName) return m[1];
  }

  const nameIdx = safeHtml.indexOf(safeTargetCategoryName);
  if (nameIdx !== -1) {
    const area = safeHtml.slice(Math.max(0, nameIdx - 600), nameIdx);
    const allMatches = [...area.matchAll(/categoryNo=(\d+)/g)];
    if (allMatches.length > 0) return allMatches[allMatches.length - 1][1];
  }

  return null;
}

export function parsePostLogNosFromHtml(html) {
  const tagParamMatch = html.match(/tagParam\s*=\s*''\s*\|\|\s*'([^']*)'/);
  if (tagParamMatch) {
    const logNos = [...tagParamMatch[1].matchAll(/logNo=(\d+)/g)].map((m) => m[1]);
    if (logNos.length > 0) return logNos;
  }

  const logNos = new Set();
  const p1 = /logNo=(\d{8,})/gi;
  let m;
  while ((m = p1.exec(html))) logNos.add(m[1]);
  return [...logNos];
}

export function hasMorePages(html, currentPage) {
  return (
    html.includes(`currentPage=${currentPage + 1}`) ||
    /<[^>]+class="[^"]*(?:btn_next|next)[^"]*"[^>]*>/.test(html)
  );
}

export function findMainContainerStart(html) {
  const match = html.match(/<div class="se-main-container"[^>]*>/i);
  if (!match || match.index == null) return -1;
  return match.index;
}

export function extractBalancedDiv(html, startIndex) {
  const openEnd = html.indexOf(">", startIndex);
  if (openEnd === -1) return null;

  const tagRegex = /<\/?div\b[^>]*>/gi;
  tagRegex.lastIndex = openEnd + 1;

  let depth = 1;
  let match;

  while ((match = tagRegex.exec(html))) {
    const token = match[0];
    if (/^<div\b/i.test(token)) depth += 1;
    if (/^<\/div/i.test(token)) depth -= 1;

    if (depth === 0) {
      return html.slice(startIndex, match.index + match[0].length);
    }
  }

  return null;
}

export function getAttr(tag, name) {
  const pattern = new RegExp(`${name}="([^"]*)"`, "i");
  return decodeHtmlEntities(tag.match(pattern)?.[1] ?? "");
}

export function setAttr(tag, name, value) {
  const pattern = new RegExp(`\\s${name}="[^"]*"`, "i");
  if (pattern.test(tag)) {
    return tag.replace(pattern, ` ${name}="${value}"`);
  }
  return tag.replace(/>$/, ` ${name}="${value}">`);
}

export function removeAttr(tag, name) {
  const pattern = new RegExp(`\\s${name}="[^"]*"`, "ig");
  return tag.replace(pattern, "");
}

export function stripHtml(html) {
  return decodeHtmlEntities(
    html
      .replace(/<img\b[^>]*>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

export function fallbackContentFromDescription(description) {
  const text = stripHtml(description);
  return text ? `<p>${escapeHtml(text)}</p>` : "<p>본문을 불러오지 못했습니다.</p>";
}

export function extractFirstImageFromHtml(html) {
  const imgPattern = /<img\b[^>]*>/gi;
  let match;
  while ((match = imgPattern.exec(html))) {
    const tag = match[0];
    const src = getAttr(tag, "src") || getAttr(tag, "data-lazy-src");
    if (src) return src;
  }
  return "";
}

export function extractFirstImageFromDescription(description) {
  const match = description.match(/<img[^>]+src="([^"]+)"/i);
  return decodeHtmlEntities(match?.[1] ?? "");
}

export function isMeaningfulOgImage(url) {
  if (!url) return false;
  return url !== NAVER_OG_PLACEHOLDER;
}

export function encodeImportMeta(meta) {
  return `${IMPORT_META_PREFIX}${Buffer.from(JSON.stringify(meta), "utf8").toString("base64")}-->`;
}

export function readImportMeta(content) {
  const match = content.match(/<!--GXP_BLOG_IMPORT_META:([A-Za-z0-9+/=]+)-->/i);
  if (!match) return null;

  try {
    const decoded = Buffer.from(match[1], "base64").toString("utf8");
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}
