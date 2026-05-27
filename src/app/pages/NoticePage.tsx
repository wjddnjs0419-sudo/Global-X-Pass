import { useEffect, useState } from "react";
import { Link } from "react-router";
import { fetchPublicPostPreviews } from "../../utils/publicPostPreviews";
import { PageShell } from "../components/PageShell";
import { BoardAccessGate } from "../components/BoardAccessGate";
import { useBoardCategoryLabel, useBoardCategoryDescription } from "../BoardCategoriesContext";
import { useTheme } from "../ThemeContext";
import { LoadingSpinner, ErrorMessage } from "../components/LoadingSpinner";
import { cleanText } from "../../utils/text";
import type { Post } from "../../lib/types";
import { getFilterTabStyle, getMutedLabelStyle } from "../components/contentListStyles";
import { AppPagination } from "../components/AppPagination";

const PAGE_SIZE = 10;

export function NoticePage() {
  const { isDark } = useTheme();
  const boardTitle = useBoardCategoryLabel("notice", "공지사항");
  const boardSubtitle = useBoardCategoryDescription("notice", "NCF의 새로운 소식과 안내 사항을 확인하세요.");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeTag, setActiveTag] = useState("전체");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchPosts = async () => {
      const { data, error } = await fetchPublicPostPreviews("notice");
      if (error) setError(true);
      else setPosts(data as Post[]);
      setLoading(false);
    };
    fetchPosts();
  }, []);

  const allTags = [...new Set(posts.map(p => p.tags).filter(Boolean))] as string[];
  const filteredPosts = activeTag === "전체" ? posts : posts.filter(p => p.tags === activeTag);
  const totalPages = Math.ceil(filteredPosts.length / PAGE_SIZE);
  const pagedPosts = filteredPosts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const handleTagChange = (tag: string) => { setActiveTag(tag); setCurrentPage(1); };

  return (
    <BoardAccessGate category="notice">
    <PageShell title={boardTitle} subtitle={boardSubtitle} accentColor="var(--color-brand-red)">
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
                    onClick={() => handleTagChange(tag)}
                    style={getFilterTabStyle(isDark, activeTag === tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
            <div className="flex flex-col gap-4">
              {pagedPosts.map((post) => {
                return (
                  <Link
                    key={post.id}
                    to={`/post/${post.id}`}
                    className="rounded-[20px] p-6 no-underline transition-all duration-200 ease-in-out hover:-translate-y-1"
                    style={{ background: "var(--color-surface-card)", border: "1px solid var(--color-border-soft)" }}
                  >
                    <div className="flex-1 flex flex-col justify-center">
                      <div className="flex items-start gap-2 mb-2.5">
                        {post.tags && (
                          <span className="shrink-0 mt-[3px]" style={getMutedLabelStyle(isDark)}>
                            {post.tags}
                          </span>
                        )}
                        <strong className="m-0 text-[19px] font-bold leading-snug" style={{ color: "var(--color-text-primary)" }}>
                          {post.title}
                        </strong>
                      </div>
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
            <AppPagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} className="mt-10" />
          </>
        )}
      </div>
    </PageShell>
    </BoardAccessGate>
  );
}
