// ─── 지원 프로그램 섹션 (Global X Pass 4가지 프로그램) ──────────────
import { useNavigate } from "react-router";
import { getSectionTheme } from "../utils/sectionTheme";

interface ProgramSectionProps { isDark?: boolean; }

const programs: {
  badge: string; badgeColor: string; gradient: string; glowFrom: string;
  icon: React.ReactNode; title: string; desc: string; tags: string[]; path?: string;
}[] = [
  {
    badge: "PLATFORM",
    badgeColor: "#4377F1",
    gradient: "linear-gradient(135deg, #4377F1 0%, #16DBBB 100%)",
    glowFrom: "67,119,241",
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
    glowFrom: "24,163,67",
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
    badgeColor: "#20D6A2",
    gradient: "linear-gradient(135deg, #20D6A2 0%, #BEFFF9 100%)",
    glowFrom: "32,214,162",
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
    glowFrom: "255,67,64",
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
  const navigate = useNavigate();
  const th = getSectionTheme(isDark);
  return (
    <section style={{
      position: "relative", width: "100vw", maxWidth: "100%",
      left: "50%", transform: "translateX(-50%)",
      padding: "clamp(60px, 10vw, 100px) clamp(20px, 5vw, 40px) clamp(70px, 11vw, 110px)",
      background: isDark
        ? "radial-gradient(circle at 80% 20%, rgba(32,214,162,0.05) 0%, transparent 50%), linear-gradient(180deg, #0e1628 0%, #0a1020 100%)"
        : "radial-gradient(circle at 80% 20%, rgba(32,214,162,0.06) 0%, transparent 50%), linear-gradient(180deg, #F0F2F8 0%, #F7F8FC 100%)",
      fontFamily: "'Pretendard', -apple-system, sans-serif",
      boxSizing: "border-box", overflow: "hidden",
      transition: "background 0.4s ease",
    }}>
      {/* dot grid */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: `radial-gradient(${th.dotGrid} 1px, transparent 1px)`,
        backgroundSize: "36px 36px",
      }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: "1280px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "64px" }}>
          <h2 style={{ color: th.headingColor, fontSize: "clamp(26px,3.5vw,44px)", fontWeight: 800, margin: "0 0 14px", letterSpacing: "-1.5px", lineHeight: 1.15 }}>
            4가지 핵심 지원 프로그램
          </h2>
          <p style={{ color: th.subText, fontSize: "16px", margin: 0, lineHeight: 1.7, maxWidth: "520px", marginLeft: "auto", marginRight: "auto" }}>
            글로벌 진출을 위한 체계적인 지원 시스템으로 여러분의 비즈니스 성장을 가속합니다.
          </p>
        </div>

        {/* Program grid — 4 cols on desktop, 2 on tablet, 1 on mobile */}
        <div className="program-grid">
          {programs.map((p, i) => (
            <ProgramCard key={i} program={p} isDark={isDark} th={th} onClick={p.path ? () => navigate(p.path!) : undefined} />
          ))}
        </div>
        <style>{`
          .program-grid {
            display: grid;
            gap: 20px;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            align-items: stretch;
          }
          @media (max-width: 1024px) {
            .program-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          }
          @media (max-width: 560px) {
            .program-grid { grid-template-columns: 1fr; }
          }
        `}</style>
      </div>
    </section>
  );
}

function ProgramCard({ program: p, isDark, th, onClick }: { program: typeof programs[0]; isDark: boolean; th: ReturnType<typeof getSectionTheme>; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: th.cardBg,
        border: `1px solid ${th.cardBorder}`,
        borderRadius: "24px",
        padding: "clamp(20px, 4vw, 32px)",
        boxShadow: th.cardShadow,
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        height: "100%",
        transition: "transform 0.3s ease, box-shadow 0.3s ease",
        cursor: onClick ? "pointer" : "default",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 16px 40px rgba(${p.glowFrom},0.12)`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = th.cardShadow;
      }}
    >
      {/* Gradient glow blob */}
      <div style={{
        position: "absolute", top: "-40px", right: "-40px",
        width: "180px", height: "180px", borderRadius: "50%",
        background: `radial-gradient(circle, rgba(${p.glowFrom},0.1) 0%, transparent 70%)`,
        pointerEvents: "none",
      }} />

      {/* Icon + badge */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div style={{
          width: "52px", height: "52px", borderRadius: "14px",
          background: p.gradient,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff",
          boxShadow: `0 8px 20px rgba(${p.glowFrom},0.3)`,
          flexShrink: 0,
        }}>
          {p.icon}
        </div>
        <span style={{
          fontSize: "10px", fontWeight: 800, letterSpacing: "1.5px",
          color: p.badgeColor,
          background: `${p.badgeColor}15`,
          border: `1px solid ${p.badgeColor}35`,
          padding: "4px 10px", borderRadius: "100px",
        }}>{p.badge}</span>
      </div>

      {/* Title & desc */}
      <div>
        <h3 style={{ color: th.itemTitle, fontSize: "18px", fontWeight: 800, margin: "0 0 10px", letterSpacing: "-0.4px", lineHeight: 1.3 }}>
          {p.title}
        </h3>
        <p style={{ color: th.itemDesc, fontSize: "14px", margin: 0, lineHeight: 1.7 }}>
          {p.desc}
        </p>
      </div>

      {/* Tags */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "4px" }}>
        {p.tags.map((tag) => (
          <span key={tag} style={{
            fontSize: "11px", fontWeight: 600,
            color: p.badgeColor,
            background: `${p.badgeColor}10`,
            border: `1px solid ${p.badgeColor}30`,
            padding: "4px 10px", borderRadius: "100px",
          }}>{tag}</span>
        ))}
      </div>
    </div>
  );
}
