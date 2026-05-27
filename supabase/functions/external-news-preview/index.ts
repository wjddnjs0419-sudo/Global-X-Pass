import { corsHeaders } from "../_shared/cors.ts";
import { requireVerifiedAdmin } from "../_shared/adminAuth.ts";
import { captureEfError } from "../_shared/errorLogger.ts";

type PreviewRequestBody = {
  url?: string;
  external_url?: string;
};

type PreviewFieldSources = {
  title: string;
  summary: string;
  source_name: string;
  published_at: string;
};

type PreviewResult = {
  input_url: string;
  canonical_url: string;
  title: string;
  summary: string | null;
  source_name: string;
  published_at: string;
  warnings: string[];
  field_sources: PreviewFieldSources;
};

function jsonResponse(
  body: Record<string, unknown>,
  status: number,
  headers: Record<string, string>,
) {
  return new Response(JSON.stringify(body), {
    headers: { ...headers, "Content-Type": "application/json" },
    status,
  });
}

function cleanText(value: string | null | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;/gi, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(Number.parseInt(code, 16)));
}

function stripHtml(value: string): string {
  return decodeHtmlEntities(value.replace(/<[^>]*>/g, " "));
}

function getAttr(tag: string, attrName: string): string | null {
  const escaped = attrName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = tag.match(new RegExp(`(?:^|\\s)${escaped}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'>]+))`, "i"));
  const value = match?.[1] ?? match?.[2] ?? match?.[3] ?? null;
  return value ? decodeHtmlEntities(cleanText(value)) : null;
}

function normalizeUrl(rawUrl: string): string {
  const raw = rawUrl.trim();
  if (!raw) {
    throw new Error("링크를 입력해 주세요.");
  }

  const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  const url = new URL(candidate);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("링크는 http 또는 https여야 합니다.");
  }

  url.hash = "";
  for (const key of [...url.searchParams.keys()]) {
    if (key.startsWith("utm_") || ["fbclid", "gclid", "yclid", "msclkid", "ref", "referrer"].includes(key)) {
      url.searchParams.delete(key);
    }
  }

  return url.toString().replace(/\/$/, "");
}

function isPrivateIpv4(hostname: string): boolean {
  const parts = hostname.split(".").map((part) => Number.parseInt(part, 10));
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return false;
  }

  const [a, b] = parts;
  if (a === 10 || a === 127 || a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a >= 224) return true;
  return false;
}

function isPrivateIpv6(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  return (
    lower === "::1" ||
    lower.startsWith("fc") ||
    lower.startsWith("fd") ||
    lower.startsWith("fe80") ||
    lower === "::" ||
    lower.startsWith("::ffff:127.") ||
    lower.startsWith("::ffff:10.") ||
    lower.startsWith("::ffff:192.168.") ||
    lower.startsWith("::ffff:172.")
  );
}

function isBlockedHostname(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (lower === "localhost" || lower.endsWith(".localhost") || lower.endsWith(".local") || lower.endsWith(".internal")) {
    return true;
  }

  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(lower)) {
    return isPrivateIpv4(lower);
  }

  if (lower.includes(":")) {
    return isPrivateIpv6(lower);
  }

  return false;
}

function getMetaContent(html: string, attrName: "property" | "name", attrValue: string): string | null {
  const metaPattern = /<meta\b[^>]*>/gi;
  for (const match of html.matchAll(metaPattern)) {
    const tag = match[0];
    if ((getAttr(tag, attrName) ?? "").toLowerCase() === attrValue.toLowerCase()) {
      const content = getAttr(tag, "content");
      if (content) return content;
    }
  }
  return null;
}

function getCanonicalUrl(html: string, fallbackUrl: string): string {
  const linkPattern = /<link\b[^>]*>/gi;
  for (const match of html.matchAll(linkPattern)) {
    const tag = match[0];
    const rel = (getAttr(tag, "rel") ?? "").toLowerCase();
    if (!rel.split(/\s+/).includes("canonical")) continue;
    const href = getAttr(tag, "href");
    if (!href) continue;
    try {
      return normalizeUrl(new URL(href, fallbackUrl).toString());
    } catch {
      return fallbackUrl;
    }
  }
  return fallbackUrl;
}

function getJsonLdNodes(html: string): unknown[] {
  const nodes: unknown[] = [];
  const scriptPattern = /<script\b[^>]*type=(?:"application\/ld\+json"|'application\/ld\+json')[^>]*>([\s\S]*?)<\/script>/gi;
  for (const match of html.matchAll(scriptPattern)) {
    const text = cleanText(match[1]);
    if (!text) continue;
    try {
      nodes.push(JSON.parse(text));
    } catch {
      continue;
    }
  }
  return nodes;
}

