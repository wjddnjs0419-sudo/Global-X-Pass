import { useState } from "react";
import { PageShell } from "../components/PageShell";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { useTheme } from "../ThemeContext";

const ARCHIVE_IMAGES = [
  "https://images.unsplash.com/photo-1558008258-3256797b43f3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080&q=80",
  "https://images.unsplash.com/photo-1531058020387-3be344556be6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080&q=80",
  "https://images.unsplash.com/photo-1571645163064-77faa9676a46?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080&q=80",
  "https://images.unsplash.com/photo-1576085898323-218337e3e43c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080&q=80",
  "https://images.unsplash.com/photo-1762968274962-20c12e6e8ecd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080&q=80",
  "https://images.unsplash.com/photo-1762968286778-60e65336d5ca?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080&q=80",
  "https://images.unsplash.com/photo-1508997449629-303059a039c0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080&q=80",
  "https://images.unsplash.com/photo-1776039325163-f45315a484f3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080&q=80",
  "https://images.unsplash.com/photo-1775902087078-ecee948a7c6a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080&q=80",
  "https://images.unsplash.com/photo-1666725257093-e2f1eebf4f5e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080&q=80",
];

const YEARS = ["전체", "2026", "2025", "2024"];

const ARCHIVE = [
  { id: 1, year: "2026", date: "2026.03.28", category: "데모데이", title: "창구 프로그램 2기 데모데이", attendees: 280, highlight: "15개 팀 발표, 누적 투자 유치 82억" },
  { id: 2, year: "2026", date: "2026.02.14", category: "네트워킹", title: "2026 New Year Networking Night", attendees: 198, highlight: "스타트업·VC 200명 참석" },
  { id: 3, year: "2025", date: "2025.11.21", category: "서밋", title: "NCF Global Innovation Summit 2025", attendees: 520, highlight: "기조연설 3개국, 비즈니스 매칭 160건" },
  { id: 4, year: "2025", date: "2025.09.12", category: "워크숍", title: "글로벌 IR 피칭 워크숍 Vol.3", attendees: 45, highlight: "외국계 VC 7인 참석 피드백 세션" },
  { id: 5, year: "2025", date: "2025.07.04", category: "해외탐방", title: "Silicon Valley Startup Tour 2025", attendees: 22, highlight: "Y Combinator, a16z 방문" },
  { id: 6, year: "2025", date: "2025.05.09", category: "데모데이", title: "창구 프로그램 1기 데모데이", attendees: 240, highlight: "12개 팀 발표, 5개 팀 투자 연계" },
  { id: 7, year: "2025", date: "2025.03.20", category: "컨퍼런스", title: "스타트업 생태계 트렌드 컨퍼런스 2025", attendees: 380, highlight: "AI·헬스케어·딥테크 트렌드 세션" },
  { id: 8, year: "2024", date: "2024.12.06", category: "네트워킹", title: "2024 Year-End Networking Party", attendees: 175, highlight: "올해의 스타트업 시상식 포함" },
  { id: 9, year: "2024", date: "2024.10.11", category: "서밋", title: "NCF Global Innovation Summit 2024", attendees: 430, highlight: "21개국 파트너사 참가" },
  { id: 10, year: "2024", date: "2024.08.22", category: "워크숍", title: "일본 진출 전략 워크숍", attendees: 38, highlight: "도쿄 현지 파트너와 실전 연습" },
];

const CAT_COLORS: Record<string, string> = {
  데모데이: "#20D6A2",
  네트워킹: "#60A5FA",
  서밋: "#A78BFA",
  워크숍: "#FBBF24",
  해외탐방: "#F472B6",
  컨퍼런스: "#34D399",
};

