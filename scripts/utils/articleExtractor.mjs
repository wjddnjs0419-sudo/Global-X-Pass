import { execFileSync } from "node:child_process";
import { decodeHtmlEntities, stripHtml } from "./naverHtmlParser.mjs";

const MIN_ARTICLE_CHARS = 180;
const MAX_ARTICLE_CHARS = 3000;
const NOISE_WORDS = [
  "구독",
  "공유",
  "댓글",
  "로그인",
  "회원가입",
  "관련기사",
  "추천기사",
  "인기기사",
  "기사제보",
  "저작권",
  "무단전재",
  "배너",
  "광고",
  "개인정보처리방침",
  "맨위로",
];

const PREFERRED_BLOCK_PATTERNS = [
  /<[^>]+id=["']dic_area["'][^>]*>/i,
  /<[^>]+class=["'][^"']*newsct_article[^"']*["'][^>]*>/i,
  /<[^>]+class=["'][^"']*_article_content[^"']*["'][^>]*>/i,
  /<[^>]+itemprop=["']articleBody["'][^>]*>/i,
  /<article\b[^>]*>/i,
  /<main\b[^>]*>/i,
];

function cleanHtml(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<(?:nav|header|footer|aside|form|button)\b[\s\S]*?<\/(?:nav|header|footer|aside|form|button)>/gi, " ");
}

function normalizeText(html) {
  return stripHtml(html)
    .replace(/\[[^\]]{1,30}\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function findMatchingClose(html, openMatch) {
  const openTag = openMatch[0];
  const tagName = openTag.match(/^<([a-z0-9-]+)/i)?.[1];
  if (!tagName) return null;

  const start = openMatch.index;
  const openEnd = start + openTag.length;
  const tagRegex = new RegExp(`</?${tagName}\\b[^>]*>`, "gi");
  tagRegex.lastIndex = openEnd;

  let depth = 1;
  let match;
  while ((match = tagRegex.exec(html))) {
    if (match[0].startsWith("</")) depth -= 1;
    else depth += 1;
    if (depth === 0) return html.slice(start, match.index + match[0].length);
  }

  return null;
}

function extractPreferredBlocks(html) {
  const blocks = [];
  for (const pattern of PREFERRED_BLOCK_PATTERNS) {
    const match = pattern.exec(html);
    if (!match) continue;
    const block = findMatchingClose(html, match);
    if (block) blocks.push(block);
  }
  return blocks;
}

function extractGenericBlocks(html) {
  const blocks = [];
  const blockRegex =
    /<(article|main|section|div)\b[^>]*(?:article|content|body|news|post|view|story)[^>]*>/gi;

  let match;
  while ((match = blockRegex.exec(html)) && blocks.length < 80) {
    const block = findMatchingClose(html, match);
    if (block) blocks.push(block);
  }

  return blocks;
}

function scoreCandidate(html) {
  const text = normalizeText(html);
  if (!text) return { text, score: -Infinity };

  const linkTextLength = [...html.matchAll(/<a\b[\s\S]*?<\/a>/gi)]
    .map((match) => normalizeText(match[0]).length)
    .reduce((sum, length) => sum + length, 0);
  const linkDensity = linkTextLength / Math.max(text.length, 1);
  const sentenceCount = (text.match(/[.!?。！？]|다\.|요\.|니다\.|습니다\./g) ?? []).length;
  const koreanChars = (text.match(/[가-힣]/g) ?? []).length;
  const koreanRatio = koreanChars / Math.max(text.length, 1);
  const noiseHits = NOISE_WORDS.filter((word) => text.includes(word)).length;
  const paragraphHints = (html.match(/<\/p>|<br\s*\/?>|se-text|article/gi) ?? []).length;

  const score =
    Math.min(text.length, 3000) * 0.7 +
    sentenceCount * 80 +
    paragraphHints * 20 +
    koreanRatio * 500 -
    linkDensity * 1800 -
    noiseHits * 180;

  return { text, score, linkDensity, sentenceCount, noiseHits };
}

function validateExtractedText(best) {
  if (!best || best.text.length < MIN_ARTICLE_CHARS) {
    throw new Error(
      "기사 본문 추출 실패: 본문 후보가 너무 짧습니다. 직접 본문을 복사해서 --input-file 또는 --input-stdin 으로 시도해보세요.",
    );
  }

  if (best.linkDensity > 0.45 || best.noiseHits >= 6 || best.sentenceCount < 2) {
    throw new Error(
      "기사 본문 추출 실패: 메뉴/추천기사/광고 텍스트가 섞였을 가능성이 큽니다. 직접 본문을 복사해서 --input-file 또는 --input-stdin 으로 시도해보세요.",
    );
  }
}

export async function fetchHtml(url) {
  try {
    const res = await fetch(url, {
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; GlobalXPassArticleExtractor/1.0; +https://globalxpass.com)",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
        Referer: new URL(url).origin,
      },
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } catch {
    return execFileSync("curl", ["-Ls", "-H", `Referer: ${new URL(url).origin}`, url], {
      encoding: "utf8",
    });
  }
}

export async function fetchArticleText(url, { maxChars = MAX_ARTICLE_CHARS } = {}) {
  const html = cleanHtml(await fetchHtml(url));
  const candidates = [
    ...extractPreferredBlocks(html),
    ...extractGenericBlocks(html),
  ];

  const bodyMatch = /<body\b[^>]*>([\s\S]*?)<\/body>/i.exec(html);
  if (bodyMatch) candidates.push(bodyMatch[1]);
  candidates.push(html);

  const ranked = candidates
    .map(scoreCandidate)
    .filter((candidate) => candidate.text.length > 0)
    .sort((a, b) => b.score - a.score);

  const best = ranked[0];
  validateExtractedText(best);
  return decodeHtmlEntities(best.text).slice(0, maxChars);
}
