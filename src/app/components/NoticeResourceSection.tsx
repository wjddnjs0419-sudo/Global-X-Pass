import { useEffect, useState } from "react";
import { Link } from "react-router";
import { getSectionTheme } from "../utils/sectionTheme";
import { supabase } from "../../lib/supabaseClient";
import { cleanText } from "../../utils/text";
import type { Post } from "../../lib/types";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";
import {
  getHomeSectionCtaPillClass,
  HOME_CARD_RADIUS,
  HOME_SECTION_HEADER_GAP,
  HOME_SECTION_MAX_WIDTH,
  HOME_SECTION_PADDING,
  HOME_SECTION_TITLE_STYLE_COMPACT,
} from "./homeSectionStyles";

interface NoticeResourceSectionProps { isDark?: boolean; }

const NOTICE_COLOR = "#EA4335";
const RESOURCE_COLOR = "#4377F1";
const SECTION_ACCENT_CLASS = {
  [RESOURCE_COLOR]: "blue",
  [NOTICE_COLOR]: "red",
} as const;

export function NoticeResourceSection({ isDark = false }: NoticeResourceSectionProps) {
  const th = getSectionTheme(isDark);
  const [notices, setNotices] = useState<Post[]>([]);
  const [resources, setResources] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const textMain = isDark ? "rgba(255,255,255,0.92)" : "#0f172a";
  const textMuted = isDark ? "rgba(255,255,255,0.45)" : "rgba(15,23,42,0.45)";
  const skCls = isDark ? "bg-white/[0.07]" : "bg-black/[0.07]";

  useEffect(() => {
    const fetchItems = async () => {
      const [noticeResult, resourceResult] = await Promise.all([
        supabase
          .from("posts")
          .select("*")
          .eq("category", "notice")
          .order("created_at", { ascending: false })
          .limit(4),
        supabase
          .from("posts")
          .select("*")
          .eq("category", "resources")
          .order("created_at", { ascending: false })
          .limit(4),
      ]);

      setNotices((noticeResult.data as Post[]) || []);
      setResources((resourceResult.data as Post[]) || []);
      setLoading(false);
    };

    fetchItems();
  }, []);

  if (!loading && notices.length === 0 && resources.length === 0) return null;

  return (
    <section style={{
      position: "relative",
      width: "100vw",
      maxWidth: "100%",
      left: "50%",
      transform: "translateX(-50%)",
      padding: HOME_SECTION_PADDING,
      background: th.sectionBg,
      fontFamily: "'Pretendard', -apple-system, sans-serif",
      boxSizing: "border-box",
      overflow: "hidden",
      transition: "background 0.4s ease",
    }}>
      <div
        className="grid grid-cols-1 min-[1100px]:grid-cols-[minmax(0,0.9fr)_minmax(0,1.25fr)] gap-8 min-[1100px]:gap-9"
        style={{ position: "relative", zIndex: 1, maxWidth: HOME_SECTION_MAX_WIDTH, margin: "0 auto" }}
      >
        <div className="min-w-0" style={{ display: "flex", flexDirection: "column" }}>
          <SectionHeader
            title="자료실"
            href="/resources"
            actionLabel="전체 자료 보기"
            accentColor={RESOURCE_COLOR}
            isDark={isDark}
            loading={loading}
            skeletonClass={skCls}
          />

          <div className="grid grid-cols-1 min-[560px]:grid-cols-2 gap-3">
            {loading ? (
              [0, 1, 2, 3].map((i) => (
                <div key={i} style={{ minHeight: 154, padding: "16px", background: th.cardBg, border: `1px solid ${th.cardBorder}`, borderRadius: "16px" }}>
                  <div className="flex justify-between items-start mb-4">
                    <Skeleton className={`h-9 w-9 rounded-xl ${skCls}`} />
                    <Skeleton className={`h-4 w-16 ${skCls}`} />
                  </div>
                  <Skeleton className={`h-5 w-4/5 mb-3 ${skCls}`} />
                  <Skeleton className={`h-4 w-full mb-2 ${skCls}`} />
                  <Skeleton className={`h-4 w-2/3 ${skCls}`} />
                </div>
              ))
            ) : (
              resources.map((item) => (
                <ResourceCard
                  key={item.id}
                  item={item}
                  isDark={isDark}
                  textMain={textMain}
                  textMuted={textMuted}
                  cardBg={th.cardBg}
                  cardBorder={th.cardBorder}
                />
              ))
            )}
          </div>
        </div>

        <div className="min-w-0" style={{ display: "flex", flexDirection: "column" }}>
          <SectionHeader
            title="공지사항"
            href="/notice"
            actionLabel="전체 공지 보기"
            accentColor={NOTICE_COLOR}
            isDark={isDark}
            loading={loading}
            skeletonClass={skCls}
          />

          <div style={{ display: "flex", flex: 1, flexDirection: "column", gap: "8px", minWidth: 0 }}>
            {loading ? (
              [0, 1, 2, 3].map((i) => (
                <div key={i} style={{ display: "flex", flex: "1 1 0", alignItems: "center", gap: "12px", minHeight: 74, padding: "13px 16px", background: th.cardBg, border: `1px solid ${th.cardBorder}`, borderRadius: "15px", minWidth: 0 }}>
                  <Skeleton className={`h-9 w-11 shrink-0 ${skCls}`} />
                  <div className="flex-1 min-w-0 space-y-2">
                    <Skeleton className={`h-4 w-5/6 ${skCls}`} />
                    <Skeleton className={`h-3 w-2/3 ${skCls}`} />
                  </div>
                </div>
              ))
            ) : (
              notices.map((notice) => (
                <NoticeRow
                  key={notice.id}
                  notice={notice}
                  isDark={isDark}
                  textMain={textMain}
                  textMuted={textMuted}
                  cardBg={th.cardBg}
                  cardBorder={th.cardBorder}
                />
              ))
            )}
          </div>
        </div>
      </div>
      <style>{`
        .notice-resource-card:focus-visible {
          outline: 2px solid rgba(67,119,241,0.5) !important;
          outline-offset: 2px !important;
          transform: translateY(-2px) !important;
        }
      `}</style>
    </section>
  );
}

