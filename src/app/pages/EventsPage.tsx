import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { PageShell } from "../components/PageShell";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { useTheme } from "../ThemeContext";
import { supabase } from "../../lib/supabaseClient";

export function EventsPage() {
  const { isDark } = useTheme();
  const navigate = useNavigate(); 
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const card = isDark ? "rgba(255,255,255,0.04)" : "#ffffff";
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)";
  const textMain = isDark ? "rgba(255,255,255,0.92)" : "#0f172a";
  const textMuted = isDark ? "rgba(255,255,255,0.45)" : "rgba(15,23,42,0.45)";

  useEffect(() => {
    const fetchPosts = async () => {
      const { data } = await supabase
        .from('posts')
        .select('*')
        .eq('category', 'events')
        .order('created_at', { ascending: false });
      setPosts(data || []);
      setLoading(false);
    };
    fetchPosts();
  }, []);

  return (
    <PageShell title="행사" subtitle="NCF × Around X가 준비한 소식을 확인하세요.">
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {loading ? (
          <p style={{ color: textMuted }}>행사 정보를 불러오는 중...</p>
        ) : (
          posts.map((post) => (
            <div 
              key={post.id} 
              onClick={() => navigate(`/post/${post.id}`)}
              style={{ 
                background: card, border: `1px solid ${border}`, borderRadius: 24, 
                overflow: "hidden", display: "grid", gridTemplateColumns: "minmax(200px, 280px) 1fr auto", 
                cursor: "pointer", transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 12px 24px rgba(0,0,0,0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{ height: "100%", minHeight: 220 }}>
                <ImageWithFallback src={post.image_url} alt={post.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <div style={{ padding: "32px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <span style={{ padding: "4px 10px", background: "rgba(67, 119, 241, 0.1)", color: "#4377F1", fontSize: 13, fontWeight: 700, borderRadius: 6 }}>
                    EVENT
                  </span>
                  <span style={{ fontSize: 14, color: textMuted }}>{new Date(post.created_at).toLocaleDateString()}</span>
                </div>
                <h2 style={{ margin: "0 0 12px", fontSize: 24, fontWeight: 800, color: textMain }}>{post.title}</h2>
                <p style={{ margin: 0, fontSize: 15, color: textMuted, lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {post.content}
                </p>
              </div>
              <div style={{ minWidth: 200, background: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.01)", borderLeft: `1px solid ${border}`, padding: "32px 24px", display: "flex", alignItems: "center" }}>
                 <button style={{ padding: "14px", borderRadius: 12, border: "none", background: "#4377F1", color: "#fff", fontWeight: 700, cursor: "pointer", width: "100%" }}>
                   신청하기
                 </button>
              </div>
            </div>
          ))
        )}
      </div>
    </PageShell>
  );
}