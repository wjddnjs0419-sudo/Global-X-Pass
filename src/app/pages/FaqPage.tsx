import { useState, useEffect } from "react";
import { PageShell } from "../components/PageShell";
import { useTheme } from "../ThemeContext";
import { supabase } from "../../lib/supabaseClient";

export function FaqPage() {
  const { isDark } = useTheme();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 💡 현재 열려있는 FAQ의 ID를 저장하는 상태 (아코디언 기능)
  const [openId, setOpenId] = useState<string | null>(null);

  const card = isDark ? "rgba(255,255,255,0.04)" : "#ffffff";
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)";
  const textMain = isDark ? "rgba(255,255,255,0.92)" : "#0f172a";
  const textMuted = isDark ? "rgba(255,255,255,0.45)" : "rgba(15,23,42,0.45)";

  useEffect(() => {
    const fetchPosts = async () => {
      const { data } = await supabase.from('posts').select('*').eq('category', 'faq').order('created_at', { ascending: false });
      setPosts(data || []);
      setLoading(false);
    };
    fetchPosts();
  }, []);

  // 💡 클릭 시 열고 닫는 함수
  const toggleOpen = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <PageShell title="자주 묻는 질문" subtitle="궁금한 점을 빠르게 찾아보세요.">
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {loading ? (
          <p style={{ color: textMuted }}>질문을 불러오는 중...</p>
        ) : (
          posts.map((post) => {
            const isOpen = openId === post.id;
            return (
              <div
                key={post.id}
                style={{
                  background: card, border: `1px solid ${border}`, borderRadius: 16,
                  overflow: "hidden", transition: "all 0.2s"
                }}
              >
                {/* 질문 (Q) 영역 - 클릭 시 답변 열림 */}
                <div
                  onClick={() => toggleOpen(post.id)}
                  style={{ padding: "24px 32px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.02)" : "#fcfcfc"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <span style={{ color: "#4377F1", fontWeight: 800, fontSize: 20 }}>Q.</span>
                    <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: textMain }}>{post.title}</h2>
                  </div>
                  {/* 열림/닫힘 화살표 아이콘 */}
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.3s" }}>
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>
                
                {/* 답변 (A) 영역 - isOpen이 true일 때만 나타남 */}
                {isOpen && (
                  <div style={{ padding: "0 32px 32px", borderTop: `1px solid ${border}`, marginTop: 16, paddingTop: 24, display: "flex", gap: 16 }}>
                    <span style={{ color: textMuted, fontWeight: 800, fontSize: 20 }}>A.</span>
                    <p style={{ margin: 0, fontSize: 15, color: textMuted, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                      {post.content}
                    </p>
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