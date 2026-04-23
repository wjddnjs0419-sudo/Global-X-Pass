import { useState, useEffect } from "react";
import { PageShell } from "../components/PageShell";
import { useTheme } from "../ThemeContext";
import { supabase } from "../../lib/supabaseClient";

export function FaqPage() {
  const { isDark } = useTheme();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 💡 아코디언 상태 관리
  const [openId, setOpenId] = useState<string | null>(null);

  // ── 통합 디자인 시스템 스타일 ──
  const card = isDark ? "rgba(255,255,255,0.04)" : "#ffffff";
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)";
  const textMain = isDark ? "rgba(255,255,255,0.92)" : "#0f172a";
  const textMuted = isDark ? "rgba(255,255,255,0.45)" : "rgba(15,23,42,0.45)";

  useEffect(() => {
    const fetchPosts = async () => {
      // 💡 'faq' 카테고리 데이터를 최신순으로 가져옵니다
      const { data } = await supabase
        .from('posts')
        .select('*')
        .eq('category', 'faq')
        .order('created_at', { ascending: false });
        
      setPosts(data || []);
      setLoading(false);
    };
    fetchPosts();
  }, []);

  const toggleOpen = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <PageShell title="자주 묻는 질문" subtitle="궁금한 점을 빠르게 찾아보세요.">
      <div style={{ maxWidth: 800, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
        
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px", color: textMuted }}>질문을 불러오는 중입니다...</div>
        ) : posts.length === 0 ? (
          // 💡 질문이 없을 때의 피드백 추가
          <div style={{ textAlign: "center", padding: "100px 0", color: "gray", background: card, borderRadius: 20, border: `1px solid ${border}` }}>
            <div style={{ fontSize: "40px", marginBottom: "16px" }}>❓</div>
            <p>등록된 자주 묻는 질문이 없습니다.</p>
          </div>
        ) : (
          posts.map((post) => {
            const isOpen = openId === post.id;
            return (
              <div
                key={post.id}
                style={{
                  background: card, border: `1px solid ${border}`, borderRadius: 16,
                  overflow: "hidden", transition: "all 0.2s ease"
                }}
              >
                {/* 질문 (Q) 영역 */}
                <div
                  onClick={() => toggleOpen(post.id)}
                  style={{ padding: "24px 32px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.02)" : "#fcfcfc"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <span style={{ color: "#4377F1", fontWeight: 800, fontSize: 20 }}>Q.</span>
                    <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: textMain }}>{post.title}</h2>
                  </div>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.3s" }}>
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>
                
                {/* 답변 (A) 영역 */}
                {isOpen && (
                  <div style={{ padding: "0 32px 32px", borderTop: `1px solid ${border}`, background: isDark ? "rgba(255,255,255,0.01)" : "#fafafa" }}>
                    <div style={{ paddingTop: 24, display: "flex", gap: 16 }}>
                      <span style={{ color: textMuted, fontWeight: 800, fontSize: 20 }}>A.</span>
                      <p style={{ margin: 0, fontSize: 15, color: textMain, opacity: 0.8, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                        {post.content}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </PageShell>
  );
}