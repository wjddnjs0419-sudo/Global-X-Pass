import { useState, useEffect } from "react";
import { PageShell } from "../components/PageShell";
import { useTheme } from "../ThemeContext";
import { supabase } from "../../lib/supabaseClient";

// 💡 스타일 적용을 위해 에디터 CSS 임포트
import 'react-quill/dist/quill.snow.css';

export function FaqPage() {
  const { isDark } = useTheme();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  const card = isDark ? "rgba(255,255,255,0.04)" : "#ffffff";
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)";
  const textMain = isDark ? "rgba(255,255,255,0.92)" : "#0f172a";
  const textMuted = isDark ? "rgba(255,255,255,0.45)" : "rgba(15,23,42,0.45)";

  useEffect(() => {
    const fetchPosts = async () => {
      const { data } = await supabase
        .from('posts')
        .select('*')
        .eq('category', 'faq')
        .order('created_at', { ascending: false });
      
      if (data) setPosts(data);
      setLoading(false);
    };
    fetchPosts();
  }, []);

  return (
    <PageShell title="자주 묻는 질문" subtitle="궁금하신 점을 카테고리별로 빠르게 찾아보세요.">
      <div style={{ maxWidth: 800, margin: "0 auto", paddingBottom: 100 }}>
        {loading ? (
          <p style={{ textAlign: "center", color: "gray", padding: "80px 0" }}>데이터를 불러오는 중입니다...</p>
        ) : posts.length === 0 ? (
          <p style={{ textAlign: "center", color: "gray", padding: "80px 0" }}>등록된 FAQ가 없습니다.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {posts.map((post) => {
              const isOpen = openId === post.id;
              return (
                <div key={post.id} style={{ background: card, border: `1px solid ${border}`, borderRadius: 20, overflow: "hidden", transition: "all 0.3s ease" }}>
                  <div 
                    onClick={() => setOpenId(isOpen ? null : post.id)}
                    style={{ padding: "28px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", background: isOpen ? (isDark ? "rgba(255,255,255,0.02)" : "#fcfcfc") : "transparent" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                      <span style={{ color: "#4377F1", fontWeight: 800, fontSize: 20 }}>Q.</span>
                      <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: textMain }}>{post.title}</h2>
                    </div>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.3s" }}>
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </div>
                  
                  {isOpen && (
                    <div style={{ padding: "0 32px 32px", borderTop: `1px solid ${border}`, background: isDark ? "rgba(255,255,255,0.01)" : "#fafafa" }}>
                      <div style={{ paddingTop: 24, display: "flex", gap: 16 }}>
                        <span style={{ color: textMuted, fontWeight: 800, fontSize: 20 }}>A.</span>
                        <div className={isDark ? "quill-dark" : "quill-light"} style={{ flex: 1 }}>
                          {/* 💡 minHeight를 unset으로 설정하여 내용 길이에 따라 높이가 적응되도록 수정 */}
                          <div 
                            className="ql-editor" 
                            style={{ padding: 0, margin: 0, color: textMain, fontSize: 15, opacity: 0.8, lineHeight: 1.7, minHeight: "unset" }} 
                            dangerouslySetInnerHTML={{ __html: post.content }} 
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PageShell>
  );
}