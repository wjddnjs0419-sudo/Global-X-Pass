import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { blogImportManifest } from "./blog-import-manifest.mjs";
import {
  extractImageSourcesFromHtml,
  getNaverCanonicalDiagnostics,
  isNaverImportedContent,
  normalizeNaverImportedHtml,
  stripNaverImportMeta,
} from "../src/utils/naverImportShared.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, "..");

const IMPORT_META_PREFIX = "<!--GXP_BLOG_IMPORT_META:";
const NAVER_OG_PLACEHOLDER = "https://ssl.pstatic.net/static/blog/icon/og_270x270.png";
const NAVER_BLOG_ID = "nextchallenge";

const argv = process.argv.slice(2);
const discoverOnly = argv.includes("--discover");
const crawlMode = argv.includes("--crawl");
const reportCanonical = argv.includes("--report-canonical");
const repairQueueDuplicates = argv.includes("--repair-queue-duplicates");
const processQueue = argv.includes("--process-queue") || argv.includes("--worker");
const updateExisting = argv.includes("--update-existing");
const writeMode = argv.includes("--write");
const mirrorImages = argv.includes("--mirror-images");
const dryRun = (discoverOnly || crawlMode) ? false : (argv.includes("--dry-run") || !writeMode);

function getArgValue(name) {
  const eqMatch = argv.find((arg) => arg.startsWith(`${name}=`));
  if (eqMatch) return eqMatch.slice(name.length + 1);

  const idx = argv.indexOf(name);
  if (idx !== -1 && argv[idx + 1] && !argv[idx + 1].startsWith("--")) {
    return argv[idx + 1];
  }
  return null;
}

const runIdArg = getArgValue("--run-id");
const sourceUrlFilterArg = getArgValue("--source-url");
const logNoFilterArg = getArgValue("--log-no");
const targetPostIdArg = getArgValue("--target-post-id");

const CRAWL_TARGETS = [
  { categoryName: "★글로벌 기업 협업 프로그램", targetCategory: "events-archive" },
  { categoryName: "Around X-뉴스레터", targetCategory: "news" },
];

function loadEnv() {
  const candidates = [
    resolve(process.cwd(), ".env"),
    resolve(ROOT, ".env"),
  ];

  for (const envPath of candidates) {
    if (!existsSync(envPath)) continue;
    const raw = readFileSync(envPath, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      const value = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
      if (!(key in process.env)) process.env[key] = value;
    }
    break;
  }
}

loadEnv();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function assertConfig() {
  if (!SUPABASE_URL) {
    throw new Error("VITE_SUPABASE_URL is not set in .env");
  }
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set in .env");
  }
}

function decodeHtmlEntities(input) {
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

function escapeHtml(input) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function stripRssTracking(url) {
  if (!url) return "";
  const clean = url.replace(/\?fromRss=true&trackingCode=rss$/, "");
  return clean.replace(/\?$/, "");
}

async function fetchText(url, extraHeaders) {
  try {
    const response = await fetch(url, {
      redirect: "follow",
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; GlobalXPassImporter/1.0)",
        "referer": "https://blog.naver.com/",
        ...extraHeaders,
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.text();
  } catch {
    return execFileSync("curl", ["-Ls", "-H", "Referer: https://blog.naver.com/", url], { encoding: "utf8" });
  }
}

function extractTagValue(block, tagName) {
  const cdataPattern = new RegExp(`<${tagName}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tagName}>`, "i");
  const textPattern = new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, "i");
  const cdataMatch = block.match(cdataPattern);
  if (cdataMatch) return decodeHtmlEntities(cdataMatch[1].trim());
  const textMatch = block.match(textPattern);
  if (textMatch) return decodeHtmlEntities(textMatch[1].trim());
  return "";
}

function parseRssItems(xml) {
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

function discoverCandidates(items) {
  return items
    .filter((item) => {
      const published = new Date(item.pubDate);
      const year = Number.isNaN(published.getTime()) ? null : published.getFullYear();
      return year != null && year >= 2025 && (
        item.category === "Around X-뉴스레터" ||
        item.category === "★글로벌 기업 협업 프로그램"
      );
    })
    .map((item) => ({
      url: item.link || item.guid,
      targetCategory: item.category === "Around X-뉴스레터" ? "news" : "events-archive",
      tag: item.category === "Around X-뉴스레터" ? "뉴스레터" : "",
      titleOverride: null,
      thumbnailOverride: null,
      pubDateOverride: null,
      enabled: false,
      discoveredTitle: item.title,
      discoveredBoard: item.category,
      discoveredPubDate: item.pubDate,
    }));
}

function extractMetaContent(html, property) {
  const pattern = new RegExp(`<meta\\s+property="${property}"\\s+content="([^"]*)"`, "i");
  const match = html.match(pattern);
  return decodeHtmlEntities(match?.[1] ?? "");
}

// Try to extract published date from the post HTML (for posts not in RSS)
function extractPublishedDateFromHtml(html) {
  const metaDate = extractMetaContent(html, "article:published_time");
  if (metaDate) {
    const d = new Date(metaDate);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }

  // e.g. <span class="se_publishDate">2025.03.15.</span>
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

// ──────────────────────────────────────────────
// Category crawling helpers
// ──────────────────────────────────────────────

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseCategoryNoFromHtml(html, targetCategoryName) {
  // Most accurate: <a href="...categoryNo=XX...">CATEGORY_NAME</a>
  const directPat = new RegExp(
    `categoryNo=(\\d+)[^>]*>\\s*${escapeRegex(targetCategoryName)}\\s*</a>`,
    "i",
  );
  const directMatch = html.match(directPat);
  if (directMatch) return directMatch[1];

  // Try JSON-like pattern: "categoryNo":47,"categoryName":"★글로벌..."
  const jsonPat = /"categoryNo"\s*:\s*(\d+)\s*,\s*"categoryName"\s*:\s*"([^"]+)"/g;
  let m;
  while ((m = jsonPat.exec(html))) {
    if (decodeHtmlEntities(m[2]) === targetCategoryName) return m[1];
  }

  // Proximity fallback: find the LAST categoryNo= in the 600 chars before the name
  const nameIdx = html.indexOf(targetCategoryName);
  if (nameIdx !== -1) {
    const area = html.slice(Math.max(0, nameIdx - 600), nameIdx);
    const allMatches = [...area.matchAll(/categoryNo=(\d+)/g)];
    if (allMatches.length > 0) return allMatches[allMatches.length - 1][1];
  }

  return null;
}

function parsePostLogNosFromHtml(html) {
  // tagParam is set once per page and contains ONLY the actual listed post logNos.
  // e.g. var tagParam = '' || '&logNo=111&logNo=222&logNo=333';
  const tagParamMatch = html.match(/tagParam\s*=\s*''\s*\|\|\s*'([^']*)'/);
  if (tagParamMatch) {
    const logNos = [...tagParamMatch[1].matchAll(/logNo=(\d+)/g)].map((m) => m[1]);
    if (logNos.length > 0) return logNos;
  }

  // Fallback: broad scan (used when tagParam is absent)
  const logNos = new Set();
  const p1 = /logNo=(\d{8,})/gi;
  let m;
  while ((m = p1.exec(html))) logNos.add(m[1]);
  return [...logNos];
}

