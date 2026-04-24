import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { PageShell } from "../components/PageShell";
import { useTheme } from "../ThemeContext";
import { supabase } from "../../lib/supabaseClient";

export function ResourcesPage() {
  const { isDark } = useTheme();
  const navigate = useNavigate(); 
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const card = isDark ? "rgba(255,255,255,0.04)" : "#ffffff";
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const textMain = isDark ? "rgba(255,255,255,0.92)" : "#0f172a";

  useEffect(() => {
    const fetchPosts = async () => {
      const { data } = await supabase
        .from('posts')
        .select('*')
        .eq('category', 'resources')
        .order('created_at', { ascending: false });
      
      setPosts(data || []);
      setLoading(false);
    };
    fetchPosts();
  }, []);

  return (
    <PageShell title="자료실" subtitle="NCF와 Around X가 제공하는 필수 서식과 가이드 자료를 다운로드하세요.">
      <div style={{ maxWidth: 900, margin: "0 auto", paddingBottom: 100 }}>
        {loading ? (
          <p style={{ textAlign: "center", color: "gray", padding: "100px 0" }}>데이터를 불러오는 중입니다...</p>
        ) : posts.length === 0 ? (
          <p style={{ textAlign: "center", color: "gray", padding: "100px 0" }}>등록된 자료가 없습니다.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {posts.map((post) => (
              <div 
                key={post.id}
                onClick={() => navigate(`/post/${post.id}`)}
                style={{ 
                  background: card, border: `1px solid ${border}`, borderRadius: 16, 
                  padding: "24px 30px", display: "flex", alignItems: "center", justifyContent: "space-between",
                  cursor: "pointer", transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h2 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 700, color: textMain, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {post.title}
                  </h2>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                     <span style={{ fontSize: 13, color: "gray" }}>{new Date(post.created_at).toLocaleDateString()}</span>
                     {post.content && (
                       <span style={{ fontSize: 13, color: "rgba(128,128,128,0.5)", borderLeft: "1px solid #ddd", paddingLeft: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                         {/* 💡 자료실 미리보기 텍스트 태그 제거 */}
                         {(post.content || "").replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()}
                       </span>
                     )}
                  </div>
                </div>
                <div style={{ color: "#4377F1", background: "rgba(67, 119, 241, 0.08)", padding: 10, borderRadius: 12, marginLeft: 20 }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}