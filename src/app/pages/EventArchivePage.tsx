import { useEffect, useState } from "react";
import { Link } from "react-router";
import { supabase } from "../../lib/supabaseClient";
import { PageShell } from "../components/PageShell";
import { useTheme } from "../ThemeContext";
import { LoadingSpinner, ErrorMessage } from "../components/LoadingSpinner";
import { cleanText } from "../../utils/text";
import { getThumbnailImageStyle, resolvePostThumbnail, getThumbnailCandidates } from "../../utils/postThumbnail";
import { getFilterTabStyle, getMutedLabelStyle } from "../components/contentListStyles";
import { AppPagination } from "../components/AppPagination";

const PAGE_SIZE = 12;

export function EventArchivePage() {
  const { isDark } = useTheme();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeTag, setActiveTag] = useState("전체");
  const [activeYear, setActiveYear] = useState("전체");
  const [currentPage, setCurrentPage] = useState(1);
  const [failedThumbnails, setFailedThumbnails] = useState<Record<string, true>>({});


  useEffect(() => {
    let isMounted = true;

    const fetchPosts = async () => {
      const { data, error: err } = await supabase
        .from('posts')
        .select('*')
        .eq('category', 'events-archive')
        .order('created_at', { ascending: false });

      if (!isMounted) return;

      if (err) {
        setPosts([]);
        setError(true);
        setLoading(false);
        return;
      }

      setPosts(data ?? []);
      setError(false);
      setLoading(false);
    };

    void fetchPosts();

    return () => {
      isMounted = false;
    };
  }, []);

  const allTags = posts.flatMap(p => p.tags ? p.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : []);
  const uniqueTags = [...new Set(allTags)];
  const uniqueYears = [...new Set(posts.map(p => String(new Date(p.created_at).getFullYear())))].sort((a, b) => Number(b) - Number(a));
  const filteredPosts = posts.filter(p => {
    const tagMatch = activeTag === "전체" || p.tags?.split(',').map((t: string) => t.trim()).includes(activeTag);
    const yearMatch = activeYear === "전체" || String(new Date(p.created_at).getFullYear()) === activeYear;
    return tagMatch && yearMatch;
  });
  const totalPages = Math.ceil(filteredPosts.length / PAGE_SIZE);
  const pagedPosts = filteredPosts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleTagChange = (tag: string) => { setActiveTag(tag); setCurrentPage(1); };
  const handleYearChange = (year: string) => { setActiveYear(year); setCurrentPage(1); };

  return (
    <PageShell title="행사 아카이브" subtitle="NCF와 함께한 지난 행사의 소중한 기록들을 만나보세요." accentColor="var(--color-accent-green)">
      <div className="max-w-[1280px] mx-auto pb-[100px]">
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorMessage />
        ) : posts.length === 0 ? (
          <p className="text-center text-gray-500 py-[80px]">등록된 아카이브가 없습니다.</p>
        ) : (
          <>
            {/* Filters */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 28 }}>
              {uniqueTags.length > 0 && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {["전체", ...uniqueTags].map(tag => (
                    <button
                      key={tag}
                      aria-pressed={activeTag === tag}
                      onClick={() => handleTagChange(tag)}
                      style={getFilterTabStyle(isDark, activeTag === tag)}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              )}
              {uniqueYears.length > 1 && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {["전체", ...uniqueYears].map(year => {
                    const active = activeYear === year;
                    return (
                      <button
                        key={year}
                        aria-pressed={active}
                        onClick={() => handleYearChange(year)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          padding: "3px 10px",
                          borderRadius: 999,
                          border: `1px solid ${active ? "var(--color-glass-border-strong)" : "var(--color-glass-border)"}`,
                          background: active ? "var(--color-surface-selected)" : "var(--color-surface-subtle)",
                          color: active ? "var(--color-text-primary)" : "var(--color-text-muted)",
                          fontSize: 12,
                          fontWeight: active ? 700 : 500,
                          cursor: "pointer",
                          transition: "background 0.15s, border-color 0.15s, color 0.15s",
                        }}
                      >
                        {year === "전체" ? "전체" : `${year}년`}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 4-column grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {pagedPosts.map((post) => {
                const thumbnail = resolvePostThumbnail(post);
                const manualFailed = failedThumbnails[post.id] && !!post.thumbnail_url?.trim();
                const autoUrl = manualFailed ? (getThumbnailCandidates(post.content ?? "", post.image_url)[0]?.url ?? null) : null;
                const displayUrl = manualFailed ? autoUrl : thumbnail.url;
                const thumbnailVisible = !!displayUrl && !failedThumbnails[`${post.id}_fb`];
                const year = new Date(post.created_at).getFullYear();
                const dateStr = new Date(post.created_at)
                  .toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" })
                  .replace(/ /g, "");
                const excerpt = cleanText(post.content);

                return (
                  <Link
                    key={post.id}
                    to={`/post/${post.id}`}
                    className="rounded-[20px] no-underline overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-1"
                    style={{
                      background: "var(--color-surface-card)",
                      border: "1px solid var(--color-border-soft)",
                      boxShadow: "var(--shadow-card-rest)",
                    }}
                  >
                    {/* Thumbnail */}
                    <div style={{ position: "relative", width: "100%", aspectRatio: "16/10", background: "var(--color-skeleton-bg)", overflow: "hidden" }}>
                      {thumbnailVisible ? (
                        <img
                          src={displayUrl ?? ""}
                          alt=""
                          onError={() => {
                            if (!failedThumbnails[post.id]) {
                              setFailedThumbnails(prev => ({ ...prev, [post.id]: true }));
                            } else {
                              setFailedThumbnails(prev => ({ ...prev, [`${post.id}_fb`]: true }));
                            }
                          }}
                          style={getThumbnailImageStyle(manualFailed ? null : thumbnail.crop)}
                        />
                      ) : (
                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                          </svg>
                        </div>
                      )}
                      <span style={{
                        position: "absolute", bottom: 10, left: 10,
                        fontSize: 11, fontWeight: 700, color: "var(--color-text-primary)",
                        background: "var(--color-scrim)", backdropFilter: "blur(6px)",
                        padding: "3px 8px", borderRadius: 6,
                      }}>
                        {year}
                      </span>
                    </div>

                    {/* Card body */}
                    <div style={{ padding: "16px 18px 20px", flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                          {post.tags
                            ? post.tags.split(',').map((t: string) => t.trim()).filter(Boolean).map((tag: string) => (
                                <span key={tag} style={getMutedLabelStyle(isDark)}>{tag}</span>
                              ))
                            : <span style={getMutedLabelStyle(isDark)}>행사</span>
                          }
                        </div>
                        <span style={{ fontSize: 12, color: "var(--color-text-muted)", flexShrink: 0 }}>{dateStr}</span>
                      </div>
                      <strong style={{
                        fontSize: 15, fontWeight: 800, color: "var(--color-text-primary)", lineHeight: 1.4,
                        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                      } as React.CSSProperties}>
                        {post.title}
                      </strong>
                      {excerpt && (
                        <p style={{
                          margin: 0, fontSize: 13, color: "var(--color-text-muted)", lineHeight: 1.55,
                          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                        } as React.CSSProperties}>
                          {excerpt}
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Pagination */}
            <AppPagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} className="mt-10" />
          </>
        )}
      </div>
    </PageShell>
  );
}
