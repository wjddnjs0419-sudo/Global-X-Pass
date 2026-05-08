import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { PageShell } from "../components/PageShell";
import { useTheme } from "../ThemeContext";
import { supabase } from "../../lib/supabaseClient";
import { LoadingSpinner, ErrorMessage } from "../components/LoadingSpinner";
import { getFileNameFromUrl } from "../../utils/file";
import { LAYERS } from "../../lib/layers";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis } from "../components/ui/pagination";

const PAGE_SIZE = 10;

export function ResourcesPage() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const card = isDark ? "rgba(255,255,255,0.04)" : "#ffffff";
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const textMain = isDark ? "rgba(255,255,255,0.92)" : "#0f172a";
  const dropdownBg = isDark ? "#1e293b" : "#ffffff";

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
    <PageShell title="자료실" subtitle="NCF와 Around X가 제공하는 필수 서식과 가이드 자료를 다운로드하세요.">
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
                  className="resource-row relative rounded-2xl px-[30px] py-6 flex items-center justify-between cursor-pointer transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(0,0,0,0.05)]"
                  style={{ background: card, border: `1px solid ${border}`, zIndex: isOpen ? LAYERS.cardRaised : "auto" }}
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
                          ? "text-[#4377F1] bg-[#4377F1]/10 hover:bg-[#4377F1]/20 active:scale-95 cursor-pointer"
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
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#4377F1] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-[#0a1020]">
                          {files.length}
                        </div>
                      )}
                    </button>

                    {/* 다중 파일 드롭다운 */}
                    {isOpen && files.length > 1 && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-0 mt-2 w-[280px] rounded-2xl shadow-2xl border overflow-hidden animate-in fade-in zoom-in duration-200 origin-top-right"
                        style={{ zIndex: LAYERS.cardDropdown, background: dropdownBg, borderColor: border }}
                      >
                        <div className="p-3 bg-gray-500/5 border-b font-bold text-[12px] px-4" style={{ color: textMain, borderColor: border }}>
                          첨부파일 목록 ({files.length})
                        </div>
                        <div className="max-h-[240px] overflow-y-auto">
                          {files.map((fileUrl: string, idx: number) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={(e) => { e.stopPropagation(); triggerDownload(fileUrl); setOpenId(null); }}
                              aria-label={`${getFileNameFromUrl(fileUrl)} 다운로드`}
                              className="resource-file-button w-full px-4 py-3 flex items-center gap-3 hover:bg-[#4377F1]/5 transition-colors cursor-pointer group border-none bg-transparent text-left outline-none"
                            >
                              <div className="text-[#4377F1] group-hover:scale-110 transition-transform">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                              </div>
                              <span className="text-[13px] font-medium truncate flex-1" style={{ color: textMain }}>
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
      <style>{`
        .resource-row:focus-visible {
          outline: 2px solid rgba(67,119,241,0.5);
          outline-offset: 3px;
        }
        .resource-download-button:focus-visible,
        .resource-file-button:focus-visible {
          outline: 2px solid rgba(67,119,241,0.65);
          outline-offset: 3px;
        }
      `}</style>
    </PageShell>
  );
}