function hasMorePages(html, currentPage) {
  return (
    html.includes(`currentPage=${currentPage + 1}`) ||
    /<[^>]+class="[^"]*(?:btn_next|next)[^"]*"[^>]*>/.test(html)
  );
}

async function findCategoryNo(blogId, categoryName) {
  // The main blog page is a frameset — fetch PostList.naver frames for the sidebar.
  const candidateUrls = [
    `https://blog.naver.com/PostList.naver?blogId=${blogId}&directAccess=true`,
    `https://blog.naver.com/PostList.naver?blogId=${blogId}&categoryNo=1&directAccess=true`,
    `https://blog.naver.com/PostList.naver?blogId=${blogId}&widgetTypeCall=true&directAccess=true`,
  ];

  for (const url of candidateUrls) {
    try {
      const html = await fetchText(url);
      const no = parseCategoryNoFromHtml(html, categoryName);
      if (no) return no;
    } catch {
      // try next
    }
  }

  // Last resort: check a known post of that category (uses PostView breadcrumb/series link)
  const KNOWN_POSTS = {
    "Around X-뉴스레터": "224095642446",
    "★글로벌 기업 협업 프로그램": "224049989824",
  };
  const knownLogNo = KNOWN_POSTS[categoryName];
  if (knownLogNo) {
    try {
      const postUrl = `https://blog.naver.com/PostView.naver?blogId=${blogId}&logNo=${knownLogNo}&redirect=Dlog&widgetTypeCall=true&directAccess=false`;
      const postHtml = await fetchText(postUrl);
      const no = parseCategoryNoFromHtml(postHtml, categoryName);
      if (no) return no;
    } catch {
      // ignore
    }
  }

  return null;
}

async function crawlCategoryPosts(blogId, categoryName) {
  console.error(`[crawl] Resolving categoryNo for "${categoryName}"...`);
  const categoryNo = await findCategoryNo(blogId, categoryName);

  if (!categoryNo) {
    throw new Error(`Could not find categoryNo for "${categoryName}" in blog ${blogId}`);
  }
  console.error(`[crawl] categoryNo=${categoryNo}`);

  const allLogNos = new Set();
  let page = 1;

  while (true) {
    const url = `https://blog.naver.com/PostList.naver?blogId=${blogId}&categoryNo=${categoryNo}&currentPage=${page}`;
    console.error(`[crawl] Page ${page}: ${url}`);
    const html = await fetchText(url);
    const logNos = parsePostLogNosFromHtml(html);

    let added = 0;
    for (const logNo of logNos) {
      if (!allLogNos.has(logNo)) { allLogNos.add(logNo); added++; }
    }

    console.error(`[crawl]   → ${logNos.length} found, ${added} new (total ${allLogNos.size})`);

    if (added === 0 || !hasMorePages(html, page)) break;

    page++;
    await new Promise((r) => setTimeout(r, 900));
  }

  return [...allLogNos].map((logNo) => ({
    url: `https://blog.naver.com/${blogId}/${logNo}`,
    logNo,
    categoryName,
  }));
}

// ──────────────────────────────────────────────
// Image mirroring helpers
// ──────────────────────────────────────────────

function getImageExtension(url, contentType) {
  const ctMap = { "image/jpeg": "jpg", "image/png": "png", "image/gif": "gif", "image/webp": "webp" };
  const ct = (contentType ?? "").split(";")[0].trim();
  if (ctMap[ct]) return ctMap[ct];
  const ext = url.split("?")[0].split(".").pop()?.toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext ?? "")) {
    return ext === "jpeg" ? "jpg" : ext;
  }
  return "jpg";
}

