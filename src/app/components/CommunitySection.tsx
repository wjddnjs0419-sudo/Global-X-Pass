import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { getSectionTheme, SectionTheme } from "../utils/sectionTheme";
import { supabase } from "../../lib/supabaseClient";
import { cleanText } from "../../utils/text";
import type { Post } from "../../lib/types";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

interface CommunitySectionProps { isDark?: boolean; }

type BadgeVariant = "default" | "secondary" | "destructive" | "outline" | "blue" | "green" | "yellow" | "red" | "purple" | "glass";

const CAT_MAP: Record<string, { label: string; variant: BadgeVariant }> = {
  notice:           { label: "공지사항", variant: "red"    },
  news:             { label: "인사이트", variant: "blue"   },
  blog:             { label: "블로그",   variant: "purple" },
  events:           { label: "행사소식", variant: "green"  },
  "events-archive": { label: "행사소식", variant: "green"  },
  resources:        { label: "자료실",   variant: "blue"   },
  faq:              { label: "FAQ",      variant: "yellow" },
};

const TABS = [
  { id: "all",       label: "전체",    path: "" },
  { id: "notice",    label: "공지사항", path: "/notice" },
  { id: "news",      label: "인사이트", path: "/news" },
  { id: "blog",      label: "블로그",   path: "/blog" },
  { id: "events",    label: "행사소식", path: "/events" },
  { id: "resources", label: "자료실",  path: "/resources" },
];

const POSTS_PER_TAB = 8;

export function CommunitySection({ isDark = false }: CommunitySectionProps) {
  const th = getSectionTheme(isDark);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("all");
  const [displayPosts, setDisplayPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTabPosts = async () => {
      setLoading(true);

      let query = supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(POSTS_PER_TAB);

      if (activeTab === "events") {
        query = query.in("category", ["events", "events-archive"]);
      } else if (activeTab !== "all") {
        query = query.eq("category", activeTab);
      }

      const { data } = await query;
      setDisplayPosts((data as Post[]) || []);
      setLoading(false);
    };

    fetchTabPosts();
  }, [activeTab]);

  const currentTabInfo = TABS.find((t) => t.id === activeTab);

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
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0, backgroundImage: `radial-gradient(${th.dotGrid} 1px, transparent 1px)`, backgroundSize: "36px 36px" }} />

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

          {activeTab !== "all" && currentTabInfo?.path && (
            <Button variant="outline" shape="pill" size="sm" asChild className={isDark ? "border-white/20 text-white/70" : "border-black/20 text-black/70"}>
              <Link to={currentTabInfo.path}>
                {currentTabInfo.label} 전체보기
              </Link>
            </Button>
          )}
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "28px" }}>
          {TABS.map((tab) => {
            const active = tab.id === activeTab;
            return (
              <Button
                key={tab.id}
                variant={active ? "default" : "outline"}
                shape="pill"
                size="sm"
                onClick={() => setActiveTab(tab.id)}
                className={active 
                  ? "bg-[#A855F7] hover:bg-[#9333EA] border-transparent text-white shadow-[0_4px_12px_rgba(168,85,247,0.3)]" 
                  : (isDark ? "border-white/20 text-white/70 hover:bg-white/5" : "border-black/10 text-black/60 hover:bg-black/5")
                }
              >
                {tab.label}
              </Button>
            );
          })}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: "16px" }}>
          {loading ? (
            <div style={{ gridColumn: "1 / -1", padding: "60px 0", textAlign: "center", color: th.mutedText }}>
              데이터를 불러오는 중입니다...
            </div>
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

function CommunityCard({ post, isDark, th, onClick }: { post: Post; isDark: boolean; th: SectionTheme; onClick: () => void }) {
  const meta = CAT_MAP[post.category] ?? CAT_MAP.notice;
  const plainText = cleanText(post.content);

  return (
    <div
      onClick={onClick}
      style={{ background: th.cardBg, border: `1px solid ${th.cardBorder}`, borderRadius: "18px", padding: "22px 24px", boxShadow: th.cardShadow, display: "flex", flexDirection: "column", gap: "12px", cursor: "pointer", transition: "transform 0.25s ease, box-shadow 0.25s ease" }}
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
        <Badge variant={meta.variant} shape="pill" showDot>
          {meta.label}
        </Badge>
      </div>

      <div style={{ flex: 1 }}>
        <h4 style={{ color: th.itemTitle, fontSize: "14px", fontWeight: 800, margin: "0 0 8px", lineHeight: 1.4, letterSpacing: "-0.2px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {post.title}
        </h4>
        <p style={{ color: th.itemDesc, fontSize: "12px", margin: 0, lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {plainText || "이미지 또는 첨부파일이 포함된 게시물입니다."}
        </p>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "12px", borderTop: `1px solid ${th.rowDivider}` }}>
        <div style={{ color: th.mutedText, fontSize: "12px", fontWeight: 500 }}>
          {new Date(post.created_at).toLocaleDateString()}
        </div>
        <span style={{ display: "flex", alignItems: "center", gap: "4px", color: th.mutedText, fontSize: "12px", fontWeight: 500 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
          {post.views || 0}
        </span>
      </div>
    </div>
  );
}
