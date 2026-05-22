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

const PAGE_SIZE = 10;

const NEWS_COLOR = "var(--color-accent-blue)";

export function NewsPage() {
  const { isDark } = useTheme();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeTag, setActiveTag] = useState("전체");
  const [currentPage, setCurrentPage] = useState(1);
  const [failedThumbnails, setFailedThumbnails] = useState<Record<string, true>>({});

  const card = "var(--color-surface-card)";
  const border = "var(--color-border-soft)";
  const textMain = "var(--color-text-primary)";
  const textMuted = "var(--color-text-muted)";
  useEffect(() => {
    const fetchPosts = async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('category', 'news')
        .order('created_at', { ascending: false });

      if (error) setError(true);
      else if (data) setPosts(data);
      setLoading(false);
    };
    fetchPosts();
  }, []);

  const allTags = [...new Set(posts.map(p => p.tags).filter(Boolean))] as string[];
  const filteredPosts = activeTag === "전체" ? posts : posts.filter(p => p.tags === activeTag);
  const totalPages = Math.ceil(filteredPosts.length / PAGE_SIZE);
  const pagedPosts = filteredPosts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const handleTagChange = (tag: string) => { setActiveTag(tag); setCurrentPage(1); };

  return (
    <PageShell title="뉴스" subtitle="NCF가 전하는 글로벌 마켓 트렌드와 비즈니스 인사이트를 확인하세요." accentColor={NEWS_COLOR}>
      <div className="max-w-[900px] mx-auto pb-[100px]">
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorMessage />
        ) : (
          <>
            {allTags.length > 0 && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
                {["전체", ...allTags].map(tag => (
                  <button
                    key={tag}
                    onClick={() => handleTagChange(tag)}
                    style={getFilterTabStyle(isDark, activeTag === tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
            <div className="flex flex-col gap-4">
              {pagedPosts.map((post) => {
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
                    {/* Thumbnail — flush, no padding */}
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
                              setFailedThumbnails(prev => ({ ...prev, [post.id]: true }));
                            } else {
                              setFailedThumbnails(prev => ({ ...prev, [`${post.id}_fb`]: true }));
                            }
                          }}
                          style={getThumbnailImageStyle(manualFailed ? null : thumbnail.crop)}
                        />
                      ) : (
                        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={textMuted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                        </svg>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 p-4 sm:p-5 flex flex-col gap-2">
                      <div className="flex items-start gap-2">
                        {post.tags && (
                          <span className="shrink-0 mt-[3px]" style={getMutedLabelStyle(isDark)}>{post.tags}</span>
                        )}
                        <h2
                          className="m-0 font-extrabold leading-snug line-clamp-2"
                          style={{ fontSize: "clamp(16px, 2vw, 19px)", color: textMain }}
                        >
                          {post.title}
                        </h2>
                      </div>
                      {excerpt && (
                        <p
                          className="m-0 text-[14px] leading-relaxed line-clamp-2"
                          style={{ color: textMuted }}
                        >
                          {excerpt}
                        </p>
                      )}
                      <p className="m-0 text-[12px] font-medium mt-auto pt-1" style={{ color: textMuted }}>
                        {new Date(post.created_at).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
            <AppPagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} className="mt-10" />
          </>
        )}
      </div>
    </PageShell>
  );
}