async function mirrorImageToSupabase(imageUrl, supabase) {
  if (!imageUrl || !imageUrl.startsWith("http")) return imageUrl;
  if (imageUrl.startsWith(SUPABASE_URL ?? "__none__")) return imageUrl;

  try {
    const res = await fetch(imageUrl, {
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; GlobalXPassImporter/1.0)",
        "referer": "https://blog.naver.com/",
      },
    });
    if (!res.ok) {
      console.error(`[mirror] HTTP ${res.status} — ${imageUrl.slice(0, 80)}`);
      return imageUrl;
    }
    const ct = res.headers.get("content-type") ?? "";
    if (!ct.startsWith("image/")) {
      console.error(`[mirror] Non-image content-type (${ct}) — skipping`);
      return imageUrl;
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    const hash = createHash("sha256").update(imageUrl).digest("hex").slice(0, 40);
    const ext = getImageExtension(imageUrl, ct);
    const storagePath = `blog-import/${hash}.${ext}`;

    const { error } = await supabase.storage.from("images").upload(storagePath, buffer, {
      contentType: ct.split(";")[0].trim(),
      upsert: true,
    });
    if (error) {
      console.error(`[mirror] Upload error: ${error.message}`);
      return imageUrl;
    }

    const { data: { publicUrl } } = supabase.storage.from("images").getPublicUrl(storagePath);
    console.error(`[mirror] ✓ ${storagePath}`);
    return publicUrl;
  } catch (err) {
    console.error(`[mirror] Error: ${err.message}`);
    return imageUrl;
  }
}

