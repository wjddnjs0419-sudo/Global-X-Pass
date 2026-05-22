import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { stripHtml } from "./utils/naverHtmlParser.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, "..");

const argv = process.argv.slice(2);

function getArgValue(name) {
  const match = argv.find((arg) => arg.startsWith(`${name}=`));
  if (match) return match.slice(name.length + 1);

  const index = argv.indexOf(name);
  if (index !== -1 && argv[index + 1] && !argv[index + 1].startsWith("--")) {
    return argv[index + 1];
  }

  return null;
}

function hasFlag(name) {
  return argv.includes(name);
}

function loadEnv() {
  const candidates = [resolve(process.cwd(), ".env"), resolve(ROOT, ".env")];

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

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID;
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;

const BATCH_SIZE = Number.parseInt(getArgValue("--batch-size") ?? "25", 10);
const RESULTS_PER_COMPANY = Number.parseInt(getArgValue("--results-per-company") ?? "5", 10);
const REQUEST_DELAY_MS = Number.parseInt(getArgValue("--delay-ms") ?? "300", 10);
const DRY_RUN = hasFlag("--dry-run");
const MAX_COMPANY_KEYWORDS = Number.parseInt(getArgValue("--max-keywords") ?? "6", 10);
const MAX_STORED_ARTICLES = Number.parseInt(
  getArgValue("--max-stored-articles") ?? process.env.NEWS_MAX_STORED_ARTICLES ?? "300",
  10,
);

const supabase = createClient(SUPABASE_URL ?? "", SUPABASE_SERVICE_ROLE_KEY ?? "", {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

function assertConfig() {
  if (!SUPABASE_URL) throw new Error("SUPABASE_URL 또는 VITE_SUPABASE_URL이 필요합니다.");
  if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error("SUPABASE_SERVICE_ROLE_KEY가 필요합니다.");
  if (!NAVER_CLIENT_ID) throw new Error("NAVER_CLIENT_ID가 필요합니다.");
  if (!NAVER_CLIENT_SECRET) throw new Error("NAVER_CLIENT_SECRET가 필요합니다.");
}

function sleep(ms) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
}

function normalizeText(value) {
  return stripHtml(value ?? "").replace(/\s+/g, " ").trim();
}

function splitKeywords(raw) {
  return (raw ?? "")
    .split(/[\n,;|/]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function buildSearchKeywords(company) {
  const preferred = splitKeywords(company.search_keywords);
  const terms = preferred.length > 0 ? preferred : [company.name.trim()];
  if (company.name.trim() && !terms.some((term) => term === company.name.trim())) {
    terms.unshift(company.name.trim());
  }

  return Array.from(new Set(terms))
    .filter(Boolean)
    .slice(0, Math.max(1, MAX_COMPANY_KEYWORDS));
}

function normalizeUrl(raw) {
  const value = (raw ?? "").trim();
  if (!value) return "";

  try {
    const url = new URL(value);
    url.hash = "";

    const removable = new Set(["from", "trackingCode", "ref", "referrer", "fbclid", "gclid", "yclid", "msclkid"]);
    for (const key of [...url.searchParams.keys()]) {
      if (key.startsWith("utm_") || removable.has(key)) {
        url.searchParams.delete(key);
      }
    }

    return url.toString().replace(/\/$/, "");
  } catch {
    return value;
  }
}

function resolveHost(url) {
  try {
    const host = new URL(url).hostname.replace(/^www\./i, "");
    if (!host || /naver\.com$/i.test(host)) return null;
    return host;
  } catch {
    return null;
  }
}

function hashUrl(url) {
  return createHash("sha256").update(url).digest("hex");
}

function chunkArray(items, size) {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

async function fetchJson(url, headers = {}) {
  try {
    const response = await fetch(url, {
      redirect: "follow",
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    const curlArgs = ["-sSL"];
    for (const [key, value] of Object.entries(headers)) {
      curlArgs.push("-H", `${key}: ${value}`);
    }
    curlArgs.push(url);

    try {
      const raw = execFileSync("curl", curlArgs, { encoding: "utf8" });
      return JSON.parse(raw);
    } catch {
      throw error;
    }
  }
}

async function fetchNaverNews(keyword, display) {
  const url = new URL("https://openapi.naver.com/v1/search/news.json");
  url.searchParams.set("query", keyword);
  url.searchParams.set("display", String(display));
  url.searchParams.set("start", "1");
  url.searchParams.set("sort", "date");

  const response = await fetchJson(url.toString(), {
    "X-Naver-Client-Id": NAVER_CLIENT_ID,
    "X-Naver-Client-Secret": NAVER_CLIENT_SECRET,
  });

  return Array.isArray(response.items) ? response.items : [];
}

function buildCandidate(company, item) {
  const title = normalizeText(item.title);
  const description = normalizeText(item.description) || null;
  const originallink = normalizeUrl(item.originallink ?? "");
  const link = normalizeUrl(item.link ?? "");
  const canonicalUrl = originallink || link;

  if (!title || !canonicalUrl) return null;

  const publishedAt = new Date(item.pubDate);
  if (Number.isNaN(publishedAt.getTime())) return null;

  return {
    company_id: company.id,
    title,
    description,
    link: link || canonicalUrl,
    originallink: originallink || null,
    source: resolveHost(originallink) || resolveHost(link),
    published_at: publishedAt.toISOString(),
    status: "pending",
    url_hash: hashUrl(canonicalUrl),
  };
}

async function loadExistingHashes(urlHashes) {
  const existing = new Set();
  if (urlHashes.length === 0) return existing;

  for (const chunk of chunkArray(urlHashes, 100)) {
    const { data, error } = await supabase
      .from("articles")
      .select("url_hash")
      .in("url_hash", chunk);

    if (error) {
      throw new Error(`기존 기사 해시 조회 실패: ${error.message}`);
    }

    for (const row of data ?? []) {
      if (row.url_hash) existing.add(row.url_hash);
    }
  }

  return existing;
}

async function insertArticles(rows) {
  if (rows.length === 0) return 0;

  let inserted = 0;
  for (const chunk of chunkArray(rows, 50)) {
    const { data, error } = await supabase
      .from("articles")
      .insert(chunk)
      .select("id");

    if (error) {
      throw new Error(`기사 저장 실패: ${error.message}`);
    }

    inserted += data?.length ?? chunk.length;
  }

  return inserted;
}

async function updateCompanyCrawledAt(companyId, timestamp) {
  const { error } = await supabase
    .from("companies")
    .update({ last_crawled_at: timestamp })
    .eq("id", companyId);

  if (error) {
    throw new Error(`회사 last_crawled_at 업데이트 실패: ${error.message}`);
  }
}

async function pruneOldArticles(maxStoredArticles) {
  if (maxStoredArticles <= 0) return 0;

  let deleted = 0;

  while (true) {
    const { data, error } = await supabase
      .from("articles")
      .select("id")
      .order("published_at", { ascending: false })
      .order("created_at", { ascending: false })
      .range(maxStoredArticles, maxStoredArticles + 199);

    if (error) {
      throw new Error(`오래된 기사 정리 대상 조회 실패: ${error.message}`);
    }

    const ids = (data ?? []).map((row) => row.id).filter(Boolean);
    if (ids.length === 0) break;

    const { error: deleteError } = await supabase
      .from("articles")
      .delete()
      .in("id", ids);

    if (deleteError) {
      throw new Error(`오래된 기사 정리 실패: ${deleteError.message}`);
    }

    deleted += ids.length;
  }

  return deleted;
}

async function processCompany(company, options) {
  const keywords = buildSearchKeywords(company);
  console.log(`[news-crawl] company=${company.name} keywords=${keywords.join(" | ")}`);

  const discovered = [];
  const seenHashes = new Set();

  for (const keyword of keywords) {
    try {
      const items = await fetchNaverNews(keyword, options.resultsPerCompany);
      console.log(`[news-crawl]   query="${keyword}" items=${items.length}`);

      for (const item of items) {
        const candidate = buildCandidate(company, item);
        if (!candidate || seenHashes.has(candidate.url_hash)) continue;
        seenHashes.add(candidate.url_hash);
        discovered.push(candidate);
        if (discovered.length >= options.resultsPerCompany) break;
      }
    } catch (error) {
      console.error(`[news-crawl]   query failed: "${keyword}" (${error.message})`);
    }

    if (discovered.length >= options.resultsPerCompany) break;
    await sleep(Math.max(100, Math.min(options.delayMs, 700)));
  }

  const existingHashes = await loadExistingHashes(discovered.map((row) => row.url_hash));
  const freshRows = discovered.filter((row) => !existingHashes.has(row.url_hash));

  let inserted = 0;
  if (!options.dryRun && freshRows.length > 0) {
    inserted = await insertArticles(freshRows);
  }

  const crawledAt = new Date().toISOString();
  if (!options.dryRun) {
    await updateCompanyCrawledAt(company.id, crawledAt);
  }

  console.log(
    `[news-crawl]   discovered=${discovered.length} new=${freshRows.length} inserted=${inserted} ` +
    `existing=${discovered.length - freshRows.length}`,
  );

  return {
    discovered: discovered.length,
    newCount: freshRows.length,
    inserted,
  };
}

async function loadCompanies(batchSize) {
  const { data, error } = await supabase
    .from("companies")
    .select("id, name, search_keywords, last_crawled_at")
    .order("last_crawled_at", { ascending: true, nullsFirst: true })
    .order("created_at", { ascending: true })
    .limit(batchSize);

  if (error) {
    throw new Error(`기업 목록 조회 실패: ${error.message}`);
  }

  return data ?? [];
}

async function main() {
  assertConfig();

  if (!Number.isFinite(BATCH_SIZE) || BATCH_SIZE <= 0) {
    throw new Error("--batch-size는 1 이상의 숫자여야 합니다.");
  }

  if (!Number.isFinite(RESULTS_PER_COMPANY) || RESULTS_PER_COMPANY <= 0) {
    throw new Error("--results-per-company는 1 이상의 숫자여야 합니다.");
  }

  if (!Number.isFinite(REQUEST_DELAY_MS) || REQUEST_DELAY_MS < 0) {
    throw new Error("--delay-ms는 0 이상의 숫자여야 합니다.");
  }

  if (!Number.isFinite(MAX_STORED_ARTICLES) || MAX_STORED_ARTICLES < 0) {
    throw new Error("--max-stored-articles는 0 이상의 숫자여야 합니다.");
  }

  const options = {
    batchSize: BATCH_SIZE,
    resultsPerCompany: RESULTS_PER_COMPANY,
    delayMs: REQUEST_DELAY_MS,
    dryRun: DRY_RUN,
    maxStoredArticles: MAX_STORED_ARTICLES,
  };

  console.log(
    `[news-crawl] start batchSize=${options.batchSize} resultsPerCompany=${options.resultsPerCompany} ` +
    `delayMs=${options.delayMs} maxStoredArticles=${options.maxStoredArticles} ` +
    `dryRun=${options.dryRun ? "yes" : "no"}`,
  );

  const companies = await loadCompanies(options.batchSize);
  console.log(`[news-crawl] loaded companies=${companies.length}`);

  let totalDiscovered = 0;
  let totalNew = 0;
  let totalInserted = 0;
  let processed = 0;
  let failed = 0;

  for (const company of companies) {
    try {
      const summary = await processCompany(company, options);
      totalDiscovered += summary.discovered;
      totalNew += summary.newCount;
      totalInserted += summary.inserted;
      processed += 1;
    } catch (error) {
      failed += 1;
      console.error(`[news-crawl] company failed: ${company.name} (${error.message})`);
      if (!options.dryRun) {
        try {
          await updateCompanyCrawledAt(company.id, new Date().toISOString());
        } catch (updateError) {
          console.error(`[news-crawl] crawl timestamp update failed: ${updateError.message}`);
        }
      }
    }

    await sleep(Math.max(100, Math.min(options.delayMs, 700)));
  }

  console.log(
    `[news-crawl] done processed=${processed} failed=${failed} discovered=${totalDiscovered} ` +
    `new=${totalNew} inserted=${totalInserted} dryRun=${options.dryRun ? "yes" : "no"}`,
  );

  if (!options.dryRun) {
    const pruned = await pruneOldArticles(options.maxStoredArticles);
    console.log(`[news-crawl] pruned old articles=${pruned} maxStoredArticles=${options.maxStoredArticles}`);
  }
}

main().catch((error) => {
  console.error(`[news-crawl] fatal: ${error.message}`);
  process.exitCode = 1;
});
