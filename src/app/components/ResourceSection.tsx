// ─── 자료실 섹션 ─────────────────────────────────────────────────
import { Link } from "react-router";
import { getSectionTheme } from "../utils/sectionTheme";

interface ResourceSectionProps { isDark?: boolean; }

const resources = [
  {
    type: "PPT",
    typeColor: "#4377F1",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
        <path d="M7 8h4a2 2 0 0 1 0 4H7V8z"/>
      </svg>
    ),
    title: "IR 피칭 템플릿",
    desc: "글로벌 투자사 대상 IR 발표용 스타트업 피칭 덱 템플릿. 구글 파트너십 실적 레퍼런스 슬라이드 포함.",
    size: "4.2 MB",
    updated: "2026.04.01",
    downloads: 1834,
    gradient: "linear-gradient(135deg, #4377F1 0%, #16DBBB 100%)",
    glowFrom: "67,119,241",
  },
  {
    type: "PDF",
    typeColor: "#EA4335",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
    title: "창구 프로그램 공식 소개서",
    desc: "2026년 8기 창구 프로그램 전체 혜택, 지원 자격, 선발 기준, 주요 일정이 담긴 공식 안내 문서.",
    size: "2.8 MB",
    updated: "2026.04.15",
    downloads: 3201,
    gradient: "linear-gradient(135deg, #FF4340 0%, #FF7C44 100%)",
    glowFrom: "255,67,64",
  },
  {
    type: "VOD",
    typeColor: "#34A853",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
      </svg>
    ),
    title: "글로벌 마케팅 전략 VOD",
    desc: "Google Play 피처링 획득 전략, ASO 최적화, 해외 UA 캠페인 설계 전문가 강의 영상 (총 4강, 6시간).",
    size: "온라인 스트리밍",
    updated: "2026.03.20",
    downloads: 1102,
    gradient: "linear-gradient(135deg, #18A343 0%, #37AD9A 100%)",
    glowFrom: "24,163,67",
  },
  {
    type: "XLSX",
    typeColor: "#FBBC05",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/>
      </svg>
    ),
    title: "글로벌 진출 체크리스트",
    desc: "동남아·북미·유럽 시장별 진출 준비 체크리스트. 현지화, 법률, 결제 모듈, 스토어 등록 항목 총 72개.",
    size: "0.9 MB",
    updated: "2026.02.28",
    downloads: 876,
    gradient: "linear-gradient(135deg, #FFEE56 0%, #FFC2B4 100%)",
    glowFrom: "255,238,86",
  },
  {
    type: "PDF",
    typeColor: "#4285F4",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
    ),
    title: "동남아 앱 시장 트렌드 리포트 2026",
    desc: "인도네시아·베트남·태국·필리핀 4개국 주요 앱 카테고리 수익 데이터 및 2026 성장 전망 분석 리포트.",
    size: "6.1 MB",
    updated: "2026.04.10",
    downloads: 2547,
    gradient: "linear-gradient(135deg, #4377F1 0%, #16DBBB 100%)",
    glowFrom: "67,119,241",
  },
  {
    type: "ZIP",
    typeColor: "#20D6A2",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
    ),
    title: "7기 성과 보고서 & 케이스 스터디",
    desc: "2025년 7기 수료 기업 22개사 글로벌 매출, DAU, 다운로드 성장 지표와 성공 케이스 스터디 아카이브.",
    size: "12.4 MB",
    updated: "2026.03.15",
    downloads: 3891,
    gradient: "linear-gradient(135deg, #20D6A2 0%, #BEFFF9 100%)",
    glowFrom: "32,214,162",
  },
];

