import { useState, useEffect } from "react";
import { Link } from "react-router";
import { getSectionTheme, SectionTheme } from "../utils/sectionTheme";
import { supabase } from "../../lib/supabaseClient";
import { fetchPublicPostPreviews } from "../../utils/publicPostPreviews";
import { cleanText } from "../../utils/text";
import type { Post } from "../../lib/types";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import { Button } from "./ui/button";
import {
  getHomeSectionCtaPillClass,
  HOME_CARD_RADIUS,
  HOME_SECTION_BODY_STYLE,
  HOME_SECTION_HEADER_GAP,
  HOME_SECTION_MAX_WIDTH,
  HOME_SECTION_PADDING,
  HOME_SECTION_TITLE_STYLE,
} from "./homeSectionStyles";

interface CommunitySectionProps { isDark?: boolean; }

const CAT_MAP: Record<string, { label: string; color: string }> = {
  notice:           { label: "공지사항", color: "#EA4335" },
  news:             { label: "뉴스",     color: "#4377F1" },
  events:           { label: "행사소식", color: "#18A343" },
  "events-archive": { label: "행사소식", color: "#18A343" },
  resources:        { label: "자료실",   color: "#4377F1" },
  faq:              { label: "FAQ",      color: "#FBBC05" },
};

const TABS = [
  { id: "all",       label: "전체",    path: "" },
  { id: "notice",    label: "공지사항", path: "/notice" },
  { id: "news",      label: "뉴스",    path: "/news" },
  { id: "events-archive", label: "행사소식", path: "/events/archive" },
  { id: "resources", label: "자료실",  path: "/resources" },
];

const POSTS_PER_PAGE = 8;
const POSTS_PER_TAB = 24;
const TAB_ACCENT: Record<string, "blue" | "green" | "red" | "purple"> = {
  notice: "red",
  news: "blue",
  "events-archive": "green",
  resources: "blue",
};

