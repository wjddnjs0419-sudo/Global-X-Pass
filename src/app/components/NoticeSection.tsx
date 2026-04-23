// ─── 공지사항 섹션 ───────────────────────────────────────────────
import { Link } from "react-router";
import { getSectionTheme } from "../utils/sectionTheme";

interface NoticeSectionProps { isDark?: boolean; }

const notices = [
  {
    id: 1,
    isPinned: true,
    category: "필독",
    categoryColor: "#EA4335",
    date: "2026.04.18",
    title: "[8기 모집] 2026 글로벌기업협업프로그램 참가 기업 모집 공고",
    excerpt: "넥스트챌린지 × 구글플레이 × 중소벤처기업부가 공동 운영하는 2026년 8기 창구 프로그램 참가 스타트업을 모집합니다. 서류 접수 기간 및 지원 자격을 반드시 확인하세요.",
    views: 1842,
  },
  {
    id: 2,
    isPinned: true,
    category: "필독",
    categoryColor: "#EA4335",
    date: "2026.04.10",
    title: "[사전 설명회] 8기 온라인 설명회 일정 및 Zoom 링크 안내",
    excerpt: "5월 8일(금) 오후 2시 진행되는 온라인 사전 설명회 참석 방법과 사전 질문 등록 방법을 안내드립니다.",
    views: 987,
  },
  {
    id: 3,
    isPinned: false,
    category: "공지",
    categoryColor: "#4285F4",
    date: "2026.03.28",
    title: "8기 지원 자격 및 평가 기준 업데이트 안내",
    excerpt: "2026년부터 글로벌 매출 비중 및 앱 활성 사용자 수 기준이 일부 변경되었습니다. 지원 전 반드시 확인 바랍니다.",
    views: 654,
  },
  {
    id: 4,
    isPinned: false,
    category: "결과",
    categoryColor: "#34A853",
    date: "2026.03.15",
    title: "7기 수료식 성료 — 참여 기업 성과 보고서 공유",
    excerpt: "2025년 7기 창구 프로그램 수료 기업 22개사의 글로벌 성과 요약 리포트를 자료실에 업로드하였습니다.",
    views: 1231,
  },
  {
    id: 5,
    isPinned: false,
    category: "공지",
    categoryColor: "#4285F4",
    date: "2026.02.20",
    title: "창구 포털 시스템 개편 및 로그인 방식 변경 안내",
    excerpt: "2026년 3월 1일부터 Google 계정 SSO 방식으로 로그인 방법이 통합됩니다. 기존 계정 마이그레이션 방법을 확인하세요.",
    views: 789,
  },
];

export function NoticeSection({ isDark = false }: NoticeSectionProps) {
  const th = getSectionTheme(isDark);

  return (
    <section style={{
      position: "relative", width: "100vw", maxWidth: "100%",
      left: "50%", transform: "translateX(-50%)",
      padding: "clamp(60px, 10vw, 100px) clamp(20px, 5vw, 40px) clamp(70px, 11vw, 110px)",
      background: isDark
        ? "linear-gradient(180deg, #0a1020 0%, #070d1a 100%)"
        : "linear-gradient(180deg, #ffffff 0%, #F7F8FC 100%)",
      fontFamily: "'Pretendard', -apple-system, sans-serif",
      boxSizing: "border-box", overflow: "hidden",
      transition: "background 0.4s ease",
    }}>
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: `radial-gradient(${th.dotGrid} 1px, transparent 1px)`,
        backgroundSize: "36px 36px",
      }} />
      <style>{`
        @media (max-width: 640px) {
          .notice-meta { display: none !important; }
        }
      `}</style>
      {/* Blue ambient */}
      <div style={{
        position: "absolute", top: "-60px", right: "10%", width: "400px", height: "400px",
        borderRadius: "50%", pointerEvents: "none", zIndex: 0,
        background: `radial-gradient(circle, rgba(66,133,244,${isDark ? "0.07" : "0.05"}) 0%, transparent 70%)`,
      }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: "1280px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "40px", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <h2 style={{ color: th.headingColor, fontSize: "clamp(24px,3vw,40px)", fontWeight: 800, margin: 0, letterSpacing: "-1.2px", lineHeight: 1.15 }}>
              공지사항
            </h2>
          </div>
          <Link to="/notice" style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            color: "#4285F4", fontSize: "13px", fontWeight: 700,
            textDecoration: "none",
            padding: "8px 16px",
            background: "rgba(66,133,244,0.08)",
            border: "1px solid rgba(66,133,244,0.2)",
            borderRadius: "100px",
          }}>
            전체보기
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
        </div>

        {/* Notice list */}
        <div style={{
          background: th.cardBg,
          border: `1px solid ${th.cardBorder}`,
          borderRadius: "20px",
          boxShadow: th.cardShadow,
          overflow: "hidden",
        }}>
          {notices.map((notice, i) => (
            <NoticeRow key={notice.id} notice={notice} isDark={isDark} th={th} isLast={i === notices.length - 1} />
          ))}
        </div>
      </div>
    </section>
  );
}

function NoticeRow({ notice, isDark, th, isLast }: {
  notice: typeof notices[0];
  isDark: boolean;
  th: ReturnType<typeof getSectionTheme>;
  isLast: boolean;
}) {
  return (
    <div
      className="notice-row"
      style={{
        display: "flex", alignItems: "flex-start", gap: "12px",
        padding: "20px clamp(16px, 4vw, 28px)",
        borderBottom: isLast ? "none" : `1px solid ${th.rowDivider}`,
        cursor: "pointer",
        transition: "background 0.2s ease",
        background: notice.isPinned ? (isDark ? "rgba(66,133,244,0.04)" : "rgba(66,133,244,0.03)") : "transparent",
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = isDark ? "rgba(255,255,255,0.04)" : "#F8FAFF"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = notice.isPinned ? (isDark ? "rgba(66,133,244,0.04)" : "rgba(66,133,244,0.03)") : "transparent"; }}
    >
      {/* Pin icon for pinned */}
      {notice.isPinned && (
        <div style={{ flexShrink: 0, marginTop: "2px" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill={isDark ? "rgba(234,67,53,0.7)" : "#EA4335"} stroke="none">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        </div>
      )}
      {!notice.isPinned && <div style={{ width: "14px", flexShrink: 0 }} />}

      {/* Category badge */}
      <span style={{
        flexShrink: 0, fontSize: "10px", fontWeight: 800, letterSpacing: "0.5px",
        color: notice.categoryColor,
        background: `${notice.categoryColor}15`,
        border: `1px solid ${notice.categoryColor}35`,
        padding: "3px 8px", borderRadius: "6px", alignSelf: "flex-start", marginTop: "2px",
        whiteSpace: "nowrap",
      }}>{notice.category}</span>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          color: th.itemTitle, fontSize: "15px", fontWeight: 700,
          marginBottom: "6px", lineHeight: 1.4,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {notice.title}
        </div>
        <div style={{ color: th.itemDesc, fontSize: "13px", lineHeight: 1.6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {notice.excerpt}
        </div>
      </div>

      {/* Meta */}
      <div className="notice-meta" style={{ flexShrink: 0, textAlign: "right" }}>
        <div style={{ color: th.mutedText, fontSize: "12px", marginBottom: "4px" }}>{notice.date}</div>
        <div style={{ color: th.mutedText, fontSize: "11px", display: "flex", alignItems: "center", gap: "3px", justifyContent: "flex-end" }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          {notice.views.toLocaleString()}
        </div>
      </div>
    </div>
  );
}
