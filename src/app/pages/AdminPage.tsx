import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useTheme } from "../ThemeContext";
import { supabase } from "../../lib/supabaseClient";

import { HeaderSection } from "../components/HeaderSection";
import { FooterSection } from "../components/FooterSection";

const CATEGORIES = [
  { id: "notice", label: "공지사항" },
  { id: "news", label: "뉴스" },
  { id: "events", label: "행사" },
  { id: "events-archive", label: "행사 아카이브" },
  { id: "resources", label: "자료실" },
  { id: "blog", label: "블로그" },
  { id: "faq", label: "FAQ" },
];

const getFileNameFromUrl = (url: string | null) => {
  if (!url) return "첨부된 파일";
  try {
    const path = url.split('?')[0];
    const filename = path.split('/').pop() || "첨부된 파일";
    return decodeURIComponent(filename);
  } catch { return "첨부된 파일"; }
};

const getLocalDateString = (d: Date) => {
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().split('T')[0];
};

export default function AdminPage() {
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const [stats, setStats] = useState({ views: 0, posts: 0, visitors: 0 });
  const [category, setCategory] = useState("notice");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [removeExisting, setRemoveExisting] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [showModal, setShowModal] = useState<{ show: boolean; type: 'save' | 'delete' | null }>({ show: false, type: null });
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 10;

  // ── 💡 차트 및 Top 5 상태 ──
  const [chartPeriod, setChartPeriod] = useState<7 | 30>(7); // 7일 or 30일 상태
  const [chartData, setChartData] = useState<{ fullDate: string; label: string; views: number; cumulative: number }[]>([]);
  const [topPosts, setTopPosts] = useState<any[]>([]);

  const card = isDark ? "rgba(255,255,255,0.04)" : "#ffffff";
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const textMain = isDark ? "rgba(255,255,255,0.92)" : "rgba(10,16,32,0.88)";
  const textMuted = isDark ? "rgba(255,255,255,0.45)" : "rgba(10,16,32,0.45)";
  const inputBg = isDark ? "rgba(255,255,255,0.04)" : "#fff";

  const inputStyle = {
    padding: "12px 16px", borderRadius: 10,
    background: inputBg, border: `1px solid ${border}`,
    color: textMain, outline: "none", boxSizing: "border-box" as const,
  };

  useEffect(() => {
    fetchStats();
    fetchPosts();
  }, []);

  // 💡 차트 기간(chartPeriod)이 바뀔 때마다 데이터를 다시 불러옵니다.
  useEffect(() => {
    fetchChartData(chartPeriod);
  }, [chartPeriod]);

  const fetchStats = async () => {
    const { count: v } = await supabase.from('page_views').select('*', { count: 'exact', head: true });
    const { count: p } = await supabase.from('posts').select('*', { count: 'exact', head: true });
    const { data: vd } = await supabase.from('page_views').select('visitor_id');
    const uv = new Set(vd?.map(x => x.visitor_id)).size;
    setStats({ views: v || 0, posts: p || 0, visitors: uv });
  };

  const fetchPosts = async () => {
    const { data } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
    if (data) {
      setPosts(data);
      const sorted = [...data].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5);
      setTopPosts(sorted);
    }
  };

  // ── 💡 7일 / 30일 유동적 데이터 로딩 로직 ──
  const fetchChartData = async (period: number) => {
    const today = new Date();
    const days = [...Array(period)].map((_, i) => {
      const d = new Date();
      d.setDate(today.getDate() - ((period - 1) - i));
      
      // 30일일 경우 라벨이 겹치지 않게 일부 날짜만 표시
      let label = "";
      if (period === 7) {
        label = i === period - 1 ? "오늘" : `${d.getMonth() + 1}/${d.getDate()}`;
      } else {
        if (i === 0 || i === period - 1 || i % 7 === 0) {
          label = i === period - 1 ? "오늘" : `${d.getMonth() + 1}/${d.getDate()}`;
        }
      }

      return { fullDate: getLocalDateString(d), label, views: 0, cumulative: 0 };
    });

    const periodAgo = new Date();
    periodAgo.setDate(today.getDate() - (period - 1));
    periodAgo.setHours(0, 0, 0, 0);

    const { data } = await supabase.from('page_views').select('created_at').gte('created_at', periodAgo.toISOString());
    const { count: totalBefore } = await supabase.from('page_views').select('*', { count: 'exact', head: true }).lt('created_at', periodAgo.toISOString());

    if (days) {
      let runningTotal = totalBefore || 0;
      data?.forEach(view => {
        const dateStr = getLocalDateString(new Date(view.created_at));
        const day = days.find(d => d.fullDate === dateStr);
        if (day) day.views += 1;
      });

      days.forEach(day => {
        runningTotal += day.views;
        day.cumulative = runningTotal;
      });
      setChartData(days);
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || post.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
  const currentPosts = filteredPosts.slice((currentPage - 1) * postsPerPage, currentPage * postsPerPage);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, filterCategory]);
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) setCurrentPage(totalPages);
  }, [filteredPosts.length, currentPage, totalPages]);

  const handleDeleteClick = (id: string) => {
    setSelectedPostId(id);
    setShowModal({ show: true, type: 'delete' });
  };

  const startEdit = (post: any) => {
    setEditingId(post.id);
    setCategory(post.category);
    setTitle(post.title);
    setContent(post.content);
    setFile(null);
    setRemoveExisting(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.size > 5 * 1024 * 1024) {
      alert("파일 크기는 5MB를 초과할 수 없습니다.");
      return;
    }
    setFile(selectedFile || null);
    setRemoveExisting(false);
  };

  const handleSubmitClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return alert("제목과 내용을 입력해주세요.");
    setShowModal({ show: true, type: 'save' });
  };

  const handleConfirmAction = async () => {
    setLoading(true);
    try {
      if (showModal.type === 'delete' && selectedPostId) {
        await supabase.from('posts').delete().eq('id', selectedPostId);
      } else if (showModal.type === 'save') {
        let imageUrl = posts.find(p => p.id === editingId)?.image_url || null;
        if (removeExisting) imageUrl = null;
        if (file) {
          const fileName = `${Date.now()}.${file.name.split('.').pop()}`;
          await supabase.storage.from('images').upload(fileName, file);
          imageUrl = supabase.storage.from('images').getPublicUrl(fileName).data.publicUrl;
        }
        if (editingId) {
          await supabase.from('posts').update({ category, title, content, image_url: imageUrl }).eq('id', editingId);
        } else {
          await supabase.from('posts').insert([{ category, title, content, image_url: imageUrl }]);
        }
        setEditingId(null); setTitle(""); setContent(""); setFile(null); setRemoveExisting(false);
      }
      fetchPosts(); fetchStats(); fetchChartData(chartPeriod); // 수정 완료 후 차트도 새로고침
    } catch (err: any) { alert(err.message); }
    finally { setLoading(false); setShowModal({ show: false, type: null }); setSelectedPostId(null); }
  };

  const existingImageUrl = editingId ? posts.find(p => p.id === editingId)?.image_url : null;
  const showExistingImage = existingImageUrl && !removeExisting && !file;

  const maxViews = Math.max(...chartData.map(d => d.views), 1);
  const maxCumul = Math.max(...chartData.map(d => d.cumulative), 1);
  const chartW = 400, chartH = 150;
  
  // 데이터 개수에 맞춰 X축 간격을 자동 조절
  const getPoints = (key: 'views' | 'cumulative', max: number) => 
    chartData.map((d, i) => `${(i * (chartW / (chartPeriod - 1)))},${chartH - (d[key] / max * chartH)}`).join(" ");

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: isDark ? "#0a1020" : "#F7F8FC", width: "100%", position: "relative" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "72px", background: "#0a1020", zIndex: 999 }} />
      <HeaderSection isDark={isDark} />

      <main style={{ flex: 1, width: "100%", maxWidth: "1100px", margin: "0 auto", padding: "120px 20px 80px 20px" }}>
        <h2 style={{ fontSize: "32px", fontWeight: 800, color: textMain, marginBottom: "40px" }}>관리 대시보드</h2>

        {/* 요약 통계 카드 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px", marginBottom: "40px" }}>
          {[{ label: "누적 페이지뷰", value: stats.views, icon: "👁️" }, { label: "누적 방문자", value: stats.visitors, icon: "👥" }, { label: "전체 게시물", value: stats.posts, icon: "📝" }].map((item) => (
            <div key={item.label} style={{ background: card, padding: "32px", borderRadius: "24px", border: `1px solid ${border}` }}>
              <div style={{ color: textMuted, fontSize: "14px", fontWeight: 600, marginBottom: "12px" }}>{item.icon} {item.label}</div>
              <div style={{ fontSize: "36px", fontWeight: 900, color: textMain }}>{item.value.toLocaleString()}</div>
            </div>
          ))}
        </div>

        {/* ── 💡 차트 & 랭킹 섹션 ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "24px", marginBottom: "60px" }}>
          
          {/* 방문 추이 차트 */}
          <div style={{ background: card, border: `1px solid ${border}`, borderRadius: "24px", padding: "32px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <h3 style={{ margin: 0, color: textMain, fontSize: "18px", fontWeight: 800 }}>📈 방문 및 누적 추이</h3>
                
                {/* 💡 7일 / 30일 토글 버튼 */}
                <div style={{ display: "flex", background: isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9", padding: "4px", borderRadius: "8px" }}>
                  <button onClick={() => setChartPeriod(7)} style={{ padding: "4px 12px", fontSize: "12px", fontWeight: 700, borderRadius: "6px", border: "none", cursor: "pointer", background: chartPeriod === 7 ? "#fff" : "transparent", color: chartPeriod === 7 ? "#4377F1" : textMuted, boxShadow: chartPeriod === 7 ? "0 2px 4px rgba(0,0,0,0.05)" : "none", transition: "all 0.2s" }}>7일</button>
                  <button onClick={() => setChartPeriod(30)} style={{ padding: "4px 12px", fontSize: "12px", fontWeight: 700, borderRadius: "6px", border: "none", cursor: "pointer", background: chartPeriod === 30 ? "#fff" : "transparent", color: chartPeriod === 30 ? "#4377F1" : textMuted, boxShadow: chartPeriod === 30 ? "0 2px 4px rgba(0,0,0,0.05)" : "none", transition: "all 0.2s" }}>30일</button>
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", fontSize: "11px" }}>
                <span style={{ color: "#4377F1" }}>● 일간</span>
                <span style={{ color: "#20D6A2" }}>● 누적</span>
              </div>
            </div>

            <div style={{ width: "100%", height: "180px", position: "relative" }}>
              <svg viewBox={`0 0 ${chartW} ${chartH}`} style={{ width: "100%", height: "100%", overflow: "visible" }}>
                <polyline fill="none" stroke="#4377F1" strokeWidth="3" strokeLinejoin="round" points={getPoints('views', maxViews)} style={{ transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)" }} />
                <polyline fill="none" stroke="#20D6A2" strokeWidth="3" strokeLinejoin="round" points={getPoints('cumulative', maxCumul)} style={{ transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)", strokeDasharray: "4 2" }} />
              </svg>
              
              {/* 💡 날짜 라벨 (30일일 때 겹치지 않도록 절대 위치 사용) */}
              <div style={{ position: "relative", height: "20px", marginTop: "12px" }}>
                {chartData.map((d, i) => d.label && (
                  <span key={d.fullDate} style={{ position: "absolute", left: `${(i / (chartPeriod - 1)) * 100}%`, transform: "translateX(-50%)", fontSize: "11px", color: textMuted, fontWeight: 700 }}>
                    {d.label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* 인기 게시물 Top 5 */}
          <div style={{ background: card, border: `1px solid ${border}`, borderRadius: "24px", padding: "32px" }}>
            <h3 style={{ margin: "0 0 24px 0", color: textMain, fontSize: "18px", fontWeight: 800 }}>🔥 인기 게시물 Top 5</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {topPosts.length === 0 ? (
                <div style={{ color: textMuted, fontSize: "14px", textAlign: "center", padding: "20px" }}>데이터가 없습니다.</div>
              ) : (
                topPosts.map((post, i) => (
                  <div key={post.id} style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", transition: "transform 0.2s" }} onClick={() => navigate(`/post/${post.id}`)} onMouseEnter={(e) => e.currentTarget.style.transform = "translateX(4px)"} onMouseLeave={(e) => e.currentTarget.style.transform = "translateX(0)"}>
                    <div style={{ width: "24px", height: "24px", borderRadius: "6px", background: i < 3 ? "#4377F1" : border, color: i < 3 ? "#fff" : textMuted, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 800, flexShrink: 0 }}>{i + 1}</div>
                    
                    {/* 💡 카테고리 배지 추가 */}
                    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "8px", overflow: "hidden" }}>
                      <span style={{ fontSize: "10px", background: isDark ? "rgba(67, 119, 241, 0.15)" : "#eef2ff", color: "#4377F1", padding: "3px 6px", borderRadius: "6px", fontWeight: 700, whiteSpace: "nowrap" }}>
                        {CATEGORIES.find(c => c.id === post.category)?.label}
                      </span>
                      <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: textMain, fontSize: "14px", fontWeight: 600 }}>{post.title}</div>
                    </div>

                    <div style={{ fontSize: "12px", color: "#4377F1", fontWeight: 700, flexShrink: 0 }}>{post.views || 0}회</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 게시물 등록 폼 */}
        <form onSubmit={handleSubmitClick} style={{ background: card, border: `1px solid ${border}`, borderRadius: "24px", padding: "40px", display: "flex", flexDirection: "column", gap: "20px", marginBottom: "80px" }}>
          <h3 style={{ margin: 0, color: textMain, fontSize: "22px", fontWeight: 800 }}>{editingId ? "✨ 게시물 수정" : "📝 새 게시물 등록"}</h3>
          <div style={{ display: "flex", gap: "16px" }}>
            <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ ...inputStyle, width: "200px" }}>
              {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목을 입력하세요" style={{ ...inputStyle, flex: 1 }} required />
          </div>
          <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="내용을 입력하세요" style={{ ...inputStyle, minHeight: "200px", resize: "none" }} required />
          
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {file ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px", background: inputBg, border: `1px solid ${border}`, borderRadius: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", color: textMain }}>
                   <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4377F1" strokeWidth="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
                   <span style={{ fontWeight: 600 }}>{file.name}</span>
                </div>
                <button type="button" onClick={() => setFile(null)} style={{ border: "none", background: "#fee2e2", color: "#ef4444", padding: "8px 12px", borderRadius: "8px", cursor: "pointer" }}>제거</button>
              </div>
            ) : showExistingImage ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px", background: inputBg, border: `1px solid ${border}`, borderRadius: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", color: textMain }}>
                  <img src={existingImageUrl} alt="" style={{ width: "44px", height: "44px", borderRadius: "8px", objectFit: "cover" }} />
                  <span style={{ fontWeight: 600 }}>{getFileNameFromUrl(existingImageUrl)}</span>
                </div>
                <button type="button" onClick={() => setRemoveExisting(true)} style={{ border: "none", background: "#fee2e2", color: "#ef4444", padding: "8px 12px", borderRadius: "8px", cursor: "pointer" }}>기존 파일 삭제</button>
              </div>
            ) : (
              <label style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "50px 20px", background: isDark ? "rgba(255,255,255,0.02)" : "#fafafa", border: `2px dashed ${border}`, borderRadius: "20px", cursor: "pointer", color: textMain, gap: "12px" }}>
                <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
                <span style={{ fontWeight: 700, color: "#4377F1" }}>+ 이미지 파일 첨부</span>
                <span style={{ fontSize: "13px", color: "gray" }}>최대 5MB / JPG, PNG 지원</span>
              </label>
            )}
          </div>

          <button type="submit" disabled={loading} style={{ padding: "18px", borderRadius: "16px", border: "none", background: "#4377F1", color: "#fff", fontWeight: 800, cursor: "pointer" }}>{loading ? "처리 중..." : editingId ? "변경사항 저장" : "게시물 등록하기"}</button>
        </form>

        {/* 게시물 목록 관리 */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: "22px", fontWeight: 800, color: textMain }}>📦 게시물 관리 ({filteredPosts.length})</h3>
            <div style={{ display: "flex", gap: "12px" }}>
              <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} style={{ ...inputStyle, padding: "10px 16px" }}>
                <option value="all">전체 카테고리</option>
                {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
              <input type="text" placeholder="검색어 입력..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ ...inputStyle, width: "240px" }} />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px", minHeight: "800px" }}>
            {currentPosts.length === 0 ? (
               <div style={{ padding: "60px", textAlign: "center", color: textMuted }}>게시물이 없습니다.</div>
            ) : (
               currentPosts.map(post => (
                 <div key={post.id} style={{ background: card, border: `1px solid ${border}`, borderRadius: "20px", padding: "20px 30px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                   <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                     <span style={{ fontSize: "12px", background: "#eef2ff", color: "#4377F1", padding: "6px 10px", borderRadius: "8px", fontWeight: 700 }}>
                       {CATEGORIES.find(c => c.id === post.category)?.label}
                     </span>
                     <strong style={{ color: textMain, fontSize: "16px" }}>{post.title}</strong>
                   </div>
                   <div style={{ display: "flex", gap: "10px" }}>
                     <button onClick={() => startEdit(post)} style={{ padding: "10px 18px", borderRadius: "10px", border: `1px solid ${border}`, background: "none", color: "#4377F1", fontWeight: 700, cursor: "pointer" }}>수정</button>
                     <button onClick={() => handleDeleteClick(post.id)} style={{ padding: "10px 18px", borderRadius: "10px", border: "none", background: "#fee2e2", color: "#ef4444", fontWeight: 700, cursor: "pointer" }}>삭제</button>
                   </div>
                 </div>
               ))
            )}
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "20px" }}>
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{ padding: "8px 14px", borderRadius: "8px", border: `1px solid ${border}`, background: card, color: textMain, cursor: currentPage === 1 ? "not-allowed" : "pointer", fontWeight: 600 }}
              >
                이전
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  style={{ 
                    padding: "8px 16px", borderRadius: "8px", cursor: "pointer",
                    border: currentPage === i + 1 ? `1px solid #4377F1` : `1px solid ${border}`, 
                    background: currentPage === i + 1 ? "#4377F1" : card, 
                    color: currentPage === i + 1 ? "#fff" : textMain, 
                    fontWeight: currentPage === i + 1 ? 800 : 500,
                  }}
                >
                  {i + 1}
                </button>
              ))}
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={{ padding: "8px 14px", borderRadius: "8px", border: `1px solid ${border}`, background: card, color: textMain, cursor: currentPage === totalPages ? "not-allowed" : "pointer", fontWeight: 600 }}
              >
                다음
              </button>
            </div>
          )}
        </div>
      </main>
      <FooterSection isDark={isDark} />

      {/* 모달 */}
      {showModal.show && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }}>
          <div style={{ background: isDark ? "#1e293b" : "#fff", padding: "40px", borderRadius: "32px", textAlign: "center", maxWidth: "420px", width: "90%" }}>
            <h2 style={{ color: textMain, marginBottom: "16px" }}>{showModal.type === 'delete' ? '🗑️ 게시물 삭제' : '✅ 작업 확인'}</h2>
            <p style={{ color: textMuted, marginBottom: "32px", lineHeight: 1.6 }}>{showModal.type === 'delete' ? '이 게시물을 삭제하시겠습니까?\n이 작업은 취소할 수 없습니다.' : '내용을 게시판에 즉시 반영하시겠습니까?'}</p>
            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={handleConfirmAction} style={{ flex: 1, padding: "16px", borderRadius: "16px", border: "none", background: showModal.type === 'delete' ? "#ef4444" : "#4377F1", color: "#fff", fontWeight: 700, cursor: "pointer" }}>확인</button>
              <button onClick={() => setShowModal({ show: false, type: null })} style={{ flex: 1, padding: "16px", borderRadius: "16px", border: `1px solid ${border}`, background: "none", color: textMain, cursor: "pointer" }}>취소</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}