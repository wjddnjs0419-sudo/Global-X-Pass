// ─── 커뮤니티 / 최신게시물 섹션 ──────────────────────────────────
import { useState } from "react";
import { Link } from "react-router";
import { getSectionTheme } from "../utils/sectionTheme";

interface CommunitySectionProps { isDark?: boolean; }

const posts = [
  {
    category: "성과 공유",
    categoryColor: "#20D6A2",
    author: "바이탈리티 Labs",
    authorInitial: "V",
    authorBg: "linear-gradient(135deg, #20D6A2, #BEFFF9)",
    date: "2026.04.19",
    title: "Google Play 피처링 획득 후 3주 만에 MAU 3.8만 → 12만 달성 후기",
    desc: "창구 8기 지원 준비 중 7기 수료 선배 기업의 피처링 전략을 벤치마킹했습니다. ASO 키워드 재설계 + 스크린샷 A/B 테스트 결과를 공유합니다.",
    likes: 142,
    comments: 38,
    views: 2841,
    tag: "HOT",
    tagColor: "#FF4340",
  },
  {
    category: "질문/답변",
    categoryColor: "#4285F4",
    author: "글로마인드 Inc.",
    authorInitial: "G",
    authorBg: "linear-gradient(135deg, #4377F1, #16DBBB)",
    date: "2026.04.18",
    title: "8기 서류 지원 시 '글로벌 매출 비중' 산정 기준이 어떻게 되나요?",
    desc: "지원 자격 요건 중 '최근 1년 글로벌 매출 비중 20% 이상' 항목에서 구글 플레이 인앱결제만 포함인지, 외부 스토어 포함 여부가 궁금합니다.",
    likes: 34,
    comments: 12,
    views: 987,
    tag: "NEW",
    tagColor: "#4285F4",
  },
  {
    category: "네트워킹",
    categoryColor: "#FBBC05",
    author: "헬스박스 Korea",
    authorInitial: "H",
    authorBg: "linear-gradient(135deg, #FFEE56, #FFC2B4)",
    date: "2026.04.17",
    title: "동남아 현지 퍼블리셔 파트너십 찾고 있어요 — 협업 제안 환영합니다",
    desc: "베트남 호치민 기반 헬스케어 앱 운영 중입니다. 현지 마케팅 파트너 또는 공동 UA 캠페인 진행에 관심 있는 팀과 협업하고 싶습니다.",
    likes: 67,
    comments: 22,
    views: 1456,
    tag: null,
    tagColor: "",
  },
  {
    category: "성과 공유",
    categoryColor: "#20D6A2",
    author: "에듀플렉스",
    authorInitial: "E",
    authorBg: "linear-gradient(135deg, #18A343, #37AD9A)",
    date: "2026.04.15",
    title: "7기 수료 6개월 후 — 북미 교육 앱 시장 진출 성과 솔직 정리",
    desc: "창구 7기 수료 후 북미 K-12 교육 시장에 진입한 결과를 공유합니다. 유료 구독 전환율, LTV, 현지 에듀테크 VC 미팅 결과까지.",
    likes: 203,
    comments: 51,
    views: 4322,
    tag: "HOT",
    tagColor: "#FF4340",
  },
  {
    category: "정보 공유",
    categoryColor: "#4377F1",
    author: "페이루트 Dev",
    authorInitial: "P",
    authorBg: "linear-gradient(135deg, #4377F1, #16DBBB)",
    date: "2026.04.14",
    title: "2026 Google Play 개발자 정책 변경 요약 — 창구 참가 기업 필독",
    desc: "5월 시행되는 타겟 API 레벨 정책 변경, 인앱결제 정책 업데이트, 데이터 보안 섹션 강화 내용을 간략히 정리했습니다.",
    likes: 88,
    comments: 19,
    views: 2104,
    tag: "NEW",
    tagColor: "#4285F4",
  },
  {
    category: "구인/구직",
    categoryColor: "#EA4335",
    author: "루나소프트",
    authorInitial: "L",
    authorBg: "linear-gradient(135deg, #FF4340, #FF7C44)",
    date: "2026.04.12",
    title: "[채용] 글로벌 그로스 마케터 — 동남아·북미 UA 경험자 우대",
    desc: "창구 7기 수료 후 성장 중인 모바일 게임 스타트업입니다. 구글 UAC·메타·애플 캠페인 운영 경험자를 찾고 있습니다. 스톡옵션 포함.",
    likes: 29,
    comments: 14,
    views: 1789,
    tag: null,
    tagColor: "",
  },
];

const CATEGORIES = ["전체", "성과 공유", "질문/답변", "네트워킹", "정보 공유", "구인/구직"];