function SectionHeader({
  title,
  href,
  actionLabel,
  accentColor,
  isDark,
  loading,
  skeletonClass,
}: {
  title: string;
  href: string;
  actionLabel: string;
  accentColor: keyof typeof SECTION_ACCENT_CLASS;
  isDark: boolean;
  loading: boolean;
  skeletonClass: string;
}) {
  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: HOME_SECTION_HEADER_GAP, gap: "12px", minWidth: 0 }}>
        <Skeleton className={`h-9 w-24 ${skeletonClass}`} />
        <Skeleton className={`h-8 w-28 rounded-full ${skeletonClass}`} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: HOME_SECTION_HEADER_GAP, gap: "12px", flexWrap: "wrap", minWidth: 0 }}>
      <h2 style={{ ...HOME_SECTION_TITLE_STYLE_COMPACT, color: isDark ? "#ffffff" : "#0D1117" }}>
        {title}
      </h2>
      <Button
        variant="outline"
        shape="pill"
        size="sm"
        asChild
        className={getHomeSectionCtaPillClass(isDark, SECTION_ACCENT_CLASS[accentColor])}
      >
        <Link to={href}>
          {actionLabel}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ml-1"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
        </Link>
      </Button>
    </div>
  );
}

function ResourceCard({
  item,
  isDark,
  textMain,
  textMuted,
  cardBg,
  cardBorder,
}: {
  item: Post;
  isDark: boolean;
  textMain: string;
  textMuted: string;
  cardBg: string;
  cardBorder: string;
}) {
  const date = new Date(item.created_at).toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" }).replace(/\. /g, ".").replace(/\.$/, "");

  return (
    <Link
      to={`/post/${item.id}`}
      className="notice-resource-card"
      style={{
        minHeight: 154,
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        padding: "18px",
        background: cardBg,
        border: `1px solid ${cardBorder}`,
        borderRadius: HOME_CARD_RADIUS,
        outline: "1px solid transparent",
        outlineOffset: "-1px",
        cursor: "pointer",
        textDecoration: "none",
        transition: "transform 0.18s ease, outline-color 0.18s ease, background 0.18s ease",
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.transform = "translateY(-2px)";
        event.currentTarget.style.outlineColor = `${RESOURCE_COLOR}55`;
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.transform = "translateY(0)";
        event.currentTarget.style.outlineColor = "transparent";
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px", minWidth: 0 }}>
        <div style={{ width: "34px", height: "34px", borderRadius: "11px", background: isDark ? "rgba(67,119,241,0.16)" : "rgba(67,119,241,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: RESOURCE_COLOR, flexShrink: 0 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
        </div>
        <span style={{ fontSize: "11px", color: textMuted, fontWeight: 700, whiteSpace: "nowrap" }}>{date}</span>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <h3 style={{ margin: "0 0 8px", fontSize: "15px", fontWeight: 800, color: textMain, lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {item.title}
        </h3>
        <p style={{ margin: 0, fontSize: "12px", color: textMuted, lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {cleanText(item.content)}
        </p>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "6px", color: RESOURCE_COLOR, fontSize: "12px", fontWeight: 800, paddingTop: "2px" }}>
        자료 확인
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
      </div>
    </Link>
  );
}

function NoticeRow({
  notice,
  isDark,
  textMain,
  textMuted,
  cardBg,
  cardBorder,
}: {
  notice: Post;
  isDark: boolean;
  textMain: string;
  textMuted: string;
  cardBg: string;
  cardBorder: string;
}) {
  const date = new Date(notice.created_at);
  const day = String(date.getDate()).padStart(2, "0");
  const month = date.toLocaleString("en-US", { month: "short" }).toUpperCase();

  return (
    <Link
      to={`/post/${notice.id}`}
      className="notice-resource-card"
      style={{
        minHeight: 74,
        flex: "1 1 0",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "15px 18px",
        background: cardBg,
        border: `1px solid ${cardBorder}`,
        borderRadius: HOME_CARD_RADIUS,
        minWidth: 0,
        outline: "1px solid transparent",
        outlineOffset: "-1px",
        cursor: "pointer",
        textDecoration: "none",
        transition: "transform 0.18s ease, outline-color 0.18s ease, background 0.18s ease",
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.transform = "translateY(-2px)";
        event.currentTarget.style.outlineColor = `${NOTICE_COLOR}55`;
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.transform = "translateY(0)";
        event.currentTarget.style.outlineColor = "transparent";
      }}
    >
      <div style={{ width: "38px", flexShrink: 0, textAlign: "center" }}>
        <div style={{ fontSize: "15px", fontWeight: 800, color: textMain, lineHeight: 1 }}>{day}</div>
        <div style={{ marginTop: "4px", fontSize: "9.5px", fontWeight: 800, color: textMuted, letterSpacing: "0.04em" }}>{month}</div>
      </div>

      <div style={{ width: "1px", height: "26px", background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)", flexShrink: 0 }} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <h3 style={{ minWidth: 0, margin: "0 0 5px", fontSize: "14px", fontWeight: 800, color: textMain, lineHeight: 1.35, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {notice.title}
        </h3>
        <p style={{ margin: 0, fontSize: "12px", color: textMuted, lineHeight: 1.45, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {cleanText(notice.content)}
        </p>
      </div>

      <div style={{ color: textMuted, flexShrink: 0 }}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
      </div>
    </Link>
  );
}