function collectJsonLdObjects(node: unknown): Record<string, unknown>[] {
  if (!node) return [];
  if (Array.isArray(node)) return node.flatMap((item) => collectJsonLdObjects(item));
  if (typeof node !== "object") return [];

  const record = node as Record<string, unknown>;
  const items: Record<string, unknown>[] = [record];
  if (record["@graph"]) items.push(...collectJsonLdObjects(record["@graph"]));
  return items;
}

function getJsonLdArticle(html: string): Record<string, unknown> | null {
  const allObjects = getJsonLdNodes(html).flatMap((node) => collectJsonLdObjects(node));
  const articleLike = allObjects.find((obj) => {
    const typeValue = obj["@type"];
    const types = Array.isArray(typeValue) ? typeValue : [typeValue];
    return types.some((type) => typeof type === "string" && /(NewsArticle|Article|BlogPosting|ReportageNewsArticle)/i.test(type));
  });

  return articleLike ?? null;
}

function readJsonLdString(node: Record<string, unknown> | null, keys: string[]): string | null {
  if (!node) return null;
  for (const key of keys) {
    const value = node[key];
    if (typeof value === "string") {
      const cleaned = cleanText(value);
      if (cleaned) return decodeHtmlEntities(cleaned);
    }
  }
  return null;
}

function readPublisherName(node: Record<string, unknown> | null): string | null {
  if (!node) return null;
  const publisher = node.publisher;
  if (!publisher || typeof publisher !== "object") return null;
  const record = publisher as Record<string, unknown>;
  if (typeof record.name === "string") {
    const cleaned = cleanText(record.name);
    if (cleaned) return decodeHtmlEntities(cleaned);
  }
  return null;
}

function pickFirst(values: Array<string | null | undefined>): string | null {
  for (const value of values) {
    const cleaned = cleanText(value);
    if (cleaned) return decodeHtmlEntities(cleaned);
  }
  return null;
}

function getFirstParagraphSummary(html: string): string | null {
  const paragraphPattern = /<p\b[^>]*>([\s\S]*?)<\/p>/giu;
  for (const match of html.matchAll(paragraphPattern)) {
    const text = cleanText(stripHtml(match[1]));
    if (text.length >= 40) {
      return text.slice(0, 260);
    }
  }

  return null;
}

async function ensurePublicHost(url: URL): Promise<void> {
  const hostname = url.hostname.toLowerCase();
  if (isBlockedHostname(hostname)) {
    throw new Error("사설/로컬 주소는 미리보기에 사용할 수 없습니다.");
  }

  if (/^[a-z0-9-]+(?:\.[a-z0-9-]+)+$/i.test(hostname)) {
    let blocked = false;
    try {
      const aRecords = await Deno.resolveDns(hostname, "A");
      const aaaaRecords = await Deno.resolveDns(hostname, "AAAA");
      blocked = [...aRecords, ...aaaaRecords].some((record) => isBlockedHostname(record));
    } catch {
      // DNS 조회 실패는 fetch 단계에서 다시 처리한다.
    }

    if (blocked) {
      throw new Error("사설/로컬 주소는 미리보기에 사용할 수 없습니다.");
    }
  }
}

