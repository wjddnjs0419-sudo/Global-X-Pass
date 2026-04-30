import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { useTheme } from "../../ThemeContext";
import { CATEGORIES, CATEGORY_COLOR } from "./adminConstants";
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

  const toggleFeatured = async (id: string, current: boolean) => {
    if (!current) await supabase.from('posts').update({ is_featured: false }).eq('category', 'blog');
    await supabase.from('posts').update({ is_featured: !current }).eq('id', id);
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
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ fontSize: "22px", fontWeight: 800, color: textMain }}>
          게시물 관리 ({loading ? "…" : filteredPosts.length})
        </h3>
        <div className="flex flex-col sm:flex-row gap-[12px] w-full sm:w-auto">
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="w-full sm:w-auto" style={{ ...inputStyle, padding: "10px 16px" }}>
            <option value="all">전체 카테고리</option>
            {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          <input type="text" placeholder="검색어 입력..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full sm:w-[240px]" style={inputStyle} />
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <Sk key={i} />)
          : currentPosts.length === 0
            ? <div style={{ padding: "60px", textAlign: "center", color: textMuted }}>게시물이 없습니다.</div>
            : currentPosts.map(post => {
                const cat = CATEGORIES.find(c => c.id === post.category);
                const clr = CATEGORY_COLOR[post.category] ?? CATEGORY_COLOR["news"];
                return (
                  <div key={post.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-[16px] sm:gap-0" style={{ background: card, border: `1px solid ${border}`, borderRadius: "20px", padding: "20px 30px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "20px", minWidth: 0 }}>
                      <span style={{ fontSize: "12px", background: isDark ? clr.bgDark : clr.bg, color: clr.color, padding: "6px 12px", borderRadius: "8px", fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 }}>
                        {cat?.label ?? post.category}
                      </span>
                      <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                        <strong onClick={() => navigate(`/post/${post.id}`)} style={{ color: textMain, fontSize: "16px", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3, textDecorationColor: "rgba(67,119,241,0.4)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {post.title}
                        </strong>
                        <span style={{ fontSize: 12, color: textMuted }}>
                          {post.updated_at ? `수정 ${fmtDate(post.updated_at)}` : `게시 ${fmtDate(post.created_at)}`}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "10px" }}>
                      {post.category === "blog" && (
                        <button onClick={() => toggleFeatured(post.id, !!post.is_featured)} style={{ padding: "10px 14px", borderRadius: "10px", border: `1px solid ${post.is_featured ? "rgba(168,85,247,0.4)" : border}`, background: post.is_featured ? "rgba(168,85,247,0.12)" : "none", color: post.is_featured ? "#A855F7" : textMuted, fontWeight: 700, cursor: "pointer", fontSize: 14 }}>
                          {post.is_featured ? "★ 추천중" : "☆ 추천"}
                        </button>
                      )}
                      <button onClick={() => onStartEdit(post)} style={{ padding: "10px 18px", borderRadius: "10px", border: `1px solid ${border}`, background: "none", color: "#4377F1", fontWeight: 700, cursor: "pointer" }}>수정</button>
                      <button onClick={() => setDeletingId(post.id)} style={{ padding: "10px 18px", borderRadius: "10px", border: "none", background: "#fee2e2", color: "#ef4444", fontWeight: 700, cursor: "pointer" }}>삭제</button>
                    </div>
                  </div>
                );
              })}
      </div>

      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "20px" }}>
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} style={{ padding: "8px 14px", borderRadius: "8px", border: `1px solid ${border}`, background: card, color: textMain, cursor: currentPage === 1 ? "not-allowed" : "pointer", fontWeight: 600 }}>이전</button>
          {[...Array(totalPages)].map((_, i) => (
            <button key={i} onClick={() => setCurrentPage(i + 1)} style={{ padding: "8px 16px", borderRadius: "8px", cursor: "pointer", border: currentPage === i + 1 ? `1px solid #4377F1` : `1px solid ${border}`, background: currentPage === i + 1 ? "#4377F1" : card, color: currentPage === i + 1 ? "#fff" : textMain, fontWeight: currentPage === i + 1 ? 800 : 500 }}>{i + 1}</button>
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
