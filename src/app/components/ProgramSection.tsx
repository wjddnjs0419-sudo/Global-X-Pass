// ─── 지원 프로그램 섹션 (Global X Pass 4가지 프로그램) ──────────────
import { Link } from "react-router";
import { getSectionTheme } from "../utils/sectionTheme";
import {
  HOME_CARD_RADIUS,
  HOME_SECTION_BODY_STYLE,
  HOME_SECTION_HEADER_GAP,
  HOME_SECTION_MAX_WIDTH,
  HOME_SECTION_PADDING,
  HOME_SECTION_TITLE_STYLE,
} from "./homeSectionStyles";

interface ProgramSectionProps { isDark?: boolean; }

const programs: {
  badge: string; badgeColor: string; gradient: string;
  icon: React.ReactNode; title: string; desc: string; tags: string[]; path?: string;
}[] = [
  {
    badge: "PLATFORM",
    badgeColor: "#4377F1",
    gradient: "linear-gradient(135deg, #4377F1 0%, #16DBBB 100%)",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="3"/><path d="M9 3v18M3 9h6M3 15h6M15 3v18M15 9h6M15 15h6"/>
      </svg>
    ),
    title: "Global X Pass 플랫폼",
    desc: "글로벌 진출에 필요한 모든 도구를 하나의 플랫폼에서. Google Play 콘솔 연동, 현지화 리소스, 스토어 최적화(ASO) 가이드를 원스톱으로 제공합니다.",
    tags: ["Google Play 연동", "ASO 최적화", "현지화 지원"],
  },
  {
    badge: "CONSULTING",
    badgeColor: "#18A343",
    gradient: "linear-gradient(135deg, #18A343 0%, #37AD9A 100%)",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    title: "1:1 전문가 컨설팅",
    desc: "Google 현직 전문가와 1:1로 연결되는 개인 맞춤 컨설팅. 제품 전략부터 해외 론칭 계획까지, 기업 상황에 맞는 실질적 조언을 제공합니다.",
    tags: ["Google 전문가 매칭", "월 2회 세션", "전략 리포트"],
    path: "/consulting",
  },
  {
    badge: "COMMUNITY",
    badgeColor: "#A855F7",
    gradient: "linear-gradient(135deg, #A855F7 0%, #C084FC 100%)",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M22 12h-4M20 10l2 2-2 2"/>
      </svg>
    ),
    title: "Founder's Club",
    desc: "창구 프로그램 수료 스타트업 CEO들의 폐쇄형 네트워크. 분기별 오프라인 밋업, 공동 IR 피칭, 크로스 파트너십 기회를 제공합니다.",
    tags: ["폐쇄형 CEO 네트워크", "분기 오프라인 밋업", "공동 IR"],
    path: "/founders-club",
  },
  {
    badge: "INSIGHT",
    badgeColor: "#FF4340",
    gradient: "linear-gradient(135deg, #FF4340 0%, #FF7C44 100%)",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
      </svg>
    ),
    title: "Market & Tech Insight",
    desc: "매주 발행되는 글로벌 앱·게임 시장 인사이트 팟캐스트와 VOD. 동남아, 북미, 유럽 시장 트렌드 분석과 성공 사례를 심층 제공합니다.",
    tags: ["주간 팟캐스트", "VOD 아카이브", "시장 분석 리포트"],
  },
];

