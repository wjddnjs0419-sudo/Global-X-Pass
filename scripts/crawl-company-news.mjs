import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { stripHtml } from "./utils/naverHtmlParser.mjs";
import {
  buildCompanyNewsQueries,
  evaluateCompanyNewsRelevance,
  isCompanyNewsRelevant,
} from "./utils/companyNewsRelevance.mjs";

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
const AUDIT_EXISTING_RELEVANCE = hasFlag("--audit-existing-relevance");
const APPLY_EXISTING_RELEVANCE = hasFlag("--apply-existing-relevance");
const REJECT_LOW_RELEVANCE_EXISTING = hasFlag("--reject-low-relevance-existing");
const EXISTING_STATUS = getArgValue("--existing-status") ?? "pending";
const EXISTING_AUDIT_LIMIT = Number.parseInt(getArgValue("--existing-limit") ?? "300", 10);
const MAX_COMPANY_KEYWORDS = Number.parseInt(getArgValue("--max-keywords") ?? "6", 10);
const MAX_STORED_ARTICLES = Number.parseInt(
  getArgValue("--max-stored-articles") ?? process.env.NEWS_MAX_STORED_ARTICLES ?? "300",
  10,
);
const MIN_RELEVANCE_SCORE = Number.parseInt(
  getArgValue("--min-relevance-score") ?? process.env.NEWS_MIN_RELEVANCE_SCORE ?? "3",
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

function summarizeTitle(value) {
  const text = normalizeText(value);
  return text.length > 80 ? `${text.slice(0, 77)}...` : text;
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

function getJoinedCompany(article) {
  return Array.isArray(article.companies) ? article.companies[0] : article.companies;
}

async function updateArticleRelevance(article, relevance, nextStatus) {
  const payload = {
    relevance_score: relevance.score,
    matched_terms: relevance.matchedTerms,
    relevance_reason: nextStatus === "rejected"
      ? `${relevance.reason}_below_threshold`
      : relevance.reason,
  };

  if (nextStatus) {
    payload.status = nextStatus;
  }

  const { error } = await supabase
    .from("articles")
    .update(payload)
    .eq("id", article.id);

  if (error) {
    throw new Error(`기존 기사 관련도 업데이트 실패: ${error.message}`);
  }
}

async function auditExistingRelevance(options) {
  let query = supabase
    .from("articles")
    .select("id, title, description, status, relevance_score, matched_terms, relevance_reason, published_at, companies(name, search_keywords)")
    .order("published_at", { ascending: false })
    .limit(options.limit);

  if (options.status !== "all") {
    query = query.eq("status", options.status);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`기존 기사 조회 실패: ${error.message}`);
  }

  let relevant = 0;
  let lowRelevance = 0;
  let updated = 0;
  let rejected = 0;

  for (const article of data ?? []) {
    const company = getJoinedCompany(article);
    if (!company) continue;

    const relevance = evaluateCompanyNewsRelevance(company, article);
    const accepted = isCompanyNewsRelevant(relevance, options.minRelevanceScore);
    if (accepted) {
      relevant += 1;
    } else {
      lowRelevance += 1;
      console.log(
        `[news-crawl] existing low-relevance id=${article.id} status=${article.status} ` +
        `score=${relevance.score} matched=${relevance.matchedTerms.join(",") || "-"} ` +
        `title="${summarizeTitle(article.title)}"`,
      );
    }

    if (options.apply) {
      const nextStatus = !accepted && options.rejectLowRelevance ? "rejected" : null;
      await updateArticleRelevance(article, relevance, nextStatus);
      updated += 1;
      if (nextStatus === "rejected") rejected += 1;
    }
  }

  console.log(
    `[news-crawl] existing relevance audit status=${options.status} checked=${data?.length ?? 0} ` +
    `relevant=${relevant} lowRelevance=${lowRelevance} updated=${updated} rejected=${rejected} ` +
    `apply=${options.apply ? "yes" : "no"}`,
  );
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
  const queries = buildCompanyNewsQueries(company, MAX_COMPANY_KEYWORDS);
  console.log(`[news-crawl] company=${company.name} queries=${queries.join(" | ")}`);

  const discovered = [];
  const seenHashes = new Set();
  let rejectedByRelevance = 0;

  for (const query of queries) {
    try {
      const items = await fetchNaverNews(query, options.resultsPerCompany);
      console.log(`[news-crawl]   query="${query}" items=${items.length}`);

      for (const item of items) {
        const candidate = buildCandidate(company, item);
        if (!candidate || seenHashes.has(candidate.url_hash)) continue;
        seenHashes.add(candidate.url_hash);
        const relevance = evaluateCompanyNewsRelevance(company, candidate);
        const accepted = isCompanyNewsRelevant(relevance, options.minRelevanceScore);
        const relevanceReason = accepted ? relevance.reason : `${relevance.reason}_below_threshold`;

        if (!accepted) {
          rejectedByRelevance += 1;
          console.log(
            `[news-crawl]   rejected score=${relevance.score} matched=${relevance.matchedTerms.join(",") || "-"} ` +
            `reason=${relevanceReason} title="${summarizeTitle(candidate.title)}"`,
          );
          continue;
        }

        discovered.push({
          ...candidate,
          relevance_score: relevance.score,
          matched_terms: relevance.matchedTerms,
          relevance_reason: relevanceReason,
        });
        console.log(
          `[news-crawl]   accepted score=${relevance.score} matched=${relevance.matchedTerms.join(",") || "-"} ` +
          `title="${summarizeTitle(candidate.title)}"`,
        );
        if (discovered.length >= options.resultsPerCompany) break;
      }
    } catch (error) {
      console.error(`[news-crawl]   query failed: "${query}" (${error.message})`);
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
    `existing=${discovered.length - freshRows.length} rejectedByRelevance=${rejectedByRelevance}`,
  );

  return {
    discovered: discovered.length,
    newCount: freshRows.length,
    inserted,
    rejectedByRelevance,
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

  if (!Number.isFinite(MIN_RELEVANCE_SCORE) || MIN_RELEVANCE_SCORE <= 0) {
    throw new Error("--min-relevance-score는 1 이상의 숫자여야 합니다.");
  }

  if (!Number.isFinite(EXISTING_AUDIT_LIMIT) || EXISTING_AUDIT_LIMIT <= 0) {
    throw new Error("--existing-limit은 1 이상의 숫자여야 합니다.");
  }

  if (!["pending", "approved", "rejected", "all"].includes(EXISTING_STATUS)) {
    throw new Error("--existing-status는 pending, approved, rejected, all 중 하나여야 합니다.");
  }

  const options = {
    batchSize: BATCH_SIZE,
    resultsPerCompany: RESULTS_PER_COMPANY,
    delayMs: REQUEST_DELAY_MS,
    dryRun: DRY_RUN,
    maxStoredArticles: MAX_STORED_ARTICLES,
    minRelevanceScore: MIN_RELEVANCE_SCORE,
  };

  if (AUDIT_EXISTING_RELEVANCE) {
    await auditExistingRelevance({
      status: EXISTING_STATUS,
      limit: EXISTING_AUDIT_LIMIT,
      minRelevanceScore: options.minRelevanceScore,
      apply: APPLY_EXISTING_RELEVANCE && !DRY_RUN,
      rejectLowRelevance: REJECT_LOW_RELEVANCE_EXISTING,
    });
    return;
  }

  console.log(
    `[news-crawl] start batchSize=${options.batchSize} resultsPerCompany=${options.resultsPerCompany} ` +
    `delayMs=${options.delayMs} maxStoredArticles=${options.maxStoredArticles} ` +
    `minRelevanceScore=${options.minRelevanceScore} ` +
    `dryRun=${options.dryRun ? "yes" : "no"}`,
  );

  const companies = await loadCompanies(options.batchSize);
  console.log(`[news-crawl] loaded companies=${companies.length}`);

  let totalDiscovered = 0;
  let totalNew = 0;
  let totalInserted = 0;
  let totalRejectedByRelevance = 0;
  let processed = 0;
  let failed = 0;

  for (const company of companies) {
    try {
      const summary = await processCompany(company, options);
      totalDiscovered += summary.discovered;
      totalNew += summary.newCount;
      totalInserted += summary.inserted;
      totalRejectedByRelevance += summary.rejectedByRelevance;
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
    `new=${totalNew} inserted=${totalInserted} rejectedByRelevance=${totalRejectedByRelevance} ` +
    `dryRun=${options.dryRun ? "yes" : "no"}`,
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