export function ResourceSection({ isDark = false }: ResourceSectionProps) {
  const th = getSectionTheme(isDark);

  return (
    <section style={{
      position: "relative", width: "100vw", maxWidth: "100%",
      left: "50%", transform: "translateX(-50%)",
      padding: "clamp(60px, 10vw, 100px) clamp(20px, 5vw, 40px) clamp(70px, 11vw, 110px)",
      background: isDark
        ? "radial-gradient(circle at 90% 10%, rgba(67,119,241,0.07) 0%, transparent 50%), linear-gradient(180deg, #0e1628 0%, #0a1020 100%)"
        : "radial-gradient(circle at 90% 10%, rgba(67,119,241,0.05) 0%, transparent 50%), linear-gradient(180deg, #F7F8FC 0%, #F0F2F8 100%)",
      fontFamily: "'Pretendard', -apple-system, sans-serif",
      boxSizing: "border-box", overflow: "hidden",
      transition: "background 0.4s ease",
    }}>
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: `radial-gradient(${th.dotGrid} 1px, transparent 1px)`,
        backgroundSize: "36px 36px",
      }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: "1280px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "48px", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <h2 style={{ color: th.headingColor, fontSize: "clamp(24px,3vw,40px)", fontWeight: 800, margin: "0 0 8px", letterSpacing: "-1.2px", lineHeight: 1.15 }}>
              자료실
            </h2>
            <p style={{ color: th.subText, fontSize: "14px", margin: 0 }}>
              IR 템플릿, VOD, 시장 리포트 등 사업 성장에 필요한 자료를 무료로 제공합니다.
            </p>
          </div>
          <Link to="/resources" style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            color: "#4377F1", fontSize: "13px", fontWeight: 700, textDecoration: "none",
            padding: "8px 16px", background: "rgba(67,119,241,0.08)",
            border: "1px solid rgba(67,119,241,0.2)", borderRadius: "100px",
          }}>
            전체 자료 보기
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
        </div>

        {/* Resource grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))", gap: "18px" }}>
          {resources.map((r, i) => (
            <ResourceCard key={i} resource={r} isDark={isDark} th={th} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ResourceCard({ resource: r, th }: { resource: typeof resources[0]; isDark: boolean; th: ReturnType<typeof getSectionTheme> }) {
  return (
    <div
      style={{
        background: th.cardBg, border: `1px solid ${th.cardBorder}`,
        borderRadius: "20px", padding: "24px",
        boxShadow: th.cardShadow, display: "flex", flexDirection: "column", gap: "14px",
        position: "relative", overflow: "hidden", cursor: "default",
        transition: "transform 0.3s ease, box-shadow 0.3s ease",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 12px 32px rgba(${r.glowFrom},0.12)`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = th.cardShadow;
      }}
    >
      {/* Gradient blob */}
      <div style={{
        position: "absolute", bottom: "-30px", right: "-30px", width: "120px", height: "120px",
        borderRadius: "50%",
        background: `radial-gradient(circle, rgba(${r.glowFrom},0.1) 0%, transparent 70%)`,
        pointerEvents: "none",
      }} />

      {/* Top row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div style={{
          width: "46px", height: "46px", borderRadius: "12px",
          background: r.gradient, display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", boxShadow: `0 6px 16px rgba(${r.glowFrom},0.3)`, flexShrink: 0,
        }}>
          {r.icon}
        </div>
        <span style={{
          fontSize: "10px", fontWeight: 800, letterSpacing: "1px",
          color: r.typeColor, background: `${r.typeColor}15`,
          border: `1px solid ${r.typeColor}35`,
          padding: "4px 10px", borderRadius: "6px",
        }}>{r.type}</span>
      </div>

      {/* Content */}
      <div>
        <h4 style={{ color: th.itemTitle, fontSize: "15px", fontWeight: 800, margin: "0 0 8px", lineHeight: 1.3, letterSpacing: "-0.3px" }}>
          {r.title}
        </h4>
        <p style={{ color: th.itemDesc, fontSize: "13px", margin: 0, lineHeight: 1.6 }}>
          {r.desc}
        </p>
      </div>

      {/* Meta */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "10px", borderTop: `1px solid ${th.rowDivider}` }}>
        <div style={{ display: "flex", gap: "12px" }}>
          <span style={{ color: th.mutedText, fontSize: "11px", display: "flex", alignItems: "center", gap: "3px" }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            {r.downloads.toLocaleString()}
          </span>
          <span style={{ color: th.mutedText, fontSize: "11px" }}>· {r.size}</span>
        </div>
        <span style={{ color: th.mutedText, fontSize: "11px" }}>{r.updated}</span>
      </div>

      {/* Download button */}
      <button style={{
        width: "100%", padding: "10px",
        background: `${r.typeColor}12`,
        border: `1px solid ${r.typeColor}30`,
        borderRadius: "10px",
        color: r.typeColor, fontSize: "13px", fontWeight: 700, cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
        transition: "background 0.2s ease",
      }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = `${r.typeColor}20`; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = `${r.typeColor}12`; }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        다운로드
      </button>
    </div>
  );
}
