import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { supabase } from "../../lib/supabaseClient";
import type { Post } from "../../lib/types";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import {
  getMediaCategoryAspectRatio,
  isPortraitMediaCategory,
  isWideMediaCategory,
} from "../constants/mediaCategories";
import { getMediaPostThumbnailUrl } from "../../utils/mediaPost";
import { getSectionTheme } from "../utils/sectionTheme";
import {
  HOME_SECTION_BODY_STYLE,
  HOME_SECTION_HEADER_GAP,
  HOME_SECTION_MAX_WIDTH,
  HOME_SECTION_PADDING,
  HOME_SECTION_TITLE_STYLE_COMPACT,
} from "./homeSectionStyles";

interface MediaSectionProps {
  isDark?: boolean;
}

const DISPLAY_LIMIT = 16;
const MEDIA_SHOWCASE_MAX_WIDTH = {
  desktop: 990,
  tablet: 750,
  mobile: 510,
} as const;

const MEDIA_SHOWCASE_GAP = {
  desktop: 66,
  mobile: 51,
} as const;

type MediaPost = Post;

export function MediaSection({ isDark = false }: MediaSectionProps) {
  const th = getSectionTheme(isDark);
  const [posts, setPosts] = useState<MediaPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(4);
  const [showMoreLink, setShowMoreLink] = useState(false);
  const [pageDirection, setPageDirection] = useState<1 | -1>(1);
  const prefersReducedMotion = usePrefersReducedMotion();

  const textMuted = isDark ? "rgba(255,255,255,0.52)" : "rgba(15,23,42,0.54)";
  const subtleText = isDark ? "rgba(255,255,255,0.36)" : "rgba(15,23,42,0.42)";
  const placeholderBg = isDark ? "rgba(255,255,255,0.05)" : "#EEF2F7";

  useEffect(() => {
    let cancelled = false;

    const fetchMediaPosts = async () => {
      setLoading(true);
      setError(false);

      const { data, error: fetchError } = await supabase
        .from("posts")
        .select("*")
        .eq("category", "media")
        .order("created_at", { ascending: false })
        .limit(16);

      if (cancelled) return;

      if (fetchError) {
        setError(true);
        setPosts([]);
      } else {
        setPosts((data as MediaPost[]) || []);
      }

      setLoading(false);
    };

    fetchMediaPosts();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const updateItemsPerPage = () => {
      const width = window.innerWidth;
      setItemsPerPage(width < 700 ? 2 : width < 980 ? 3 : 4);
    };

    updateItemsPerPage();
    window.addEventListener("resize", updateItemsPerPage);
    return () => window.removeEventListener("resize", updateItemsPerPage);
  }, []);

  const displayPosts = useMemo(() => {
    const portraitPosts = posts.filter((post) => isPortraitMediaCategory(post.tags));
    const widePosts = posts.filter((post) => isWideMediaCategory(post.tags));
    const orderedPosts = portraitPosts.length >= 4 ? portraitPosts : [...portraitPosts, ...widePosts];
    return orderedPosts.slice(0, DISPLAY_LIMIT);
  }, [posts]);
  const totalPages = Math.max(1, Math.ceil(displayPosts.length / itemsPerPage));
  const pagePosts = displayPosts.slice(currentPage * itemsPerPage, currentPage * itemsPerPage + itemsPerPage);
  const showcaseMaxWidth =
    itemsPerPage === 4
      ? MEDIA_SHOWCASE_MAX_WIDTH.desktop
      : itemsPerPage === 3
        ? MEDIA_SHOWCASE_MAX_WIDTH.tablet
        : MEDIA_SHOWCASE_MAX_WIDTH.mobile;
  const showcaseGap =
    itemsPerPage === 2 ? MEDIA_SHOWCASE_GAP.mobile : MEDIA_SHOWCASE_GAP.desktop;
  const showcaseCardWidth =
    (showcaseMaxWidth - showcaseGap * (itemsPerPage - 1)) / itemsPerPage;
  const showcaseContentWidth =
    showcaseCardWidth * pagePosts.length + showcaseGap * Math.max(0, pagePosts.length - 1);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages - 1));
    setShowMoreLink(false);
  }, [totalPages]);

  const goToPrevPage = () => {
    setShowMoreLink(false);
    setPageDirection(-1);
    setCurrentPage((page) => Math.max(0, page - 1));
  };

  const goToNextPage = () => {
    if (currentPage < totalPages - 1) {
      setShowMoreLink(false);
      setPageDirection(1);
      setCurrentPage((page) => Math.min(totalPages - 1, page + 1));
      return;
    }
    setShowMoreLink(true);
  };

  const showcaseAnimationClass = prefersReducedMotion
    ? ""
    : pageDirection > 0
      ? "media-showcase-grid-enter-forward"
      : "media-showcase-grid-enter-backward";

  return (
    <section
      style={{
        position: "relative",
        width: "100vw",
        maxWidth: "100%",
        left: "50%",
        transform: "translateX(-50%)",
        padding: HOME_SECTION_PADDING,
        background: th.sectionBg,
        fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      <div style={{ maxWidth: HOME_SECTION_MAX_WIDTH, margin: "0 auto" }}>
        <div
          style={{
            maxWidth: 560,
            margin: `0 auto ${HOME_SECTION_HEADER_GAP}`,
            textAlign: "center",
          }}
        >
          <h2
            style={{
              color: th.headingColor,
              ...HOME_SECTION_TITLE_STYLE_COMPACT,
            }}
          >
            미디어
          </h2>
          <p
            className="media-showcase-description"
            style={{
              ...HOME_SECTION_BODY_STYLE,
              color: textMuted,
              margin: "14px auto 0",
              whiteSpace: "nowrap",
            }}
          >
            Global X Pass에서 발간한 리포트와 인사이트를 확인하세요
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 min-[640px]:grid-cols-3 min-[980px]:grid-cols-4 gap-x-[60px] gap-y-10 max-w-[990px] mx-auto">
            {Array.from({ length: itemsPerPage }).map((_, index) => (
              <div key={index} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div
                  style={{
                    aspectRatio: "540 / 675",
                    borderRadius: 8,
                    background: placeholderBg,
                    border: `1px solid ${th.cardBorder}`,
                  }}
                />
                <div style={{ height: 16, width: "80%", alignSelf: "center", borderRadius: 999, background: placeholderBg }} />
              </div>
            ))}
          </div>
        ) : error ? (
          <SectionNotice
            isDark={isDark}
            title="미디어 콘텐츠를 불러오지 못했습니다."
            description="잠시 후 다시 시도해주세요."
          />
        ) : displayPosts.length === 0 ? (
          <SectionNotice
            isDark={isDark}
            title="등록된 미디어 콘텐츠가 없습니다."
            description="관리자에서 미디어 게시물을 등록하면 이곳에 최신 콘텐츠가 표시됩니다."
          />
        ) : (
          <>
            <div
              className="media-showcase-wrap"
              style={{ width: `min(100%, ${showcaseContentWidth}px)` }}
            >
              {currentPage > 0 && (
                <button
                  type="button"
                  aria-label="이전 미디어 보기"
                  onClick={goToPrevPage}
                  className="media-showcase-nav media-showcase-nav-prev"
                  style={{ color: th.headingColor }}
                >
                  &lt;
                </button>
              )}

              <div className="media-showcase-viewport">
                <div
                  key={`media-page-${currentPage}-${itemsPerPage}`}
                  className={`media-showcase-grid ${showcaseAnimationClass}`}
                >
                  {pagePosts.map((post) => (
                    <MediaContentCard
                      key={post.id}
                      post={post}
                      isDark={isDark}
                      placeholderBg={placeholderBg}
                      subtleText={subtleText}
                      titleColor={th.itemTitle}
                    />
                  ))}
                </div>
              </div>

              <button
                type="button"
                aria-label={currentPage < totalPages - 1 ? "다음 미디어 보기" : "미디어 전체보기 표시"}
                onClick={goToNextPage}
                className="media-showcase-nav media-showcase-nav-next"
                style={{ color: th.headingColor }}
              >
                &gt;
              </button>

              {showMoreLink && (
                <Link
                  to="/media"
                  className="media-showcase-more"
                  style={{ color: isDark ? "rgba(255,255,255,0.74)" : "rgba(15,23,42,0.58)" }}
                >
                  자세히 보기
                </Link>
              )}
            </div>

            <style>{`
              .media-showcase-wrap {
                position: relative;
                margin: 0 auto;
              }
              .media-showcase-viewport {
                overflow: hidden;
              }
              .media-showcase-grid {
                display: grid;
                grid-template-columns: repeat(${pagePosts.length}, minmax(0, 1fr));
                gap: 66px;
              }
              .media-showcase-grid-enter-forward {
                animation: mediaShowcaseEnterForward 0.2s cubic-bezier(0.22, 1, 0.36, 1);
              }
              .media-showcase-grid-enter-backward {
                animation: mediaShowcaseEnterBackward 0.2s cubic-bezier(0.22, 1, 0.36, 1);
              }
              .media-showcase-nav {
                position: absolute;
                top: 42%;
                z-index: 2;
                width: 36px;
                height: 72px;
                transform: translateY(-50%);
                border: none;
                background: transparent;
                font-size: 24px;
                font-weight: 700;
                line-height: 1;
                cursor: pointer;
                padding: 0;
              }
              .media-showcase-nav-prev { left: -52px; }
              .media-showcase-nav-next { right: -52px; }
              .media-showcase-more {
                position: absolute;
                top: 42%;
                left: calc(100% + 58px);
                transform: translateY(-50%);
                font-size: 13px;
                font-weight: 750;
                line-height: 1;
                text-decoration: none;
                white-space: nowrap;
              }
              .media-content-card:focus-visible {
                outline: 2px solid rgba(32,214,162,0.5) !important;
                outline-offset: 2px !important;
                transform: translateY(-2px) !important;
              }
              @keyframes mediaShowcaseEnterForward {
                from {
                  opacity: 0.76;
                  transform: translate3d(18px, 0, 0);
                }
                to {
                  opacity: 1;
                  transform: translate3d(0, 0, 0);
                }
              }
              @keyframes mediaShowcaseEnterBackward {
                from {
                  opacity: 0.76;
                  transform: translate3d(-18px, 0, 0);
                }
                to {
                  opacity: 1;
                  transform: translate3d(0, 0, 0);
                }
              }
              @media (max-width: 980px) {
                .media-showcase-grid { gap: 66px; }
              }
	              @media (max-width: 700px) {
	                .media-showcase-description {
	                  white-space: normal !important;
	                }
	                .media-showcase-grid {
	                  gap: 51px;
	                }
	                .media-showcase-nav {
	                  width: 44px;
	                  height: 56px;
	                  font-size: 20px;
	                }
                .media-showcase-nav-prev { left: 8px; }
                .media-showcase-nav-next { right: 8px; }
                .media-showcase-more {
                  top: calc(100% + 22px);
                  left: auto;
                  right: 0;
                  transform: none;
                }
              }
              @media (prefers-reduced-motion: reduce) {
                .media-showcase-grid-enter-forward,
                .media-showcase-grid-enter-backward {
                  animation: none !important;
                }
              }
            `}</style>
          </>
        )}
      </div>
    </section>
  );
}