export function CommunitySection({ isDark = false }: CommunitySectionProps) {
  const th = getSectionTheme(isDark);
  const [activeCat, setActiveCat] = useState("전체");
  const filteredPosts = activeCat === "전체" ? posts : posts.filter((p) => p.category === activeCat);

  return (
    <section id="community-section" style={{
      position: "relative", width: "100vw", maxWidth: "100%",
      left: "50%", transform: "translateX(-50%)",
      padding: "clamp(60px, 10vw, 100px) clamp(20px, 5vw, 40px) clamp(70px, 11vw, 110px)",
      background: isDark
        ? "radial-gradient(circle at 50% 0%, rgba(255,238,86,0.04) 0%, transparent 50%), linear-gradient(180deg, #0e1628 0%, #0a1020 100%)"
        : "radial-gradient(circle at 50% 0%, rgba(255,238,86,0.06) 0%, transparent 50%), linear-gradient(180deg, #F0F2F8 0%, #F7F8FC 100%)",
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
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "40px", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <h2 style={{ color: th.headingColor, fontSize: "clamp(24px,3vw,40px)", fontWeight: 800, margin: "0 0 8px", letterSpacing: "-1.2px", lineHeight: 1.15 }}>
              최신 게시물
            </h2>
            <p style={{ color: th.subText, fontSize: "14px", margin: 0 }}>
              창구 프로그램 참가·수료 기업의 성과 공유, 네트워킹, 정보 교류 공간입니다.
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <Link to="/blog" style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              color: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.5)",
              fontSize: "13px", fontWeight: 700, textDecoration: "none",
              padding: "8px 16px", background: th.tagBg,
              border: `1px solid ${th.tagBorder}`, borderRadius: "100px",
            }}>
              전체보기
            </Link>
            <button style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              color: "#fff", fontSize: "13px", fontWeight: 700,
              padding: "8px 16px",
              background: isDark ? "rgba(255,238,86,0.15)" : "#FBBC05",
              border: isDark ? "1px solid rgba(255,238,86,0.3)" : "none",
              borderRadius: "100px", cursor: "pointer",
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={isDark ? "#FBBC05" : "#fff"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              <span style={{ color: isDark ? "#FBBC05" : "#fff" }}>글쓰기</span>
            </button>
          </div>
        </div>

        {/* Category filter pills */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "28px" }}>
          {CATEGORIES.map((cat) => {
            const active = cat === activeCat;
            return (
              <button key={cat} onClick={() => setActiveCat(cat)} style={{
                fontSize: "12px", fontWeight: 700,
                padding: "6px 14px", borderRadius: "100px",
                background: active ? "#FBBC05" : th.pillBg,
                border: active ? "none" : `1px solid ${th.pillBorder}`,
                color: active ? "#fff" : th.pillText,
                cursor: "pointer",
                transition: "background 0.2s ease, color 0.2s ease",
              }}>
                {cat}
              </button>
            );
          })}
        </div>

        {/* Posts grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: "16px" }}>
          {filteredPosts.map((post, i) => (
            <CommunityCard key={`${activeCat}-${i}`} post={post} isDark={isDark} th={th} />
          ))}
          {filteredPosts.length === 0 && (
            <div style={{ gridColumn: "1 / -1", padding: "60px 20px", textAlign: "center", color: th.mutedText, fontSize: "13px" }}>
              해당 카테고리의 게시물이 아직 없습니다.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function CommunityCard({ post, isDark, th }: { post: typeof posts[0]; isDark: boolean; th: ReturnType<typeof getSectionTheme> }) {
  return (
    <div
      style={{
        background: th.cardBg, border: `1px solid ${th.cardBorder}`,
        borderRadius: "18px", padding: "22px 24px",
        boxShadow: th.cardShadow, display: "flex", flexDirection: "column", gap: "12px",
        cursor: "pointer",
        transition: "transform 0.25s ease, box-shadow 0.25s ease",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = isDark ? "0 8px 28px rgba(0,0,0,0.35)" : "0 8px 28px rgba(0,0,0,0.09)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = th.cardShadow;
      }}
    >
      {/* Top row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{
          fontSize: "10px", fontWeight: 800, letterSpacing: "0.5px",
          color: post.categoryColor,
          background: `${post.categoryColor}15`,
          border: `1px solid ${post.categoryColor}35`,
          padding: "3px 8px", borderRadius: "6px",
        }}>{post.category}</span>
        {post.tag && (
          <span style={{
            fontSize: "10px", fontWeight: 800, letterSpacing: "0.5px",
            color: "#fff", background: post.tagColor,
            padding: "3px 8px", borderRadius: "5px",
          }}>{post.tag}</span>
        )}
      </div>

      {/* Title & desc */}
      <div>
        <h4 style={{ color: th.itemTitle, fontSize: "14px", fontWeight: 800, margin: "0 0 8px", lineHeight: 1.4, letterSpacing: "-0.2px" }}>
          {post.title}
        </h4>
        <p style={{ color: th.itemDesc, fontSize: "12px", margin: 0, lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {post.desc}
        </p>
      </div>

      {/* Author + Meta */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "10px", borderTop: `1px solid ${th.rowDivider}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{
            width: "28px", height: "28px", borderRadius: "50%",
            background: post.authorBg,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "11px", fontWeight: 800, color: "#fff",
            flexShrink: 0,
          }}>
            {post.authorInitial}
          </div>
          <div>
            <div style={{ color: th.itemTitle, fontSize: "12px", fontWeight: 700 }}>{post.author}</div>
            <div style={{ color: th.mutedText, fontSize: "10px" }}>{post.date}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          {[
            { icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>, val: post.likes },
            { icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>, val: post.comments },
            { icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>, val: post.views },
          ].map((m, j) => (
            <span key={j} style={{ display: "flex", alignItems: "center", gap: "3px", color: th.mutedText, fontSize: "11px" }}>
              {m.icon}
              {m.val >= 1000 ? `${(m.val / 1000).toFixed(1)}k` : m.val}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
