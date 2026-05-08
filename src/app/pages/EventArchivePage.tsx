import { useEffect, useState } from "react";
import { Link } from "react-router";
import { supabase } from "../../lib/supabaseClient";
import { PageShell } from "../components/PageShell";
import { useTheme } from "../ThemeContext";
import { LoadingSpinner, ErrorMessage } from "../components/LoadingSpinner";
import { cleanText } from "../../utils/text";
import { getFilterTabStyle, getMutedLabelStyle } from "../components/contentListStyles";
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext, PaginationLink, PaginationEllipsis } from "../components/ui/pagination";

const PAGE_SIZE = 12;

const decodeFilename = (encoded: string) => {
  if (encoded.startsWith('b64-')) {
    try {
      let b64 = encoded.substring(4).replace(/-/g, '+').replace(/_/g, '/');
      while (b64.length % 4 !== 0) b64 += '=';
      return decodeURIComponent(atob(b64));
    } catch { return encoded; }
  }
  return decodeURIComponent(encoded);
};

const getFileNameFromUrl = (url: string) => {
  try {
    const path = url.split('?')[0];
    let filename = path.split('/').pop() || "";
    if (filename.includes('---')) filename = filename.split('---').pop()!;
    else if (filename.match(/^\d+_[a-z0-9]+_/)) filename = filename.split('_').slice(2).join('_');
    return decodeFilename(filename);
  } catch { return ""; }
};

const isImage = (url: string) => {
  const fileName = getFileNameFromUrl(url);
  if (fileName.match(/\.(jpeg|jpg|gif|png|webp|avif|svg|jfif|pjpeg|pjp|bmp|heic|heif)$/i)) return true;
  if (url.match(/\.(jpeg|jpg|gif|png|webp|avif|svg|jfif|pjpeg|pjp|bmp|heic|heif)(?:\?.*)?$/i)) return true;
  if (url.includes('unsplash.com') || url.includes('picsum.photos') || url.includes('placeholder.com')) return true;
  return false;
};

