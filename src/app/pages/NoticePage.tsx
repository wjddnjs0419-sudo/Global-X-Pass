import { useEffect, useState } from "react";
import { Link } from "react-router";
import { supabase } from "../../lib/supabaseClient";
import { PageShell } from "../components/PageShell";
import { useTheme } from "../ThemeContext";

export function NoticePage() {
  const { isDark } = useTheme();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ── 사용자님의 AdminPage와 통일된 스타일 ──
  const card = isDark ? "rgba(255,255,255,0.04)" : "#ffffff";
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const textMain = isDark ? "rgba(255,255,255,0.92)" : "#0f172a";

  useEffect(() => {
    const fetchPosts = async () => {
      // 💡 'posts' 테이블에서 'notice' 카테고리만 최신순으로 가져옵니다.
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('category', 'notice') 
        .order('created_at', { ascending: false });

      if (data) setPosts(data);
      setLoading(false);
    };

    fetchPosts();
  }, []);

  return (
    <PageShell 
      title="공지사항" 
      subtitle="NCF의 새로운 소식과 주요 안내사항을 전해드립니다."
    >
      <div style={{ maxWidth: 800, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px", color: textMain, fontSize: "15px" }}>데이터를 불러오는 중입니다...</div>
        ) : posts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "100px 0", color: "gray", background: card, borderRadius: 20, border: `1px solid ${border}` }}>
            <div style={{ fontSize: "40px", marginBottom: "16px" }}>📝</div>
            <p>아직 등록된 공지사항이 없습니다.</p>
          </div>
        ) : (
          posts.map((post) => (
            <Link 
              key={post.id} 
              to={`/post/${post.id}`} // 💡 상세 페이지 경로 연동
              style={{ 
                background: card, border: `1px solid ${border}`, borderRadius: 20, 
                padding: "24px", display: "flex", gap: 24, textDecoration: "none",
                transition: "all 0.2s ease-in-out",
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-4px)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
            >
              {/* 이미지 섬네일 (있을 때만 노출) */}
              {post.image_url && (
                <img 
                  src={post.image_url} 
                  alt="" 
                  style={{ width: 140, height: 100, objectFit: "cover", borderRadius: 12, background: "#f8fafc" }} 
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
                <div style={{ marginTop: 14, fontSize: "13px", color: "rgba(128,128,128,0.6)", fontWeight: 500 }}>
                  {new Date(post.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </PageShell>
  );
}