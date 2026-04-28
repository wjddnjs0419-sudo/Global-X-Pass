import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router";
import { useTheme } from "../ThemeContext";
import { supabase } from "../../lib/supabaseClient";

import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

import { HeaderSection } from "../components/HeaderSection";
import { encodeFilename, getFileNameFromUrl } from "../../utils/file";
import { CATEGORIES, getLocalDateString } from "../components/admin/adminConstants";
import { NotificationBell } from "../components/admin/NotificationBell";
import { AdminDashboard } from "../components/admin/AdminDashboard";
import { AdminUserManagement } from "../components/admin/AdminUserManagement";
import { AdminPostCreate } from "../components/admin/AdminPostCreate";
import { AdminPostManage } from "../components/admin/AdminPostManage";
import { AdminConsultingManagement } from "../components/admin/AdminConsultingManagement";
import { AdminFoundersClubManagement } from "../components/admin/AdminFoundersClubManagement";
import { AdminFlowMap } from "../components/admin/AdminFlowMap";

export default function AdminPage() {
  const { isDark } = useTheme();
  const navigate = useNavigate();

  // 상단 탭 상태
  const [activeTab, setActiveTab] = useState<"dashboard" | "users" | "create" | "manage" | "consulting" | "founders">("dashboard");

  const [stats, setStats] = useState({ views: 0, posts: 0, visitors: 0 });
  const [category, setCategory] = useState("notice");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  
  const [files, setFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);

  // 행사·블로그 확장 필드
  const [eventMeta, setEventMeta] = useState({ event_date: "", location: "", event_status: "접수예정", capacity: "", slots_remaining: "", tags: "" });
  
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [showModal, setShowModal] = useState<{ show: boolean; type: 'save' | 'delete' | null }>({ show: false, type: null });
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 10;

  const [chartPeriod, setChartPeriod] = useState<7 | 30>(7);
  const [chartData, setChartData] = useState<{ fullDate: string; label: string; views: number; cumulative: number }[]>([]);
  const [topPosts, setTopPosts] = useState<any[]>([]);

  // 회원 관리용 상태
  const [users, setUsers] = useState<any[]>([]);
  const [currentUsersPage, setCurrentUsersPage] = useState(1);
  const usersPerPage = 10;
  const [csvLoading, setCsvLoading] = useState(false);

  const quillRef = useRef<ReactQuill>(null);

  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const textMain = isDark ? "rgba(255,255,255,0.92)" : "rgba(10,16,32,0.88)";
  const textMuted = isDark ? "rgba(255,255,255,0.45)" : "rgba(10,16,32,0.45)";

  useEffect(() => {
    fetchStats();
    fetchPosts();
    fetchUsers();

    // 💡 추가된 코드: Supabase 실시간(Realtime) 감지 로직
    const profileChannel = supabase
      .channel('realtime-profiles-admin')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => {
          fetchUsers(); // DB에 변화가 생기면 새로고침 없이 즉시 유저 목록을 재호출합니다.
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profileChannel);
    };
  }, []);

  useEffect(() => { fetchChartData(chartPeriod); }, [chartPeriod]);

  const imageHandler = () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (file) {
        if (file.size > 10 * 1024 * 1024) {
          alert("이미지 파일은 10MB 이하만 업로드 가능합니다.");
          return;
        }
        try {
          const safeName = encodeFilename(file.name);
          const fileName = `${Date.now()}---editor---${Math.random().toString(36).substr(2, 9)}---${safeName}`;

          const { error: upError } = await supabase.storage.from('images').upload(fileName, file);
          if (upError) throw upError;

          const url = supabase.storage.from('images').getPublicUrl(fileName).data.publicUrl;
          
          const quill = quillRef.current?.getEditor();
          const range = quill?.getSelection();
          quill?.insertEmbed(range?.index || 0, 'image', url);
        } catch (err) {
          alert("에디터 이미지 업로드에 실패했습니다.");
        }
      }
    };
  };

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }], 
        [{ 'size': ['small', false, 'large', 'huge'] }], 
        ['bold', 'italic', 'underline', 'strike'], 
        [{ 'color': [] }, { 'background': [] }], 
        [{ 'align': [] }], 
        ['blockquote', 'code-block'], 
        [{ 'list': 'ordered'}, { 'list': 'bullet' }], 
        ['link', 'image', 'video'], 
        ['clean'] 
      ],
      handlers: { image: imageHandler }
    }
  }), []);

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

  const fetchUsers = async () => {
    const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (error) console.error("회원 데이터 불러오기 오류:", error.message);
    if (data) setUsers(data);
  };

  const fetchChartData = async (period: number) => {
    const today = new Date();
    const days = [...Array(period)].map((_, i) => {
      const d = new Date();
      d.setDate(today.getDate() - ((period - 1) - i));
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

  const totalUsersPages = Math.ceil(users.length / usersPerPage);
  const currentUsersList = users.slice((currentUsersPage - 1) * usersPerPage, currentUsersPage * usersPerPage);

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
    setFiles([]);
    setExistingImages(post.image_url ? post.image_url.split(',') : []);
    setEventMeta({
      event_date: post.event_date || "",
      location: post.location || "",
      event_status: post.event_status || "접수예정",
      capacity: post.capacity != null ? String(post.capacity) : "",
      slots_remaining: post.slots_remaining != null ? String(post.slots_remaining) : "",
      tags: post.tags || "",
    });
    setActiveTab("create");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleFeatured = async (id: string, current: boolean) => {
    if (!current) {
      await supabase.from('posts').update({ is_featured: false }).eq('category', 'blog');
    }
    await supabase.from('posts').update({ is_featured: !current }).eq('id', id);
    fetchPosts();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const validFiles = selectedFiles.filter(f => f.size <= 10 * 1024 * 1024);
    if (validFiles.length < selectedFiles.length) alert("10MB 이하의 파일만 첨부할 수 있습니다.");
    setFiles(prev => [...prev, ...validFiles]);
    e.target.value = ""; 
  };

  const handleSubmitClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content || content === "<p><br></p>") return alert("제목과 내용을 입력해주세요.");
    setShowModal({ show: true, type: 'save' });
  };

  const handleConfirmAction = async () => {
    setLoading(true);
    try {
      if (showModal.type === 'delete' && selectedPostId) {
        const { error } = await supabase.from('posts').delete().eq('id', selectedPostId);
        if (error) throw error;
      } else if (showModal.type === 'save') {
        
        let imageUrls = [...existingImages];

        if (files.length > 0) {
          for (const f of files) {
            if (f.size > 10 * 1024 * 1024) {
              alert(`"${f.name}" 파일이 10MB를 초과합니다. 10MB 이하 파일만 업로드 가능합니다.`);
              setLoading(false);
              return;
            }
            const safeName = encodeFilename(f.name);
            const fileName = `${Date.now()}---${Math.random().toString(36).substr(2, 9)}---${safeName}`;

            const { error: upError } = await supabase.storage.from('images').upload(fileName, f);
            if (upError) {
              console.error("Supabase Storage Upload Error:", upError);
              throw new Error(`파일 업로드 실패 (${f.name}): ${upError.message}`);
            }
            
            const url = supabase.storage.from('images').getPublicUrl(fileName).data.publicUrl;
            imageUrls.push(url);
          }
        }
        
        const finalImageUrl = imageUrls.length > 0 ? imageUrls.join(',') : null;

        const extraFields = category === 'events' ? {
          event_date: eventMeta.event_date || null,
          location: eventMeta.location || null,
          event_status: eventMeta.event_status || null,
          capacity: eventMeta.capacity ? Number(eventMeta.capacity) : null,
          slots_remaining: eventMeta.slots_remaining ? Number(eventMeta.slots_remaining) : null,
          tags: eventMeta.tags || null,
        } : category === 'blog' ? {
          tags: eventMeta.tags || null,
        } : {};

        if (editingId) {
          const { error: updateError } = await supabase.from('posts').update({ category, title, content, image_url: finalImageUrl, ...extraFields }).eq('id', editingId);
          if (updateError) {
            console.error("Supabase Post Update Error:", updateError);
            throw updateError;
          }
        } else {
          const { error: insertError } = await supabase.from('posts').insert([{ category, title, content, image_url: finalImageUrl, ...extraFields }]);
          if (insertError) {
            console.error("Supabase Post Insert Error:", insertError);
            throw insertError;
          }
        }

        setEditingId(null); setTitle(""); setContent(""); setFiles([]); setExistingImages([]);
        setEventMeta({ event_date: "", location: "", event_status: "접수예정", capacity: "", slots_remaining: "", tags: "" });
        setActiveTab("manage"); // 저장 후 게시물 관리 탭으로 자동 이동
      }
      fetchPosts(); fetchStats(); fetchChartData(chartPeriod);
    } catch (err: any) { 
      alert("처리 중 오류가 발생했습니다!\n\n" + err.message); 
    }
    finally { setLoading(false); setShowModal({ show: false, type: null }); setSelectedPostId(null); }
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm("이 회원을 삭제하시겠습니까?")) return;
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (error) alert("삭제 실패: " + error.message);
    // Realtime 구독으로 인해 fetchUsers()를 수동으로 부르지 않아도 즉각 반영됩니다.
  };

  const handleSetRole = async (id: string, newRole: string) => {
    const labels: Record<string, string> = { admin: "관리자", participant: "참여사 담당자", user: "일반 회원" };
    if (!window.confirm(`역할을 '${labels[newRole]}'로 변경하시겠습니까?`)) return;
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', id);
    if (error) alert("역할 변경 실패: " + error.message);
  };

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvLoading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const rows = text.split('\n').filter(row => row.trim() !== '');
        if (rows.length < 2) throw new Error("데이터가 없습니다.");
        
        const headers = rows[0].split(',').map(h => h.trim());
        const newUsers = rows.slice(1).map(row => {
          const values = row.split(',');
          const userObj: any = {};
          headers.forEach((h, i) => {
            if (h) userObj[h] = values[i]?.trim() || "";
          });
          if (!userObj.id) userObj.id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
          return userObj;
        });

        const { error } = await supabase.from('profiles').insert(newUsers);
        if (error) throw error;
        
        alert(`${newUsers.length}명의 회원이 일괄 추가되었습니다.`);
        // Realtime 구독으로 인해 fetchUsers()를 수동 호출하지 않아도 자동 갱신됩니다.
      } catch (err: any) {
        alert("CSV 처리 실패: " + err.message);
      } finally {
        setCsvLoading(false);
        e.target.value = "";
      }
    };
    reader.readAsText(file);
  };

  const maxViews = Math.max(...chartData.map(d => d.views), 1);
  const maxCumul = Math.max(...chartData.map(d => d.cumulative), 1);
  const chartW = 400, chartH = 150;
  const fmtNum = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);
  const getPoints = (key: 'views' | 'cumulative', max: number) =>
    chartData.map((d, i) => `${(i * (chartW / (chartPeriod - 1)))},${chartH - (d[key] / max * chartH)}`).join(" ");

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: isDark ? "#0a1020" : "#F7F8FC", width: "100%", position: "relative" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "72px", background: "#0a1020", zIndex: 999 }} />
      <HeaderSection isDark={isDark} />
      
      <NotificationBell isDark={isDark} />

      <main style={{ flex: 1, width: "100%", maxWidth: "1100px", margin: "0 auto", padding: "120px 20px 80px 20px" }}>
        
        <h2 style={{ fontSize: "32px", fontWeight: 800, color: textMain, marginBottom: "20px" }}>관리자 페이지</h2>

        {/* 탭 필터 메뉴 추가 */}
        <div className="flex gap-[12px] mb-[40px] pb-[16px] overflow-x-auto whitespace-nowrap scrollbar-hide" style={{ borderBottom: `1px solid ${border}` }}>
          {[
            { id: "dashboard",  label: "관리 대시보드" },
            { id: "users",      label: "회원 관리" },
            { id: "create",     label: "새 게시물 등록" },
            { id: "manage",     label: "게시물 관리" },
            { id: "consulting", label: "컨설팅 관리" },
            { id: "founders",   label: "Founder's Club" },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                // "새 게시물 등록" 탭을 직접 누를 경우 수정 모드 초기화
                if (tab.id === "create" && editingId) {
                  setEditingId(null); setTitle(""); setContent(""); setFiles([]); setExistingImages([]);
                }
              }}
              className="px-[20px] py-[10px] rounded-[12px] text-[15px] cursor-pointer transition-all duration-200 flex-shrink-0"
              style={{
                background: activeTab === tab.id ? "#4377F1" : "transparent",
                color: activeTab === tab.id ? "#fff" : textMuted,
                fontWeight: activeTab === tab.id ? 800 : 600,
                border: "none",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 탭 1: 관리 대시보드 영역 */}
        {activeTab === "dashboard" && (
          <AdminDashboard 
            stats={stats}
            chartPeriod={chartPeriod}
            setChartPeriod={setChartPeriod}
            chartData={chartData}
            topPosts={topPosts}
          />
        )}

        {/* 탭 2: 회원 관리 영역 */}
        {activeTab === "users" && (
          <AdminUserManagement
            users={users}
            currentUsersList={currentUsersList}
            currentUsersPage={currentUsersPage}
            setCurrentUsersPage={setCurrentUsersPage}
            totalUsersPages={totalUsersPages}
            csvLoading={csvLoading}
            handleSetRole={handleSetRole}
            handleDeleteUser={handleDeleteUser}
            handleCsvUpload={handleCsvUpload}
          />
        )}

        {/* 탭 3: 새 게시물 등록 (작성 및 수정) 영역 */}
        {activeTab === "create" && (
          <AdminPostCreate
            editingId={editingId}
            setEditingId={setEditingId}
            category={category}
            setCategory={setCategory}
            title={title}
            setTitle={setTitle}
            content={content}
            setContent={setContent}
            existingImages={existingImages}
            setExistingImages={setExistingImages}
            files={files}
            setFiles={setFiles}
            loading={loading}
            handleSubmitClick={handleSubmitClick}
            quillRef={quillRef}
            modules={modules}
            handleFileChange={handleFileChange}
            setActiveTab={setActiveTab}
            eventMeta={eventMeta}
            setEventMeta={setEventMeta}
          />
        )}

        {/* 탭 4: 게시물 관리 영역 */}
        {activeTab === "manage" && (
          <AdminPostManage
            filteredPosts={filteredPosts}
            currentPosts={currentPosts}
            filterCategory={filterCategory}
            setFilterCategory={setFilterCategory}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            totalPages={totalPages}
            startEdit={startEdit}
            handleDeleteClick={handleDeleteClick}
            toggleFeatured={toggleFeatured}
          />
        )}

        {/* 탭 5: 컨설팅 관리 */}
        {activeTab === "consulting" && <AdminConsultingManagement />}

        {/* 탭 6: Founder's Club */}
        {activeTab === "founders" && <AdminFoundersClubManagement />}


      </main>

      {showModal.show && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }}>
          <div style={{ background: isDark ? "#1e293b" : "#fff", padding: "40px 32px", borderRadius: 24, textAlign: "center", maxWidth: 400, width: "90%", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
            <h2 style={{ color: textMain, marginBottom: 12, fontSize: 22 }}>
              {showModal.type === 'delete' ? '게시물 삭제' : editingId ? '변경사항 저장' : '새 게시물 등록'}
            </h2>
            <p style={{ color: textMuted, marginBottom: 32, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
              {showModal.type === 'delete'
                ? '정말로 이 게시물을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.'
                : editingId ? '수정한 내용을 게시판에 즉시 적용하시겠습니까?' : '새 게시물을 즉시 등록하시겠습니까?'}
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={handleConfirmAction} disabled={loading} style={{ flex: 1, padding: 14, borderRadius: 12, border: "none", background: showModal.type === 'delete' ? "#ff4d4f" : "#4377F1", color: "#fff", fontWeight: 700, cursor: "pointer", opacity: loading ? 0.5 : 1 }}>
                {loading ? "처리 중..." : "확인"}
              </button>
              <button onClick={() => setShowModal({ show: false, type: null })} disabled={loading} style={{ flex: 1, padding: 14, borderRadius: 12, border: `1px solid ${border}`, background: "none", color: textMain, cursor: "pointer" }}>
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}