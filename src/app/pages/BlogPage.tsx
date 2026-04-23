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

  useEffect(() => {
    const fetchPosts = async () => {
      const { data } = await supabase.from('posts').select('*').eq('category', 'blog').order('created_at', { ascending: false });
      setPosts(data || []);
    };
    fetchPosts();
  }, []);

  return (
    <PageShell title="블로그" subtitle="다양한 인사이트와 이야기를 만나보세요.">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 32 }}>
        {posts.map((post) => (
          <div 
            key={post.id} 
            onClick={() => navigate(`/post/${post.id}`)}
            style={{ 
              background: isDark ? "rgba(255,255,255,0.04)" : "#ffffff", 
              border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)"}`, 
              borderRadius: 24, overflow: "hidden", cursor: "pointer", transition: "all 0.2s" 
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-6px)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "none"}
          >
            <div style={{ height: 200 }}>
              <ImageWithFallback src={post.image_url} alt={post.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div style={{ padding: 24 }}>
              <div style={{ marginBottom: 12 }}>
                <span style={{ padding: "4px 10px", background: "rgba(236, 72, 153, 0.1)", color: "#ec4899", fontSize: 12, fontWeight: 700, borderRadius: 6 }}>
                  INSIGHT
                </span>
              </div>
              <h2 style={{ margin: "0 0 10px", fontSize: 20, fontWeight: 800, color: isDark ? "#fff" : "#0f172a" }}>{post.title}</h2>
              <p style={{ margin: 0, fontSize: 14, color: "gray", lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                {post.content}
              </p>
            </div>
          </div>
        ))}
      </div>
    </PageShell>
  );
}