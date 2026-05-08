import { useEffect, useState } from "react";
import { Link } from "react-router";
import { supabase } from "../../lib/supabaseClient";
import { PageShell } from "../components/PageShell";
import { useTheme } from "../ThemeContext";
import { LoadingSpinner, ErrorMessage } from "../components/LoadingSpinner";
import { isImage } from "../../utils/file";
import { cleanText } from "../../utils/text";
import { getFilterTabStyle, getMutedLabelStyle } from "../components/contentListStyles";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis } from "../components/ui/pagination";

const PAGE_SIZE = 10;

const NEWS_COLOR = "#4377F1";

export function NewsPage() {
  const { isDark } = useTheme();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeTag, setActiveTag] = useState("전체");
  const [currentPage, setCurrentPage] = useState(1);

  const card = isDark ? "rgba(255,255,255,0.04)" : "#ffffff";
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const textMain = isDark ? "rgba(255,255,255,0.92)" : "#0f172a";
  const textMuted = isDark ? "rgba(255,255,255,0.45)" : "rgba(15,23,42,0.5)";
  useEffect(() => {
    const fetchPosts = async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('category', 'news')
        .order('created_at', { ascending: false });

      if (error) setError(true);
      else if (data) setPosts(data);
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
    <PageShell title="뉴스" subtitle="NCF가 전하는 글로벌 마켓 트렌드와 비즈니스 인사이트를 확인하세요." accentColor={NEWS_COLOR}>
      <div className="max-w-[900px] mx-auto pb-[100px]">
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorMessage />
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
                const attachmentImages = post.image_url?.split(',').filter(isImage) || [];
                const thumbnailUrl = attachmentImages.length > 0 ? attachmentImages[0] : (post.content?.match(/<img[^>]+src="([^">]+)"/) || [])[1];
                const excerpt = cleanText(post.content);

                return (
                  <Link
                    key={post.id}
                    to={`/post/${post.id}`}
                    className="rounded-[20px] overflow-hidden flex flex-col sm:flex-row no-underline transition-all duration-200 ease-out hover:-translate-y-0.5"
                    style={{ background: card, border: `1px solid ${border}` }}
                  >
                    {/* Thumbnail — flush, no padding */}
                    <div
                      className="w-full h-[180px] sm:w-[200px] sm:h-auto sm:self-stretch shrink-0 flex items-center justify-center"
                      style={{ background: isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9" }}
                    >
                      {thumbnailUrl ? (
                        <img src={thumbnailUrl} alt="" className="w-full h-full object-cover block" />
                      ) : (
                        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={textMuted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                        </svg>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 p-4 sm:p-5 flex flex-col gap-2">
                      <div className="flex items-start gap-2">
                        {post.tags && (
                          <span className="shrink-0 mt-[3px]" style={getMutedLabelStyle(isDark)}>{post.tags}</span>
                        )}
                        <h2
                          className="m-0 font-extrabold leading-snug line-clamp-2"
                          style={{ fontSize: "clamp(16px, 2vw, 19px)", color: textMain }}
                        >
                          {post.title}
                        </h2>
                      </div>
                      {excerpt && (
                        <p
                          className="m-0 text-[14px] leading-relaxed line-clamp-2"
                          style={{ color: textMuted }}
                        >
                          {excerpt}
                        </p>
                      )}
                      <p className="m-0 text-[12px] font-medium mt-auto pt-1" style={{ color: textMuted }}>
                        {new Date(post.created_at).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
            {totalPages > 1 && (
              <div className="mt-10">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious href="#" onClick={e => { e.preventDefault(); if (currentPage > 1) setCurrentPage(p => p - 1); }} aria-disabled={currentPage === 1} className={currentPage === 1 ? "pointer-events-none opacity-40" : ""} />
                    </PaginationItem>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                      const showPage = page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1;
                      const showEllipsisBefore = page === currentPage - 2 && currentPage > 3;
                      const showEllipsisAfter = page === currentPage + 2 && currentPage < totalPages - 2;
                      if (showEllipsisBefore || showEllipsisAfter) return <PaginationItem key={`el-${page}`}><PaginationEllipsis /></PaginationItem>;
                      if (!showPage) return null;
                      return (
                        <PaginationItem key={page}>
                          <PaginationLink href="#" isActive={currentPage === page} onClick={e => { e.preventDefault(); setCurrentPage(page); }}>{page}</PaginationLink>
                        </PaginationItem>
                      );
                    })}
                    <PaginationItem>
                      <PaginationNext href="#" onClick={e => { e.preventDefault(); if (currentPage < totalPages) setCurrentPage(p => p + 1); }} aria-disabled={currentPage === totalPages} className={currentPage === totalPages ? "pointer-events-none opacity-40" : ""} />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </div>
    </PageShell>
  );
}
