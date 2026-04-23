import { useState } from "react";
import { PageShell } from "../components/PageShell";
import { useTheme } from "../ThemeContext";

const CATEGORIES = ["전체", "가이드", "보고서", "양식", "발표자료"];

const RESOURCES = [
  {
    id: 1, category: "가이드", date: "2026.04.15",
    title: "2026 글로벌 진출 가이드북 — 동남아 편",
    desc: "싱가포르·베트남·인도네시아 시장 진출을 위한 실전 가이드",
    size: "4.2 MB", format: "PDF", downloads: 1824,
    accent: "#20D6A2",
  },
  {
    id: 2, category: "보고서", date: "2026.04.10",
    title: "Q1 2026 국내 스타트업 투자 동향 보고서",
    desc: "2026년 1분기 국내 스타트업 투자 현황 및 분석 리포트",
    size: "2.8 MB", format: "PDF", downloads: 3241,
    accent: "#60A5FA",
  },
  {
    id: 3, category: "양식", date: "2026.03.28",
    title: "투자자 IR 덱 템플릿 (한/영 병용)",
    desc: "글로벌 IR 피칭에 최적화된 슬라이드 덱 템플릿",
    size: "1.5 MB", format: "PPTX", downloads: 5102,
    accent: "#A78BFA",
  },
  {
    id: 4, category: "발표자료", date: "2026.03.20",
    title: "NCF Global Innovation Summit 2025 발표 자료 모음",
    desc: "2025 서밋 전체 발표자료를 압축하여 제공합니다",
    size: "18.7 MB", format: "ZIP", downloads: 2387,
    accent: "#FBBF24",
  },
  {
    id: 5, category: "가이드", date: "2026.03.10",
    title: "스타트업 법인 설립 체크리스트 — 일본 편",
    desc: "일본 현지 법인 설립 시 필요한 절차와 서류를 정리한 체크리스트",
    size: "0.9 MB", format: "PDF", downloads: 978,
    accent: "#20D6A2",
  },
  {
    id: 6, category: "양식", date: "2026.02.25",
    title: "비즈니스 MOU 계약서 표준 양식 (국문/영문)",
    desc: "글로벌 파트너십 체결 시 활용 가능한 MOU 표준 계약서",
    size: "0.4 MB", format: "DOCX", downloads: 2156,
    accent: "#A78BFA",
  },
  {
    id: 7, category: "보고서", date: "2026.02.15",
    title: "2025 연간 스타트업 생태계 보고서",
    desc: "2025년 국내외 스타트업 생태계 전반에 대한 연간 종합 분석",
    size: "5.6 MB", format: "PDF", downloads: 4872,
    accent: "#60A5FA",
  },
  {
    id: 8, category: "발표자료", date: "2026.02.05",
    title: "창구 프로그램 2기 데모데이 발표 자료",
    desc: "창구 2기 15개 팀의 최종 발표 자료 모음",
    size: "9.3 MB", format: "ZIP", downloads: 1634,
    accent: "#FBBF24",
  },
];

const FORMAT_ICONS: Record<string, string> = {
  PDF: "📄",
  PPTX: "📊",
  DOCX: "📝",
  ZIP: "📦",
};

export function ResourcesPage() {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState("전체");

  const filtered = RESOURCES.filter((r) => activeTab === "전체" || r.category === activeTab);

  const card = isDark ? "rgba(255,255,255,0.04)" : "#ffffff";
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)";
  const textMain = isDark ? "rgba(255,255,255,0.92)" : "#0f172a";
  const textMuted = isDark ? "rgba(255,255,255,0.45)" : "rgba(15,23,42,0.45)";

  return (
    <PageShell title="자료실" subtitle="NCF × Around X 멤버를 위한 실전 자료를 내려받으세요." accentColor="#20D6A2">
      {/* Search bar */}
      <div style={{ marginBottom: 24 }}>
        <input
          placeholder="자료 검색..."
          style={{
            width: "100%", maxWidth: 480,
            padding: "12px 20px", borderRadius: 12,
            border: `1px solid ${border}`,
            background: card,
            color: textMain,
            fontSize: 14, fontFamily: "'Pretendard', sans-serif",
            outline: "none", boxSizing: "border-box",
          }}
        />
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 40, flexWrap: "wrap" }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveTab(cat)}
            style={{
              padding: "8px 20px", borderRadius: 100, border: "none", cursor: "pointer",
              fontFamily: "'Pretendard', sans-serif",
              fontSize: 14, fontWeight: 600,
              background: activeTab === cat ? "#20D6A2" : isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
              color: activeTab === cat ? "#0a1020" : textMuted,
              transition: "all 0.2s ease",
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Resource grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 260px), 1fr))", gap: 18 }}>
        {filtered.map((res) => (
          <div
            key={res.id}
            style={{
              background: card, border: `1px solid ${border}`,
              borderRadius: 18, padding: "22px 24px",
              display: "flex", flexDirection: "column", gap: 14,
              cursor: "pointer", transition: "all 0.25s ease",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLDivElement;
              el.style.transform = "translateY(-3px)";
              el.style.borderColor = res.accent;
              el.style.boxShadow = isDark ? "0 12px 32px rgba(0,0,0,0.3)" : "0 12px 32px rgba(0,0,0,0.1)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLDivElement;
              el.style.transform = "translateY(0)";
              el.style.borderColor = border;
              el.style.boxShadow = "none";
            }}
          >
            {/* File type icon + format */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div
                style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: `${res.accent}18`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 22,
                }}
              >
                {FORMAT_ICONS[res.format] || "📄"}
              </div>
              <span
                style={{
                  padding: "3px 10px", borderRadius: 6,
                  background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
                  color: textMuted, fontSize: 11, fontWeight: 700, letterSpacing: "0.04em",
                }}
              >
                {res.format}
              </span>
            </div>

            {/* Content */}
            <div>
              <span
                style={{
                  fontSize: 11, color: res.accent, fontWeight: 700,
                  letterSpacing: "0.04em", textTransform: "uppercase",
                }}
              >
                {res.category}
              </span>
              <h3 style={{ margin: "4px 0 6px", fontSize: 15, fontWeight: 700, color: textMain, lineHeight: 1.4 }}>
                {res.title}
              </h3>
              <p style={{ margin: 0, fontSize: 12, color: textMuted, lineHeight: 1.6 }}>{res.desc}</p>
            </div>

            {/* Footer */}
            <div
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                paddingTop: 12, borderTop: `1px solid ${border}`,
              }}
            >
              <div style={{ fontSize: 12, color: textMuted }}>
                {res.size} · ⬇ {res.downloads.toLocaleString()}
              </div>
              <button
                style={{
                  padding: "7px 16px", borderRadius: 8, border: "none",
                  background: res.accent, color: "#0a1020",
                  fontSize: 12, fontWeight: 700, cursor: "pointer",
                  fontFamily: "'Pretendard', sans-serif",
                }}
              >
                다운로드
              </button>
            </div>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
