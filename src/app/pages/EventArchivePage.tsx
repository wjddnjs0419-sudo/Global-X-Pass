import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { supabase } from "../../lib/supabaseClient";
import { PageShell } from "../components/PageShell";
import { BoardAccessGate } from "../components/BoardAccessGate";
import { useBoardCategoryLabel, useBoardCategoryDescription } from "../BoardCategoriesContext";
import { useTheme } from "../ThemeContext";
import { LoadingSpinner, ErrorMessage } from "../components/LoadingSpinner";
import { cleanText } from "../../utils/text";
import { getThumbnailImageStyle, resolvePostThumbnail, getThumbnailCandidates } from "../../utils/postThumbnail";
import { getFilterTabStyle, getMutedLabelStyle } from "../components/contentListStyles";
import { AppPagination } from "../components/AppPagination";
import type { Post } from "../../lib/types";
import { extractFirstYouTubeUrlFromHtml, isVideoArchiveTag, parseMediaMeta } from "../../utils/mediaPost";

const PAGE_SIZE = 12;
const VIDEO_PAGE_SIZE = 4;
const VIDEO_TAG_HINTS = ["영상", "video", "동영상", "vod", "youtube"];

const normalizeTagValue = (value: string) => value.trim().toLowerCase();

const isVideoTagLabel = (value?: string | null) => {
  const normalized = normalizeTagValue(value ?? "");
  return VIDEO_TAG_HINTS.some((hint) => normalized.includes(normalizeTagValue(hint)));
};

const getPostTags = (post: Post) => (post.tags ?? "").split(",").map((tag) => tag.trim()).filter(Boolean);

