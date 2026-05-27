import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { useTheme } from "../../ThemeContext";
import { CATEGORIES } from "./adminConstants";
import { useBoardCategoryLabels, useBoardCategoryList } from "../../BoardCategoriesContext";
import { supabase } from "../../../lib/supabaseClient";
import { AdminPostModal } from "./AdminPostModal";

interface AdminPostManageProps {
  refreshKey: number;
  onStartEdit: (post: any) => void;
  onDeleted: () => void;
}

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  const MM = String(d.getMonth() + 1).padStart(2, "0");
  const DD = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${MM}/${DD} ${hh}:${mm}`;
};

export function AdminPostManage({ refreshKey, onStartEdit, onDeleted }: AdminPostManageProps) {
  const { isDark } = useTheme();
  const boardLabels = useBoardCategoryLabels();
  const boardList = useBoardCategoryList();
  // 게시판 옵션은 post_categories(동적) 우선, 로딩 전에는 정적 폴백.
  const categoryOptions = boardList.length ? boardList : CATEGORIES;
  const catLabel = (id: string) => {
    const fallback = CATEGORIES.find((c) => c.id === id)?.label ?? id;
    return id === "expenses" ? fallback : boardLabels[id] ?? fallback;
  };
  const navigate = useNavigate();

  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const postsPerPage = 10;

  const card     = isDark ? "rgba(255,255,255,0.04)" : "#ffffff";
  const border   = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const textMain = isDark ? "rgba(255,255,255,0.92)" : "rgba(10,16,32,0.88)";
  const textMuted= isDark ? "rgba(255,255,255,0.45)" : "rgba(10,16,32,0.45)";
  const inputBg  = isDark ? "rgba(255,255,255,0.04)" : "#fff";
  const skBg     = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)";
  const labelBg = isDark ? "rgba(255,255,255,0.045)" : "rgba(15,23,42,0.035)";
  const labelBorder = isDark ? "rgba(255,255,255,0.10)" : "rgba(15,23,42,0.09)";
  const selectedBg = isDark ? "rgba(255,255,255,0.10)" : "rgba(15,23,42,0.08)";

  const Sk = ({ h = 56 }: { h?: number }) => (
    <div style={{ height: h, borderRadius: 20, background: skBg, animation: "pulse 1.5s ease-in-out infinite" }} />
  );

  const inputStyle = { padding: "12px 16px", borderRadius: 10, background: inputBg, border: `1px solid ${border}`, color: textMain, outline: "none", boxSizing: "border-box" as const };

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
    if (data) setPosts(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchPosts(); }, [refreshKey]);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, filterCategory]);

  const toggleFeatured = async (post: any) => {
    const current = !!post.is_featured;
    if (!current) {
      await supabase.from('posts').update({ is_featured: false }).eq('category', post.category);
    }
    await supabase.from('posts').update({ is_featured: !current }).eq('id', post.id);
    fetchPosts();
  };

  const togglePublic = async (post: any) => {
    if (post.category === "expenses") {
      alert("사업비 자료실(expenses)은 정책상 항상 비공개로 운영되며 공개 설정을 변경할 수 없습니다.");
      return;
    }
    const next = !(post.is_public ?? true);
    const { error } = await supabase.from('posts').update({ is_public: next }).eq('id', post.id);
    if (error) { alert(`공개 설정 변경 실패: ${error.message}`); return; }
    fetchPosts();
  };

  const bulkSetPublic = async (nextPublic: boolean) => {
    if (filterCategory === "all") { alert("카테고리를 선택한 뒤 일괄 설정할 수 있습니다."); return; }
    if (filterCategory === "expenses") {
      alert("사업비 자료실(expenses)은 정책상 항상 비공개로 운영되며 일괄 변경할 수 없습니다.");
      return;
    }
    const label = catLabel(filterCategory);
    const verb = nextPublic ? "공개" : "비공개";
    if (!window.confirm(`'${label}' 카테고리의 모든 게시물을 ${verb} 상태로 변경하시겠습니까?`)) return;
    const { error } = await supabase.from('posts').update({ is_public: nextPublic }).eq('category', filterCategory);
    if (error) { alert(`일괄 변경 실패: ${error.message}`); return; }
    fetchPosts();
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    setDeleteLoading(true);
    await supabase.from('posts').delete().eq('id', deletingId);
    setDeleteLoading(false);
    setDeletingId(null);
    fetchPosts();
    onDeleted();
  };

  const filteredPosts = posts
    .filter(p => {
      const matchSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = filterCategory === "all" || p.category === filterCategory;
      return matchSearch && matchCat;
    })
    .sort((a, b) => new Date(b.updated_at ?? b.created_at).getTime() - new Date(a.updated_at ?? a.created_at).getTime());

  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
  const currentPosts = filteredPosts.slice((currentPage - 1) * postsPerPage, currentPage * postsPerPage);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", overflow: "hidden" }}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 style={{ fontSize: "24px", fontWeight: 800, color: textMain, margin: 0 }}>
          게시물 관리 ({loading ? "…" : filteredPosts.length})
        </h3>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:gap-3">
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="w-full sm:w-auto" style={{ ...inputStyle, padding: "10px 16px" }}>
            <option value="all">전체 카테고리</option>
            {categoryOptions.map(c => <option key={c.id} value={c.id}>{catLabel(c.id)}</option>)}
          </select>
          <input type="text" placeholder="검색어 입력..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full sm:w-[240px]" style={inputStyle} />
        </div>
      </div>

      {filterCategory !== "all" && filterCategory !== "expenses" && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3" style={{ padding: "14px 18px", background: labelBg, border: `1px solid ${labelBorder}`, borderRadius: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontWeight: 800, fontSize: 13, color: textMain }}>'{catLabel(filterCategory)}' 카테고리 일괄 설정</span>
            <span style={{ fontSize: 12, color: textMuted }}>이 카테고리의 모든 게시물 공개/비공개 상태를 한 번에 변경합니다.</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => bulkSetPublic(true)} style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${labelBorder}`, background: card, color: textMain, fontWeight: 750, cursor: "pointer", fontSize: 13 }}>전체 공개</button>
            <button onClick={() => bulkSetPublic(false)} style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${labelBorder}`, background: card, color: textMain, fontWeight: 750, cursor: "pointer", fontSize: 13 }}>전체 비공개</button>
          </div>
        </div>
      )}

      {filterCategory === "expenses" && (
        <div className="flex items-center gap-3" style={{ padding: "14px 18px", background: isDark ? "rgba(234,67,53,0.08)" : "rgba(234,67,53,0.06)", border: `1px solid ${isDark ? "rgba(234,67,53,0.28)" : "rgba(234,67,53,0.22)"}`, borderRadius: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--color-brand-red)" }}>🔒 사업비 자료실은 정책상 항상 비공개로 운영되며 공개 설정을 변경할 수 없습니다.</span>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <Sk key={i} />)
          : currentPosts.length === 0
            ? <div style={{ padding: "60px", textAlign: "center", color: textMuted }}>게시물이 없습니다.</div>
            : currentPosts.map(post => {
                return (
                  <div key={post.id} className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-[16px] sm:gap-3" style={{ background: card, border: `1px solid ${border}`, borderRadius: "16px", padding: "18px 24px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px", minWidth: 0, flex: 1 }}>
                      <span style={{ fontSize: "12px", background: labelBg, border: `1px solid ${labelBorder}`, color: textMuted, padding: "5px 10px", borderRadius: "8px", fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 }}>
                        {catLabel(post.category)}
                      </span>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0, flex: 1 }}>
                        <strong onClick={() => navigate(post.category === "events" ? `/events/${post.id}/apply` : `/post/${post.id}`)} style={{ color: textMain, fontSize: "16px", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3, textDecorationColor: "rgba(67,119,241,0.4)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>
                          {post.title}
                        </strong>
                        <span style={{ fontSize: 12, color: textMuted }}>
                          {post.updated_at ? `수정 ${fmtDate(post.updated_at)}` : `게시 ${fmtDate(post.created_at)}`}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "flex-end", flexShrink: 0 }}>
                      {post.category === "expenses" ? (
                        <span title="사업비 자료실은 정책상 항상 비공개" style={{ padding: "9px 12px", borderRadius: "8px", border: `1px solid rgba(234,67,53,0.32)`, background: isDark ? "rgba(234,67,53,0.10)" : "rgba(234,67,53,0.06)", color: "var(--color-brand-red)", fontWeight: 800, fontSize: 13, whiteSpace: "nowrap", display: "inline-flex", alignItems: "center" }}>
                          🔒 비공개 고정
                        </span>
                      ) : (
                        <button
                          onClick={() => togglePublic(post)}
                          title={(post.is_public ?? true) ? "클릭하면 비공개로 전환 (로그인 유저만 열람)" : "클릭하면 공개로 전환 (비로그인도 열람)"}
                          style={{
                            padding: "9px 14px",
                            borderRadius: "8px",
                            border: `1px solid ${(post.is_public ?? true) ? "rgba(24,163,67,0.32)" : "rgba(234,67,53,0.32)"}`,
                            background: (post.is_public ?? true)
                              ? (isDark ? "rgba(24,163,67,0.16)" : "rgba(24,163,67,0.10)")
                              : (isDark ? "rgba(234,67,53,0.16)" : "rgba(234,67,53,0.08)"),
                            color: (post.is_public ?? true) ? "var(--color-accent-green)" : "var(--color-brand-red)",
                            fontWeight: 800,
                            cursor: "pointer",
                            fontSize: 13,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {(post.is_public ?? true) ? "공개" : "비공개"}
                        </button>
                      )}
                      {post.category === "events" && (
                        <button onClick={() => toggleFeatured(post)} style={{ padding: "9px 12px", borderRadius: "8px", border: `1px solid ${post.is_featured ? labelBorder : border}`, background: post.is_featured ? selectedBg : "transparent", color: post.is_featured ? textMain : textMuted, fontWeight: 700, cursor: "pointer", fontSize: 13, whiteSpace: "nowrap" }}>
                          {post.is_featured ? "대표중" : "대표"}
                        </button>
                      )}
                      <button onClick={() => onStartEdit(post)} style={{ padding: "9px 14px", borderRadius: "8px", border: `1px solid ${border}`, background: "transparent", color: textMain, fontWeight: 700, cursor: "pointer", fontSize: 13, whiteSpace: "nowrap" }}>수정</button>
                      <button onClick={() => setDeletingId(post.id)} style={{ padding: "9px 14px", borderRadius: "8px", border: `1px solid ${isDark ? "rgba(234,67,53,0.28)" : "rgba(234,67,53,0.22)"}`, background: isDark ? "rgba(234,67,53,0.08)" : "rgba(234,67,53,0.06)", color: "#EA4335", fontWeight: 700, cursor: "pointer", fontSize: 13, whiteSpace: "nowrap" }}>삭제</button>
                    </div>
                  </div>
                );
              })}
      </div>

      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "20px" }}>
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} style={{ padding: "8px 14px", borderRadius: "8px", border: `1px solid ${border}`, background: card, color: textMain, cursor: currentPage === 1 ? "not-allowed" : "pointer", fontWeight: 600 }}>이전</button>
          {[...Array(totalPages)].map((_, i) => (
            <button key={i} onClick={() => setCurrentPage(i + 1)} style={{ padding: "8px 16px", borderRadius: "8px", cursor: "pointer", border: `1px solid ${currentPage === i + 1 ? labelBorder : border}`, background: currentPage === i + 1 ? selectedBg : card, color: currentPage === i + 1 ? textMain : textMain, fontWeight: currentPage === i + 1 ? 800 : 500 }}>{i + 1}</button>
          ))}
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} style={{ padding: "8px 14px", borderRadius: "8px", border: `1px solid ${border}`, background: card, color: textMain, cursor: currentPage === totalPages ? "not-allowed" : "pointer", fontWeight: 600 }}>다음</button>
        </div>
      )}

      {deletingId && (
        <AdminPostModal
          type="delete"
          editingId={null}
          loading={deleteLoading}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingId(null)}
        />
      )}
    </div>
  );
}

export default AdminPostManage;
