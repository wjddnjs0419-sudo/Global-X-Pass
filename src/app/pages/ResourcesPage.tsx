import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { PageShell } from "../components/PageShell";
import { BoardAccessGate } from "../components/BoardAccessGate";
import { useBoardCategoryLabel, useBoardCategoryDescription } from "../BoardCategoriesContext";
import { fetchPublicPostPreviews } from "../../utils/publicPostPreviews";
import { LoadingSpinner, ErrorMessage } from "../components/LoadingSpinner";
import { getFileNameFromUrl } from "../../utils/file";
import { LAYERS } from "../../lib/layers";
import { AppPagination } from "../components/AppPagination";

const PAGE_SIZE = 10;

export function ResourcesPage() {
  const boardTitle = useBoardCategoryLabel("resources", "자료실");
  const boardSubtitle = useBoardCategoryDescription("resources", "NCF와 Around X가 제공하는 필수 서식과 가이드 자료를 다운로드하세요.");
  const navigate = useNavigate();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchPosts = async () => {
      const { data, error } = await fetchPublicPostPreviews('resources');
      if (error) setError(true);
      else setPosts(data || []);
      setLoading(false);
    };
    fetchPosts();

    const handleClickOutside = () => setOpenId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const triggerDownload = (url: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.download = getFileNameFromUrl(url);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadClick = (e: React.MouseEvent, post: any) => {
    e.stopPropagation();
    const files = post.image_url ? post.image_url.split(',').filter(Boolean) : [];
    if (files.length === 0) {
      e.preventDefault();
      return;
    }

    if (files.length === 1) {
      triggerDownload(files[0]);
    } else {
      setOpenId(openId === post.id ? null : post.id);
    }
  };

  const handleRowKeyDown = (event: React.KeyboardEvent, postId: string) => {
    if (event.currentTarget !== event.target) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      navigate(`/post/${postId}`);
    }
  };

  return (
    <BoardAccessGate category="resources">
    <PageShell title={boardTitle} subtitle={boardSubtitle}>
      <div className="max-w-[900px] mx-auto pb-[100px]">
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorMessage />
        ) : posts.length === 0 ? (
          <p className="text-center text-gray-500 py-[100px]">등록된 자료가 없습니다.</p>
        ) : (() => {
          const totalPages = Math.ceil(posts.length / PAGE_SIZE);
          const pagedPosts = posts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
          return (
          <div className="flex flex-col gap-3">
            {pagedPosts.map((post) => {
              const files = post.image_url ? post.image_url.split(',').filter(Boolean) : [];
              const hasFiles = files.length > 0;
              const isOpen = openId === post.id;
              const downloadLabel = !hasFiles
                ? `${post.title} 첨부파일 없음`
                : files.length > 1
                  ? `${post.title} 첨부파일 ${files.length}개 선택`
                  : `${post.title} 자료 다운로드`;

              return (
                <div
                  key={post.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/post/${post.id}`)}
                  onKeyDown={(event) => handleRowKeyDown(event, post.id)}
                  className="resource-row relative rounded-2xl px-[30px] py-6 flex items-center justify-between cursor-pointer transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-rest)]"
                  style={{ background: "var(--color-surface-card)", border: "1px solid var(--color-border-soft)", zIndex: isOpen ? LAYERS.cardRaised : "auto" }}
                >
                  <div className="flex-1 min-w-0">
                    <h2
                      className="m-0 mb-1.5 text-[18px] font-bold whitespace-nowrap overflow-hidden text-ellipsis"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {post.title}
                    </h2>
                    <div className="flex gap-3 items-center">
                       <span className="text-[13px] text-gray-500">{new Date(post.created_at).toLocaleDateString()}</span>
                       {post.content && (
                         <span className="text-[13px] text-[var(--color-text-muted)] border-l border-[var(--color-border-soft)] pl-3 whitespace-nowrap overflow-hidden text-ellipsis">
                           {(post.content || "").replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()}
                         </span>
                       )}
                    </div>
                  </div>

                  <div className="relative ml-5" style={{ zIndex: isOpen ? LAYERS.cardDropdown : "auto" }}>
                    <button
                      type="button"
                      onClick={(e) => handleDownloadClick(e, post)}
                      aria-label={downloadLabel}
                      aria-disabled={!hasFiles}
                      aria-haspopup={files.length > 1 ? "menu" : undefined}
                      aria-expanded={files.length > 1 ? isOpen : undefined}
                      className={`resource-download-button p-2.5 rounded-xl transition-all duration-200 border-none outline-none ${
                        hasFiles
                          ? "text-[var(--color-accent-blue)] bg-[var(--color-accent-blue-soft-bg)] hover:bg-[var(--color-accent-blue-soft-bg-hover)] active:scale-95 cursor-pointer"
                          : "text-gray-300 bg-gray-100 cursor-not-allowed"
                      }`}
                      title={hasFiles ? (files.length > 1 ? "자료 선택" : "자료 다운로드") : "첨부파일 없음"}
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                      {files.length > 1 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-[var(--color-bg-surface)]" style={{ background: "var(--color-accent-blue)", color: "var(--color-text-primary)" }}>
                          {files.length}
                        </div>
                      )}
                    </button>

                    {/* 다중 파일 드롭다운 */}
                    {isOpen && files.length > 1 && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-0 mt-2 w-[280px] rounded-2xl shadow-2xl border overflow-hidden animate-in fade-in zoom-in duration-200 origin-top-right"
                        style={{ zIndex: LAYERS.cardDropdown, background: "var(--color-bg-elevated)", borderColor: "var(--color-border-soft)" }}
                      >
                        <div className="p-3 bg-gray-500/5 border-b font-bold text-[12px] px-4" style={{ color: "var(--color-text-primary)", borderColor: "var(--color-border-soft)" }}>
                          첨부파일 목록 ({files.length})
                        </div>
                        <div className="max-h-[240px] overflow-y-auto">
                          {files.map((fileUrl: string, idx: number) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={(e) => { e.stopPropagation(); triggerDownload(fileUrl); setOpenId(null); }}
                              aria-label={`${getFileNameFromUrl(fileUrl)} 다운로드`}
                              className="resource-file-button w-full px-4 py-3 flex items-center gap-3 hover:bg-[var(--color-accent-blue-soft-bg)] transition-colors cursor-pointer group border-none bg-transparent text-left outline-none"
                            >
                              <div className="text-[var(--color-accent-blue)] group-hover:scale-110 transition-transform">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                              </div>
                              <span className="text-[13px] font-medium truncate flex-1" style={{ color: "var(--color-text-primary)" }}>
                                {getFileNameFromUrl(fileUrl)}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <AppPagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} className="mt-10" />
          </div>
          );
        })()}
      </div>
      <style>{`
        .resource-row:focus-visible {
          outline: 2px solid var(--color-accent-blue-soft-border-strong);
          outline-offset: 3px;
        }
        .resource-download-button:focus-visible,
        .resource-file-button:focus-visible {
          outline: 2px solid var(--color-accent-blue-soft-border-strong);
          outline-offset: 3px;
        }
      `}</style>
    </PageShell>
    </BoardAccessGate>
  );
}
