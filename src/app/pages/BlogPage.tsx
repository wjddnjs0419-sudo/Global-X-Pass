import { useState } from "react";
import { PageShell } from "../components/PageShell";
import { useTheme } from "../ThemeContext";

const TAGS = ["전체", "창업", "투자", "글로벌", "커뮤니티", "기술"];

const POSTS = [
  {
    id: 1, tag: "글로벌", date: "2026.04.19", readTime: "8분",
    title: "동남아 5개국 스타트업 생태계 비교 분석: 어디가 최적인가?",
    desc: "싱가포르, 베트남, 인도네시아, 태국, 말레이시아의 스타트업 환경을 투자·규제·인프라·네트워크 4개 축으로 심층 비교합니다.",
    author: "NCF 리서치팀", featured: true,
    accent: "#20D6A2",
  },
  {
    id: 2, tag: "투자", date: "2026.04.16", readTime: "6분",
    title: "시리즈 A 이전, 투자자가 실제로 보는 5가지 포인트",
    desc: "100여 명의 VC와의 인터뷰를 통해 분석한, 초기 투자에서 가장 중요하게 고려되는 평가 기준을 공개합니다.",
    author: "김민준 (NCF 파트너)", featured: false,
    accent: "#60A5FA",
  },
  {
    id: 3, tag: "창업", date: "2026.04.12", readTime: "5분",
    title: "공동창업자 갈등을 방지하는 계약서 작성의 모든 것",
    desc: "스타트업 초기에 반드시 짚고 넘어가야 할 공동창업자 계약 체크리스트와 실전 사례를 정리했습니다.",
    author: "이수진 (법률 파트너)", featured: false,
    accent: "#A78BFA",
  },
  {
    id: 4, tag: "기술", date: "2026.04.09", readTime: "10분",
    title: "AI 시대의 스타트업 기술 스택 선택 가이드 2026",
    desc: "초기 스타트업이 최소 리소스로 최대 확장성을 갖춘 제품을 만들기 위한 기술 스택 선택 전략을 제안합니다.",
    author: "박상우 (CTO 자문)", featured: false,
    accent: "#34D399",
  },
  {
    id: 5, tag: "커뮤니티", date: "2026.04.06", readTime: "4분",
    title: "Around X 3주년: 우리가 함께 만들어 온 숫자들",
    desc: "2023년부터 시작된 Around X 커뮤니티가 3주년을 맞이했습니다. 지난 3년의 성과를 데이터로 돌아봅니다.",
    author: "Around X 편집팀", featured: false,
    accent: "#F472B6",
  },
  {
    id: 6, tag: "글로벌", date: "2026.04.02", readTime: "7분",
    title: "일본 시장 진출, 실패하지 않으려면 이것만은 알아두자",
    desc: "일본 비즈니스 문화와 규제 특수성, 실패 사례 분석을 통해 한국 스타트업이 피해야 할 함정을 정리합니다.",
    author: "최지훈 (Japan Desk)", featured: false,
    accent: "#FBBF24",
  },
];

