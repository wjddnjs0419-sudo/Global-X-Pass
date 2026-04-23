import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { PageShell } from "../components/PageShell";
import { useTheme } from "../ThemeContext";
import { supabase } from "../../lib/supabaseClient";

export function NoticePage() {
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
      const { data } = await supabase.from('posts').select('*').eq('category', 'notice').order('created_at', { ascending: false });
      setPosts(data || []);
      setLoading(false);
    };
    fetchPosts();
  }, []);

  return (
    <PageShell title="공지사항" subtitle="중요한 안내 사항을 확인하세요.">
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {loading ? (
          <p style={{ color: textMuted }}>공지사항을 불러오는 중...</p>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              onClick={() => navigate(`/post/${post.id}`)}
              style={{
                background: card, border: `1px solid ${border}`, borderRadius: 24,
                overflow: "hidden", display: "flex", flexDirection: "column",
                cursor: "pointer", transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = isDark ? "0 12px 24px rgba(0,0,0,0.4)" : "0 12px 24px rgba(0,0,0,0.06)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{ padding: "32px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <span style={{ padding: "4px 10px", background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", fontSize: 13, fontWeight: 700, borderRadius: 6 }}>
                    NOTICE
                  </span>
                  <span style={{ fontSize: 14, color: textMuted }}>{new Date(post.created_at).toLocaleDateString()}</span>
                </div>
                <h2 style={{ margin: "0 0 12px", fontSize: 22, fontWeight: 800, color: textMain }}>{post.title}</h2>
                <p style={{ margin: 0, fontSize: 15, color: textMuted, lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
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