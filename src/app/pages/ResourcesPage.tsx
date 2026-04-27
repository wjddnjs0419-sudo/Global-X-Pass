import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { PageShell } from "../components/PageShell";
import { useTheme } from "../ThemeContext";
import { supabase } from "../../lib/supabaseClient";
import { LoadingSpinner, ErrorMessage } from "../components/LoadingSpinner";

export function ResourcesPage() {
  const { isDark } = useTheme();
  const navigate = useNavigate(); 
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const card = isDark ? "rgba(255,255,255,0.04)" : "#ffffff";
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const textMain = isDark ? "rgba(255,255,255,0.92)" : "#0f172a";

  useEffect(() => {
    const fetchPosts = async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('category', 'resources')
        .order('created_at', { ascending: false });
      if (error) setError(true);
      else setPosts(data || []);
      setLoading(false);
    };
    fetchPosts();
  }, []);

  return (
    <PageShell title="자료실" subtitle="NCF와 Around X가 제공하는 필수 서식과 가이드 자료를 다운로드하세요.">
      <div className="max-w-[900px] mx-auto pb-[100px]">
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorMessage />
        ) : posts.length === 0 ? (
          <p className="text-center text-gray-500 py-[100px]">등록된 자료가 없습니다.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {posts.map((post) => (
              <div 
                key={post.id}
                onClick={() => navigate(`/post/${post.id}`)}
                className="rounded-2xl px-[30px] py-6 flex items-center justify-between cursor-pointer transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(0,0,0,0.05)]"
                style={{ background: card, border: `1px solid ${border}` }}
              >
                <div className="flex-1 min-w-0">
                  <h2 
                    className="m-0 mb-1.5 text-[18px] font-bold whitespace-nowrap overflow-hidden text-ellipsis" 
                    style={{ color: textMain }}
                  >
                    {post.title}
                  </h2>
                  <div className="flex gap-3 items-center">
                     <span className="text-[13px] text-gray-500">{new Date(post.created_at).toLocaleDateString()}</span>
                     {post.content && (
                       <span className="text-[13px] text-gray-500/50 border-l border-[#ddd] pl-3 whitespace-nowrap overflow-hidden text-ellipsis">
                         {/* 💡 자료실 미리보기 텍스트 태그 제거 */}
                         {(post.content || "").replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()}
                       </span>
                     )}
                  </div>
                </div>
                <div className="text-[#4377F1] bg-[#4377F1]/10 p-2.5 rounded-xl ml-5">
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