async function buildPreview(inputUrl: string): Promise<PreviewResult> {
  const url = new URL(inputUrl);
  await ensurePublicHost(url);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
      },
    });

    if (!response.ok) {
      throw new Error(`링크를 불러오지 못했습니다. (HTTP ${response.status})`);
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!/html|xml/i.test(contentType)) {
      throw new Error("HTML 기사 페이지를 읽을 수 없습니다.");
    }

    const html = await response.text();
    const jsonLdArticle = getJsonLdArticle(html);
    const canonicalUrl = getCanonicalUrl(html, normalizeUrl(response.url || url.toString()));

    const titleSource = pickFirst([
      getMetaContent(html, "property", "og:title"),
      getMetaContent(html, "name", "twitter:title"),
      cleanText((html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "")),
      readJsonLdString(jsonLdArticle, ["headline", "name"]),
    ]);
    if (!titleSource) {
      throw new Error("제목을 읽지 못했습니다. 다른 기사 링크를 입력해 주세요.");
    }

    const summarySource = pickFirst([
      getMetaContent(html, "property", "og:description"),
      getMetaContent(html, "name", "twitter:description"),
      getMetaContent(html, "name", "description"),
      readJsonLdString(jsonLdArticle, ["description"]),
      getFirstParagraphSummary(html),
    ]);

    const sourceNameSource = pickFirst([
      getMetaContent(html, "property", "og:site_name"),
      readPublisherName(jsonLdArticle),
      canonicalUrl ? new URL(canonicalUrl).hostname.replace(/^www\./i, "") : null,
    ]);
    if (!sourceNameSource) {
      throw new Error("출처를 읽지 못했습니다. 다른 기사 링크를 입력해 주세요.");
    }

    const publishedAtSource = pickFirst([
      getMetaContent(html, "property", "article:published_time"),
      getMetaContent(html, "property", "og:updated_time"),
      readJsonLdString(jsonLdArticle, ["datePublished", "dateCreated", "uploadDate"]),
    ]);

    const warnings: string[] = [];
    if (!summarySource) {
      warnings.push("요약을 읽지 못해 비워 두었습니다.");
    }

    const publishedAt = publishedAtSource ? new Date(publishedAtSource) : new Date();
    if (Number.isNaN(publishedAt.getTime())) {
      warnings.push("발행일 형식이 올바르지 않아 현재 시각으로 대체했습니다.");
    }
    const publishedAtIso = Number.isNaN(publishedAt.getTime()) ? new Date().toISOString() : publishedAt.toISOString();

    const fieldSources: PreviewFieldSources = {
      title:
        getMetaContent(html, "property", "og:title") ? "og:title" :
        getMetaContent(html, "name", "twitter:title") ? "twitter:title" :
        cleanText((html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "")) ? "title" : "json-ld.headline",
      summary:
        getMetaContent(html, "property", "og:description") ? "og:description" :
        getMetaContent(html, "name", "twitter:description") ? "twitter:description" :
        getMetaContent(html, "name", "description") ? "meta description" :
        readJsonLdString(jsonLdArticle, ["description"]) ? "json-ld.description" :
        getFirstParagraphSummary(html) ? "first-paragraph" : "missing",
      source_name:
        getMetaContent(html, "property", "og:site_name") ? "og:site_name" :
        readPublisherName(jsonLdArticle) ? "json-ld.publisher" :
        "hostname",
      published_at:
        getMetaContent(html, "property", "article:published_time") ? "article:published_time" :
        getMetaContent(html, "property", "og:updated_time") ? "og:updated_time" :
        readJsonLdString(jsonLdArticle, ["datePublished", "dateCreated", "uploadDate"]) ? "json-ld.datePublished" :
        "current-time",
    };

    if (fieldSources.summary === "first-paragraph") {
      warnings.push("요약을 본문 첫 문단에서 보완했습니다.");
    }
    if (fieldSources.published_at === "current-time") {
      warnings.push("발행일이 없어 현재 시각으로 채웠습니다.");
    }
    if (fieldSources.source_name === "hostname") {
      warnings.push("출처 메타가 없어 도메인명으로 보완했습니다.");
    }

    return {
      input_url: url.toString(),
      canonical_url: canonicalUrl,
      title: titleSource,
      summary: summarySource ?? null,
      source_name: sourceNameSource,
      published_at: publishedAtIso,
      warnings,
      field_sources: fieldSources,
    };
  } finally {
    clearTimeout(timeout);
  }
}

Deno.serve(async (req: Request) => {
  const cors = corsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405, cors);
  }

  try {
    const adminCheck = await requireVerifiedAdmin(req.headers.get("Authorization"));
    if (!adminCheck.ok) {
      return jsonResponse({ error: adminCheck.message }, adminCheck.status, cors);
    }

    const body = (await req.json().catch(() => ({}))) as PreviewRequestBody;
    const rawUrl = cleanText(body.url ?? body.external_url);
    if (!rawUrl) {
      return jsonResponse({ error: "링크를 입력해 주세요." }, 400, cors);
    }

    let normalizedUrl: string;
    try {
      normalizedUrl = normalizeUrl(rawUrl);
    } catch (err) {
      const message = err instanceof Error ? err.message : "유효한 링크를 입력해 주세요.";
      return jsonResponse({ error: message }, 400, cors);
    }

    const preview = await buildPreview(normalizedUrl);
    return jsonResponse({ ok: true, ...preview }, 200, cors);
  } catch (err: unknown) {
    await captureEfError("ef-external-news-preview", err, { req, severity: "medium" });
    const message = err instanceof Error ? err.message : String(err);
    return jsonResponse({ error: message }, 400, cors);
  }
});
