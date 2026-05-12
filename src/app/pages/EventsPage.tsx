import { useEffect, useState } from "react";
import { Link } from "react-router";
import { supabase } from "../../lib/supabaseClient";
import { PageShell } from "../components/PageShell";
import { useTheme } from "../ThemeContext";
import { LoadingSpinner, ErrorMessage } from "../components/LoadingSpinner";
import { cleanText } from "../../utils/text";
import { isImage } from "../../utils/file";
import { EVENT_STATUS_CONFIG } from "../../utils/eventApplication";
import { formatStructuredLocation } from "../../utils/scheduleFields";
import { getFilterTabStyle, getMutedLabelStyle, getStatusPillStyle } from "../components/contentListStyles";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis } from "../components/ui/pagination";

const PAGE_SIZE = 10;

export function EventsPage() {
  const { isDark } = useTheme();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeTag, setActiveTag] = useState("전체");
  const [currentPage, setCurrentPage] = useState(1);
  const [acceptedCounts, setAcceptedCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    Promise.all([
      supabase
        .from("posts")
        .select("*")
        .eq("category", "events")
        .order("created_at", { ascending: false }),
      supabase.rpc("get_event_application_counts"),
    ]).then(([postsResult, countsResult]) => {
      if (postsResult.error) setError(true);
      else if (postsResult.data) setPosts(postsResult.data);
      const counts = ((countsResult.data as { post_id: string; accepted_count: number }[] | null) ?? []).reduce<Record<string, number>>((acc, row) => {
        acc[row.post_id] = row.accepted_count;
        return acc;
      }, {});
      setAcceptedCounts(counts);
      setLoading(false);
    });
  }, []);

  return (
    <PageShell title="행사" subtitle="NCF에서 진행하는 다양한 이벤트와 프로그램을 확인해 보세요." accentColor="var(--color-accent-green)">
      <div className="max-w-[1100px] mx-auto pb-[100px]">
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorMessage />
        ) : (() => {
          const allTags = posts.flatMap(p => p.tags ? p.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : []);
          const uniqueTags = [...new Set(allTags)];
          const filteredPosts = activeTag === "전체" ? posts : posts.filter(p => p.tags?.split(',').map((t: string) => t.trim()).includes(activeTag));
          const totalPages = Math.ceil(filteredPosts.length / PAGE_SIZE);
          const pagedPosts = filteredPosts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
          const handleTagChange = (tag: string) => { setActiveTag(tag); setCurrentPage(1); };
          if (posts.length === 0) return <p className="text-center text-gray-500 py-[80px]">현재 진행 중인 행사가 없습니다.</p>;
          return (
          <div className="flex flex-col gap-5">
            {uniqueTags.length > 0 && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                {["전체", ...uniqueTags].map(tag => (
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
            {pagedPosts.map((post) => {
              const attachmentImages = post.image_url?.split(",").filter(isImage) || [];
              const thumbnailUrl =
                attachmentImages.length > 0
                  ? attachmentImages[0]
                  : (post.content?.match(/<img[^>]+src="([^">]+)"/) || [])[1];
              const excerpt = cleanText(post.content);
              const tags = post.tags
                ? post.tags.split(",").map((t: string) => t.trim()).filter(Boolean)
                : [];
              const statusCfg = post.event_status ? EVENT_STATUS_CONFIG[post.event_status] : null;
              const acceptedCount = acceptedCounts[post.id] ?? 0;
              const remaining = post.capacity != null ? Math.max(post.capacity - acceptedCount, 0) : post.slots_remaining;
              const isClosed = post.event_status === "마감" || remaining === 0;

              return (
                <div
                  key={post.id}
                  className="rounded-3xl overflow-hidden flex flex-col sm:flex-row sm:min-h-[220px] transition-all duration-200 hover:-translate-y-0.5"
                  style={{
                    background: "var(--color-surface-card)",
                    border: "1px solid var(--color-border-soft)",
                    boxShadow: "var(--shadow-card-rest)",
                  }}
                >
                  {/* Thumbnail */}
                  <div
                    className="w-full sm:w-[260px] shrink-0 h-52 sm:h-auto sm:self-stretch"
                    style={{ background: "var(--color-img-placeholder)" }}
                  >
                    {thumbnailUrl ? (
                      <img
                        src={thumbnailUrl}
                        alt=""
                        className="w-full h-full object-cover block"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Center: content */}
                  <div
                    className="flex-1 min-w-0 p-6 sm:p-6 flex flex-col gap-3 overflow-hidden"
                    style={{ borderRight: "1px solid var(--color-border-soft)" }}
                  >
                    {/* Status + type badges */}
                    <div className="flex flex-wrap gap-2">
                      {statusCfg && (
                        <span
                          style={getStatusPillStyle(statusCfg.color, isDark)}
                        >
                          {statusCfg.label}
                        </span>
                      )}
                      {tags.slice(0, 2).map((tag: string) => (
                        <span
                          key={tag}
                          style={getMutedLabelStyle(isDark)}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Title */}
                    <h2
                      className="m-0 font-extrabold leading-snug"
                      style={{
                        fontSize: "clamp(17px,2vw,21px)",
                        color: isClosed ? "var(--color-text-muted)" : "var(--color-text-primary)",
                      }}
                    >
                      {post.title}
                    </h2>

                    {/* Excerpt */}
                    {excerpt && (
                      <p
                        className="m-0 text-sm leading-relaxed line-clamp-3"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        {excerpt}
                      </p>
                    )}
                  </div>

                  {/* Right: info panel */}
                  <div
                    className="w-full sm:w-[220px] shrink-0 p-5 sm:p-5 flex flex-col gap-3 justify-between"
                    style={{ background: "var(--color-surface-subtle)" }}
                  >
                    <div className="flex flex-col gap-2.5">
                      <div>
                        <p className="m-0 text-[11px] font-bold tracking-wide mb-1" style={{ color: "var(--color-text-muted)" }}>일시</p>
                        <p className="m-0 text-sm font-semibold leading-snug" style={{ color: "var(--color-text-primary)" }}>{post.event_date || "일시 미정"}</p>
                      </div>
                      <div>
                        <p className="m-0 text-[11px] font-bold tracking-wide mb-1" style={{ color: "var(--color-text-muted)" }}>장소</p>
                        <p className="m-0 text-sm font-semibold leading-snug" style={{ color: "var(--color-text-primary)" }}>{formatStructuredLocation(post.location)}</p>
                      </div>
                      <div>
                        <p className="m-0 text-[11px] font-bold tracking-wide mb-1" style={{ color: "var(--color-text-muted)" }}>정원</p>
                        <p className="m-0 text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                          {post.capacity != null ? `${post.capacity}명` : "정원 미정"}
                          {post.capacity != null && remaining != null && (
                            <span
                              className="ml-1.5 text-xs font-bold"
                              style={{ color: remaining <= 5 ? "var(--color-warning)" : "var(--color-success)" }}
                            >
                              / 잔여 {remaining}석
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <Link
                      to={`/events/${post.id}/apply`}
                      className="block text-center rounded-xl text-sm font-bold no-underline py-2.5"
                      style={{
                        background: isClosed
                          ? "var(--color-surface-subtle)"
                          : "var(--color-accent-green)",
                        color: isClosed ? "var(--color-text-muted)" : "var(--color-text-primary)",
                        pointerEvents: isClosed ? "none" : "auto",
                      }}
                    >
                      {isClosed ? "마감됨" : "신청하기 →"}
                    </Link>
                  </div>
                </div>
              );
            })}
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
          </div>
          );
        })()}
      </div>
    </PageShell>
  );
}