export function BlogPage() {
  const { isDark } = useTheme();
  const [activeTag, setActiveTag] = useState("전체");

  const featured = POSTS.find((p) => p.featured);
  const filtered = POSTS.filter((p) => !p.featured && (activeTag === "전체" || p.tag === activeTag));

  const card = isDark ? "rgba(255,255,255,0.04)" : "#ffffff";
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)";
  const textMain = isDark ? "rgba(255,255,255,0.92)" : "#0f172a";
  const textMuted = isDark ? "rgba(255,255,255,0.45)" : "rgba(15,23,42,0.45)";

  return (
    <PageShell title="블로그" subtitle="스타트업 생태계의 인사이트와 실전 노하우를 공유합니다." accentColor="#BEFFF9">
      {/* Featured post */}
      {featured && (
        <div
          style={{
            background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)",
            border: `1px solid rgba(32,214,162,0.3)`,
            borderRadius: 24, padding: "40px 44px",
            marginBottom: 40, cursor: "pointer",
            display: "flex", flexDirection: "column", gap: 16,
            transition: "all 0.3s ease",
            position: "relative", overflow: "hidden",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLDivElement).style.boxShadow = "0 24px 64px rgba(32,214,162,0.15)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
          }}
        >
          {/* Glow */}
          <div
            style={{
              position: "absolute", top: -60, right: -60,
              width: 220, height: 220, borderRadius: "50%",
              background: "radial-gradient(circle, rgba(32,214,162,0.12) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                padding: "4px 12px", borderRadius: 100,
                background: "rgba(32,214,162,0.15)",
                color: "#20D6A2", fontSize: 11, fontWeight: 700, letterSpacing: "0.05em",
              }}
            >
              ⭐ 추천 아티클
            </span>
            <span
              style={{
                padding: "4px 12px", borderRadius: 100,
                background: "rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.55)", fontSize: 11, fontWeight: 600,
              }}
            >
              {featured.tag}
            </span>
          </div>
          <h2
            style={{
              margin: 0, fontSize: "clamp(20px, 3vw, 28px)", fontWeight: 800,
              color: "#ffffff", letterSpacing: "-0.03em", lineHeight: 1.3, maxWidth: 640,
            }}
          >
            {featured.title}
          </h2>
          <p style={{ margin: 0, fontSize: 15, color: "rgba(255,255,255,0.6)", lineHeight: 1.7, maxWidth: 560 }}>
            {featured.desc}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.45)" }}>{featured.author}</span>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }}>·</span>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.45)" }}>{featured.date}</span>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }}>·</span>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.45)" }}>읽는 시간 {featured.readTime}</span>
            <span style={{ marginLeft: "auto", color: "#20D6A2", fontSize: 14, fontWeight: 700 }}>
              읽기 →
            </span>
          </div>
        </div>
      )}

      {/* Tag filter */}
      <div style={{ display: "flex", gap: 8, marginBottom: 32, flexWrap: "wrap" }}>
        {TAGS.map((tag) => (
          <button
            key={tag}
            onClick={() => setActiveTag(tag)}
            style={{
              padding: "7px 18px", borderRadius: 100, border: "none", cursor: "pointer",
              fontFamily: "'Pretendard', sans-serif",
              fontSize: 13, fontWeight: 600,
              background: activeTag === tag ? "#20D6A2" : isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
              color: activeTag === tag ? "#0a1020" : textMuted,
              transition: "all 0.2s ease",
            }}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Post grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 260px), 1fr))", gap: 20 }}>
        {filtered.map((post) => (
          <div
            key={post.id}
            style={{
              background: card, border: `1px solid ${border}`,
              borderRadius: 18, padding: "24px",
              cursor: "pointer", transition: "all 0.25s ease",
              display: "flex", flexDirection: "column", gap: 12,
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLDivElement;
              el.style.transform = "translateY(-4px)";
              el.style.borderColor = post.accent;
              el.style.boxShadow = isDark ? "0 16px 40px rgba(0,0,0,0.3)" : "0 16px 40px rgba(0,0,0,0.1)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLDivElement;
              el.style.transform = "translateY(0)";
              el.style.borderColor = border;
              el.style.boxShadow = "none";
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span
                style={{
                  padding: "3px 10px", borderRadius: 100,
                  background: `${post.accent}18`,
                  color: post.accent,
                  fontSize: 11, fontWeight: 700,
                }}
              >
                {post.tag}
              </span>
              <span style={{ fontSize: 11, color: textMuted }}>{post.readTime} 읽기</span>
            </div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: textMain, lineHeight: 1.45 }}>
              {post.title}
            </h3>
            <p style={{ margin: 0, fontSize: 13, color: textMuted, lineHeight: 1.65, flex: 1 }}>
              {post.desc}
            </p>
            <div
              style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                paddingTop: 12, borderTop: `1px solid ${border}`,
                fontSize: 12, color: textMuted,
              }}
            >
              <span>{post.author}</span>
              <span>{post.date}</span>
            </div>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
