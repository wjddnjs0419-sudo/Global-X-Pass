import { useEffect, useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";
import { PageShell } from "../components/PageShell";
import { BoardAccessGate } from "../components/BoardAccessGate";
import { supabase } from "../../lib/supabaseClient";
import { LoadingSpinner, ErrorMessage } from "../components/LoadingSpinner";
import { AppPagination } from "../components/AppPagination";
import { Badge } from "../components/ui/badge";
import { useBoardCategoryLabel, useBoardCategoryDescription } from "../BoardCategoriesContext";
import type { Article } from "../../lib/types";

const PAGE_SIZE = 10;
const ACCENT = "var(--color-accent-blue)";

function formatArticleDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function CompanyNewsPage() {
  const boardTitle = useBoardCategoryLabel("company-news", "기업 뉴스");
  const boardSubtitle = useBoardCategoryDescription("company-news", "참여기업의 최신 기사들을 확인해보세요.");
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
    <BoardAccessGate category="company-news">
    <PageShell title={boardTitle} subtitle={boardSubtitle} accentColor={ACCENT}>
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
                          <Badge variant="blue" shape="pill" className="mt-[3px]">
                            {article.source}
                          </Badge>
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
                          {formatArticleDate(article.published_at)}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[12px] font-bold" style={{ color: ACCENT }}>
                          원문 보기 <ExternalLink size={12} />
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
    </BoardAccessGate>
  );
}
