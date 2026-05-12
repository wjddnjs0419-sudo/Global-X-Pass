import { useState, useEffect } from "react";
import { PageShell } from "../components/PageShell";
import { useTheme } from "../ThemeContext";
import { supabase } from "../../lib/supabaseClient";
import { LoadingSpinner, ErrorMessage } from "../components/LoadingSpinner";
import { CONTACT_EMAIL } from "../constants/contact";
import { sanitizeRichHtml } from "../../utils/htmlSecurity";
import 'react-quill/dist/quill.snow.css';

export function FaqPage() {
  const { isDark } = useTheme();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const card = "var(--color-surface-card)";
  const border = "var(--color-border-soft)";
  const textMain = "var(--color-text-primary)";
  const textMuted = "var(--color-text-muted)";
  const answerColor = "var(--color-text-secondary)";

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
                    style={{ background: isOpen ? "var(--color-surface-subtle)" : "transparent" }}
                  >
                    <div className="flex items-center gap-4">
                      <span className="font-extrabold text-[20px]" style={{ color: "var(--color-accent-blue)" }}>Q.</span>
                      <h2 className="m-0 text-[17px] font-bold" style={{ color: textMain }}>{post.title}</h2>
                    </div>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-300" style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </div>

                  {isOpen && (
                    <div className="px-8 pb-8" style={{ borderTop: `1px solid ${border}`, background: "var(--color-glass-bg)" }}>
                      <div className="pt-6 flex gap-4">
                        <span className="font-extrabold text-[20px]" style={{ color: textMuted }}>A.</span>
                        <div className={`flex-1 ${isDark ? "quill-dark" : "quill-light"}`}>
                          <div
                            className="ql-editor p-0 m-0 text-[15px] leading-[1.7] min-h-0"
                            style={{ color: answerColor }}
                            dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(post.content) }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* 이메일 문의 카드 */}
            <div
              className="rounded-[20px] px-8 py-8 mt-4"
              style={{
                background: "var(--gradient-blue-soft)",
                border: "1px solid var(--color-accent-blue-soft-border)",
                backdropFilter: "blur(12px)",
              }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: "var(--color-accent-blue-soft-bg)" }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </div>
                <div>
                  <p className="m-0 mb-1 font-bold text-[16px]" style={{ color: textMain }}>
                    원하는 답변을 찾지 못하셨나요?
                  </p>
                  <p className="m-0 mb-3 text-[14px]" style={{ color: textMuted }}>
                    아래 이메일로 문의주시면 빠르게 답변 드리겠습니다.
                  </p>
                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    className="inline-flex items-center gap-2 font-bold text-[14px]"
                    style={{ color: "var(--color-accent-blue)", textDecoration: "none" }}
                  >
                    {CONTACT_EMAIL}
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
