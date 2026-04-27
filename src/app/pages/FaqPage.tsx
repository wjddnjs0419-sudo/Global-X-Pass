import { useState, useEffect } from "react";
import { PageShell } from "../components/PageShell";
import { useTheme } from "../ThemeContext";
import { supabase } from "../../lib/supabaseClient";
import { LoadingSpinner, ErrorMessage } from "../components/LoadingSpinner";
import 'react-quill/dist/quill.snow.css';

export function FaqPage() {
  const { isDark } = useTheme();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const card = isDark ? "rgba(255,255,255,0.04)" : "#ffffff";
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)";
  const textMain = isDark ? "rgba(255,255,255,0.92)" : "#0f172a";
  const textMuted = isDark ? "rgba(255,255,255,0.45)" : "rgba(15,23,42,0.45)";

  useEffect(() => {
    const fetchPosts = async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('category', 'faq')
        .order('created_at', { ascending: false });
      if (error) setError(true);
      else if (data) setPosts(data);
      setLoading(false);
    };
    fetchPosts();
  }, []);

  return (
    <PageShell title="자주 묻는 질문" subtitle="궁금하신 점을 카테고리별로 빠르게 찾아보세요.">
      <div className="max-w-[800px] mx-auto pb-[100px]">
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorMessage />
        ) : posts.length === 0 ? (
          <p className="text-center text-gray-500 py-[80px]">등록된 FAQ가 없습니다.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {posts.map((post) => {
              const isOpen = openId === post.id;
              return (
                <div 
                  key={post.id} 
                  className="rounded-[20px] overflow-hidden transition-all duration-300 ease-in-out" 
                  style={{ background: card, border: `1px solid ${border}` }}
                >
                  <div 
                    onClick={() => setOpenId(isOpen ? null : post.id)}
                    className="px-8 py-7 flex items-center justify-between cursor-pointer"
                    style={{ background: isOpen ? (isDark ? "rgba(255,255,255,0.02)" : "#fcfcfc") : "transparent" }}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-[#4377F1] font-extrabold text-[20px]">Q.</span>
                      <h2 className="m-0 text-[17px] font-bold" style={{ color: textMain }}>{post.title}</h2>
                    </div>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-300" style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </div>
                  
                  {isOpen && (
                    <div className="px-8 pb-8" style={{ borderTop: `1px solid ${border}`, background: isDark ? "rgba(255,255,255,0.01)" : "#fafafa" }}>
                      <div className="pt-6 flex gap-4">
                        <span className="font-extrabold text-[20px]" style={{ color: textMuted }}>A.</span>
                        <div className={`flex-1 ${isDark ? "quill-dark" : "quill-light"}`}>
                          {/* 💡 minHeight를 unset으로 설정하여 내용 길이에 따라 높이가 적응되도록 수정 */}
                          <div 
                            className="ql-editor p-0 m-0 text-[15px] opacity-80 leading-[1.7] min-h-0" 
                            style={{ color: textMain }} 
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