export function ProgramSection({ isDark = false }: ProgramSectionProps) {
  const th = getSectionTheme();
  return (
    <section style={{
      position: "relative", width: "100vw", maxWidth: "100%",
      left: "50%", transform: "translateX(-50%)",
      padding: HOME_SECTION_PADDING,
      background: th.sectionBg,
      fontFamily: "'Pretendard', -apple-system, sans-serif",
      boxSizing: "border-box", overflow: "hidden",
      transition: "background 0.4s ease",
    }}>
      <div style={{ position: "relative", zIndex: 1, maxWidth: HOME_SECTION_MAX_WIDTH, margin: "0 auto" }}>
        {/* Header */}
        <div className="program-header">
          <h2 style={{ ...HOME_SECTION_TITLE_STYLE, color: th.headingColor }}>
            4가지 핵심 지원 프로그램
          </h2>
          <p style={{ ...HOME_SECTION_BODY_STYLE, color: th.subText }}>
            글로벌 진출에 필요한 플랫폼, 전문가 컨설팅, 커뮤니티, 인사이트를 한 흐름 안에서 제공합니다.
          </p>
        </div>

        {/* Program grid — 4 cols on desktop, 2 on tablet, 1 on mobile */}
        <div className="program-grid">
          {programs.map((p, i) => (
            <ProgramCard key={i} program={p} th={th} />
          ))}
        </div>
        <style>{`
          .program-grid {
            display: grid;
            gap: var(--space-lg);
            grid-template-columns: repeat(4, minmax(0, 1fr));
            align-items: stretch;
          }
          .program-header {
            margin-bottom: ${HOME_SECTION_HEADER_GAP};
          }
          .program-card:focus-visible {
            outline: 2px solid rgba(67,119,241,0.5) !important;
            outline-offset: 2px !important;
            transform: translateY(-2px) !important;
          }
          @media (max-width: 1024px) {
            .program-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          }
          @media (max-width: 560px) {
            .program-grid { grid-template-columns: 1fr; }
            .program-header { margin-bottom: 32px; }
          }
        `}</style>
      </div>
    </section>
  );
}

function ProgramCard({ program: p, th }: { program: typeof programs[0]; th: ReturnType<typeof getSectionTheme> }) {
  const cardStyle: React.CSSProperties = {
    background: th.cardBg,
    border: `1px solid ${th.cardBorder}`,
    borderRadius: HOME_CARD_RADIUS,
    padding: "var(--space-lg)",
    position: "relative",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    gap: "18px",
    height: "100%",
    minHeight: "360px",
    outline: "1px solid transparent",
    outlineOffset: "-1px",
    transition: "transform 0.2s ease, outline-color 0.2s ease, background 0.2s ease",
    cursor: p.path ? "pointer" : "default",
    textDecoration: "none",
  };

  const cardContent = (
    <>
      {/* Icon + badge */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div style={{
          width: "48px", height: "48px", borderRadius: "14px",
          background: p.gradient,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff",
          flexShrink: 0,
        }}>
          {p.icon}
        </div>
        <span style={{
          fontSize: "10px", fontWeight: 800, letterSpacing: "0.08em",
          color: th.mutedText,
          background: "transparent",
          border: `1px solid ${th.rowDivider}`,
          padding: "var(--space-2xs) 9px", borderRadius: "6px",
        }}>{p.badge}</span>
      </div>

      {/* Title & desc */}
      <div style={{ flex: 1 }}>
        <h3 style={{ color: th.itemTitle, fontSize: "var(--text-body-lg)", fontWeight: 800, margin: "0 0 10px", letterSpacing: 0, lineHeight: 1.35 }}>
          {p.title}
        </h3>
        <p style={{ color: th.itemDesc, fontSize: "13px", margin: 0, lineHeight: 1.75 }}>
          {p.desc}
        </p>
      </div>

      {/* Tags */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "6px",
          minHeight: "58px",
          alignItems: "flex-start",
          alignContent: "flex-start",
        }}
      >
        {p.tags.map((tag) => (
          <span
            key={tag}
            style={{
              display: "inline-flex",
              alignItems: "center",
              alignSelf: "flex-start",
              fontSize: "11px",
              fontWeight: 600,
              lineHeight: 1.35,
              color: th.mutedText,
              background: th.cardBg,
              border: `1px solid ${th.rowDivider}`,
              padding: "var(--space-2xs) 9px",
              borderRadius: "7px",
            }}
          >
            {tag}
          </span>
        ))}
      </div>

      <div style={{
        borderTop: `1px solid ${th.rowDivider}`,
        paddingTop: "14px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "var(--space-sm)",
        color: p.path ? th.itemTitle : th.mutedText,
        fontSize: "13px",
        fontWeight: 800,
      }}>
        <span>{p.path ? "자세히 보기" : "안내 준비중"}</span>
        <span aria-hidden="true" style={{ fontSize: "16px", lineHeight: 1 }}>
          {p.path ? "→" : "-"}
        </span>
      </div>
    </>
  );

  if (p.path) {
    return (
      <Link
        to={p.path}
        className="program-card"
        style={cardStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.outlineColor = `${p.badgeColor}55`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.outlineColor = "transparent";
        }}
      >
        {cardContent}
      </Link>
    );
  }

  return (
    <div className="program-card" style={cardStyle}>
      {cardContent}
    </div>
  );
}