export function EventArchivePage() {
  const { isDark } = useTheme();
  const [activeYear, setActiveYear] = useState("전체");

  const filtered = ARCHIVE.filter((e) => activeYear === "전체" || e.year === activeYear);

  const card = isDark ? "rgba(255,255,255,0.04)" : "#ffffff";
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)";
  const textMain = isDark ? "rgba(255,255,255,0.92)" : "#0f172a";
  const textMuted = isDark ? "rgba(255,255,255,0.45)" : "rgba(15,23,42,0.45)";

  return (
    <PageShell title="행사 아카이브" subtitle="지난 행사들의 기록을 돌아보세요." accentColor="#A78BFA">
      {/* Year filter */}
      <div style={{ display: "flex", gap: 8, marginBottom: 40 }}>
        {YEARS.map((y) => (
          <button
            key={y}
            onClick={() => setActiveYear(y)}
            style={{
              padding: "8px 24px", borderRadius: 100, border: "none", cursor: "pointer",
              fontFamily: "'Pretendard', sans-serif",
              fontSize: 14, fontWeight: 600,
              background: activeYear === y ? "#A78BFA" : isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
              color: activeYear === y ? "#fff" : textMuted,
              transition: "all 0.2s ease",
            }}
          >
            {y}
          </button>
        ))}
      </div>

      {/* Stats bar */}
      <div
        style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))",
          gap: 16, marginBottom: 40,
        }}
      >
        {[
          { label: "총 행사", value: `${filtered.length}건` },
          { label: "총 참가자", value: `${filtered.reduce((s, e) => s + e.attendees, 0).toLocaleString()}명` },
          { label: "카테고리", value: `${new Set(filtered.map((e) => e.category)).size}종` },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              background: card, border: `1px solid ${border}`,
              borderRadius: 14, padding: "20px 24px", textAlign: "center",
            }}
          >
            <div style={{ fontSize: 28, fontWeight: 800, color: "#A78BFA", letterSpacing: "-0.03em" }}>
              {stat.value}
            </div>
            <div style={{ fontSize: 13, color: textMuted, marginTop: 4 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Archive list */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 260px), 1fr))",
          gap: 18,
        }}
      >
        {filtered.map((ev, idx) => (
          <div
            key={ev.id}
            style={{
              background: card, border: `1px solid ${border}`,
              borderRadius: 18, overflow: "hidden",
              cursor: "pointer", transition: "all 0.25s ease",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLDivElement;
              el.style.transform = "translateY(-3px)";
              el.style.borderColor = CAT_COLORS[ev.category] || "#A78BFA";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLDivElement;
              el.style.transform = "translateY(0)";
              el.style.borderColor = border;
            }}
          >
            {/* Cover image */}
            <div style={{ position: "relative", width: "100%", aspectRatio: "16 / 9", overflow: "hidden", background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }}>
              <ImageWithFallback
                src={ARCHIVE_IMAGES[(ev.id - 1) % ARCHIVE_IMAGES.length] || ARCHIVE_IMAGES[idx % ARCHIVE_IMAGES.length]}
                alt={ev.title}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", filter: "saturate(0.9)" }}
              />
              <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, transparent 40%, ${isDark ? "rgba(7,13,26,0.85)" : "rgba(0,0,0,0.45)"} 100%)` }} />
              <div style={{ position: "absolute", left: 14, bottom: 12, color: "#fff", fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", textShadow: "0 1px 4px rgba(0,0,0,0.6)" }}>
                {ev.year}
              </div>
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: CAT_COLORS[ev.category] || "#A78BFA" }} />
            </div>
            <div style={{ padding: "20px 22px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span
                  style={{
                    padding: "3px 10px", borderRadius: 100,
                    background: `${CAT_COLORS[ev.category] || "#A78BFA"}1A`,
                    color: CAT_COLORS[ev.category] || "#A78BFA",
                    fontSize: 11, fontWeight: 700,
                  }}
                >
                  {ev.category}
                </span>
                <span style={{ fontSize: 12, color: textMuted }}>{ev.date}</span>
              </div>
              <h3 style={{ margin: "0 0 10px", fontSize: 16, fontWeight: 700, color: textMain, lineHeight: 1.4 }}>
                {ev.title}
              </h3>
              <div
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "8px 12px", borderRadius: 8,
                  background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                  fontSize: 12, color: textMuted,
                }}
              >
                <span style={{ fontSize: 14 }}>✨</span>
                {ev.highlight}
              </div>
              <div style={{ marginTop: 12, fontSize: 12, color: textMuted }}>
                참가자 {ev.attendees.toLocaleString()}명
              </div>
            </div>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
