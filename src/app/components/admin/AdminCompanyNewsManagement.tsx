import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ExternalLink, Play, RefreshCw, Trash2 } from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";
import { useTheme } from "../../ThemeContext";
import { AppPagination } from "../AppPagination";
import { SearchInput } from "../SearchInput";
import { COMPANY_NEWS_CRAWL_DEFAULT_OPTIONS } from "./companyNewsCrawl";
import { getFilterTabStyle } from "../contentListStyles";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import type { CompanyNewsCrawlOptions, CompanyNewsTriggerResult } from "./companyNewsCrawl";
import type { Article } from "../../../lib/types";
import { useDebouncedValue } from "../../../hooks/useDebounce";

const PAGE_SIZE = 20;

type ArticleStatusFilter = "all" | Article["status"];

type CompanySummary = {
  name: string;
  slug: string;
};

type AdminArticle = Article & {
  companies?: CompanySummary | CompanySummary[] | null;
};

const STATUS_LABEL: Record<Article["status"], string> = {
  pending: "승인 대기",
  approved: "승인됨",
  rejected: "거절됨",
};

const STATUS_BADGE: Record<Article["status"], "yellow" | "green" | "red"> = {
  pending: "yellow",
  approved: "green",
  rejected: "red",
};

const FILTER_TABS: { id: ArticleStatusFilter; label: string }[] = [
  { id: "pending", label: "승인 대기" },
  { id: "approved", label: "승인됨" },
  { id: "rejected", label: "거절됨" },
  { id: "all", label: "전체" },
];

