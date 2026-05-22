import { useEffect, useMemo, useState } from "react";
import { PageShell } from "../components/PageShell";
import { supabase } from "../../lib/supabaseClient";
import { LoadingSpinner, ErrorMessage } from "../components/LoadingSpinner";
import { AppPagination } from "../components/AppPagination";
import type { Article } from "../../lib/types";

const PAGE_SIZE = 10;
const ACCENT = "var(--color-accent-blue)";

export function CompanyNewsPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchArticles = async () => {
      const { data, error: fetchError } = await supabase
        .from("articles")
        .select("id, company_id, title, description, link, originallink, source, published_at, status, url_hash, created_at, updated_at")
        .eq("status", "approved")
        .order("published_at", { ascending: false });

      if (fetchError) {
        setError(true);
      } else {
        setArticles((data as Article[]) || []);
      }
      setLoading(false);
    };

    fetchArticles();
  }, []);

  const totalPages = Math.ceil(articles.length / PAGE_SIZE);
  const pagedArticles = useMemo(
    () => articles.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [articles, currentPage],
  );

  return (
    <PageShell title="기업 뉴스" subtitle="스타트업 참여기업 관련 기사 중 관리자 승인된 항목만 노출합니다." accentColor={ACCENT}>
      <div className="max-w-[980px] mx-auto pb-[100px]">
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorMessage />
        ) : articles.length === 0 ? (
          <div
            className="rounded-[20px] p-8 text-center"
            style={{ background: "var(--color-surface-card)", border: "1px solid var(--color-border-soft)" }}
          >
            <p style={{ margin: 0, color: "var(--color-text-muted)", fontWeight: 600 }}>
              아직 승인된 기업 뉴스가 없습니다.
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-4">
              {pagedArticles.map((article) => {
                const href = article.originallink || article.link;
                const publishedAt = new Date(article.published_at);

                return (
                  <a
                    key={article.id}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-[20px] overflow-hidden block no-underline transition-all duration-200 ease-out hover:-translate-y-0.5"
                    style={{
                      background: "var(--color-surface-card)",
                      border: "1px solid var(--color-border-soft)",
                    }}
                  >
                    <div className="min-w-0 p-4 sm:p-5 flex flex-col gap-2">
                      <div className="flex items-start gap-2 flex-wrap">
                        {article.source && (
                          <span
                            className="shrink-0 mt-[3px] px-2 py-1 rounded-full text-[12px] font-semibold"
                            style={{
                              background: "rgba(67,119,241,0.12)",
                              color: "var(--color-accent-blue)",
                            }}
                          >
                            {article.source}
                          </span>
                        )}
                        <h2
                          className="m-0 font-extrabold leading-snug line-clamp-2"
                          style={{ fontSize: "clamp(16px, 2vw, 19px)", color: "var(--color-text-primary)" }}
                        >
                          {article.title}
                        </h2>
                      </div>

                      {article.description && (
                        <p
                          className="m-0 text-[14px] leading-relaxed line-clamp-2"
                          style={{ color: "var(--color-text-muted)" }}
                        >
                          {article.description}
                        </p>
                      )}

                      <div className="flex items-center gap-3 mt-auto pt-1 flex-wrap">
                        <span className="text-[12px] font-medium" style={{ color: "var(--color-text-muted)" }}>
                          {publishedAt.toLocaleDateString("ko-KR", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </span>
                        <span className="text-[12px] font-medium" style={{ color: ACCENT }}>
                          원문 보기
                        </span>
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>

            <AppPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              className="mt-10"
            />
          </>
        )}
      </div>
    </PageShell>
  );
}