function SectionNotice({
  isDark,
  title,
  description,
}: {
  isDark: boolean;
  title: string;
  description: string;
}) {
  return (
    <div
      style={{
        padding: "54px 20px",
        textAlign: "center",
        borderRadius: 18,
        border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(15,23,42,0.08)"}`,
        background: isDark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.82)",
      }}
    >
      <p style={{ margin: 0, color: "var(--color-text-primary)", fontSize: 15, fontWeight: 850 }}>
        {title}
      </p>
      <p style={{ margin: "8px 0 0", color: "var(--color-text-muted)", fontSize: 13 }}>
        {description}
      </p>
    </div>
  );
}

function MediaContentCard({
  post,
  isDark,
  placeholderBg,
  subtleText,
  titleColor,
}: {
  post: MediaPost;
  isDark: boolean;
  placeholderBg: string;
  subtleText: string;
  titleColor: string;
}) {
  const thumbnailUrl = getMediaPostThumbnailUrl(post);
  const isWide = isWideMediaCategory(post.tags);

  return (
    <Link
      to={`/post/${post.id}`}
      className="media-content-card"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 14,
        cursor: "pointer",
        textDecoration: "none",
        outline: "1px solid transparent",
        outlineOffset: "-1px",
        borderRadius: 12,
        transition: "transform 0.18s ease, outline-color 0.18s ease",
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.transform = "translateY(-2px)";
        event.currentTarget.style.outlineColor = isDark
          ? "rgba(255,255,255,0.18)"
          : "rgba(15,23,42,0.12)";
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.transform = "translateY(0)";
        event.currentTarget.style.outlineColor = "transparent";
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: getMediaCategoryAspectRatio(post.tags),
          borderRadius: 8,
          border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(15,23,42,0.08)"}`,
          background: placeholderBg,
          overflow: "hidden",
        }}
      >
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt=""
            style={{
              display: "block",
              width: "100%",
              height: "100%",
              objectFit: isWide ? "cover" : "contain",
              background: isDark ? "rgba(255,255,255,0.02)" : "#ffffff",
            }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: subtleText,
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 800 }}>MEDIA</span>
          </div>
        )}
      </div>

      <div>
        <h3
          style={{
            margin: 0,
            color: titleColor,
            fontSize: 14,
            fontWeight: 800,
            lineHeight: 1.5,
            letterSpacing: 0,
            textAlign: "center",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {post.title}
        </h3>
      </div>
    </Link>
  );
}