function fmtDate(iso: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  const M = String(d.getMonth() + 1).padStart(2, "0");
  const D = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${M}/${D} ${h}:${m}`;
}

function getCompanyName(article: AdminArticle): string {
  const company = Array.isArray(article.companies) ? article.companies[0] : article.companies;
  return company?.name ?? "회사 미연결";
}

function getRelevanceLabel(article: AdminArticle): string {
  if (article.relevance_score == null) return "관련도 미집계";
  return `관련도 ${article.relevance_score}`;
}

function getRelevanceVariant(article: AdminArticle): "blue" | "green" | "yellow" | "secondary" {
  const score = article.relevance_score ?? 0;
  if (score >= 6) return "green";
  if (score >= 3) return "blue";
  if (score > 0) return "yellow";
  return "secondary";
}

function sanitizeSearch(value: string): string {
  return value.trim().replace(/[,%]/g, " ");
}

export default function AdminCompanyNewsManagement() {
  const { isDark } = useTheme();
  const [articles, setArticles] = useState<AdminArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ArticleStatusFilter>("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<AdminArticle | null>(null);
  const [triggerLoading, setTriggerLoading] = useState(false);
  const [triggerMessage, setTriggerMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [crawlOptions, setCrawlOptions] = useState<CompanyNewsCrawlOptions>(COMPANY_NEWS_CRAWL_DEFAULT_OPTIONS);
  const activeFetchRef = useRef(0);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(totalCount / PAGE_SIZE)), [totalCount]);

  const fetchArticles = useCallback(async () => {
    const fetchId = ++activeFetchRef.current;
    setLoading(true);
    setFetchError(null);

    const from = (currentPage - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const queryText = sanitizeSearch(debouncedSearchTerm);

    let query = supabase
      .from("articles")
      .select("id, company_id, title, description, link, originallink, source, published_at, status, url_hash, relevance_score, matched_terms, relevance_reason, created_at, updated_at, companies(name, slug)", { count: "exact" })
      .range(from, to);

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    if (statusFilter === "pending") {
      query = query
        .order("relevance_score", { ascending: false, nullsFirst: false })
        .order("published_at", { ascending: false })
        .order("created_at", { ascending: false });
    } else {
      query = query
        .order("published_at", { ascending: false })
        .order("created_at", { ascending: false });
    }

    if (queryText) {
      query = query.or(`title.ilike.%${queryText}%,description.ilike.%${queryText}%,source.ilike.%${queryText}%`);
    }

    const { data, error, count } = await query;

    if (fetchId !== activeFetchRef.current) return;

    if (error) {
      setFetchError(error.message);
      setArticles([]);
      setTotalCount(0);
    } else {
      setArticles((data as AdminArticle[] | null) ?? []);
      setTotalCount(count ?? 0);
    }

    setLoading(false);
  }, [currentPage, debouncedSearchTerm, statusFilter]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, debouncedSearchTerm]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const patchStatus = async (article: AdminArticle, status: Article["status"]) => {
    setSavingIds((prev) => new Set(prev).add(article.id));
    const { error } = await supabase
      .from("articles")
      .update({ status })
      .eq("id", article.id);
    setSavingIds((prev) => {
      const next = new Set(prev);
      next.delete(article.id);
      return next;
    });

    if (error) {
      setFetchError(error.message);
      return;
    }

    await fetchArticles();
  };

  const deleteArticle = async () => {
    if (!deleteTarget) return;
    setSavingIds((prev) => new Set(prev).add(deleteTarget.id));
    const { error } = await supabase
      .from("articles")
      .delete()
      .eq("id", deleteTarget.id);
    setSavingIds((prev) => {
      const next = new Set(prev);
      next.delete(deleteTarget.id);
      return next;
    });
    setDeleteTarget(null);

    if (error) {
      setFetchError(error.message);
      return;
    }

    await fetchArticles();
  };

  const triggerCrawl = async () => {
    setTriggerLoading(true);
    setTriggerMessage(null);

    const { data, error } = await supabase.functions.invoke<CompanyNewsTriggerResult>("trigger-company-news-crawl", {
      body: crawlOptions,
    });

    setTriggerLoading(false);

    if (error || !data?.dispatched) {
      const detail = data?.dispatchError || data?.error || error?.message;
      setTriggerMessage({
        type: "err",
        text: detail
          ? `실행 요청에 실패했습니다. ${detail}`
          : "실행 요청에 실패했습니다. 잠시 후 다시 시도해 주세요.",
      });
      return;
    }

    setTriggerMessage({
      type: "ok",
      text: "기업 뉴스 수집 워크플로우를 실행했습니다. GitHub Actions 완료 후 새로고침하면 결과를 확인할 수 있습니다.",
    });
  };

  const card = "var(--color-surface-card)";
  const border = "var(--color-border-soft)";
  const textMain = "var(--color-text-primary)";
  const textMuted = "var(--color-text-muted)";
  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: `1px solid ${border}`,
    background: "var(--color-field-bg)",
    color: textMain,
    fontSize: 13,
    outline: "none",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: textMain }}>기업 뉴스 관리</h2>
          <p style={{ margin: "6px 0 0", fontSize: 13, color: textMuted }}>
            수집된 기사를 승인하면 기업 뉴스 페이지에 노출됩니다. 전체 저장량은 최신 300개로 유지됩니다.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Button type="button" variant="outline" size="sm" onClick={fetchArticles}>
            <RefreshCw size={14} />
            새로고침
          </Button>
          <Button type="button" size="sm" disabled={triggerLoading} onClick={triggerCrawl}>
            <Play size={14} />
            {triggerLoading ? "실행 요청 중..." : "즉시 수집"}
          </Button>
        </div>
      </div>

      <div
        style={{
          background: card,
          border: `1px solid ${border}`,
          borderRadius: 16,
          padding: 18,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: 12,
        }}
      >
        <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, fontWeight: 700, color: textMuted }}>
          처리 회사 수
          <input
            type="number"
            min={1}
            max={100}
            value={crawlOptions.batchSize}
            onChange={(e) => setCrawlOptions((prev) => ({ ...prev, batchSize: Number(e.target.value) }))}
            style={inputStyle}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, fontWeight: 700, color: textMuted }}>
          회사당 기사 수
          <input
            type="number"
            min={1}
            max={20}
            value={crawlOptions.resultsPerCompany}
            onChange={(e) => setCrawlOptions((prev) => ({ ...prev, resultsPerCompany: Number(e.target.value) }))}
            style={inputStyle}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, fontWeight: 700, color: textMuted }}>
          최대 저장 기사
          <input
            type="number"
            min={50}
            max={1000}
            value={crawlOptions.maxStoredArticles}
            onChange={(e) => setCrawlOptions((prev) => ({ ...prev, maxStoredArticles: Number(e.target.value) }))}
            style={inputStyle}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, fontWeight: 700, color: textMuted }}>
          최소 관련도
          <input
            type="number"
            min={1}
            max={10}
            value={crawlOptions.minRelevanceScore}
            onChange={(e) => setCrawlOptions((prev) => ({ ...prev, minRelevanceScore: Number(e.target.value) }))}
            style={inputStyle}
          />
        </label>
      </div>

      {triggerMessage && (
        <div
          style={{
            padding: "13px 16px",
            borderRadius: 12,
            background: triggerMessage.type === "ok" ? "var(--color-success-soft-bg)" : "var(--color-danger-soft-bg)",
            border: `1px solid ${triggerMessage.type === "ok" ? "var(--color-success-soft-border)" : "var(--color-danger-soft-border)"}`,
            color: triggerMessage.type === "ok" ? textMain : "var(--color-brand-red)",
            fontSize: 14,
            lineHeight: 1.6,
          }}
        >
          {triggerMessage.text}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            aria-pressed={statusFilter === tab.id}
            onClick={() => setStatusFilter(tab.id)}
            style={getFilterTabStyle(isDark, statusFilter === tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <SearchInput
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="제목 · 요약 · 출처 검색"
        className="max-w-[420px]"
      />

      {fetchError && (
        <div style={{ padding: 16, borderRadius: 12, background: "var(--color-danger-soft-bg)", border: "1px solid var(--color-danger-soft-border)", color: "var(--color-brand-red)", fontSize: 14 }}>
          {fetchError}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {loading ? (
          Array.from({ length: 5 }).map((_, index) => (
            <div key={index} style={{ height: 96, borderRadius: 16, background: "var(--color-skeleton-bg)", animation: "pulse 1.5s ease-in-out infinite" }} />
          ))
        ) : articles.length === 0 ? (
          <div style={{ padding: 54, textAlign: "center", color: textMuted, background: card, border: `1px solid ${border}`, borderRadius: 16 }}>
            조건에 맞는 기업 뉴스가 없습니다.
          </div>
        ) : (
          articles.map((article) => {
            const isSaving = savingIds.has(article.id);
            const href = article.originallink || article.link;
            return (
              <div
                key={article.id}
                style={{ background: card, border: `1px solid ${border}`, borderRadius: 16, padding: 18, display: "flex", flexDirection: "column", gap: 12 }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 7 }}>
                      <Badge variant={STATUS_BADGE[article.status]} shape="pill">{STATUS_LABEL[article.status]}</Badge>
                      <Badge variant={getRelevanceVariant(article)} shape="pill">{getRelevanceLabel(article)}</Badge>
                      <span style={{ fontSize: 12, fontWeight: 700, color: textMuted }}>{getCompanyName(article)}</span>
                      {article.source && <span style={{ fontSize: 12, color: textMuted }}>{article.source}</span>}
                    </div>
                    <strong style={{ display: "block", color: textMain, fontSize: 16, lineHeight: 1.45 }}>
                      {article.title}
                    </strong>
                    {article.description && (
                      <p style={{ margin: "6px 0 0", color: textMuted, fontSize: 13, lineHeight: 1.55 }}>
                        {article.description}
                      </p>
                    )}
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 9 }}>
                      {(article.matched_terms ?? []).length > 0 ? (
                        article.matched_terms?.map((term) => (
                          <span
                            key={term}
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              color: textMuted,
                              background: "var(--color-surface-muted)",
                              border: `1px solid ${border}`,
                              borderRadius: 999,
                              padding: "3px 8px",
                            }}
                          >
                            {term}
                          </span>
                        ))
                      ) : (
                        <span style={{ fontSize: 12, fontWeight: 700, color: textMuted }}>
                          매칭 키워드 없음
                        </span>
                      )}
                      {article.relevance_reason && (
                        <span style={{ fontSize: 12, color: textMuted }}>
                          {article.relevance_reason}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ color: textMuted, fontSize: 12, whiteSpace: "nowrap" }}>
                    발행 {fmtDate(article.published_at)}
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "var(--color-accent-blue)", textDecoration: "none", fontSize: 13, fontWeight: 700 }}
                  >
                    원문 보기 <ExternalLink size={13} />
                  </a>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {article.status !== "approved" && (
                      <Button type="button" size="sm" disabled={isSaving} onClick={() => patchStatus(article, "approved")}>
                        승인
                      </Button>
                    )}
                    {article.status !== "rejected" && (
                      <Button type="button" variant="outline" size="sm" disabled={isSaving} onClick={() => patchStatus(article, "rejected")}>
                        거절
                      </Button>
                    )}
                    {article.status !== "pending" && (
                      <Button type="button" variant="outline" size="sm" disabled={isSaving} onClick={() => patchStatus(article, "pending")}>
                        대기로
                      </Button>
                    )}
                    <Button type="button" variant="destructive" size="sm" disabled={isSaving} onClick={() => setDeleteTarget(article)}>
                      <Trash2 size={13} />
                      삭제
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {!loading && totalPages > 1 && (
        <AppPagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      )}

      {deleteTarget && (
        <div
          style={{ position: "fixed", inset: 0, background: "var(--color-backdrop)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={() => setDeleteTarget(null)}
        >
          <div
            style={{ width: "100%", maxWidth: 420, background: "var(--color-bg-elevated)", border: `1px solid ${border}`, borderRadius: 18, padding: 24, boxShadow: "var(--shadow-dialog)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: 0, color: textMain, fontSize: 18, fontWeight: 800 }}>기사 삭제</h3>
            <p style={{ margin: "10px 0 20px", color: textMuted, fontSize: 14, lineHeight: 1.6 }}>
              이 기사를 삭제하면 승인 상태와 관계없이 목록에서 제거됩니다.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)}>취소</Button>
              <Button type="button" variant="destructive" onClick={deleteArticle}>삭제</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
