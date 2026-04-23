import { useState } from "react";
import { PageShell } from "../components/PageShell";
import { useTheme } from "../ThemeContext";

const CATEGORIES = ["전체", "중요", "일반", "행정"];

const NOTICES = [
  {
    id: 1, category: "중요", date: "2026.04.18",
    title: "2026 NCF × Global X 글로벌 파트너십 프로그램 공개 모집 안내",
    desc: "올해 새롭게 개편된 글로벌 파트너십 프로그램의 지원 자격 및 일정을 안내드립니다.",
    views: 1824, important: true,
  },
  {
    id: 2, category: "중요", date: "2026.04.10",
    title: "Around X NCF 플랫폼 이용약관 및 개인정보처리방침 개정 안내",
    desc: "2026년 5월 1일부로 적용되는 이용약관 및 개인정보처리방침 변경 사항을 안내드립니다.",
    views: 942, important: true,
  },
  {
    id: 3, category: "일반", date: "2026.04.05",
    title: "4월 네트워킹 데이 행사 안내 — 서울 성수 STUDIO X",
    desc: "4월 네트워킹 데이는 스타트업 대표 및 투자자 100여명이 참석하는 오프라인 행사입니다.",
    views: 678,
  },
  {
    id: 4, category: "일반", date: "2026.03.28",
    title: "창구 프로그램 3기 최종 선발 결과 발표",
    desc: "2026 창구 프로그램 3기 최종 선발 기업 명단을 발표합니다. 선발된 팀에 축하를 드립니다.",
    views: 2341,
  },
  {
    id: 5, category: "행정", date: "2026.03.20",
    title: "NCF 멤버십 갱신 안내 (2026년 상반기)",
    desc: "2026년 상반기 멤버십 갱신 기간 및 혜택 변경 사항을 확인해 주세요.",
    views: 519,
  },
  {
    id: 6, category: "일반", date: "2026.03.15",
    title: "글로벌 파트너 기업 현장 방문 프로그램 모집 (1차)",
    desc: "일본·싱가포르·UAE 거점 파트너사 현장 방문 기회를 드립니다. 신청 마감 3월 31일.",
    views: 1103,
  },
  {
    id: 7, category: "일반", date: "2026.03.08",
    title: "2026 스타트업 IR 클리닉 참가 기업 모집",
    desc: "투자유치를 준비 중인 스타트업을 위한 1:1 IR 클리닉 프로그램 참가 기업을 모집합니다.",
    views: 874,
  },
  {
    id: 8, category: "행정", date: "2026.02.28",
    title: "플랫폼 정기 점검 안내 (3월 2일 오전 2시~6시)",
    desc: "시스템 안정화를 위한 정기 점검이 예정되어 있습니다. 해당 시간대 서비스 이용이 제한됩니다.",
    views: 302,
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  중요: "#EF4444",
  일반: "#20D6A2",
  행정: "#60A5FA",
};

export function NoticePage() {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState("전체");

  const filtered = NOTICES.filter((n) => activeTab === "전체" || n.category === activeTab);

  const card = isDark ? "rgba(255,255,255,0.04)" : "#ffffff";
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)";
  const textMain = isDark ? "rgba(255,255,255,0.92)" : "#0f172a";
  const textMuted = isDark ? "rgba(255,255,255,0.45)" : "rgba(15,23,42,0.45)";

  return (
    <PageShell title="공지사항" subtitle="NCF × Around X의 공식 공지 및 안내사항을 확인하세요.">
      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 32, flexWrap: "wrap" }}>
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

      {/* Notice list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {filtered.map((notice) => (
          <div
            key={notice.id}
            style={{
              background: card,
              border: `1px solid ${border}`,
              borderRadius: 14,
              padding: "20px 24px",
              display: "flex", alignItems: "flex-start", gap: 20,
              cursor: "pointer",
              transition: "all 0.2s ease",
              marginBottom: 6,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor = "#20D6A2";
              (e.currentTarget as HTMLDivElement).style.background = isDark ? "rgba(32,214,162,0.05)" : "#f0fdf9";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor = border;
              (e.currentTarget as HTMLDivElement).style.background = card;
            }}
          >
            {/* Category badge */}
            <span
              style={{
                flexShrink: 0, marginTop: 2,
                padding: "2px 10px", borderRadius: 100,
                background: `${CATEGORY_COLORS[notice.category] || "#20D6A2"}18`,
                color: CATEGORY_COLORS[notice.category] || "#20D6A2",
                fontSize: 11, fontWeight: 700, letterSpacing: "0.04em",
              }}
            >
              {notice.category}
            </span>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: textMain }}>{notice.title}</span>
              </div>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: textMuted, lineHeight: 1.6 }}>
                {notice.desc}
              </p>
            </div>

            {/* Meta */}
            <div style={{ flexShrink: 0, textAlign: "right" }}>
              <div style={{ fontSize: 12, color: textMuted, marginBottom: 4 }}>{notice.date}</div>
              <div style={{ fontSize: 11, color: textMuted }}>조회 {notice.views.toLocaleString()}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 40 }}>
        {[1, 2, 3, 4, 5].map((p) => (
          <button
            key={p}
            style={{
              width: 36, height: 36, borderRadius: 10, border: "none", cursor: "pointer",
              fontFamily: "'Pretendard', sans-serif", fontWeight: 600, fontSize: 14,
              background: p === 1 ? "#20D6A2" : isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
              color: p === 1 ? "#0a1020" : textMuted,
            }}
          >
            {p}
          </button>
        ))}
      </div>
    </PageShell>
  );
}
