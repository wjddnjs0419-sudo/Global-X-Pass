import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { PageShell } from "../components/PageShell";
import { useTheme } from "../ThemeContext";
import { supabase } from "../../lib/supabaseClient";
import { LoadingSpinner, ErrorMessage } from "../components/LoadingSpinner";
import type { Post } from "../../lib/types";
import { getFilterTabStyle } from "../components/contentListStyles";
import { getThumbnailImageStyle, resolvePostThumbnail } from "../../utils/postThumbnail";
import {
  getMediaCategoryAspectRatio,
  getMediaCategoryLabel,
  isPortraitMediaCategory,
  isWideMediaCategory,
  resolveMediaCategoryId,
  type MediaCategoryId,
} from "../constants/mediaCategories";
import { useMediaCategories } from "../../hooks/useMediaCategories";

const MAX_ALL_WIDE_ITEMS = 4;

type MediaPost = Post;

export function MediaPage() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [posts, setPosts] = useState<MediaPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeTag, setActiveTag] = useState<"all" | MediaCategoryId>("all");
  const mediaCategories = useMediaCategories();

  useEffect(() => {
    supabase
      .from("posts")
      .select("*")
      .eq("category", "media")
      .order("created_at", { ascending: false })
      .then(({ data, error: err }) => {
        if (err) setError(true);
        else setPosts((data as Post[]) || []);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (location.search) {
      navigate("/media", { replace: true });
    }
  }, [location.search, navigate]);


  const mediaCategoryLabelMap = new Map(mediaCategories.map((category) => [category.id, category.label]));
  const getReactiveMediaCategoryLabel = (value?: string | null) => {
    const id = resolveMediaCategoryId(value);
    return id ? mediaCategoryLabelMap.get(id) || getMediaCategoryLabel(id) : value || "콘텐츠";
  };
  const wideCategoryLabels = mediaCategories
    .filter((category) => isWideMediaCategory(category.id))
    .map((category) => category.label);
  const filteredPosts = activeTag === "all" ? posts : posts.filter((post) => resolveMediaCategoryId(post.tags) === activeTag);
  const portraitPosts = activeTag === "all" ? filteredPosts.filter((post) => isPortraitMediaCategory(post.tags)) : filteredPosts;
  const widePosts = activeTag === "all" ? filteredPosts.filter((post) => isWideMediaCategory(post.tags)).slice(0, MAX_ALL_WIDE_ITEMS) : [];
  const openPost = (post: MediaPost) => {
    navigate(`/post/${post.id}`);
  };

  return (
    <PageShell
      title="미디어"
      subtitle="Global X Pass가 직접 제작한 리포트, 팟캐스트, 영상 콘텐츠를 만나보세요."
      accentColor="var(--color-accent-ncf)"
    >
      <div className="max-w-[1200px] mx-auto pb-[100px]">
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorMessage />
        ) : posts.length === 0 ? (
          <div
            style={{
              padding: "72px 24px",
              textAlign: "center",
              background: "var(--color-surface-card)",
              border: "1px solid var(--color-border-soft)",
              borderRadius: 18,
              color: "var(--color-text-muted)",
            }}
          >
            <p style={{ margin: 0, fontSize: 16, fontWeight: 800, lineHeight: 1.7, color: "var(--color-text-primary)" }}>아직 등록된 미디어 콘텐츠가 없습니다.</p>
            <p style={{ margin: "8px 0 0", fontSize: 13, lineHeight: 1.6 }}>관리자에서 미디어 카테고리 게시물을 등록하면 이곳에 표시됩니다.</p>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 32 }}>
              {["all", ...mediaCategories.map((category) => category.id)].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setActiveTag(tag as "all" | MediaCategoryId)}
                  style={getFilterTabStyle(isDark, activeTag === tag)}
                >
                  {tag === "all" ? "전체" : getReactiveMediaCategoryLabel(tag)}
                </button>
              ))}
            </div>

            {filteredPosts.length === 0 ? (
              <div style={{ padding: "70px 20px", textAlign: "center", color: "var(--color-text-muted)", border: "1px solid var(--color-border-soft)", borderRadius: 18, background: "var(--color-surface-card)" }}>
                선택한 유형의 콘텐츠가 없습니다.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 56 }}>
                <MediaGrid
                  posts={activeTag === "all" ? portraitPosts : filteredPosts}
                  openPost={openPost}
                  getCategoryLabel={getReactiveMediaCategoryLabel}
                />

                {activeTag === "all" && widePosts.length > 0 && (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, marginBottom: 20 }}>
                      <h2 style={{ margin: 0, color: "var(--color-text-primary)", fontSize: 18, fontWeight: 850, letterSpacing: 0 }}>
                        영상형 콘텐츠
                      </h2>
                      <span style={{ color: "var(--color-text-muted)", fontSize: 12, fontWeight: 700 }}>
                        {wideCategoryLabels.join(" · ")}
                      </span>
                    </div>
                    <MediaGrid
                      posts={widePosts}
                      openPost={openPost}
                      getCategoryLabel={getReactiveMediaCategoryLabel}
                    />
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </PageShell>
  );
}

function MediaGrid({
  posts,
  openPost,
  getCategoryLabel,
}: {
  posts: MediaPost[];
  openPost: (post: MediaPost) => void;
  getCategoryLabel: (value?: string | null) => string;
}) {
  return (
    <div className="grid grid-cols-2 min-[720px]:grid-cols-3 lg:grid-cols-4 gap-x-7 gap-y-14">
      {posts.map((post) => {
        const thumbnail = resolvePostThumbnail(post);
        const isPlayable = isWideMediaCategory(post.tags);
        const isPortrait = isPortraitMediaCategory(post.tags);

        return (
          <article
            key={post.id}
            role="button"
            tabIndex={0}
            onClick={() => openPost(post)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openPost(post);
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
                aspectRatio: getMediaCategoryAspectRatio(post.tags),
                background: "var(--color-skeleton-bg)",
                borderRadius: isPortrait ? 8 : 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                boxShadow: "var(--shadow-media-cover)",
              }}
            >
              {thumbnail.url ? (
                <img src={thumbnail.url} alt="" style={getThumbnailImageStyle(thumbnail.crop)} />
              ) : (
                <div style={{ width: "54%", height: "66%", border: "1px solid var(--color-glass-border)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)" }}>
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  </svg>
                </div>
              )}
              {isPlayable && (
                <span style={{ position: "absolute", left: 12, top: 12, display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 8px", borderRadius: 6, background: "var(--color-scrim)", color: "var(--color-text-primary)", fontSize: 11, fontWeight: 800 }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
                  {getCategoryLabel(post.tags)}
                </span>
              )}
            </div>

            <h2 style={{ margin: 0, color: "var(--color-text-primary)", fontSize: 15, fontWeight: 750, lineHeight: 1.55, letterSpacing: 0, textAlign: "center", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
              {post.title}
            </h2>
          </article>
        );
      })}
    </div>
  );
}
