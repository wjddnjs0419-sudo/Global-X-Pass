import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { PageShell } from "../components/PageShell";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { useTheme } from "../ThemeContext";
import { supabase } from "../../lib/supabaseClient";

export function EventArchivePage() {
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
      const { data } = await supabase.from('posts').select('*').eq('category', 'events-archive').order('created_at', { ascending: false });
      setPosts(data || []);
      setLoading(false);
    };
    fetchPosts();
  }, []);

  return (
    <PageShell title="행사 아카이브" subtitle="지나간 행사의 기록을 확인하세요.">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 32 }}>
        {loading ? (
          <p style={{ color: textMuted }}>기록을 불러오는 중...</p>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              onClick={() => navigate(`/post/${post.id}`)}
              style={{
                background: card, border: `1px solid ${border}`, borderRadius: 24,
                overflow: "hidden", cursor: "pointer", transition: "all 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-6px)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "none"}
            >
              <div style={{ height: 200 }}>
                <ImageWithFallback src={post.image_url} alt={post.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <div style={{ padding: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <span style={{ padding: "4px 10px", background: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)", color: isDark ? "#e2e8f0" : "#475569", fontSize: 12, fontWeight: 700, borderRadius: 6 }}>
                    ARCHIVE
                  </span>
                  <span style={{ fontSize: 13, color: textMuted }}>{new Date(post.created_at).toLocaleDateString()}</span>
                </div>
                <h2 style={{ margin: "0 0 10px", fontSize: 20, fontWeight: 800, color: textMain }}>{post.title}</h2>
                <p style={{ margin: 0, fontSize: 14, color: textMuted, lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {post.content}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </PageShell>
  );
}