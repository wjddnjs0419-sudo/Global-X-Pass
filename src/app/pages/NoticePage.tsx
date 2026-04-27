import { useEffect, useState } from "react";
import { Link } from "react-router";
import { supabase } from "../../lib/supabaseClient";
import { PageShell } from "../components/PageShell";
import { useTheme } from "../ThemeContext";
import { LoadingSpinner, ErrorMessage } from "../components/LoadingSpinner";
import { isImage } from "../../utils/file";
import { cleanText } from "../../utils/text";
import type { Post } from "../../lib/types";

export function NoticePage() {
  const { isDark } = useTheme();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const card = isDark ? "rgba(255,255,255,0.04)" : "#ffffff";
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const textMain = isDark ? "rgba(255,255,255,0.92)" : "#0f172a";

  useEffect(() => {
    const fetchPosts = async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("category", "notice")
        .order("created_at", { ascending: false });
      if (error) setError(true);
      else setPosts(data as Post[]);
      setLoading(false);
    };
    fetchPosts();
  }, []);

  return (
    <PageShell title="공지사항" subtitle="NCF의 새로운 소식과 안내 사항을 확인하세요.">
      <div className="max-w-[900px] mx-auto pb-[100px]">
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorMessage />
        ) : posts.length === 0 ? (
          <p className="text-center text-gray-500 py-[80px]">등록된 공지사항이 없습니다.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {posts.map((post) => {
              const attachmentImages = post.image_url?.split(",").filter(isImage) || [];
              const thumbnailUrl = attachmentImages[0] ?? (post.content?.match(/<img[^>]+src="([^">]+)"/) || [])[1];

              return (
                <Link
                  key={post.id}
                  to={`/post/${post.id}`}
                  className="rounded-[20px] p-6 flex gap-6 no-underline transition-all duration-200 ease-in-out hover:-translate-y-1"
                  style={{ background: card, border: `1px solid ${border}` }}
                >
                  {thumbnailUrl && (
                    <img src={thumbnailUrl} alt="" className="w-[140px] h-[100px] object-cover rounded-xl bg-slate-50" />
                  )}
                  <div className="flex-1 flex flex-col justify-center">
                    <strong className="block text-[19px] mb-2.5 font-bold" style={{ color: textMain }}>
                      {post.title}
                    </strong>
                    <p 
                      className="m-0 text-[15px] text-gray-500 leading-[1.6] overflow-hidden" 
                      style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}
                    >
                      {cleanText(post.content)}
                    </p>
                    <div className="mt-[14px] text-[13px] text-gray-500/60 font-medium">
                      {new Date(post.created_at).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </PageShell>
  );
}
