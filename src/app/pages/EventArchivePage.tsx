import { useEffect, useState } from "react";
import { Link } from "react-router";
import { supabase } from "../../lib/supabaseClient";
import { PageShell } from "../components/PageShell";
import { useTheme } from "../ThemeContext";

export function EventArchivePage() {
  const { isDark } = useTheme();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ── 일관된 디자인 스타일 설정 ──
  const card = isDark ? "rgba(255,255,255,0.04)" : "#ffffff";
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const textMain = isDark ? "rgba(255,255,255,0.92)" : "#0f172a";

  useEffect(() => {
    const fetchPosts = async () => {
      // 💡 'posts' 테이블에서 'events-archive' 카테고리 데이터만 가져옵니다.
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('category', 'events-archive') 
        .order('created_at', { ascending: false });

      if (data) setPosts(data);
      setLoading(false);
    };

    fetchPosts();
  }, []);

  return (
    <PageShell 
      title="행사 아카이브" 
      subtitle="NCF와 함께했던 지난 행사들의 기록을 확인해 보세요."
    >
      <div style={{ maxWidth: 800, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px", color: textMain }}>아카이브 데이터를 불러오는 중입니다...</div>
        ) : posts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "100px 0", color: "gray", background: card, borderRadius: 20, border: `1px solid ${border}` }}>
            <div style={{ fontSize: "40px", marginBottom: "16px" }}>📁</div>
            <p>아직 기록된 행사 아카이브가 없습니다.</p>
          </div>
        ) : (
          posts.map((post) => (
            <Link 
              key={post.id} 
              to={`/post/${post.id}`} 
              style={{ 
                background: card, border: `1px solid ${border}`, borderRadius: 20, 
                padding: "24px", display: "flex", gap: 24, textDecoration: "none",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-4px)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
            >
              {post.image_url && (
                <img 
                  src={post.image_url} 
                  alt="" 
                  style={{ width: 140, height: 100, objectFit: "cover", borderRadius: 12 }} 
                />
              )}
              
              <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <strong style={{ display: "block", fontSize: "19px", color: textMain, marginBottom: 10, fontWeight: 700 }}>
                  {post.title}
                </strong>
                <p style={{ 
                  margin: 0, fontSize: "15px", color: "gray", lineHeight: "1.6",
                  display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" 
                }}>
                  {post.content}
                </p>
                <div style={{ marginTop: 14, fontSize: "13px", color: "rgba(128,128,128,0.6)" }}>
                  {new Date(post.created_at).toLocaleDateString()}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </PageShell>
  );
}