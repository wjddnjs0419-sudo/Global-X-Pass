import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { PageShell } from "../components/PageShell";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { useTheme } from "../ThemeContext";
import { supabase } from "../../lib/supabaseClient";

export function BlogPage() {
  const { isDark } = useTheme();
  const navigate = useNavigate(); 
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true); // 💡 로딩 상태 추가

  // ── 통합 디자인 시스템 스타일 ──
  const cardBg = isDark ? "rgba(255,255,255,0.04)" : "#ffffff";
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const textMain = isDark ? "rgba(255,255,255,0.92)" : "#0f172a";

  useEffect(() => {
    const fetchPosts = async () => {
      // 💡 'posts' 테이블에서 'blog' 카테고리만 최신순으로 가져옵니다.
      const { data } = await supabase
        .from('posts')
        .select('*')
        .eq('category', 'blog')
        .order('created_at', { ascending: false });
      
      setPosts(data || []);
      setLoading(false);
    };
    fetchPosts();
  }, []);

  return (
    <PageShell title="블로그" subtitle="NCF가 전하는 깊이 있는 인사이트와 블로그 이야기를 만나보세요.">
      {loading ? (
        <div style={{ textAlign: "center", padding: "100px 0", color: textMain }}>블로그를 불러오는 중입니다...</div>
      ) : posts.length === 0 ? (
        // 💡 게시물이 없을 때의 예외 처리 추가
        <div style={{ textAlign: "center", padding: "100px 0", color: "gray", background: cardBg, borderRadius: 24, border: `1px solid ${border}` }}>
          <div style={{ fontSize: "40px", marginBottom: "16px" }}>✍️</div>
          <p>아직 등록된 블로그 포스트가 없습니다.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 32 }}>
          {posts.map((post) => (
            <div 
              key={post.id} 
              onClick={() => navigate(`/post/${post.id}`)}
              style={{ 
                background: cardBg, 
                border: `1px solid ${border}`, 
                borderRadius: 24, overflow: "hidden", cursor: "pointer", 
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)" 
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-8px)";
                e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {/* 이미지 영역 */}
              <div style={{ height: 220, position: "relative", overflow: "hidden" }}>
                <ImageWithFallback 
                  src={post.image_url} 
                  alt={post.title} 
                  style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                />
              </div>

              {/* 콘텐츠 영역 */}
              <div style={{ padding: 28 }}>
                <div style={{ marginBottom: 16 }}>
                  <span style={{ 
                    padding: "6px 12px", background: "rgba(67, 119, 241, 0.1)", 
                    color: "#4377F1", fontSize: 12, fontWeight: 800, borderRadius: 8, letterSpacing: "0.5px"
                  }}>
                    INSIGHT
                  </span>
                </div>
                <h2 style={{ 
                  margin: "0 0 12px", fontSize: 20, fontWeight: 800, 
                  color: textMain, lineHeight: "1.4", height: "2.8em",
                  display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" 
                }}>
                  {post.title}
                </h2>
                <p style={{ 
                  margin: "0 0 20px", fontSize: 15, color: "gray", lineHeight: 1.6, 
                  display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" 
                }}>
                  {post.content}
                </p>
                <div style={{ fontSize: 13, color: "rgba(128,128,128,0.6)", fontWeight: 500 }}>
                  {new Date(post.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}