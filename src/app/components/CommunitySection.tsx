import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { getSectionTheme } from "../utils/sectionTheme";
import { supabase } from "../../lib/supabaseClient";

interface CommunitySectionProps { isDark?: boolean; }

const CAT_MAP: Record<string, any> = {
  notice: { label: "공지사항", color: "#FF4340", bg: "linear-gradient(135deg, #FF4340, #FF7C44)" },
  news: { label: "인사이트", color: "#FBBC05", bg: "linear-gradient(135deg, #FFEE56, #FFC2B4)" },
  blog: { label: "블로그", color: "#A855F7", bg: "linear-gradient(135deg, #A855F7, #D8B4FE)" },
  events: { label: "행사소식", color: "#20D6A2", bg: "linear-gradient(135deg, #20D6A2, #BEFFF9)" },
  "events-archive": { label: "행사소식", color: "#20D6A2", bg: "linear-gradient(135deg, #20D6A2, #BEFFF9)" },
  resources: { label: "자료실", color: "#4377F1", bg: "linear-gradient(135deg, #4377F1, #16DBBB)" },
  faq: { label: "FAQ", color: "#9CA3AF", bg: "linear-gradient(135deg, #9CA3AF, #D1D5DB)" }
};

const TABS = [
  { id: "all", label: "전체", path: "" },
  { id: "notice", label: "공지사항", path: "/notice" },
  { id: "news", label: "인사이트", path: "/news" },
  { id: "blog", label: "블로그", path: "/blog" },
  { id: "events", label: "행사소식", path: "/events" },
  { id: "resources", label: "자료실", path: "/resources" },
];

const POSTS_PER_TAB = 8; 

export function CommunitySection({ isDark = false }: CommunitySectionProps) {
  const th = getSectionTheme(isDark);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("all");
  
  const [displayPosts, setDisplayPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTabPosts = async () => {
      setLoading(true);
      
      let query = supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(POSTS_PER_TAB);

      if (activeTab === "notice") {
        query = query.eq("category", "notice");
      } else if (activeTab === "news") {
        query = query.eq("category", "news");
      } else if (activeTab === "blog") {
        query = query.eq("category", "blog");
      } else if (activeTab === "events") {
        query = query.in("category", ["events", "events-archive"]);
      } else if (activeTab === "resources") {
        query = query.eq("category", "resources");
      }

      const { data } = await query;
      setDisplayPosts(data || []);
      setLoading(false);
    };

    fetchTabPosts();
  }, [activeTab]);

  const currentTabInfo = TABS.find(t => t.id === activeTab);

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
            {activeTab !== "all" && currentTabInfo?.path && (
              <Link to={currentTabInfo.path} style={{
                display: "inline-flex", alignItems: "center", gap: "6px",
                color: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.5)",
                fontSize: "13px", fontWeight: 700, textDecoration: "none",
                padding: "8px 16px", background: th.tagBg,
                border: `1px solid ${th.tagBorder}`, borderRadius: "100px",
                transition: "all 0.2s"
              }}>
                {currentTabInfo.label} 전체보기
              </Link>
            )}
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "28px" }}>
          {TABS.map((tab) => {
            const active = tab.id === activeTab;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                fontSize: "12px", fontWeight: 700,
                padding: "6px 14px", borderRadius: "100px",
                background: active ? "#FBBC05" : th.pillBg,
                border: active ? "none" : `1px solid ${th.pillBorder}`,
                color: active ? "#fff" : th.pillText,
                cursor: "pointer", transition: "background 0.2s ease, color 0.2s ease",
              }}>
                {tab.label}
              </button>
            );
          })}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: "16px" }}>
          {loading ? (
             <div style={{ gridColumn: "1 / -1", padding: "60px 0", textAlign: "center", color: th.mutedText }}>데이터를 불러오는 중입니다...</div>
          ) : displayPosts.map((post) => (
            <CommunityCard key={post.id} post={post} isDark={isDark} th={th} onClick={() => navigate(`/post/${post.id}`)} />
          ))}
          {!loading && displayPosts.length === 0 && (
            <div style={{ gridColumn: "1 / -1", padding: "60px 20px", textAlign: "center", color: th.mutedText, fontSize: "14px" }}>
              해당 카테고리에 등록된 게시물이 없습니다.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function CommunityCard({ post, isDark, th, onClick }: { post: any; isDark: boolean; th: any; onClick: () => void }) {
  const meta = CAT_MAP[post.category] || CAT_MAP.notice;
  
  // 💡 [핵심] 정규식을 활용하여 HTML 태그(<p>, <img> 등)를 완벽하게 제거하고 순수 텍스트만 뽑아냅니다!
  const plainTextContent = post.content 
    ? post.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() 
    : "";

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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{
          fontSize: "10px", fontWeight: 800, letterSpacing: "0.5px",
          color: meta.color, background: `${meta.color}15`,
          border: `1px solid ${meta.color}35`, padding: "3px 8px", borderRadius: "6px",
        }}>{meta.label}</span>
      </div>

      <div style={{ flex: 1 }}>
        <h4 style={{ color: th.itemTitle, fontSize: "14px", fontWeight: 800, margin: "0 0 8px", lineHeight: 1.4, letterSpacing: "-0.2px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {post.title}
        </h4>
        {/* 💡 정제된 순수 텍스트(plainTextContent)를 출력합니다. 내용이 없으면 안내 문구 출력 */}
        <p style={{ color: th.itemDesc, fontSize: "12px", margin: 0, lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {plainTextContent || "이미지 또는 첨부파일이 포함된 게시물입니다."}
        </p>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "12px", borderTop: `1px solid ${th.rowDivider}` }}>
        <div style={{ color: th.mutedText, fontSize: "12px", fontWeight: 500 }}>
          {new Date(post.created_at).toLocaleDateString()}
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
           <span style={{ display: "flex", alignItems: "center", gap: "4px", color: th.mutedText, fontSize: "12px", fontWeight: 500 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              {post.views || 0}
            </span>
        </div>
      </div>
    </div>
  );
}