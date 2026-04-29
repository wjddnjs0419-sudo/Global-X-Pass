import { useEffect, useState } from "react";
import { Link } from "react-router";
import { supabase } from "../../lib/supabaseClient";
import { PageShell } from "../components/PageShell";
import { useTheme } from "../ThemeContext";
import { LoadingSpinner, ErrorMessage } from "../components/LoadingSpinner";
import { isImage } from "../../utils/file";
import { cleanText } from "../../utils/text";
import type { Post } from "../../lib/types";

const NOTICE_COLOR = "#EA4335";

export function NoticePage() {
  const { isDark } = useTheme();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeTag, setActiveTag] = useState("전체");

  const card = isDark ? "rgba(255,255,255,0.04)" : "#ffffff";
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const textMain = isDark ? "rgba(255,255,255,0.92)" : "#0f172a";
  const textMuted = isDark ? "rgba(255,255,255,0.45)" : "rgba(15,23,42,0.5)";

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

  const allTags = [...new Set(posts.map(p => p.tags).filter(Boolean))] as string[];
  const filteredPosts = activeTag === "전체" ? posts : posts.filter(p => p.tags === activeTag);

  return (
    <PageShell title="공지사항" subtitle="NCF의 새로운 소식과 안내 사항을 확인하세요." accentColor={NOTICE_COLOR}>
      <div className="max-w-[900px] mx-auto pb-[100px]">
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorMessage />
        ) : posts.length === 0 ? (
          <p className="text-center text-gray-500 py-[80px]">등록된 공지사항이 없습니다.</p>
        ) : (
          <>
            {allTags.length > 0 && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
                {["전체", ...allTags].map(tag => (
                  <button
                    key={tag}
                    onClick={() => setActiveTag(tag)}
                    style={{
                      padding: "8px 18px", borderRadius: 99, border: "none", cursor: "pointer",
                      fontWeight: 700, fontSize: 14, transition: "all 0.15s",
                      background: activeTag === tag ? NOTICE_COLOR : isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
                      color: activeTag === tag ? "#fff" : textMuted,
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
            <div className="flex flex-col gap-4">
              {filteredPosts.map((post) => {
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
                      {post.tags && (
                        <span style={{ display: "inline-block", marginBottom: 8, fontSize: 11, fontWeight: 700, color: NOTICE_COLOR, background: "rgba(234,67,53,0.1)", padding: "3px 10px", borderRadius: 99 }}>
                          {post.tags}
                        </span>
                      )}
                      <strong className="block text-[19px] mb-2.5 font-bold" style={{ color: textMain }}>
                        {post.title}
                      </strong>
                      <p
                        className="m-0 text-[15px] text-gray-500 leading-[1.6] overflow-hidden"
                        style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" } as React.CSSProperties}
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
          </>
        )}
      </div>
    </PageShell>
  );
}
