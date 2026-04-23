import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { PageShell } from "../components/PageShell";
import { useTheme } from "../ThemeContext";
import { supabase } from "../../lib/supabaseClient";

export function ResourcesPage() {
  const { isDark } = useTheme();
  const navigate = useNavigate(); 
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    const fetchPosts = async () => {
      const { data } = await supabase.from('posts').select('*').eq('category', 'resources').order('created_at', { ascending: false });
      setPosts(data || []);
    };
    fetchPosts();
  }, []);

  return (
    <PageShell title="자료실" subtitle="필요한 서식과 자료를 다운로드하세요.">
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {posts.map((post) => (
          <div 
            key={post.id} 
            onClick={() => navigate(`/post/${post.id}`)}
            style={{ 
              background: isDark ? "rgba(255,255,255,0.04)" : "#ffffff", 
              border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)"}`, 
              borderRadius: 16, padding: "24px 32px", cursor: "pointer", display: "flex", 
              justifyContent: "space-between", alignItems: "center", transition: "all 0.2s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.07)" : "#fcfcfc"}
            onMouseLeave={(e) => e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.04)" : "#ffffff"}
          >
            <div>
              <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 700, color: isDark ? "#fff" : "#0f172a" }}>{post.title}</h2>
              <span style={{ fontSize: 13, color: "gray" }}>{new Date(post.created_at).toLocaleDateString()}</span>
            </div>
            <div style={{ color: "#4377F1" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
            </div>
          </div>
        ))}
      </div>
    </PageShell>
  );
}