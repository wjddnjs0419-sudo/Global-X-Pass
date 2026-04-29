import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { PageShell } from "../components/PageShell";
import { useTheme } from "../ThemeContext";
import { supabase } from "../../lib/supabaseClient";
import { LoadingSpinner, ErrorMessage } from "../components/LoadingSpinner";
import { isImage } from "../../utils/file";
import { cleanText } from "../../utils/text";
import type { Post } from "../../lib/types";

const BLOG_COLOR = "#A855F7";

function readingMinutes(content: string) {
  const words = cleanText(content).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export function BlogPage() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeTag, setActiveTag] = useState("전체");

  const cardBg = isDark ? "rgba(255,255,255,0.04)" : "#ffffff";
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const textMain = isDark ? "rgba(255,255,255,0.92)" : "#0f172a";
  const textMuted = isDark ? "rgba(255,255,255,0.45)" : "rgba(15,23,42,0.5)";

  useEffect(() => {
    supabase
      .from("posts")
      .select("*")
      .eq("category", "blog")
      .order("created_at", { ascending: false })
      .then(({ data, error: err }) => {
        if (err) setError(true);
        else setPosts((data as Post[]) || []);
        setLoading(false);
      });
  }, []);

  const featured = posts.find(p => p.is_featured) ?? posts[0] ?? null;
  const allTags = [...new Set(posts.map(p => p.tags).filter(Boolean))] as string[];
  const filteredPosts = posts
    .filter(p => p.id !== featured?.id)
    .filter(p => {
      if (activeTag === "전체") return true;
      return p.tags === activeTag;
    });

  return (
    <PageShell title="블로그" subtitle="NCF와 Around X가 전하는 다양한 인사이트와 비즈니스 이야기를 만나보세요." accentColor="#A855F7">
      <div className="max-w-[1200px] mx-auto pb-[100px]">
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorMessage />
        ) : posts.length === 0 ? (
          <p className="text-center text-gray-500 py-[100px]">등록된 게시물이 없습니다.</p>
        ) : (
          <>
            {/* Featured banner */}
            {featured && (() => {
              const attachmentImages = featured.image_url?.split(",").filter(isImage) || [];
              const thumbnailUrl = attachmentImages[0] ?? (featured.content?.match(/<img[^>]+src="([^">]+)"/) || [])[1];
              const mins = readingMinutes(featured.content);
              const tagColor = BLOG_COLOR;
              return (
                <div
                  onClick={() => navigate(`/post/${featured.id}`)}
                  className="rounded-3xl overflow-hidden mb-10 cursor-pointer transition-transform duration-200 hover:-translate-y-1"
                  style={{
                    background: thumbnailUrl
                      ? `linear-gradient(rgba(10,18,38,0.82), rgba(10,18,38,0.88)), url(${thumbnailUrl}) center/cover no-repeat`
                      : "linear-gradient(135deg, #0f172a 0%, #1a2845 100%)",
                    padding: "clamp(28px,5vw,48px)",
                    minHeight: 220,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: 20,
                  }}
                >
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {featured.is_featured && (
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#FBBC05", background: "rgba(251,188,5,0.15)", padding: "4px 12px", borderRadius: 99 }}>
                        ★ 추천 아티클
                      </span>
                    )}
                    {featured.tags && (
                      <span style={{ fontSize: 12, fontWeight: 700, color: tagColor, background: tagColor + "22", padding: "4px 12px", borderRadius: 99 }}>
                        {featured.tags}
                      </span>
                    )}
                  </div>
                  <div>
                    <h2 style={{ margin: "0 0 12px", fontSize: "clamp(20px,3vw,32px)", fontWeight: 900, color: "#fff", lineHeight: 1.3, maxWidth: 700 }}>
                      {featured.title}
                    </h2>
                    <p style={{ margin: "0 0 20px", fontSize: 15, color: "rgba(255,255,255,0.7)", lineHeight: 1.65, maxWidth: 600, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" } as React.CSSProperties}>
                      {cleanText(featured.content)}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                      <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
                        NCF 리서치팀 &nbsp;·&nbsp; {new Date(featured.created_at).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }).replace(/ /g, "")} &nbsp;·&nbsp; 읽기 {mins}분
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#A855F7" }}>읽기 →</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Tag filter */}
            {allTags.length > 0 && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 32 }}>
                {["전체", ...allTags].map(tag => (
                  <button
                    key={tag}
                    onClick={() => setActiveTag(tag)}
                    style={{
                      padding: "8px 18px", borderRadius: 99, border: "none", cursor: "pointer",
                      fontWeight: 700, fontSize: 14,
                      background: activeTag === tag
                        ? BLOG_COLOR
                        : (isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)"),
                      color: activeTag === tag ? "#fff" : textMuted,
                      transition: "all 0.15s",
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredPosts.map((post) => {
                const attachmentImages = post.image_url?.split(",").filter(isImage) || [];
                const thumbnailUrl = attachmentImages[0] ?? (post.content?.match(/<img[^>]+src="([^">]+)"/) || [])[1];
                const mins = readingMinutes(post.content);
                const tagColor = BLOG_COLOR;
                const dateStr = new Date(post.created_at).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }).replace(/ /g, "");

                return (
                  <div
                    key={post.id}
                    onClick={() => navigate(`/post/${post.id}`)}
                    className="rounded-3xl overflow-hidden cursor-pointer transition-transform duration-200 hover:-translate-y-1.5 flex flex-col"
                    style={{ background: cardBg, border: `1px solid ${border}`, boxShadow: isDark ? "none" : "0 2px 12px rgba(0,0,0,0.05)" }}
                  >
                    {thumbnailUrl && (
                      <div style={{ height: 160, overflow: "hidden", background: isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9" }}>
                        <img src={thumbnailUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                      </div>
                    )}
                    <div style={{ padding: "18px 20px 22px", flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        {post.tags ? (
                          <span style={{ fontSize: 11, fontWeight: 700, color: tagColor, background: tagColor + "18", padding: "3px 10px", borderRadius: 99 }}>
                            {post.tags}
                          </span>
                        ) : (
                          <span style={{ fontSize: 11, fontWeight: 700, color: BLOG_COLOR, background: "rgba(168,85,247,0.1)", padding: "3px 10px", borderRadius: 99 }}>인사이트</span>
                        )}
                        <span style={{ fontSize: 11, color: textMuted }}>{mins}분 읽기</span>
                      </div>
                      <h2
                        style={{ margin: 0, fontSize: 16, fontWeight: 800, color: textMain, lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" } as React.CSSProperties}
                      >
                        {post.title}
                      </h2>
                      <p
                        style={{ margin: 0, fontSize: 13, color: textMuted, lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" } as React.CSSProperties}
                      >
                        {cleanText(post.content)}
                      </p>
                      <div style={{ fontSize: 12, color: textMuted, marginTop: "auto", paddingTop: 6 }}>
                        NCF 팀 &nbsp;·&nbsp; {dateStr}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </PageShell>
  );
}
