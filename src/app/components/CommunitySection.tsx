import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { getSectionTheme } from "../utils/sectionTheme";
import { supabase } from "../../lib/supabaseClient";

interface CommunitySectionProps { isDark?: boolean; }

// 💡 DB 카테고리명을 UI 스타일로 변환하는 지도
const CAT_MAP: Record<string, any> = {
  notice: { label: "공지사항", color: "#FF4340", bg: "linear-gradient(135deg, #FF4340, #FF7C44)" },
  blog: { label: "인사이트", color: "#FBBC05", bg: "linear-gradient(135deg, #FFEE56, #FFC2B4)" },
  events: { label: "행사소식", color: "#20D6A2", bg: "linear-gradient(135deg, #20D6A2, #BEFFF9)" },
  resources: { label: "자료실", color: "#4377F1", bg: "linear-gradient(135deg, #4377F1, #16DBBB)" },
};

const CATEGORIES = ["전체", "공지사항", "인사이트", "행사소식", "자료실"];

export function CommunitySection({ isDark = false }: CommunitySectionProps) {
  const th = getSectionTheme(isDark);
  const navigate = useNavigate();
  const [activeCat, setActiveCat] = useState("전체");
  const [allPosts, setAllPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLatestPosts = async () => {
      // 💡 모든 게시판에서 최신순으로 6개를 가져옵니다.
      const { data } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(6);
      
      setAllPosts(data || []);
      setLoading(false);
    };
    fetchLatestPosts();
  }, []);

  // 💡 필터링 로직 (DB 카테고리와 한글 라벨 매칭)
  const filteredPosts = activeCat === "전체" 
    ? allPosts 
    : allPosts.filter(p => CAT_MAP[p.category]?.label === activeCat);

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
              통합 게시판에서 업데이트되는 모든 최신 소식을 확인하세요.
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
                cursor: "pointer", transition: "background 0.2s ease, color 0.2s ease",
              }}>
                {cat}
              </button>
            );
          })}
        </div>

        {/* Posts grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: "16px" }}>
          {loading ? (
             <div style={{ gridColumn: "1 / -1", padding: "60px 0", textAlign: "center", color: th.mutedText }}>불러오는 중...</div>
          ) : filteredPosts.map((post) => (
            <CommunityCard key={post.id} post={post} isDark={isDark} th={th} onClick={() => navigate(`/post/${post.id}`)} />
          ))}
          {!loading && filteredPosts.length === 0 && (
            <div style={{ gridColumn: "1 / -1", padding: "60px 20px", textAlign: "center", color: th.mutedText, fontSize: "13px" }}>
              해당 카테고리의 게시물이 아직 없습니다.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function CommunityCard({ post, isDark, th, onClick }: { post: any; isDark: boolean; th: any; onClick: () => void }) {
  // 💡 디자인을 위해 임의의 메타데이터 생성 (작성자 등)
  const meta = CAT_MAP[post.category] || CAT_MAP.notice;
  const initial = post.title.charAt(0);

  return (
    <div
      onClick={onClick}
      style={{
        background: th.cardBg, border: `1px solid ${th.cardBorder}`,
        borderRadius: "18px", padding: "22px 24px",
        boxShadow: th.cardShadow, display: "flex", flexDirection: "column", gap: "12px",
        cursor: "pointer", transition: "transform 0.25s ease, box-shadow 0.25s ease",
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
          color: meta.color, background: `${meta.color}15`,
          border: `1px solid ${meta.color}35`, padding: "3px 8px", borderRadius: "6px",
        }}>{meta.label}</span>
      </div>

      {/* Title & desc */}
      <div style={{ flex: 1 }}>
        <h4 style={{ color: th.itemTitle, fontSize: "14px", fontWeight: 800, margin: "0 0 8px", lineHeight: 1.4, letterSpacing: "-0.2px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {post.title}
        </h4>
        <p style={{ color: th.itemDesc, fontSize: "12px", margin: 0, lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {post.content}
        </p>
      </div>

      {/* Author + Meta (디자인 보존을 위한 생성 로직) */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "10px", borderTop: `1px solid ${th.rowDivider}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{
            width: "28px", height: "28px", borderRadius: "50%",
            background: meta.bg, display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "11px", fontWeight: 800, color: "#fff", flexShrink: 0,
          }}>
            {initial}
          </div>
          <div>
            <div style={{ color: th.itemTitle, fontSize: "12px", fontWeight: 700 }}>관리자</div>
            <div style={{ color: th.mutedText, fontSize: "10px" }}>{new Date(post.created_at).toLocaleDateString()}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
           <span style={{ display: "flex", alignItems: "center", gap: "3px", color: th.mutedText, fontSize: "11px" }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              {Math.floor(Math.random() * 500) + 50}
            </span>
        </div>
      </div>
    </div>
  );
}