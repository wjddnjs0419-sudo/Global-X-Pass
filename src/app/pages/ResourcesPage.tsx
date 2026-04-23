import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { PageShell } from "../components/PageShell";
import { useTheme } from "../ThemeContext";
import { supabase } from "../../lib/supabaseClient";

export function ResourcesPage() {
  const { isDark } = useTheme();
  const navigate = useNavigate(); 
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true); // 💡 로딩 상태 추가

  // ── 앞선 게시판들과 통일된 스타일 변수 ──
  const card = isDark ? "rgba(255,255,255,0.04)" : "#ffffff";
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const textMain = isDark ? "rgba(255,255,255,0.92)" : "#0f172a";

  useEffect(() => {
    const fetchPosts = async () => {
      // 💡 'resources' 카테고리 데이터만 최신순으로 가져옵니다.
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
    <PageShell title="자료실" subtitle="NCF의 주요 서식과 참고 자료를 확인하고 다운로드하세요.">
      <div style={{ maxWidth: 800, margin: "0 auto", display: "flex", flexDirection: "column", gap: 12 }}>
        
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px", color: textMain }}>자료를 불러오는 중입니다...</div>
        ) : posts.length === 0 ? (
          // 💡 자료가 없을 때의 피드백 추가
          <div style={{ textAlign: "center", padding: "100px 0", color: "gray", background: card, borderRadius: 20, border: `1px solid ${border}` }}>
            <div style={{ fontSize: "40px", marginBottom: "16px" }}>📂</div>
            <p>등록된 자료가 없습니다.</p>
          </div>
        ) : (
          posts.map((post) => (
            <div 
              key={post.id} 
              onClick={() => navigate(`/post/${post.id}`)}
              style={{ 
                background: card, 
                border: `1px solid ${border}`, 
                borderRadius: 16, padding: "24px 32px", cursor: "pointer", display: "flex", 
                justifyContent: "space-between", alignItems: "center", transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div>
                <h2 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 700, color: textMain }}>{post.title}</h2>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                   <span style={{ fontSize: 13, color: "gray" }}>{new Date(post.created_at).toLocaleDateString()}</span>
                   {/* 내용이 있다면 살짝 보여주기 */}
                   {post.content && (
                     <span style={{ fontSize: 13, color: "rgba(128,128,128,0.5)", borderLeft: "1px solid #ddd", paddingLeft: 12 }}>
                       상세 정보 확인
                     </span>
                   )}
                </div>
              </div>
              <div style={{ color: "#4377F1", background: "rgba(67, 119, 241, 0.08)", padding: 10, borderRadius: 12 }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
              </div>
            </div>
          ))
        )}
      </div>
    </PageShell>
  );
}