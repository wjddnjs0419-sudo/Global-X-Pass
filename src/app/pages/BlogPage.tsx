import { useState, useEffect } from "react";
import { Link } from "react-router";
import { PageShell } from "../components/PageShell";
import { useTheme } from "../ThemeContext";
import { supabase } from "../../lib/supabaseClient";
import { LoadingSpinner, ErrorMessage } from "../components/LoadingSpinner";
import { isImage } from "../../utils/file";
import { cleanText } from "../../utils/text";
import type { Post } from "../../lib/types";
import { getFilterTabStyle, getMutedLabelStyle } from "../components/contentListStyles";
import { AppPagination } from "../components/AppPagination";

const PAGE_SIZE = 12;

function readingMinutes(content: string) {
  const words = cleanText(content).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export function BlogPage() {
  const { isDark } = useTheme();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeTag, setActiveTag] = useState("전체");
  const [currentPage, setCurrentPage] = useState(1);


  useEffect(() => {
    supabase
      .from("posts")
      .select("*")
      .eq("category", "blog")
      .order("created_at", { ascending: false })
      .then(({ data, error: err }) => {
        if (err) setError(true);
        else setPosts((data as Post[]) || []);
        setLoading(false);
      });
  }, []);

  const featured = posts.find(p => p.is_featured) ?? posts[0] ?? null;
  const allTags = [...new Set(posts.map(p => p.tags).filter(Boolean))] as string[];
  const filteredPosts = posts
    .filter(p => p.id !== featured?.id)
    .filter(p => activeTag === "전체" || p.tags === activeTag);
  const totalPages = Math.ceil(filteredPosts.length / PAGE_SIZE);
  const pagedPosts = filteredPosts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleTagChange = (tag: string) => { setActiveTag(tag); setCurrentPage(1); };

  return (
    <PageShell title="블로그" subtitle="NCF와 Around X가 전하는 다양한 인사이트와 비즈니스 이야기를 만나보세요." accentColor="var(--color-accent-purple)">
      <div className="max-w-[1200px] mx-auto pb-[100px]">
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorMessage />
        ) : posts.length === 0 ? (
          <p className="text-center text-gray-500 py-[100px]">등록된 게시물이 없습니다.</p>
        ) : (
          <>
            {/* Featured banner */}
            {featured && (() => {
              const attachmentImages = featured.image_url?.split(",").filter(isImage) || [];
              const thumbnailUrl = attachmentImages[0] ?? (featured.content?.match(/<img[^>]+src="([^">]+)"/) || [])[1];
              const mins = readingMinutes(featured.content);
              return (
                <Link
                  to={`/post/${featured.id}`}
                  className="blog-card blog-featured-card rounded-3xl overflow-hidden mb-10 cursor-pointer transition-transform duration-200 hover:-translate-y-1 no-underline block"
                  style={{
                    background: thumbnailUrl
                      ? `linear-gradient(rgba(10,18,38,0.82), rgba(10,18,38,0.88)), url(${thumbnailUrl}) center/cover no-repeat`
                      : "linear-gradient(135deg, #0f172a 0%, #1a2845 100%)",
                    padding: "clamp(28px,5vw,48px)",
                    minHeight: 220,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: 20,
                  }}
                >
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {featured.is_featured && (
                      <span style={{ fontSize: 12, fontWeight: 750, color: "var(--color-text-secondary)", background: "var(--color-glass-border)", border: "1px solid var(--color-glass-border-strong)", padding: "4px 10px", borderRadius: 6 }}>
                        추천 아티클
                      </span>
                    )}
                    {featured.tags && (
                      <span style={{ fontSize: 12, fontWeight: 750, color: "var(--color-text-secondary)", background: "var(--color-border-soft)", border: "1px solid var(--color-glass-border)", padding: "4px 10px", borderRadius: 6 }}>
                        {featured.tags}
                      </span>
                    )}
                  </div>
                  <div>
                    <h2 style={{ margin: "0 0 12px", fontSize: "clamp(20px,3vw,32px)", fontWeight: 900, color: "var(--color-text-primary)", lineHeight: 1.3, maxWidth: 700 }}>
                      {featured.title}
                    </h2>
                    <p style={{ margin: "0 0 20px", fontSize: 15, color: "var(--color-text-secondary)", lineHeight: 1.65, maxWidth: 600, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" } as React.CSSProperties}>
                      {cleanText(featured.content)}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                      <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
                        NCF 리서치팀 &nbsp;·&nbsp; {new Date(featured.created_at).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }).replace(/ /g, "")} &nbsp;·&nbsp; 읽기 {mins}분
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text-secondary)" }}>읽기 →</span>
                      </div>
                    </div>
                </Link>
              );
            })()}

            {/* Tag filter */}
            {allTags.length > 0 && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 32 }}>
                {["전체", ...allTags].map(tag => (
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

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {pagedPosts.map((post) => {
                const attachmentImages = post.image_url?.split(",").filter(isImage) || [];
                const thumbnailUrl = attachmentImages[0] ?? (post.content?.match(/<img[^>]+src="([^">]+)"/) || [])[1];
                const mins = readingMinutes(post.content);
                const dateStr = new Date(post.created_at).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }).replace(/ /g, "");

                return (
                  <Link
                    key={post.id}
                    to={`/post/${post.id}`}
                    className="blog-card rounded-3xl overflow-hidden cursor-pointer transition-transform duration-200 hover:-translate-y-1.5 flex flex-col no-underline block"
                    style={{ background: "var(--color-surface-card)", border: "1px solid var(--color-border-soft)", boxShadow: "var(--shadow-card-rest)" }}
                  >
                    <div style={{ height: 160, overflow: "hidden", background: "var(--color-skeleton-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {thumbnailUrl ? (
                        <img src={thumbnailUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                      ) : (
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                        </svg>
                      )}
                    </div>
                    <div style={{ padding: "18px 20px 22px", flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        {post.tags ? (
                          <span style={getMutedLabelStyle(isDark)}>
                            {post.tags}
                          </span>
                        ) : (
                          <span style={getMutedLabelStyle(isDark)}>인사이트</span>
                        )}
                        <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>{mins}분 읽기</span>
                      </div>
                      <h2
                        style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "var(--color-text-primary)", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" } as React.CSSProperties}
                      >
                        {post.title}
                      </h2>
                      <p
                        style={{ margin: 0, fontSize: 13, color: "var(--color-text-muted)", lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" } as React.CSSProperties}
                      >
                        {cleanText(post.content)}
                      </p>
                      <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: "auto", paddingTop: 6 }}>
                        NCF 팀 &nbsp;·&nbsp; {dateStr}
                      </div>
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
      <style>{`
        .blog-card:focus-visible {
          outline: 2px solid var(--color-accent-purple-soft-border-strong);
          outline-offset: 3px;
        }
      `}</style>
    </PageShell>
  );
}