async function mirrorContentImages(html, supabase) {
  if (!html) return html;
  const imgPattern = /<img\b[^>]*>/gi;
  const imgs = [...html.matchAll(imgPattern)];

  let result = html;
  for (const m of imgs) {
    const tag = m[0];
    const src = getAttr(tag, "src");
    if (!src || !src.startsWith("http")) continue;
    if (src.startsWith(SUPABASE_URL ?? "__none__")) continue;

    const mirrored = await mirrorImageToSupabase(src, supabase);
    if (mirrored !== src) {
      result = result.replace(tag, setAttr(tag, "src", mirrored));
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  return result;
}

// ──────────────────────────────────────────────
// HTML parsing helpers (unchanged)
// ──────────────────────────────────────────────

function findMainContainerStart(html) {
  const match = html.match(/<div class="se-main-container"[^>]*>/i);
  if (!match || match.index == null) return -1;
  return match.index;
}

function extractBalancedDiv(html, startIndex) {
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

function getAttr(tag, name) {
  const pattern = new RegExp(`${name}="([^"]*)"`, "i");
  return decodeHtmlEntities(tag.match(pattern)?.[1] ?? "");
}

function setAttr(tag, name, value) {
  const pattern = new RegExp(`\\s${name}="[^"]*"`, "i");
  if (pattern.test(tag)) {
    return tag.replace(pattern, ` ${name}="${value}"`);
  }
  return tag.replace(/>$/, ` ${name}="${value}">`);
}

function removeAttr(tag, name) {
  const pattern = new RegExp(`\\s${name}="[^"]*"`, "ig");
  return tag.replace(pattern, "");
}

function stripHtml(html) {
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

function fallbackContentFromDescription(description) {
  const text = stripHtml(description);
  return text ? `<p>${escapeHtml(text)}</p>` : "<p>본문을 불러오지 못했습니다.</p>";
}

function extractFirstImageFromHtml(html) {
  const imgPattern = /<img\b[^>]*>/gi;
  let match;
  while ((match = imgPattern.exec(html))) {
    const tag = match[0];
    const src = getAttr(tag, "src") || getAttr(tag, "data-lazy-src");
    if (src) return src;
  }
  return "";
}

function extractFirstImageFromDescription(description) {
  const match = description.match(/<img[^>]+src="([^"]+)"/i);
  return decodeHtmlEntities(match?.[1] ?? "");
}

function isMeaningfulOgImage(url) {
  if (!url) return false;
  return url !== NAVER_OG_PLACEHOLDER;
}

function encodeImportMeta(meta) {
  return `${IMPORT_META_PREFIX}${Buffer.from(JSON.stringify(meta), "utf8").toString("base64")}-->`;
}

function readImportMeta(content) {
  const match = content.match(/<!--GXP_BLOG_IMPORT_META:([A-Za-z0-9+/=]+)-->/i);
  if (!match) return null;

  try {
    const decoded = Buffer.from(match[1], "base64").toString("utf8");
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

function ensureValidManifestEntry(entry) {
  if (!entry.enabled) return;
  if (!entry.url) {
    throw new Error("Enabled manifest entry is missing url");
  }
  if (!["news", "events-archive"].includes(entry.targetCategory)) {
    throw new Error(`Unsupported targetCategory for ${entry.url}`);
  }
  if (entry.targetCategory === "events-archive" && !entry.tag?.trim()) {
    throw new Error(`Event archive entry requires a manual tag: ${entry.url}`);
  }
}

function prettyDate(isoString) {
  return new Date(isoString).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
}

// ──────────────────────────────────────────────
// Core record builder
// ──────────────────────────────────────────────

async function buildImportRecord(entry, rssMap, supabase) {
  const sourceUrl = stripRssTracking(entry.url);
  const rssItem = rssMap.get(sourceUrl);
  const html = await fetchText(
    sourceUrl.includes("PostView.naver")
      ? sourceUrl
      : sourceUrl.replace(
          `https://blog.naver.com/${NAVER_BLOG_ID}/`,
          `https://blog.naver.com/PostView.naver?blogId=${NAVER_BLOG_ID}&logNo=`,
        ) + "&redirect=Dlog&widgetTypeCall=true&noTrackingCode=true&directAccess=false",
  );

  const ogTitle = extractMetaContent(html, "og:title");
  const ogImage = extractMetaContent(html, "og:image");
  const ogUrl = stripRssTracking(extractMetaContent(html, "og:url"));

  const containerStart = findMainContainerStart(html);
  const containerHtml = containerStart >= 0 ? extractBalancedDiv(html, containerStart) : null;
  const normalizedContent = normalizeNaverImportedHtml(containerHtml || "");
  const canonicalDiagnostics = getNaverCanonicalDiagnostics(normalizedContent);
  const fallbackContent = fallbackContentFromDescription(rssItem?.description || "");
  let contentHtml = normalizedContent || fallbackContent;

  if (
    normalizedContent &&
    (
      !canonicalDiagnostics.hasCanonicalRoot ||
      canonicalDiagnostics.unknownComponentCount > 0 ||
      canonicalDiagnostics.markerCoverageRatio < 1
    )
  ) {
    console.error(
      `[canonical] ${sourceUrl} coverage=${canonicalDiagnostics.markerCoverageRatio} ` +
      `unknown=${canonicalDiagnostics.unknownComponentCount} ` +
      `samples=${canonicalDiagnostics.unknownComponentSamples.join(" | ") || "-"}`,
    );
  }

  // Mirror content images first so thumbnail can pick up a mirrored src
  if (mirrorImages && supabase) {
    console.error(`[mirror] Content images for: ${ogTitle || sourceUrl}`);
    contentHtml = await mirrorContentImages(contentHtml, supabase);
  }

  const firstContentImage = extractFirstImageFromHtml(contentHtml);
  const rssImage = extractFirstImageFromDescription(rssItem?.description || "");

  let thumbnailUrl =
    entry.thumbnailOverride?.trim() ||
    firstContentImage ||
    (isMeaningfulOgImage(ogImage) ? ogImage : "") ||
    rssImage ||
    "";

  // Mirror thumbnail (may be og:image / rssImage that wasn't in content)
  if (mirrorImages && supabase && thumbnailUrl && !thumbnailUrl.startsWith(SUPABASE_URL ?? "__none__")) {
    console.error(`[mirror] Thumbnail: ${thumbnailUrl.slice(0, 80)}`);
    thumbnailUrl = await mirrorImageToSupabase(thumbnailUrl, supabase);
  }

  const contentImageSources = extractImageSourcesFromHtml(contentHtml);
  const attachmentImageUrl = thumbnailUrl && !contentImageSources.includes(thumbnailUrl)
    ? thumbnailUrl
    : "";

  const title = entry.titleOverride?.trim() || ogTitle || rssItem?.title || "";
  if (!title) {
    throw new Error(`Could not extract title: ${sourceUrl}`);
  }

  // Published date: manifest override > RSS > HTML extraction
  const pubDateRaw = entry.pubDateOverride || rssItem?.pubDate;
  let publishedAt;

  if (pubDateRaw) {
    publishedAt = new Date(pubDateRaw);
  } else {
    const htmlDate = extractPublishedDateFromHtml(html);
    publishedAt = htmlDate ? new Date(htmlDate) : null;
  }

  if (!publishedAt || Number.isNaN(publishedAt.getTime())) {
    throw new Error(`Could not resolve published date: ${sourceUrl}`);
  }

  const importMeta = {
    sourceUrl: ogUrl || sourceUrl,
    sourceBoard: rssItem?.category || "",
    publishedAt: publishedAt.toISOString(),
    importedAt: new Date().toISOString(),
  };

  const finalTag = entry.targetCategory === "news" ? "뉴스레터" : entry.tag.trim();
  const finalContent = `${encodeImportMeta(importMeta)}\n${stripNaverImportMeta(contentHtml)}`;

  return {
    sourceUrl: importMeta.sourceUrl,
    sourceBoard: importMeta.sourceBoard,
    targetCategory: entry.targetCategory,
    title,
    tag: finalTag,
    thumbnailUrl,
    attachmentImageUrl,
    content: finalContent,
    createdAt: publishedAt.toISOString(),
  };
}

async function loadExistingImportedPosts(supabase, categories) {
  const { data, error } = await supabase
    .from("posts")
    .select("id, category, title, content, created_at, updated_at")
    .in("category", categories);

  if (error) {
    throw new Error(`Failed to load existing posts: ${error.message}`);
  }

  const bySourceUrl = new Map();
  for (const post of data || []) {
    const meta = readImportMeta(post.content || "");
    if (!meta?.sourceUrl) continue;
    bySourceUrl.set(meta.sourceUrl, post);
  }
  return bySourceUrl;
}

async function loadImportedNaverPosts(supabase, categories = CRAWL_TARGETS.map((target) => target.targetCategory)) {
  const { data: markerPosts, error: markerError } = await supabase
    .from("posts")
    .select("id, category, title, content, created_at, updated_at")
    .in("category", categories)
    .order("created_at", { ascending: false });

  if (markerError) {
    throw new Error(`Failed to load imported Naver posts: ${markerError.message}`);
  }

  const byId = new Map();
  for (const post of markerPosts || []) {
    if (isNaverImportedContent(post.content || "")) {
      const meta = readImportMeta(post.content || "");
      byId.set(post.id, {
        ...post,
        report_source: "content-marker",
        report_source_url: meta?.sourceUrl || null,
      });
    }
  }

  const { data: queueRows, error: queueError } = await supabase
    .from("blog_import_queue")
    .select("source_url, target_category, existing_post_id, status")
    .in("target_category", categories)
    .not("existing_post_id", "is", null);

  if (queueError) {
    throw new Error(`Failed to load imported Naver queue rows: ${queueError.message}`);
  }

  const queueRowByPostId = new Map();
  for (const row of queueRows || []) {
    if (row.existing_post_id && !queueRowByPostId.has(row.existing_post_id)) {
      queueRowByPostId.set(row.existing_post_id, row);
    }
  }

  const queuedPostIds = [...queueRowByPostId.keys()];
  if (queuedPostIds.length > 0) {
    const { data: queuedPosts, error: queuedPostsError } = await supabase
      .from("posts")
      .select("id, category, title, content, created_at, updated_at")
      .in("id", queuedPostIds);

    if (queuedPostsError) {
      throw new Error(`Failed to load queue-backed imported posts: ${queuedPostsError.message}`);
    }

    for (const post of queuedPosts || []) {
      const queueRow = queueRowByPostId.get(post.id);
      byId.set(post.id, {
        ...post,
        report_source: byId.has(post.id) ? "queue+content-marker" : "queue",
        report_source_url: queueRow?.source_url || byId.get(post.id)?.report_source_url || null,
      });
    }
  }

  return [...byId.values()].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

async function loadRssMap() {
  const rssXml = await fetchText("https://rss.blog.naver.com/nextchallenge.xml");
  const rssItems = parseRssItems(rssXml);
  return new Map(
    rssItems.map((item) => [stripRssTracking(item.link || item.guid), item]),
  );
}

function extractLogNoFromUrl(url) {
  return url.match(/(?:logNo=|nextchallenge\/)(\d{8,})/)?.[1] ?? null;
}

function normalizeSourceUrl(url) {
  const logNo = extractLogNoFromUrl(url);
  return logNo ? `https://blog.naver.com/${NAVER_BLOG_ID}/${logNo}` : stripRssTracking(url);
}

function entryMatchesFilter(entry) {
  if (!sourceUrlFilterArg && !logNoFilterArg) return true;

  const normalizedEntryUrl = normalizeSourceUrl(entry.url);
  if (sourceUrlFilterArg && normalizedEntryUrl === normalizeSourceUrl(sourceUrlFilterArg)) {
    return true;
  }

  if (logNoFilterArg && extractLogNoFromUrl(entry.url) === logNoFilterArg) {
    return true;
  }

  return false;
}

async function resolveQueueRun(supabase) {
  if (dryRun) {
    throw new Error("Queue worker mode requires --write because it updates run and queue state.");
  }

  if (runIdArg) {
    const { data, error } = await supabase
      .from("blog_import_runs")
      .select("*")
      .eq("id", runIdArg)
      .maybeSingle();

    if (error) throw new Error(`Failed to load run ${runIdArg}: ${error.message}`);
    if (!data) throw new Error(`Run not found: ${runIdArg}`);
    return data;
  }

  const { data: queuedRun, error: queuedError } = await supabase
    .from("blog_import_runs")
    .select("*")
    .eq("status", "queued")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (queuedError) {
    throw new Error(`Failed to load queued run: ${queuedError.message}`);
  }

  if (queuedRun) return queuedRun;

  const { data: createdRun, error: createError } = await supabase
    .from("blog_import_runs")
    .insert({
      trigger_source: "worker",
      status: "queued",
    })
    .select("*")
    .single();

  if (createError) {
    throw new Error(`Failed to create worker run: ${createError.message}`);
  }
  return createdRun;
}

async function updateQueueRun(supabase, runId, payload) {
  const { error } = await supabase
    .from("blog_import_runs")
    .update(payload)
    .eq("id", runId);

  if (error) {
    throw new Error(`Failed to update run ${runId}: ${error.message}`);
  }
}

async function discoverQueueCandidates() {
  const candidates = [];

  for (const target of CRAWL_TARGETS) {
    console.error(`\n[worker] Crawling ${target.categoryName}...`);
    const posts = await crawlCategoryPosts(NAVER_BLOG_ID, target.categoryName);
    for (const post of posts) {
      candidates.push({
        source_url: normalizeSourceUrl(post.url),
        source_log_no: post.logNo,
        source_board: target.categoryName,
        target_category: target.targetCategory,
        suggested_tag: target.targetCategory === "news" ? "뉴스레터" : null,
      });
    }
    await new Promise((r) => setTimeout(r, 1000));
  }

  return candidates;
}

async function loadQueueRowsBySourceUrl(supabase, sourceUrls) {
  if (sourceUrls.length === 0) return new Map();

  const { data, error } = await supabase
    .from("blog_import_queue")
    .select("*")
    .in("source_url", sourceUrls);

  if (error) {
    throw new Error(`Failed to load import queue: ${error.message}`);
  }

  return new Map((data || []).map((row) => [row.source_url, row]));
}

function nextQueueStatus(candidate, existingQueue, existingPost) {
  if (existingPost) return "imported";
  if (existingQueue?.status === "imported") return "imported";

  if (candidate.target_category === "news") {
    return "approved";
  }

  const existingTag = existingQueue?.suggested_tag?.trim();
  if (existingQueue?.status === "approved" && existingTag) {
    return "approved";
  }

  return "pending";
}

async function upsertQueueCandidates(supabase, candidates, existingBySourceUrl, runId) {
  const existingQueueBySourceUrl = await loadQueueRowsBySourceUrl(
    supabase,
    candidates.map((candidate) => candidate.source_url),
  );

  const rows = candidates.map((candidate) => {
    const existingQueue = existingQueueBySourceUrl.get(candidate.source_url);
    const existingPost = existingBySourceUrl.get(candidate.source_url);
    const suggestedTag = existingQueue?.suggested_tag || candidate.suggested_tag;

    return {
      run_id: runId,
      source_url: candidate.source_url,
      source_log_no: candidate.source_log_no,
      source_board: candidate.source_board,
      target_category: candidate.target_category,
      suggested_tag: suggestedTag,
      status: nextQueueStatus(candidate, existingQueue, existingPost),
      existing_post_id: existingPost?.id || existingQueue?.existing_post_id || null,
      error: null,
      imported_at: existingPost ? new Date().toISOString() : existingQueue?.imported_at || null,
    };
  });

  const { data, error } = await supabase
    .from("blog_import_queue")
    .upsert(rows, { onConflict: "source_url" })
    .select("*");

  if (error) {
    throw new Error(`Failed to upsert import queue: ${error.message}`);
  }

  return data || [];
}

async function loadApprovedQueueRows(supabase, runId) {
  const { data, error } = await supabase
    .from("blog_import_queue")
    .select("*")
    .eq("run_id", runId)
    .eq("status", "approved")
    .order("updated_at", { ascending: true, nullsFirst: false });

  if (error) {
    throw new Error(`Failed to load approved queue rows: ${error.message}`);
  }

  return data || [];
}

function queueRowToManifestEntry(row) {
  return {
    url: row.source_url,
    targetCategory: row.target_category,
    tag: row.target_category === "news" ? "뉴스레터" : (row.suggested_tag || "").trim(),
    titleOverride: null,
    thumbnailOverride: null,
    pubDateOverride: row.suggested_date,
    enabled: true,
  };
}

async function updateQueueRow(supabase, id, payload) {
  const { error } = await supabase
    .from("blog_import_queue")
    .update(payload)
    .eq("id", id);

  if (error) {
    throw new Error(`Failed to update queue row ${id}: ${error.message}`);
  }
}

async function importApprovedQueueRows(supabase, rows, existingBySourceUrl, rssMap) {
  const counts = { inserted: 0, updated: 0, skipped: 0, failed: 0 };

  for (const row of rows) {
    const entry = queueRowToManifestEntry(row);

    if (entry.targetCategory === "events-archive" && !entry.tag) {
      await updateQueueRow(supabase, row.id, {
        status: "pending",
        error: "events-archive entries require suggested_tag before import",
      });
      counts.skipped += 1;
      continue;
    }

    try {
      const record = await buildImportRecord(entry, rssMap, supabase);
      const existing = existingBySourceUrl.get(record.sourceUrl) || existingBySourceUrl.get(row.source_url);

      const payload = {
        category: record.targetCategory,
        title: record.title,
        content: record.content,
        image_url: record.attachmentImageUrl || null,
        tags: record.tag || null,
        created_at: record.createdAt,
      };

      if (existing && !updateExisting) {
        await updateQueueRow(supabase, row.id, {
          status: "imported",
          existing_post_id: existing.id,
          imported_at: new Date().toISOString(),
          error: null,
        });
        counts.skipped += 1;
        continue;
      }

      if (existing) {
        const { error } = await supabase
          .from("posts")
          .update(payload)
          .eq("id", existing.id);

        if (error) throw error;

        await updateQueueRow(supabase, row.id, {
          status: "imported",
          existing_post_id: existing.id,
          imported_at: new Date().toISOString(),
          error: null,
        });
        counts.updated += 1;
        continue;
      }

      const { data: insertedPost, error } = await supabase
        .from("posts")
        .insert([{ ...payload, views: 0 }])
        .select("id, category, title, content, created_at, updated_at")
        .single();

      if (error) throw error;

      existingBySourceUrl.set(record.sourceUrl, insertedPost);
      await updateQueueRow(supabase, row.id, {
        status: "imported",
        existing_post_id: insertedPost.id,
        imported_at: new Date().toISOString(),
        error: null,
      });
      counts.inserted += 1;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[worker] Failed: ${row.source_url} — ${message}`);
      await updateQueueRow(supabase, row.id, {
        status: "failed",
        error: message,
      });
      counts.failed += 1;
    }
  }

  return counts;
}

// ──────────────────────────────────────────────
// Run modes
// ──────────────────────────────────────────────

async function runDiscoverMode() {
  const rssXml = await fetchText("https://rss.blog.naver.com/nextchallenge.xml");
  const items = parseRssItems(rssXml);
  const candidates = discoverCandidates(items);
  console.log(JSON.stringify(candidates, null, 2));
}

async function runCrawlMode() {
  const results = [];

  for (const target of CRAWL_TARGETS) {
    console.error(`\n[crawl] ── ${target.categoryName} ──`);
    const posts = await crawlCategoryPosts(NAVER_BLOG_ID, target.categoryName);
    console.error(`[crawl] Total: ${posts.length} posts`);

    for (const post of posts) {
      results.push({
        url: post.url,
        targetCategory: target.targetCategory,
        tag: target.targetCategory === "news" ? "뉴스레터" : "",
        titleOverride: null,
        thumbnailOverride: null,
        pubDateOverride: null,
        enabled: false,
      });
    }

    await new Promise((r) => setTimeout(r, 1000));
  }

  console.log(JSON.stringify(results, null, 2));
}

async function runImportMode() {
  assertConfig();

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  for (const entry of blogImportManifest) {
    ensureValidManifestEntry(entry);
  }

  const activeEntries = blogImportManifest.filter((entry) => entry.enabled && entryMatchesFilter(entry));
  if (activeEntries.length === 0) {
    console.log("No enabled manifest entries matched the requested filter.");
    return;
  }
  if (targetPostIdArg && activeEntries.length !== 1) {
    throw new Error("--target-post-id requires exactly one matched manifest entry.");
  }

  const rssMap = await loadRssMap();

  const categories = [...new Set(activeEntries.map((entry) => entry.targetCategory))];
  const existingBySourceUrl = await loadExistingImportedPosts(supabase, categories);

  const records = [];
  for (const entry of activeEntries) {
    records.push(await buildImportRecord(entry, rssMap, supabase));
  }

  const summary = records.map((record) => {
    const existing = existingBySourceUrl.get(record.sourceUrl);
    const forcedUpdate = Boolean(targetPostIdArg);
    const action = existing
      ? updateExisting ? "update" : "skip-existing"
      : forcedUpdate ? "force-update-by-id" : dryRun ? "preview-insert" : "insert";
    return {
      action,
      targetCategory: record.targetCategory,
      tag: record.tag,
      title: record.title,
      createdAt: record.createdAt,
      thumbnail: record.thumbnailUrl ? "yes" : "no",
      sourceUrl: record.sourceUrl,
    };
  });

  console.log(JSON.stringify(summary, null, 2));

  if (dryRun) {
    console.log(`\nDry run complete: ${summary.length} records`);
    return;
  }

  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const record of records) {
    const existing = existingBySourceUrl.get(record.sourceUrl);
    const existingOrForced = existing ?? (targetPostIdArg ? { id: targetPostIdArg } : null);
    if (existing && !updateExisting && !targetPostIdArg) {
      skipped += 1;
      continue;
    }

    const payload = {
      category: record.targetCategory,
      title: record.title,
      content: record.content,
      image_url: record.attachmentImageUrl || null,
      tags: record.tag || null,
      created_at: record.createdAt,
    };

    if (existingOrForced) {
      const { error } = await supabase
        .from("posts")
        .update(payload)
        .eq("id", existingOrForced.id);
      if (error) {
        throw new Error(`Failed to update ${record.sourceUrl}: ${error.message}`);
      }
      updated += 1;
      continue;
    }

    const insertPayload = {
      ...payload,
      created_at: record.createdAt,
      views: 0,
    };

    const { error } = await supabase
      .from("posts")
      .insert([insertPayload]);
    if (error) {
      throw new Error(`Failed to insert ${record.sourceUrl}: ${error.message}`);
    }
    inserted += 1;
  }

  console.log(
    `\nImport complete. inserted=${inserted} updated=${updated} skipped=${skipped} (${prettyDate(new Date().toISOString())})`,
  );
}

async function runCanonicalReportMode() {
  assertConfig();

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const importedPosts = await loadImportedNaverPosts(supabase);
  const byUnknownClass = new Map();
  const byCategory = new Map();
  const reportSourceCounts = {};
  const unstructuredPosts = [];
  let partialCoveragePosts = 0;
  let fullCoveragePosts = 0;

  for (const post of importedPosts) {
    const normalizedContent = normalizeNaverImportedHtml(post.content || "");
    const diagnostics = getNaverCanonicalDiagnostics(normalizedContent);
    reportSourceCounts[post.report_source] = (reportSourceCounts[post.report_source] || 0) + 1;
    const categoryBucket = byCategory.get(post.category) || {
      posts: 0,
      avgCoverageSum: 0,
      unknownPosts: 0,
      unknownComponents: 0,
      unstructuredPosts: 0,
    };

    categoryBucket.posts += 1;
    categoryBucket.avgCoverageSum += diagnostics.markerCoverageRatio;
    if (diagnostics.seComponentCount === 0) {
      categoryBucket.unstructuredPosts += 1;
      if (unstructuredPosts.length < 12) {
        unstructuredPosts.push({
          id: post.id,
          title: post.title,
          category: post.category,
          reportSource: post.report_source,
          sourceUrl: post.report_source_url,
        });
      }
    }
    if (diagnostics.unknownComponentCount > 0) {
      categoryBucket.unknownPosts += 1;
      categoryBucket.unknownComponents += diagnostics.unknownComponentCount;
    }
    byCategory.set(post.category, categoryBucket);

    if (diagnostics.markerCoverageRatio >= 1 && diagnostics.unknownComponentCount === 0) {
      fullCoveragePosts += 1;
    } else {
      partialCoveragePosts += 1;
    }

    for (const className of diagnostics.unknownComponentClassNames) {
      const current = byUnknownClass.get(className) || {
        count: 0,
        posts: [],
        categories: new Set(),
      };
      current.count += 1;
      current.categories.add(post.category);
      if (current.posts.length < 5) {
        current.posts.push({
          id: post.id,
          title: post.title,
          category: post.category,
          reportSource: post.report_source,
          sourceUrl: post.report_source_url,
          coverage: diagnostics.markerCoverageRatio,
        });
      }
      byUnknownClass.set(className, current);
    }
  }

  const unknownClassSummary = [...byUnknownClass.entries()]
    .map(([className, info]) => ({
      className,
      count: info.count,
      categories: [...info.categories],
      posts: info.posts,
    }))
    .sort((a, b) => b.count - a.count || a.className.localeCompare(b.className));

  const categorySummary = [...byCategory.entries()]
    .map(([category, info]) => ({
      category,
      posts: info.posts,
      averageCoverage: Number((info.avgCoverageSum / Math.max(info.posts, 1)).toFixed(3)),
      unknownPosts: info.unknownPosts,
      unknownComponents: info.unknownComponents,
      unstructuredPosts: info.unstructuredPosts,
    }))
    .sort((a, b) => a.category.localeCompare(b.category));

  console.log(JSON.stringify({
    scannedPosts: importedPosts.length,
    fullCoveragePosts,
    partialCoveragePosts,
    reportSourceCounts,
    categorySummary,
    unstructuredPosts,
    unknownClassSummary,
  }, null, 2));
}

async function runRepairQueueDuplicatesMode() {
  assertConfig();

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const { data: queueRows, error: queueError } = await supabase
    .from("blog_import_queue")
    .select("source_url, target_category, existing_post_id")
    .not("existing_post_id", "is", null);

  if (queueError) {
    throw new Error(`Failed to load import queue for duplicate repair: ${queueError.message}`);
  }

  const repaired = [];
  const { data: posts, error: postsError } = await supabase
    .from("posts")
    .select("id, category, title, content, image_url, tags, created_at")
    .in("category", CRAWL_TARGETS.map((target) => target.targetCategory));

  if (postsError) {
    throw new Error(`Failed to load posts for duplicate repair: ${postsError.message}`);
  }

  for (const row of queueRows || []) {
    const sourceUrl = normalizeSourceUrl(row.source_url);
    const candidates = (posts || []).filter((post) => {
      if (post.category !== row.target_category) return false;
      const meta = readImportMeta(post.content || "");
      return normalizeSourceUrl(meta?.sourceUrl || "") === sourceUrl;
    });
    const duplicates = candidates.filter((post) => post.id !== row.existing_post_id);
    if (duplicates.length === 0) continue;

    const canonicalPost = duplicates[0];
    const payload = {
      category: canonicalPost.category,
      title: canonicalPost.title,
      content: canonicalPost.content,
      image_url: canonicalPost.image_url,
      tags: canonicalPost.tags,
      created_at: canonicalPost.created_at,
    };

    const { error: updateError } = await supabase
      .from("posts")
      .update(payload)
      .eq("id", row.existing_post_id);

    if (updateError) {
      throw new Error(`Failed to repair original post ${row.existing_post_id}: ${updateError.message}`);
    }

    const duplicateIds = duplicates.map((post) => post.id);
    const { error: deleteError } = await supabase
      .from("posts")
      .delete()
      .in("id", duplicateIds);

    if (deleteError) {
      throw new Error(`Failed to delete duplicate posts for ${sourceUrl}: ${deleteError.message}`);
    }

    repaired.push({
      sourceUrl,
      originalPostId: row.existing_post_id,
      deletedDuplicateIds: duplicateIds,
      title: canonicalPost.title,
    });
  }

  console.log(JSON.stringify({
    repairedCount: repaired.length,
    repaired,
  }, null, 2));
}

async function runQueueWorkerMode() {
  assertConfig();

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const run = await resolveQueueRun(supabase);
  if (!["queued", "running"].includes(run.status)) {
    throw new Error(`Run ${run.id} is not processable (status=${run.status})`);
  }

  await updateQueueRun(supabase, run.id, {
    status: "running",
    started_at: run.started_at || new Date().toISOString(),
    error: null,
  });

  try {
    const rssMap = await loadRssMap();
    const existingBySourceUrl = await loadExistingImportedPosts(supabase, ["news", "events-archive"]);
    const candidates = await discoverQueueCandidates();
    const queuedRows = await upsertQueueCandidates(supabase, candidates, existingBySourceUrl, run.id);
    const approvedRows = await loadApprovedQueueRows(supabase, run.id);
    const counts = await importApprovedQueueRows(supabase, approvedRows, existingBySourceUrl, rssMap);
    const finalStatus = counts.failed > 0 ? "failed" : "success";

    await updateQueueRun(supabase, run.id, {
      status: finalStatus,
      discovered_count: candidates.length,
      queued_count: queuedRows.filter((row) => ["pending", "approved"].includes(row.status)).length,
      inserted_count: counts.inserted,
      updated_count: counts.updated,
      skipped_count: counts.skipped,
      failed_count: counts.failed,
      finished_at: new Date().toISOString(),
      error: counts.failed > 0 ? `${counts.failed} queue item(s) failed` : null,
    });

    console.log(JSON.stringify({
      runId: run.id,
      status: finalStatus,
      discovered: candidates.length,
      queued: queuedRows.length,
      approved: approvedRows.length,
      ...counts,
    }, null, 2));

    if (counts.failed > 0) {
      process.exitCode = 1;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await updateQueueRun(supabase, run.id, {
      status: "failed",
      finished_at: new Date().toISOString(),
      error: message,
    });
    throw err;
  }
}

async function main() {
  if (discoverOnly) {
    await runDiscoverMode();
    return;
  }

  if (crawlMode) {
    await runCrawlMode();
    return;
  }

  if (reportCanonical) {
    await runCanonicalReportMode();
    return;
  }

  if (repairQueueDuplicates) {
    await runRepairQueueDuplicatesMode();
    return;
  }

  if (processQueue) {
    await runQueueWorkerMode();
    return;
  }

  await runImportMode();
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