export function CommunitySection({ isDark = false }: CommunitySectionProps) {
  const th = getSectionTheme();
  const [activeTab, setActiveTab] = useState("all");
  const [displayPosts, setDisplayPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageDirection, setPageDirection] = useState<1 | -1>(1);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const fetchTabPosts = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        let query = supabase
          .from("posts")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(POSTS_PER_TAB);

        if (activeTab !== "all") {
          query = query.eq("category", activeTab);
        }

        const { data } = await query;
        setDisplayPosts((data as Post[]) || []);
        setPageDirection(1);
        setPage(0);
        setLoading(false);
        return;
      }

      if (activeTab === "all" || activeTab === "notice") {
        const { data } = await fetchPublicPostPreviews(
          activeTab === "all" ? null : activeTab,
          POSTS_PER_TAB,
        );
        setDisplayPosts((data as Post[]) || []);
        setPageDirection(1);
        setPage(0);
        setLoading(false);
        return;
      }

      const { data } = await fetchPublicPostPreviews(activeTab, POSTS_PER_TAB);
      setDisplayPosts((data as Post[]) || []);
      setPageDirection(1);
      setPage(0);
      setLoading(false);
    };

    fetchTabPosts();
  }, [activeTab]);

  const currentTabInfo = TABS.find((t) => t.id === activeTab);
  const totalPages = Math.max(1, Math.ceil(displayPosts.length / POSTS_PER_PAGE));
  const currentPage = Math.min(page, totalPages - 1);
  const visiblePosts = displayPosts.slice(
    currentPage * POSTS_PER_PAGE,
    currentPage * POSTS_PER_PAGE + POSTS_PER_PAGE,
  );
  const pageAnimationClass = loading || prefersReducedMotion
    ? ""
    : pageDirection > 0
      ? "community-grid-enter-forward"
      : "community-grid-enter-backward";

  return (
    <section id="community-section" style={{
      position: "relative", width: "100vw", maxWidth: "100%",
      left: "50%", transform: "translateX(-50%)",
      padding: HOME_SECTION_PADDING,
      background: th.sectionBg,
      fontFamily: "'Pretendard', -apple-system, sans-serif",
      boxSizing: "border-box", overflow: "hidden",
      transition: "background 0.4s ease",
    }}>
      <div style={{ position: "relative", zIndex: 1, maxWidth: HOME_SECTION_MAX_WIDTH, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: HOME_SECTION_HEADER_GAP, flexWrap: "wrap", gap: "16px" }}>
          <div>
            <h2 style={{ ...HOME_SECTION_TITLE_STYLE, color: th.headingColor }}>
              최신 게시물
            </h2>
            <p style={{ ...HOME_SECTION_BODY_STYLE, color: th.subText }}>
              통합 게시판에서 업데이트되는 모든 최신 소식을 확인하세요.
            </p>
          </div>

          {activeTab !== "all" && currentTabInfo?.path && (
            <Button
              variant="outline"
              shape="pill"
              size="sm"
              asChild
              className={getHomeSectionCtaPillClass(isDark, TAB_ACCENT[activeTab])}
            >
              <Link to={currentTabInfo.path}>
                {currentTabInfo.label} 전체보기
              </Link>
            </Button>
          )}
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "24px" }}>
          {TABS.map((tab) => {
            const active = tab.id === activeTab;
            return (
              <Button
                key={tab.id}
                variant="outline"
                shape="pill"
                size="sm"
                onClick={() => setActiveTab(tab.id)}
                aria-pressed={active}
                className={active 
                  ? (isDark ? "border-white/25 bg-white/10 text-white hover:bg-white/10" : "border-transparent bg-slate-900 text-white hover:bg-slate-800")
                  : (isDark ? "border-white/20 text-white/70 hover:bg-white/5" : "border-black/10 text-black/60 hover:bg-black/5")
                }
              >
                {tab.label}
              </Button>
            );
          })}
        </div>

        <div style={{ position: "relative" }}>
          {currentPage > 0 && !loading && displayPosts.length > POSTS_PER_PAGE && (
            <button
              type="button"
              aria-label="이전 게시물 보기"
              onClick={() => {
                setPageDirection(-1);
                setPage((p) => Math.max(0, p - 1));
              }}
              className="community-nav community-nav-prev"
              style={{
                color: th.headingColor,
              }}
            >
              &lt;
            </button>
          )}
          {currentPage < totalPages - 1 && !loading && displayPosts.length > POSTS_PER_PAGE && (
            <button
              type="button"
              aria-label="다음 게시물 보기"
              onClick={() => {
                setPageDirection(1);
                setPage((p) => Math.min(totalPages - 1, p + 1));
              }}
              className="community-nav community-nav-next"
              style={{
                color: th.headingColor,
              }}
            >
              &gt;
            </button>
          )}

          <div className="community-grid-viewport">
            <div
              key={loading ? `community-loading-${activeTab}` : `community-page-${activeTab}-${currentPage}`}
              className={`community-grid ${pageAnimationClass}`}
            >
            {loading ? (
              <div style={{ gridColumn: "1 / -1", padding: "60px 0", textAlign: "center", color: th.mutedText }}>
                데이터를 불러오는 중입니다...
              </div>
            ) : visiblePosts.map((post) => (
              <CommunityCard key={post.id} post={post} th={th} />
            ))}
            {!loading && displayPosts.length === 0 && (
              <div style={{ gridColumn: "1 / -1", padding: "60px 20px", textAlign: "center", color: th.mutedText, fontSize: "14px" }}>
                해당 카테고리에 등록된 게시물이 없습니다.
              </div>
            )}
            </div>
          </div>
        </div>
        <style>{`
          .community-grid-viewport {
            overflow: hidden;
          }
          .community-grid {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 18px;
          }
          .community-grid-enter-forward {
            animation: communityGridEnterForward 0.16s cubic-bezier(0.22, 1, 0.36, 1);
          }
          .community-grid-enter-backward {
            animation: communityGridEnterBackward 0.16s cubic-bezier(0.22, 1, 0.36, 1);
          }
          .community-nav {
            position: absolute;
            top: 50%;
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
          .community-nav-prev { left: -52px; }
          .community-nav-next { right: -52px; }
          .community-card:focus-visible {
            outline: 2px solid rgba(67,119,241,0.5) !important;
            outline-offset: 2px !important;
            transform: translateY(-2px) !important;
          }
          @keyframes communityGridEnterForward {
            from {
              opacity: 0.82;
              transform: translate3d(12px, 0, 0);
            }
            to {
              opacity: 1;
              transform: translate3d(0, 0, 0);
            }
          }
          @keyframes communityGridEnterBackward {
            from {
              opacity: 0.82;
              transform: translate3d(-12px, 0, 0);
            }
            to {
              opacity: 1;
              transform: translate3d(0, 0, 0);
            }
          }
          @media (max-width: 1180px) {
            .community-nav-prev { left: 8px; }
            .community-nav-next { right: 8px; }
          }
          @media (max-width: 900px) {
            .community-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          }
          @media (max-width: 560px) {
            .community-grid { grid-template-columns: 1fr; }
            .community-nav {
              width: 44px;
              height: 56px;
              font-size: 20px;
            }
          }
          @media (prefers-reduced-motion: reduce) {
            .community-grid-enter-forward,
            .community-grid-enter-backward {
              animation: none !important;
            }
          }
        `}</style>
      </div>
    </section>
  );
}

function CommunityCard({ post, th }: { post: Post; th: SectionTheme }) {
  const meta = CAT_MAP[post.category] ?? CAT_MAP.notice;
  const plainText = cleanText(post.content);

  return (
    <Link
      to={`/post/${post.id}`}
      className="community-card"
      style={{
        background: th.cardBg,
        border: `1px solid ${th.cardBorder}`,
        borderRadius: HOME_CARD_RADIUS,
        padding: "22px 24px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        minHeight: "206px",
        cursor: "pointer",
        textDecoration: "none",
        outline: "1px solid transparent",
        outlineOffset: "-1px",
        transition: "transform 0.2s ease, outline-color 0.2s ease, background 0.2s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.outlineColor = `${meta.color}55`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.outlineColor = "transparent";
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "11px", fontWeight: 800, color: th.mutedText, letterSpacing: "0.02em" }}>
          {meta.label}
        </span>
      </div>

      <div style={{ flex: 1 }}>
        <h4 style={{ color: th.itemTitle, fontSize: "15px", fontWeight: 800, margin: "0 0 8px", lineHeight: 1.45, letterSpacing: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {post.title}
        </h4>
        <p style={{ color: th.itemDesc, fontSize: "13px", margin: 0, lineHeight: 1.65, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {plainText || "이미지 또는 첨부파일이 포함된 게시물입니다."}
        </p>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "12px", borderTop: `1px solid ${th.rowDivider}` }}>
        <div style={{ color: th.mutedText, fontSize: "12px", fontWeight: 500 }}>
          {new Date(post.created_at).toLocaleDateString()}
        </div>
        <span style={{ display: "flex", alignItems: "center", gap: "4px", color: th.mutedText, fontSize: "12px", fontWeight: 500 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
          {post.views || 0}
        </span>
      </div>
    </Link>
  );
}
