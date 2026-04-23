import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { PageShell } from "../components/PageShell";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { useTheme } from "../ThemeContext";
import { supabase } from "../../lib/supabaseClient";

export function NewsPage() {
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
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('category', 'news')
        .order('created_at', { ascending: false });

      if (!error) setPosts(data || []);
      setLoading(false);
    };
    fetchPosts();
  }, []);

  return (
    <PageShell title="뉴스레터" subtitle="새로운 소식을 확인하세요.">
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {loading ? (
          <p style={{ color: textMuted }}>소식을 불러오는 중...</p>
        ) : posts.length === 0 ? (
          <p style={{ color: textMuted }}>등록된 뉴스가 없습니다.</p>
        ) : (
          posts.map((post) => (
            <div 
              key={post.id} 
              onClick={() => navigate(`/post/${post.id}`)}
              style={{ 
                background: card, 
                border: `1px solid ${border}`, 
                borderRadius: 24, // 💡 둥글기 증가
                overflow: "hidden", 
                display: "grid", 
                gridTemplateColumns: "minmax(200px, 280px) 1fr auto", // 💡 이미지 비율 조정
                gap: 0, 
                alignItems: "stretch",
                cursor: "pointer",
                transition: "transform 0.2s ease, box-shadow 0.2s ease", // 💡 호버 애니메이션 준비
              }}
              // 💡 마우스를 올렸을 때 카드가 살짝 떠오르는 효과
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = isDark ? "0 12px 24px rgba(0,0,0,0.4)" : "0 12px 24px rgba(0,0,0,0.06)";
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
                {/* 💡 1. 태그와 날짜 영역 복구 */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <span style={{ padding: "4px 10px", background: "rgba(67, 119, 241, 0.1)", color: "#4377F1", fontSize: 13, fontWeight: 700, borderRadius: 6 }}>
                    NEWS
                  </span>
                  <span style={{ fontSize: 14, color: textMuted }}>
                    {new Date(post.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                <h2 style={{ margin: "0 0 12px", fontSize: 24, fontWeight: 800, color: textMain, letterSpacing: "-0.02em" }}>
                  {post.title}
                </h2>
                
                {/* 💡 2. 긴 본문 깔끔하게 자르기 (2줄까지만 보이고 ... 처리) */}
                <p style={{ 
                  margin: 0, 
                  fontSize: 15, 
                  color: textMuted, 
                  lineHeight: 1.6, 
                  display: "-webkit-box", 
                  WebkitLineClamp: 2, 
                  WebkitBoxOrient: "vertical", 
                  overflow: "hidden" 
                }}>
                  {post.content}
                </p>
              </div>

              <div style={{ 
                minWidth: 200, 
                background: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.01)", 
                borderLeft: `1px solid ${border}`, 
                padding: "32px 24px", 
                display: "flex", 
                flexDirection: "column", 
                justifyContent: "center" 
              }}>
                 <button 
                  style={{ 
                    padding: "14px", 
                    borderRadius: 12, 
                    border: "none", 
                    background: "#4377F1", 
                    color: "#fff", 
                    fontSize: 15,
                    fontWeight: 700, 
                    cursor: "pointer",
                    width: "100%"
                  }}
                 >
                   자세히 보기
                 </button>
              </div>
            </div>
          ))
        )}
      </div>
    </PageShell>
  );
}