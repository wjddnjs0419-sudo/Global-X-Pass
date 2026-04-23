import { useState } from "react";
import { PageShell } from "../components/PageShell";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { useTheme } from "../ThemeContext";

const CATEGORIES = ["전체", "스타트업", "투자", "글로벌", "정책"];

const NEWS = [
  {
    id: 1, category: "글로벌", date: "2026.04.20",
    title: "NCF × 싱가포르 EDB, 한국 스타트업 진출 지원 MOU 체결",
    desc: "싱가포르 경제개발청(EDB)과의 MOU를 통해 회원사에 현지 진출 패스트트랙 기회를 제공합니다.",
    readTime: "3분",
    tag: "파트너십",
    image: "https://images.unsplash.com/photo-1531058020387-3be344556be6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080&q=80",
  },
  {
    id: 2, category: "스타트업", date: "2026.04.17",
    title: "창구 2기 출신 핀테크 스타트업 '페이블', 시리즈 B 150억 유치",
    desc: "NCF 창구 프로그램 출신 핀테크 기업이 글로벌 VC로부터 대규모 투자를 유치했습니다.",
    readTime: "4분",
    tag: "투자",
    image: "https://images.unsplash.com/photo-1707332287886-84315bbb04bb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080&q=80",
  },
  {
    id: 3, category: "투자", date: "2026.04.14",
    title: "2026 스타트업 투자 트렌드: AI·헬스케어 집중 현상 심화",
    desc: "1분기 국내 스타트업 투자 리포트에서 AI·헬스케어 섹터가 전체 투자의 62%를 차지했습니다.",
    readTime: "6분",
    tag: "리포트",
    image: "https://images.unsplash.com/photo-1683560660669-6be33568035e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080&q=80",
  },
  {
    id: 4, category: "정책", date: "2026.04.10",
    title: "중기부, 글로벌 스타트업 지원 예산 30% 확대 발표",
    desc: "2026년 하반기부터 글로벌 진출 스타트업 대상 지원 예산이 대폭 증가할 예정입니다.",
    readTime: "5분",
    tag: "정책",
    image: "https://images.unsplash.com/photo-1697382608848-c5fea6dd9d60?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080&q=80",
  },
  {
    id: 5, category: "스타트업", date: "2026.04.07",
    title: "Around X 멤버사 10곳, CES 2027 참가 확정",
    desc: "NCF Around X 네트워크 소속 10개 스타트업이 세계 최대 IT 박람회 CES 2027 한국관에 참가합니다.",
    readTime: "3분",
    tag: "행사",
    image: "https://images.unsplash.com/photo-1762968286778-60e65336d5ca?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080&q=80",
  },
  {
    id: 6, category: "글로벌", date: "2026.04.03",
    title: "일본 소프트뱅크, 국내 딥테크 스타트업 투자 관심 확대",
    desc: "소프트뱅크 관계자가 NCF 네트워킹 행사에 참석해 국내 딥테크 분야 관심을 표명했습니다.",
    readTime: "4분",
    tag: "투자",
    image: "https://images.unsplash.com/photo-1658909896496-3a9c405ca472?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080&q=80",
  },
];

const TAG_COLORS: Record<string, string> = {
  파트너십: "#20D6A2",
  투자: "#60A5FA",
  리포트: "#A78BFA",
  정책: "#FBBF24",
  행사: "#F472B6",
};

export function NewsPage() {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState("전체");

  const filtered = NEWS.filter((n) => activeTab === "전체" || n.category === activeTab);

  const card = isDark ? "rgba(255,255,255,0.04)" : "#ffffff";
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)";
  const textMain = isDark ? "rgba(255,255,255,0.92)" : "#0f172a";
  const textMuted = isDark ? "rgba(255,255,255,0.45)" : "rgba(15,23,42,0.45)";

  return (
    <PageShell title="뉴스레터" subtitle="NCF × Around X 생태계의 최신 인사이트를 매주 전해드립니다." accentColor="#60A5FA">
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
              background: activeTab === cat ? "#60A5FA" : isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
              color: activeTab === cat ? "#fff" : textMuted,
              transition: "all 0.2s ease",
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* News grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 280px), 1fr))",
          gap: 24,
        }}
      >
        {filtered.map((news) => (
          <div
            key={news.id}
            style={{
              background: card,
              border: `1px solid ${border}`,
              borderRadius: 18,
              overflow: "hidden",
              cursor: "pointer",
              transition: "all 0.25s ease",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLDivElement;
              el.style.transform = "translateY(-4px)";
              el.style.boxShadow = isDark
                ? "0 20px 48px rgba(0,0,0,0.35)"
                : "0 20px 48px rgba(0,0,0,0.12)";
              el.style.borderColor = "#60A5FA";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLDivElement;
              el.style.transform = "translateY(0)";
              el.style.boxShadow = "none";
              el.style.borderColor = border;
            }}
          >
            {/* Cover image */}
            <div style={{ position: "relative", width: "100%", aspectRatio: "16 / 9", overflow: "hidden", background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }}>
              <ImageWithFallback
                src={news.image}
                alt={news.title}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
              <div style={{
                position: "absolute", bottom: 0, left: 0, right: 0, height: 4,
                background: `linear-gradient(90deg, ${TAG_COLORS[news.tag] || "#60A5FA"}, ${TAG_COLORS[news.tag] || "#60A5FA"}88)`,
              }} />
            </div>
            <div style={{ padding: "22px 24px 24px" }}>
              {/* Top meta */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <span
                  style={{
                    padding: "3px 10px", borderRadius: 100,
                    background: `${TAG_COLORS[news.tag] || "#60A5FA"}1A`,
                    color: TAG_COLORS[news.tag] || "#60A5FA",
                    fontSize: 11, fontWeight: 700, letterSpacing: "0.04em",
                  }}
                >
                  {news.tag}
                </span>
                <span style={{ fontSize: 12, color: textMuted }}>{news.date}</span>
              </div>

              {/* Title */}
              <h3
                style={{
                  margin: "0 0 10px",
                  fontSize: 17,
                  fontWeight: 700,
                  color: textMain,
                  lineHeight: 1.45,
                  letterSpacing: "-0.02em",
                }}
              >
                {news.title}
              </h3>

              {/* Desc */}
              <p style={{ margin: 0, fontSize: 13, color: textMuted, lineHeight: 1.65 }}>
                {news.desc}
              </p>

              {/* Footer */}
              <div
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  marginTop: 18, paddingTop: 16,
                  borderTop: `1px solid ${border}`,
                }}
              >
                <span style={{ fontSize: 12, color: textMuted }}>읽는 시간: {news.readTime}</span>
                <span style={{ fontSize: 12, color: "#60A5FA", fontWeight: 600 }}>자세히 보기 →</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
