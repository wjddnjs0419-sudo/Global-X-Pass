import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { PageShell } from "../components/PageShell";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { useTheme } from "../ThemeContext";
import { supabase } from "../../lib/supabaseClient";
import { LoadingSpinner, ErrorMessage } from "../components/LoadingSpinner";
import { isImage } from "../../utils/file";
import { cleanText } from "../../utils/text";
import type { Post } from "../../lib/types";

export function BlogPage() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const cardBg = isDark ? "rgba(255,255,255,0.04)" : "#ffffff";
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const textMain = isDark ? "rgba(255,255,255,0.92)" : "#0f172a";

  useEffect(() => {
    const fetchPosts = async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("category", "blog")
        .order("created_at", { ascending: false });
      if (error) setError(true);
      else setPosts((data as Post[]) || []);
      setLoading(false);
    };
    fetchPosts();
  }, []);

  return (
    <PageShell title="블로그" subtitle="NCF와 Around X가 전하는 다양한 인사이트와 비즈니스 이야기를 만나보세요.">
      <div className="max-w-[1200px] mx-auto pb-[100px]">
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorMessage />
        ) : posts.length === 0 ? (
          <p className="text-center text-gray-500 py-[100px]">등록된 게시물이 없습니다.</p>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-8">
            {posts.map((post) => {
              const attachmentImages = post.image_url?.split(",").filter(isImage) || [];
              const thumbnailUrl = attachmentImages[0] ?? (post.content?.match(/<img[^>]+src="([^">]+)"/) || [])[1];

              return (
                <div
                  key={post.id}
                  onClick={() => navigate(`/post/${post.id}`)}
                  className="rounded-3xl overflow-hidden cursor-pointer transition-transform duration-200 ease-out hover:-translate-y-1.5"
                  style={{ background: cardBg, border: `1px solid ${border}` }}
                >
                  <div className="h-[200px] w-full bg-[#f0f0f0] overflow-hidden">
                    <ImageWithFallback src={thumbnailUrl} alt={post.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-7">
                    <div className="mb-4">
                      <span className="px-3 py-1.5 bg-[#4377F1]/10 text-[#4377F1] text-xs font-extrabold rounded-lg">INSIGHT</span>
                    </div>
                    <h2 
                      className="m-0 mb-3 text-[20px] font-extrabold leading-[1.4] h-[2.8em] overflow-hidden" 
                      style={{ color: textMain, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}
                    >
                      {post.title}
                    </h2>
                    <p 
                      className="m-0 mb-5 text-[15px] text-gray-500 leading-[1.6] overflow-hidden" 
                      style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}
                    >
                      {cleanText(post.content)}
                    </p>
                    <div className="text-[13px] text-gray-500/60 font-medium">
                      {new Date(post.created_at).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PageShell>
  );
}