export function EventArchivePage() {
  const { isDark } = useTheme();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeTag, setActiveTag] = useState("전체");
  const [activeYear, setActiveYear] = useState("전체");
  const [currentPage, setCurrentPage] = useState(1);

  const card = isDark ? "rgba(255,255,255,0.04)" : "#ffffff";
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const textMain = isDark ? "rgba(255,255,255,0.92)" : "#0f172a";
  const textMuted = isDark ? "rgba(255,255,255,0.45)" : "rgba(15,23,42,0.45)";
  const imgPlaceholder = isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9";

  useEffect(() => {
    let isMounted = true;

    const fetchPosts = async () => {
      const { data, error: err } = await supabase
        .from('posts')
        .select('*')
        .eq('category', 'events-archive')
        .order('created_at', { ascending: false });

      if (!isMounted) return;

      if (err) {
        setPosts([]);
        setError(true);
        setLoading(false);
        return;
      }

      setPosts(data ?? []);
      setError(false);
      setLoading(false);
    };

    void fetchPosts();

    return () => {
      isMounted = false;
    };
  }, []);

  const allTags = posts.flatMap(p => p.tags ? p.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : []);
  const uniqueTags = [...new Set(allTags)];
  const uniqueYears = [...new Set(posts.map(p => String(new Date(p.created_at).getFullYear())))].sort((a, b) => Number(b) - Number(a));
  const filteredPosts = posts.filter(p => {
    const tagMatch = activeTag === "전체" || p.tags?.split(',').map((t: string) => t.trim()).includes(activeTag);
    const yearMatch = activeYear === "전체" || String(new Date(p.created_at).getFullYear()) === activeYear;
    return tagMatch && yearMatch;
  });
  const totalPages = Math.ceil(filteredPosts.length / PAGE_SIZE);
  const pagedPosts = filteredPosts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleTagChange = (tag: string) => { setActiveTag(tag); setCurrentPage(1); };
  const handleYearChange = (year: string) => { setActiveYear(year); setCurrentPage(1); };

  return (
    <PageShell title="행사 아카이브" subtitle="NCF와 함께한 지난 행사의 소중한 기록들을 만나보세요." accentColor="#18A343">
      <div className="max-w-[1280px] mx-auto pb-[100px]">
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorMessage />
        ) : posts.length === 0 ? (
          <p className="text-center text-gray-500 py-[80px]">등록된 아카이브가 없습니다.</p>
        ) : (
          <>
            {/* Filters */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 28 }}>
              {uniqueTags.length > 0 && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {["전체", ...uniqueTags].map(tag => (
                    <button
                      key={tag}
                      aria-pressed={activeTag === tag}
                      onClick={() => handleTagChange(tag)}
                      style={getFilterTabStyle(isDark, activeTag === tag)}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              )}
              {uniqueYears.length > 1 && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {["전체", ...uniqueYears].map(year => {
                    const active = activeYear === year;
                    return (
                      <button
                        key={year}
                        aria-pressed={active}
                        onClick={() => handleYearChange(year)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          padding: "3px 10px",
                          borderRadius: 999,
                          border: `1px solid ${isDark ? (active ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.1)") : (active ? "rgba(15,23,42,0.22)" : "rgba(15,23,42,0.1)")}`,
                          background: active
                            ? (isDark ? "rgba(255,255,255,0.1)" : "rgba(15,23,42,0.07)")
                            : (isDark ? "rgba(255,255,255,0.035)" : "rgba(15,23,42,0.025)"),
                          color: active
                            ? (isDark ? "rgba(255,255,255,0.85)" : "rgba(15,23,42,0.8)")
                            : (isDark ? "rgba(255,255,255,0.45)" : "rgba(15,23,42,0.45)"),
                          fontSize: 12,
                          fontWeight: active ? 700 : 500,
                          cursor: "pointer",
                          transition: "background 0.15s, border-color 0.15s, color 0.15s",
                        }}
                      >
                        {year === "전체" ? "전체" : `${year}년`}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 4-column grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {pagedPosts.map((post) => {
                const attachmentImages = post.image_url?.split(',').filter(isImage) || [];
                const thumbnailUrl =
                  attachmentImages.length > 0
                    ? attachmentImages[0]
                    : (post.content?.match(/<img[^>]+src="([^">]+)"/) || [])[1];
                const year = new Date(post.created_at).getFullYear();
                const dateStr = new Date(post.created_at)
                  .toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" })
                  .replace(/ /g, "");
                const excerpt = cleanText(post.content);

                return (
                  <Link
                    key={post.id}
                    to={`/post/${post.id}`}
                    className="rounded-[20px] no-underline overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-1"
                    style={{
                      background: card,
                      border: `1px solid ${border}`,
                      boxShadow: isDark ? "none" : "0 2px 12px rgba(0,0,0,0.05)",
                    }}
                  >
                    {/* Thumbnail */}
                    <div style={{ position: "relative", width: "100%", aspectRatio: "16/10", background: imgPlaceholder, overflow: "hidden" }}>
                      {thumbnailUrl ? (
                        <img src={thumbnailUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                      ) : (
                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={textMuted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                          </svg>
                        </div>
                      )}
                      <span style={{
                        position: "absolute", bottom: 10, left: 10,
                        fontSize: 11, fontWeight: 700, color: "#fff",
                        background: "rgba(0,0,0,0.52)", backdropFilter: "blur(6px)",
                        padding: "3px 8px", borderRadius: 6,
                      }}>
                        {year}
                      </span>
                    </div>

                    {/* Card body */}
                    <div style={{ padding: "16px 18px 20px", flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                          {post.tags
                            ? post.tags.split(',').map((t: string) => t.trim()).filter(Boolean).map((tag: string) => (
                                <span key={tag} style={getMutedLabelStyle(isDark)}>{tag}</span>
                              ))
                            : <span style={getMutedLabelStyle(isDark)}>행사</span>
                          }
                        </div>
                        <span style={{ fontSize: 12, color: textMuted, flexShrink: 0 }}>{dateStr}</span>
                      </div>
                      <strong style={{
                        fontSize: 15, fontWeight: 800, color: textMain, lineHeight: 1.4,
                        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                      } as React.CSSProperties}>
                        {post.title}
                      </strong>
                      {excerpt && (
                        <p style={{
                          margin: 0, fontSize: 13, color: textMuted, lineHeight: 1.55,
                          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                        } as React.CSSProperties}>
                          {excerpt}
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-10">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={e => { e.preventDefault(); if (currentPage > 1) setCurrentPage(p => p - 1); }}
                        aria-disabled={currentPage === 1}
                        className={currentPage === 1 ? "pointer-events-none opacity-40" : ""}
                      />
                    </PaginationItem>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                      const showPage = page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1;
                      const showEllipsisBefore = page === currentPage - 2 && currentPage > 3;
                      const showEllipsisAfter = page === currentPage + 2 && currentPage < totalPages - 2;
                      if (showEllipsisBefore || showEllipsisAfter) {
                        return <PaginationItem key={`el-${page}`}><PaginationEllipsis /></PaginationItem>;
                      }
                      if (!showPage) return null;
                      return (
                        <PaginationItem key={page}>
                          <PaginationLink
                            href="#"
                            isActive={currentPage === page}
                            onClick={e => { e.preventDefault(); setCurrentPage(page); }}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={e => { e.preventDefault(); if (currentPage < totalPages) setCurrentPage(p => p + 1); }}
                        aria-disabled={currentPage === totalPages}
                        className={currentPage === totalPages ? "pointer-events-none opacity-40" : ""}
                      />
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