export function EventArchivePage() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const boardTitle = useBoardCategoryLabel("events-archive", "행사 아카이브");
  const boardSubtitle = useBoardCategoryDescription("events-archive", "NCF와 함께한 지난 행사의 소중한 기록들을 만나보세요.");
  const [videoTagLabel, setVideoTagLabel] = useState("영상");
  const normalizedVideoTagLabel = normalizeTagValue(videoTagLabel);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeTag, setActiveTag] = useState("전체");
  const [activeYear, setActiveYear] = useState("전체");
  const [currentPage, setCurrentPage] = useState(1);
  const [currentVideoPage, setCurrentVideoPage] = useState(1);
  const [failedThumbnails, setFailedThumbnails] = useState<Record<string, true>>({});

  useEffect(() => {
    let mounted = true;

    const refreshVideoTagLabel = async () => {
      const { data } = await supabase
        .from("board_tag_presets")
        .select("tag, is_default, sort_order")
        .eq("board_id", "events-archive")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (!mounted || !data || data.length === 0) return;
      const defaultRows = data.filter((row) => row.is_default);
      const currentLabel = defaultRows[defaultRows.length - 1]?.tag?.trim();
      if (currentLabel) setVideoTagLabel(currentLabel);
    };

    void refreshVideoTagLabel();

    const channel = supabase
      .channel("event-archive-video-tag-label")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "board_tag_presets", filter: "board_id=eq.events-archive" },
        () => { void refreshVideoTagLabel(); }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);


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

      setPosts((data as Post[]) ?? []);
      setError(false);
      setLoading(false);
    };

    void fetchPosts();

    return () => {
      isMounted = false;
    };
  }, []);

  const allTags = posts.flatMap((post) => getPostTags(post));
  const uniqueTags = [...new Set(allTags)];
  const uniqueYears = [...new Set(posts.map((post) => String(new Date(post.created_at).getFullYear())))].sort((a, b) => Number(b) - Number(a));
  const filteredPosts = posts.filter((post) => {
    const tagMatch = activeTag === "전체" || getPostTags(post).includes(activeTag);
    const yearMatch = activeYear === "전체" || String(new Date(post.created_at).getFullYear()) === activeYear;
    return tagMatch && yearMatch;
  });
  const isVideoArchivePost = (post: Post) => {
    const videoMeta = parseMediaMeta(post.content ?? "");
    const youtubeUrl = videoMeta.externalUrl || extractFirstYouTubeUrlFromHtml(post.content ?? "");
    if (!youtubeUrl) return false;
    const tags = getPostTags(post).map(normalizeTagValue);
    return tags.includes(normalizedVideoTagLabel) || tags.some((tag) => isVideoTagLabel(tag)) || isVideoArchiveTag(post.tags);
  };
  const videoPosts = filteredPosts.filter(isVideoArchivePost);
  const mainPosts = filteredPosts.filter((post) => !isVideoArchivePost(post));
  const totalPages = Math.ceil(mainPosts.length / PAGE_SIZE);
  const pagedPosts = mainPosts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const totalVideoPages = Math.ceil(videoPosts.length / VIDEO_PAGE_SIZE);
  const pagedVideoPosts = videoPosts.slice((currentVideoPage - 1) * VIDEO_PAGE_SIZE, currentVideoPage * VIDEO_PAGE_SIZE);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, Math.max(totalPages, 1)));
  }, [totalPages]);

  useEffect(() => {
    setCurrentVideoPage((page) => Math.min(page, Math.max(totalVideoPages, 1)));
  }, [totalVideoPages]);

  const handleTagChange = (tag: string) => { setActiveTag(tag); setCurrentPage(1); setCurrentVideoPage(1); };
  const handleYearChange = (year: string) => { setActiveYear(year); setCurrentPage(1); setCurrentVideoPage(1); };
  const hasVideoSection = videoPosts.length > 0;

  return (
    <BoardAccessGate category="events-archive">
    <PageShell title={boardTitle} subtitle={boardSubtitle} accentColor="var(--color-accent-green)">
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

            {pagedPosts.length === 0 ? (
              <div style={{ padding: "70px 20px", textAlign: "center", color: "var(--color-text-muted)", border: "1px solid var(--color-border-soft)", borderRadius: 18, background: "var(--color-surface-card)" }}>
                선택한 조건의 일반 아카이브가 없습니다.
              </div>
            ) : (
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

                      <div style={{ padding: "16px 18px 20px", flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                            {getPostTags(post).length > 0
                              ? getPostTags(post).map((tag) => (
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
            )}

            {/* Pagination */}
            <AppPagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} className="mt-10" />

            {hasVideoSection && (
              <div style={{ marginTop: 56 }}>
                <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 14, marginBottom: 20, flexWrap: "wrap" }}>
                  <div>
                    <h2 style={{ margin: 0, color: "var(--color-text-primary)", fontSize: 18, fontWeight: 850, letterSpacing: 0 }}>
                      영상형 콘텐츠
                    </h2>
                  </div>
                </div>

                <div className="grid grid-cols-2 min-[720px]:grid-cols-3 lg:grid-cols-4 gap-x-7 gap-y-14">
                  {pagedVideoPosts.map((post) => {
                    const thumbnail = resolvePostThumbnail(post);
                    const hasImage = !!thumbnail.url;

                    return (
                      <article
                        key={post.id}
                        role="button"
                        aria-label={`상세 보기: ${post.title}`}
                        tabIndex={0}
                        onClick={() => navigate(`/post/${post.id}`)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            navigate(`/post/${post.id}`);
                          }
                        }}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "stretch",
                          gap: 16,
                          background: "transparent",
                          border: "none",
                          outline: "none",
                          cursor: "pointer",
                          transition: "transform 0.18s ease",
                        }}
                        onMouseEnter={(event) => {
                          event.currentTarget.style.transform = "translateY(-2px)";
                        }}
                        onMouseLeave={(event) => {
                          event.currentTarget.style.transform = "translateY(0)";
                        }}
                      >
                        <div
                          style={{
                            position: "relative",
                            width: "100%",
                            aspectRatio: "16 / 9",
                            background: "var(--color-skeleton-bg)",
                            borderRadius: 12,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            overflow: "hidden",
                            boxShadow: "var(--shadow-media-cover)",
                          }}
                        >
                          {hasImage ? (
                            <img
                              src={thumbnail.url ?? ""}
                              alt=""
                              style={getThumbnailImageStyle(thumbnail.crop)}
                            />
                          ) : (
                            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="5" width="18" height="14" rx="3" />
                                <path d="M10 9l5 3-5 3V9z" />
                              </svg>
                            </div>
                          )}
                        </div>

                        <h2 style={{ margin: 0, color: "var(--color-text-primary)", fontSize: 15, fontWeight: 750, lineHeight: 1.55, letterSpacing: 0, textAlign: "center", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {post.title}
                        </h2>
                      </article>
                    );
                  })}
                </div>

                <AppPagination currentPage={currentVideoPage} totalPages={totalVideoPages} onPageChange={setCurrentVideoPage} className="mt-10" />
              </div>
            )}
          </>
        )}
      </div>
    </PageShell>
    </BoardAccessGate>
  );
}
