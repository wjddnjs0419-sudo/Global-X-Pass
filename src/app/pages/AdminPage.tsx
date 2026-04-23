import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { PageShell } from "../components/PageShell";
import { useTheme } from "../ThemeContext";
import { supabase } from "../../lib/supabaseClient";

const CATEGORIES = [
  { id: "notice", label: "공지사항" },
  { id: "news", label: "뉴스" },
  { id: "events", label: "행사" },
  { id: "events-archive", label: "행사 아카이브" },
  { id: "resources", label: "자료실" },
  { id: "blog", label: "블로그" },
  { id: "faq", label: "FAQ" },
];

// 💡 URL에서 파일명만 깔끔하게 추출하는 함수
const getFileNameFromUrl = (url: string | null) => {
  if (!url) return "첨부된 파일";
  try {
    const path = url.split('?')[0]; // 파라미터 제거
    const filename = path.split('/').pop() || "첨부된 파일"; // 맨 마지막 파일명 추출
    return decodeURIComponent(filename); // 한글 깨짐 방지
  } catch {
    return "첨부된 파일";
  }
};

export default function AdminPage() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  
  // 폼 상태
  const [category, setCategory] = useState("notice");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  
  const [removeExisting, setRemoveExisting] = useState(false);

  // 관리 데이터 상태
  const [posts, setPosts] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const card = isDark ? "rgba(255,255,255,0.04)" : "#ffffff";
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const textMain = isDark ? "rgba(255,255,255,0.92)" : "#0f172a";
  const inputBg = isDark ? "rgba(255,255,255,0.04)" : "#fff";

  const inputStyle = {
    width: "100%", padding: "12px 16px", borderRadius: 10,
    background: inputBg, border: `1px solid ${border}`,
    color: textMain, outline: "none", boxSizing: "border-box" as const,
  };

  useEffect(() => {
    checkAdmin();
    fetchPosts();
  }, []);

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return navigate("/");
    
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') {
      alert("관리자 권한이 없습니다.");
      navigate("/");
    } else {
      setIsChecking(false);
    }
  };

  const fetchPosts = async () => {
    const { data } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
    setPosts(data || []);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    const { error } = await supabase.from('posts').delete().eq('id', id);
    if (error) alert("삭제 실패: " + error.message);
    else fetchPosts();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = posts.find(p => p.id === editingId)?.image_url || null;

      if (removeExisting) imageUrl = null;

      if (file) {
        const fileName = `${Date.now()}.${file.name.split('.').pop()}`;
        const { data } = await supabase.storage.from('images').upload(fileName, file);
        if (data) {
          const { data: urlData } = supabase.storage.from('images').getPublicUrl(fileName);
          imageUrl = urlData.publicUrl;
        }
      }

      if (editingId) {
        const { error } = await supabase.from('posts').update({
          category, title, content, image_url: imageUrl
        }).eq('id', editingId);
        if (error) throw error;
        alert("수정되었습니다.");
      } else {
        const { error } = await supabase.from('posts').insert([{ category, title, content, image_url: imageUrl }]);
        if (error) throw error;
        alert("등록되었습니다.");
      }

      setEditingId(null);
      setTitle("");
      setContent("");
      setFile(null);
      setRemoveExisting(false);
      fetchPosts();
    } catch (err: any) {
      alert("작업 실패: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (isChecking) return null;

  const existingImageUrl = editingId ? posts.find(p => p.id === editingId)?.image_url : null;
  const showExistingImage = existingImageUrl && !removeExisting && !file;

  return (
    <PageShell title="관리자 센터" subtitle="게시물을 등록하거나 관리할 수 있습니다.">
      <div style={{ maxWidth: 800, margin: "0 auto", display: "flex", flexDirection: "column", gap: 40 }}>
        
        <form onSubmit={handleSubmit} style={{ background: card, border: `1px solid ${border}`, borderRadius: 20, padding: 32, display: "flex", flexDirection: "column", gap: 16 }}>
          <h3 style={{ margin: 0, color: textMain }}>{editingId ? "게시물 수정하기" : "새 게시물 등록"}</h3>
          <div style={{ display: "flex", gap: 12 }}>
            <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ ...inputStyle, flex: 1 }}>
              {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목" style={{ ...inputStyle, flex: 2 }} required />
          </div>
          <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="내용을 입력하세요" style={{ ...inputStyle, minHeight: 150 }} required />
          
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {file ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", background: inputBg, border: `1px solid ${border}`, borderRadius: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, color: textMain, overflow: "hidden" }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4377F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                    <polyline points="13 2 13 9 20 9"></polyline>
                  </svg>
                  <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
                    <span style={{ fontWeight: 600, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{file.name}</span>
                    <span style={{ fontSize: 12, color: "gray" }}>({(file.size / 1024 / 1024).toFixed(2)}MB) - 업로드 대기중</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <label style={{ cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: 8, background: "rgba(67, 119, 241, 0.1)", color: "#4377F1", transition: "all 0.2s" }}>
                    <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  </label>
                  <button type="button" onClick={() => setFile(null)} style={{ cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: 8, border: "none", background: "rgba(255, 0, 0, 0.1)", color: "#ff4d4f", transition: "all 0.2s" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                </div>
              </div>
            ) : showExistingImage ? (
              // 💡 2. 기존 이미지의 실제 파일명을 띄워주는 부분
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", background: inputBg, border: `1px solid ${border}`, borderRadius: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, color: textMain, overflow: "hidden" }}>
                  <img src={existingImageUrl} alt="기존 이미지" style={{ width: 40, height: 40, borderRadius: 6, objectFit: "cover", border: `1px solid ${border}`, flexShrink: 0 }} />
                  <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
                    {/* 💡 변경된 곳: 파일명을 추출해서 보여줌 */}
                    <span style={{ fontWeight: 600, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={existingImageUrl}>
                      {getFileNameFromUrl(existingImageUrl)}
                    </span>
                    <span style={{ fontSize: 12, color: "gray" }}>우측 버튼을 눌러 교체하거나 삭제하세요.</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <label style={{ cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: 8, background: "rgba(67, 119, 241, 0.1)", color: "#4377F1", transition: "all 0.2s" }}>
                    <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  </label>
                  <button type="button" onClick={() => setRemoveExisting(true)} style={{ cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: 8, border: "none", background: "rgba(255, 0, 0, 0.1)", color: "#ff4d4f", transition: "all 0.2s" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                </div>
              </div>
            ) : (
              <label style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px", background: isDark ? "rgba(255,255,255,0.02)" : "#fafafa", border: `2px dashed ${border}`, borderRadius: 12, cursor: "pointer", color: textMain, gap: 12, transition: "all 0.2s" }}>
                <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "#4377F1" }}>
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                </svg>
                <span style={{ fontWeight: 600, fontSize: 15 }}>클릭하여 이미지 파일 첨부</span>
                <span style={{ fontSize: 13, color: "gray" }}>JPG, PNG 지원 / 최대 5MB</span>
              </label>
            )}
          </div>
          
          <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
            <button type="submit" disabled={loading} style={{ flex: 1, padding: 14, borderRadius: 10, border: "none", background: "#4377F1", color: "#fff", fontWeight: 700, cursor: "pointer" }}>
              {loading ? "처리 중..." : editingId ? "수정 완료" : "게시물 등록"}
            </button>
            {editingId && (
              <button type="button" onClick={() => { setEditingId(null); setTitle(""); setContent(""); setFile(null); setRemoveExisting(false); }} style={{ padding: 14, borderRadius: 10, border: `1px solid ${border}`, background: "none", color: textMain, cursor: "pointer" }}>
                취소
              </button>
            )}
          </div>
        </form>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <h3 style={{ color: textMain, marginBottom: 8 }}>게시물 목록 ({posts.length})</h3>
          {posts.map(post => (
            <div key={post.id} style={{ background: card, border: `1px solid ${border}`, borderRadius: 16, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ fontSize: 11, background: "#4377F1", color: "#fff", padding: "2px 6px", borderRadius: 4, marginRight: 8 }}>
                  {CATEGORIES.find(c => c.id === post.category)?.label}
                </span>
                <strong style={{ color: textMain }}>{post.title}</strong>
                <div style={{ fontSize: 12, color: "rgba(128,128,128,0.6)", marginTop: 4 }}>{new Date(post.created_at).toLocaleDateString()}</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => startEdit(post)} style={{ padding: "6px 12px", borderRadius: 6, border: `1px solid ${border}`, background: "none", color: "#4377F1", fontSize: 13, cursor: "pointer" }}>수정</button>
                <button onClick={() => handleDelete(post.id)} style={{ padding: "6px 12px", borderRadius: 6, border: "none", background: "rgba(255,0,0,0.1)", color: "#ff4d4f", fontSize: 13, cursor: "pointer" }}>삭제</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}