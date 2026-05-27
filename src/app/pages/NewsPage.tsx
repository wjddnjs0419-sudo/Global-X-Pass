import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { supabase } from "../../lib/supabaseClient";
import { PageShell } from "../components/PageShell";
import { BoardAccessGate } from "../components/BoardAccessGate";
import { useBoardCategoryLabel } from "../BoardCategoriesContext";
import { useTheme } from "../ThemeContext";
import { LoadingSpinner, ErrorMessage } from "../components/LoadingSpinner";
import { cleanText } from "../../utils/text";
import { getThumbnailImageStyle, resolvePostThumbnail, getThumbnailCandidates } from "../../utils/postThumbnail";
import { getFilterTabStyle, getMutedLabelStyle } from "../components/contentListStyles";
import { AppPagination } from "../components/AppPagination";
import { ExternalNewsCard } from "../components/ExternalNewsCard";
import type { ExternalNewsItem, Post } from "../../lib/types";

const PAGE_SIZE = 10;
const PREVIEW_SIZE = 5;
const NEWS_COLOR = "var(--color-accent-blue)";

type NewsFilter = "all" | "newsletter" | "press";

function formatNewsletterDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function NewsPage() {
  const { isDark } = useTheme();
  const boardTitle = useBoardCategoryLabel("news", "뉴스");
  const boardSubtitle = "뉴스레터와 언론보도를 한곳에서 확인하세요.";
  const [activeFilter, setActiveFilter] = useState<NewsFilter>("all");
  const [posts, setPosts] = useState<Post[]>([]);
  const [pressItems, setPressItems] = useState<ExternalNewsItem[]>([]);
  const [newsletterLoading, setNewsletterLoading] = useState(true);
  const [pressLoading, setPressLoading] = useState(true);
  const [newsletterError, setNewsletterError] = useState<string | null>(null);
  const [pressError, setPressError] = useState<string | null>(null);
  const [newsletterPage, setNewsletterPage] = useState(1);
  const [pressPage, setPressPage] = useState(1);
  const [failedThumbnails, setFailedThumbnails] = useState<Record<string, true>>({});

  const card = "var(--color-surface-card)";
  const border = "var(--color-border-soft)";
  const textMain = "var(--color-text-primary)";
  const textMuted = "var(--color-text-muted)";

  useEffect(() => {
    let mounted = true;

    const fetchNewsletterPosts = async () => {
      setNewsletterLoading(true);
      setNewsletterError(null);

      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("category", "news")
        .order("created_at", { ascending: false });

      if (!mounted) return;
      if (error) {
        setNewsletterError(error.message);
        setPosts([]);
      } else {
        setPosts((data as Post[] | null) ?? []);
      }
      setNewsletterLoading(false);
    };

    const fetchPressItems = async () => {
      setPressLoading(true);
      setPressError(null);

      const { data, error } = await supabase
        .from("external_news_items")
        .select("id, title, summary, source_name, external_url, published_at, status, created_at, updated_at")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .order("created_at", { ascending: false });

      if (!mounted) return;
      if (error) {
        setPressError(error.message);
        setPressItems([]);
      } else {
        setPressItems((data as ExternalNewsItem[] | null) ?? []);
      }
      setPressLoading(false);
    };

    void fetchNewsletterPosts();
    void fetchPressItems();

    return () => {
      mounted = false;
    };
  }, []);

  const newsletterTotalPages = Math.max(1, Math.ceil(posts.length / PAGE_SIZE));
  const pagedNewsletterPosts = useMemo(
    () => posts.slice((newsletterPage - 1) * PAGE_SIZE, newsletterPage * PAGE_SIZE),
    [posts, newsletterPage],
  );

  const pressTotalPages = Math.max(1, Math.ceil(pressItems.length / PAGE_SIZE));
  const pagedPressItems = useMemo(
    () => pressItems.slice((pressPage - 1) * PAGE_SIZE, pressPage * PAGE_SIZE),
    [pressItems, pressPage],
  );

  useEffect(() => {
    setNewsletterPage((page) => Math.min(page, newsletterTotalPages));
  }, [newsletterTotalPages]);

  useEffect(() => {
    setPressPage((page) => Math.min(page, pressTotalPages));
  }, [pressTotalPages]);

  const handleFilterChange = (filter: NewsFilter) => {
    setActiveFilter(filter);
    setNewsletterPage(1);
    setPressPage(1);
  };

  const filterChips: { key: NewsFilter; label: string; count: number }[] = [
    { key: "all", label: "전체", count: posts.length + pressItems.length },
    { key: "newsletter", label: "뉴스레터", count: posts.length },
    { key: "press", label: "언론보도", count: pressItems.length },
  ];

  const renderNewsletterCard = (post: Post) => {
    const thumbnail = resolvePostThumbnail(post);
    const manualFailed = failedThumbnails[post.id] && !!post.thumbnail_url?.trim();
    const autoUrl = manualFailed ? (getThumbnailCandidates(post.content ?? "", post.image_url)[0]?.url ?? null) : null;
    const displayUrl = manualFailed ? autoUrl : thumbnail.url;
    const thumbnailVisible = !!displayUrl && !failedThumbnails[`${post.id}_fb`];
    const excerpt = cleanText(post.content);

    return (
      <Link
        key={post.id}
        to={`/post/${post.id}`}
        className="rounded-[20px] overflow-hidden flex flex-col sm:flex-row no-underline transition-all duration-200 ease-out hover:-translate-y-0.5"
        style={{ background: card, border: `1px solid ${border}` }}
      >
        <div
          className="w-full h-[180px] sm:w-[200px] sm:h-auto sm:self-stretch shrink-0 flex items-center justify-center"
          style={{ background: "var(--color-bg-overlay)", overflow: "hidden" }}
        >
          {thumbnailVisible ? (
            <img
              src={displayUrl ?? ""}
              alt=""
              onError={() => {
                if (!failedThumbnails[post.id]) {
                  setFailedThumbnails((prev) => ({ ...prev, [post.id]: true }));
                } else {
                  setFailedThumbnails((prev) => ({ ...prev, [`${post.id}_fb`]: true }));
                }
              }}
              style={getThumbnailImageStyle(manualFailed ? null : thumbnail.crop)}
            />
          ) : (
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={textMuted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          )}
        </div>

        <div className="flex-1 min-w-0 p-4 sm:p-5 flex flex-col gap-2">
          <div className="flex items-start gap-2">
            {post.tags && (
              <span className="shrink-0 mt-[3px]" style={getMutedLabelStyle(isDark)}>
                {post.tags}
              </span>
            )}
            <h2
              className="m-0 font-extrabold leading-snug line-clamp-2"
              style={{ fontSize: "clamp(16px, 2vw, 19px)", color: textMain }}
            >
              {post.title}
            </h2>
          </div>

          {excerpt && (
            <p className="m-0 text-[14px] leading-relaxed line-clamp-2" style={{ color: textMuted }}>
              {excerpt}
            </p>
          )}

          <p className="m-0 text-[12px] font-medium mt-auto pt-1" style={{ color: textMuted }}>
            {formatNewsletterDate(post.created_at)}
          </p>
        </div>
      </Link>
    );
  };

  const emptyCard = (message: string) => (
    <div className="rounded-[20px] p-8 text-center" style={{ background: card, border: `1px solid ${border}` }}>
      <p style={{ margin: 0, color: textMuted, fontWeight: 600 }}>{message}</p>
    </div>
  );

  const moreButton = (label: string, onClick: () => void) => (
    <button
      type="button"
      onClick={onClick}
      className="mt-6 mx-auto flex items-center gap-1 text-[13px] font-bold cursor-pointer"
      style={{ background: "none", border: "none", color: NEWS_COLOR }}
    >
      {label}
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14M12 5l7 7-7 7" />
      </svg>
    </button>
  );

  // 전체 모드에서는 각 섹션을 미리보기 개수만 노출하고, 초과분은 단독 탭으로 안내한다.
  const isAll = activeFilter === "all";

  const newsletterBlock = newsletterLoading ? (
    <LoadingSpinner />
  ) : newsletterError ? (
    <ErrorMessage message={newsletterError} />
  ) : posts.length === 0 ? (
    emptyCard("아직 등록된 뉴스레터가 없습니다.")
  ) : (
    <>
      <div className="flex flex-col gap-4">
        {(isAll ? posts.slice(0, PREVIEW_SIZE) : pagedNewsletterPosts).map(renderNewsletterCard)}
      </div>
      {isAll ? (
        posts.length > PREVIEW_SIZE && moreButton(`뉴스레터 전체 보기 (${posts.length})`, () => handleFilterChange("newsletter"))
      ) : (
        <AppPagination
          currentPage={newsletterPage}
          totalPages={newsletterTotalPages}
          onPageChange={setNewsletterPage}
          className="mt-10"
        />
      )}
    </>
  );

  const pressBlock = pressLoading ? (
    <LoadingSpinner />
  ) : pressError ? (
    <ErrorMessage message={pressError} />
  ) : pressItems.length === 0 ? (
    emptyCard("아직 등록된 언론보도가 없습니다.")
  ) : (
    <>
      <div className="flex flex-col gap-4">
        {(isAll ? pressItems.slice(0, PREVIEW_SIZE) : pagedPressItems).map((item) => (
          <ExternalNewsCard key={item.id} item={item} />
        ))}
      </div>
      {isAll ? (
        pressItems.length > PREVIEW_SIZE && moreButton(`언론보도 전체 보기 (${pressItems.length})`, () => handleFilterChange("press"))
      ) : (
        <AppPagination
          currentPage={pressPage}
          totalPages={pressTotalPages}
          onPageChange={setPressPage}
          className="mt-10"
        />
      )}
    </>
  );

  const showNewsletter = activeFilter === "all" || activeFilter === "newsletter";
  const showPress = activeFilter === "all" || activeFilter === "press";
  const newsletterReady = !newsletterLoading && !newsletterError;
  const pressReady = !pressLoading && !pressError;
  // 전체 모드에서 로딩이 끝나고 비어 있는 섹션은 숨기되, 둘 다 비면 통합 안내를 보여준다.
  const newsletterVisible = showNewsletter && (activeFilter === "newsletter" || !newsletterReady || posts.length > 0);
  const pressVisible = showPress && (activeFilter === "press" || !pressReady || pressItems.length > 0);
  const bothEmptyInAll =
    activeFilter === "all" && newsletterReady && pressReady && posts.length === 0 && pressItems.length === 0;

  return (
    <BoardAccessGate category="news">
      <PageShell title={boardTitle} subtitle={boardSubtitle} accentColor={NEWS_COLOR}>
        <div className="max-w-[980px] mx-auto pb-[100px]">
          <div className="flex flex-wrap gap-2 mb-6">
            {filterChips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={() => handleFilterChange(chip.key)}
                style={{
                  ...getFilterTabStyle(isDark, activeFilter === chip.key),
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {chip.label}
                <span className="text-[12px] font-bold opacity-70">({chip.count})</span>
              </button>
            ))}
          </div>

          {bothEmptyInAll ? (
            emptyCard("아직 등록된 콘텐츠가 없습니다.")
          ) : (
            <>
              {newsletterVisible && (
                <section className={activeFilter === "all" ? "mb-12" : ""}>
                  {activeFilter === "all" && (
                    <h2 className="m-0 mb-4 text-[15px] font-extrabold" style={{ color: textMain }}>
                      뉴스레터
                    </h2>
                  )}
                  {newsletterBlock}
                </section>
              )}

              {pressVisible && (
                <section>
                  {activeFilter === "all" && (
                    <h2 className="m-0 mb-4 text-[15px] font-extrabold" style={{ color: textMain }}>
                      언론보도
                    </h2>
                  )}
                  {pressBlock}
                </section>
              )}
            </>
          )}
        </div>
      </PageShell>
    </BoardAccessGate>
  );
}
