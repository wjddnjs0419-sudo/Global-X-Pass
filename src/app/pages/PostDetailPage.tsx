import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import { PageShell } from "../components/PageShell";
import { useTheme } from "../ThemeContext";
import { supabase } from "../../lib/supabaseClient";

import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const BOARD_INFO: Record<string, { title: string; subtitle: string }> = {
  notice: { title: "공지사항", subtitle: "중요한 안내 사항을 확인하세요." },
  news: { title: "뉴스", subtitle: "새로운 소식을 확인하세요." },
  events: { title: "행사", subtitle: "NCF × Around X가 준비한 소식을 확인하세요." },
  "events-archive": { title: "행사 아카이브", subtitle: "지나간 행사의 기록을 확인하세요." },
  resources: { title: "자료실", subtitle: "필요한 서식과 자료를 다운로드하세요." },
  blog: { title: "블로그", subtitle: "다양한 인사이트와 이야기를 만나보세요." },
  faq: { title: "자주 묻는 질문", subtitle: "궁금한 점을 빠르게 찾아보세요." },
};

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
    let filename = path.split('/').pop() || "첨부파일";
    if (filename.includes('---')) {
      filename = filename.split('---').pop()!;
    } else if (filename.match(/^\d+_[a-z0-9]+_/)) {
      const parts = filename.split('_');
      filename = parts.slice(2).join('_');
    }
    return decodeFilename(filename);
  } catch { return "첨부파일"; }
};

const isImageAttachment = (url: string) => {
  const fileName = getFileNameFromUrl(url);
  if (fileName.match(/\.(jpeg|jpg|gif|png|webp|avif|svg|jfif|pjpeg|pjp|bmp|heic|heif)$/i)) return true;
  if (url.match(/\.(jpeg|jpg|gif|png|webp|avif|svg|jfif|pjpeg|pjp|bmp|heic|heif)(?:\?.*)?$/i)) return true;
  if (url.includes('unsplash.com') || url.includes('picsum.photos') || url.includes('placeholder.com')) return true;
  return false;
};

export function PostDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editFiles, setEditFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false); 
  const [showModal, setShowModal] = useState<{ show: boolean; type: 'save' | 'delete' | null }>({ show: false, type: null });
  const quillRef = useRef<ReactQuill>(null);

  const textMain = isDark ? "rgba(255,255,255,0.92)" : "#0f172a";
  const textMuted = isDark ? "rgba(255,255,255,0.45)" : "rgba(15,23,42,0.45)";
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const card = isDark ? "rgba(255,255,255,0.04)" : "#ffffff";

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        setIsAdmin(profile?.role === 'admin' || user.email === "admin@test.com");
      }
    };

    const fetchPost = async () => {
      if (!id) return;
      const { data } = await supabase.from('posts').select('*').eq('id', id).single();
      
      if (data) { 
        const newViews = (data.views || 0) + 1;
        
        // 💡 1. 조회수 증가 RPC 호출
        const { error: rpcError } = await supabase.rpc('increment_view_count', { row_id: id });
        
        if (rpcError) {
          console.error("🚨 [조회수 RPC 에러]:", rpcError.message); // 에러가 나면 콘솔에 빨간색으로 찍힙니다!
          
          // 💡 2. RPC 실패 시 기존 방식(업데이트)으로 백업 시도
          const { error: updateError } = await supabase.from('posts').update({ views: newViews }).eq('id', id);
          if (updateError) console.error("🚨 [조회수 Update 에러]:", updateError.message);
        } else {
          console.log("✅ 조회수 1 증가 성공!"); // 성공하면 초록색으로 찍힙니다!
        }

        setPost({ ...data, views: newViews }); 
        setEditTitle(data.title); 
        setEditContent(data.content); 
        setExistingImages(data.image_url ? data.image_url.split(',') : []); 
      }
      setLoading(false);
    };

    checkAdmin(); 
    fetchPost();
  }, [id]);

  const imageHandler = () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file'); input.setAttribute('accept', 'image/*'); input.click();
    input.onchange = async () => {
      const file = input.files?.[0];
      if (file) {
        try {
          const fileName = `${Date.now()}---editor---${file.name}`;
          const { error: upError } = await supabase.storage.from('images').upload(fileName, file);
          if (upError) throw upError;
          const url = supabase.storage.from('images').getPublicUrl(fileName).data.publicUrl;
          const quill = quillRef.current?.getEditor();
          const range = quill?.getSelection();
          quill?.insertEmbed(range?.index || 0, 'image', url);
        } catch (err) { alert("에디터 이미지 업로드에 실패했습니다."); }
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

  const handleConfirmAction = async () => {
    setIsSubmitting(true);
    try {
      if (showModal.type === 'delete') { 
        await supabase.from('posts').delete().eq('id', id); 
        navigate(-1); 
      }
      else if (showModal.type === 'save') {
        let imageUrls = [...existingImages];
        if (editFiles.length > 0) {
          for (const f of editFiles) {
            const fileName = `${Date.now()}---${Math.random().toString(36).substr(2, 9)}---${f.name}`;
            const { error: upError } = await supabase.storage.from('images').upload(fileName, f);
            if (upError) throw upError;
            const url = supabase.storage.from('images').getPublicUrl(fileName).data.publicUrl;
            imageUrls.push(url);
          }
        }
        const finalImageUrl = imageUrls.length > 0 ? imageUrls.join(',') : null;
        const { data } = await supabase.from('posts').update({ 
          title: editTitle, 
          content: editContent, 
          image_url: finalImageUrl 
        }).eq('id', id).select();
        
        if (data && data.length > 0) { 
          setPost(data[0]); 
          setIsEditing(false); 
          setEditFiles([]); 
        }
      }
    } catch (err: any) { 
      alert("오류 발생: " + err.message); 
    } finally { 
      setIsSubmitting(false); 
      setShowModal({ show: false, type: null }); 
    }
  };

  if (loading) return <PageShell title="로딩 중..."><p>불러오는 중입니다.</p></PageShell>;
  if (!post && !isSubmitting) return <PageShell title="오류"><p>게시물을 찾을 수 없습니다.</p></PageShell>;

  const headerInfo = BOARD_INFO[post?.category] || { title: "게시판", subtitle: "상세 보기" };
  const attachmentUrls = post.image_url ? post.image_url.split(',') : [];
  const images = attachmentUrls.filter(isImageAttachment);
  const files = attachmentUrls.filter((url: string) => !isImageAttachment(url));

  return (
    <PageShell title={headerInfo.title} subtitle={headerInfo.subtitle}>
      <div style={{ maxWidth: 900, margin: "0 auto", paddingBottom: 100 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
           <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", color: "#4377F1", fontWeight: 700, cursor: "pointer" }}>← 목록으로 돌아가기</button>
           {isAdmin && (
             <div style={{ display: "flex", gap: 10 }}>
               {isEditing ? (
                 <>
                   <button onClick={() => setShowModal({ show: true, type: 'save' })} disabled={isSubmitting} style={{ padding: "8px 20px", borderRadius: 8, background: "#4377F1", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer", opacity: isSubmitting ? 0.5 : 1 }}>
                     {isSubmitting ? "저장 중..." : "저장하기"}
                   </button>
                   <button onClick={() => { setIsEditing(false); setEditFiles([]); }} style={{ padding: "8px 20px", borderRadius: 8, border: `1px solid ${border}`, background: card, color: textMain, cursor: "pointer" }}>취소</button>
                 </>
               ) : (
                 <>
                   <button onClick={() => setIsEditing(true)} style={{ padding: "8px 20px", borderRadius: 8, border: `1px solid ${border}`, background: card, color: "#4377F1", fontWeight: 700, cursor: "pointer" }}>수정</button>
                   <button onClick={() => setShowModal({ show: true, type: 'delete' })} style={{ padding: "8px 20px", borderRadius: 8, background: "rgba(255,0,0,0.1)", color: "#ff4d4f", border: "none", fontWeight: 700, cursor: "pointer" }}>삭제</button>
                 </>
               )}
             </div>
           )}
        </div>

        {isEditing ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} style={{ width: "100%", padding: 16, borderRadius: 12, border: `1px solid ${border}`, background: card, color: textMain, fontSize: 24, fontWeight: 800, outline: "none" }} />
            <div className={isDark ? "quill-dark" : "quill-light"} style={{ background: isDark ? "rgba(255,255,255,0.04)" : "#fff", borderRadius: "10px", border: `1px solid ${border}`, overflow: "hidden" }}>
              <ReactQuill ref={quillRef} theme="snow" value={editContent} onChange={setEditContent} modules={modules} placeholder="자유롭게 글과 이미지를 작성해 보세요!" />
            </div>
            <div style={{ padding: 20, border: `1px solid ${border}`, borderRadius: 12, background: card, display: "flex", flexDirection: "column", gap: 12 }}>
              <p style={{ margin: 0, fontSize: 14, color: textMuted, fontWeight: 700 }}>첨부파일 관리</p>
              {existingImages.map((url, idx) => (
                <div key={`exist-${idx}`} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px", background: isDark ? "rgba(255,255,255,0.02)" : "#f8fafc", borderRadius: "8px" }}>
                  <span style={{ fontSize: "14px", color: textMain, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{getFileNameFromUrl(url)}</span>
                  <button onClick={() => setExistingImages(prev => prev.filter((_, i) => i !== idx))} style={{ background: "rgba(255,0,0,0.1)", color: "#ef4444", border: "none", padding: "4px 8px", borderRadius: 6, cursor: "pointer", fontWeight: 700 }}>삭제</button>
                </div>
              ))}
              {editFiles.map((f, idx) => (
                <div key={`new-${idx}`} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px", background: isDark ? "rgba(255,255,255,0.02)" : "#f8fafc", borderRadius: "8px" }}>
                  <span style={{ fontSize: "14px", color: "#4377F1" }}>{f.name} (새 파일)</span>
                  <button onClick={() => setEditFiles(prev => prev.filter((_, i) => i !== idx))} style={{ background: "rgba(255,0,0,0.1)", color: "#ef4444", border: "none", padding: "4px 8px", borderRadius: 6, cursor: "pointer", fontWeight: 700 }}>취소</button>
                </div>
              ))}
              <label style={{ display: "inline-block", marginTop: 10, padding: "10px 16px", background: isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9", borderRadius: 8, color: "#4377F1", fontWeight: 700, cursor: "pointer", textAlign: "center" }}>
                <input type="file" multiple onChange={(e) => setEditFiles(prev => [...prev, ...Array.from(e.target.files || [])])} style={{ display: "none" }} />
                + 문서 및 기타 파일 추가
              </label>
            </div>
          </div>
        ) : (
          <>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: textMain, marginBottom: 12 }}>{post.title}</h1>
            <p style={{ fontSize: 14, color: textMuted, marginBottom: 40 }}>{new Date(post.created_at).toLocaleDateString()}</p>
            <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 24, padding: "40px", boxShadow: "0 10px 30px rgba(0,0,0,0.02)" }}>
              {files.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, marginBottom: 32 }}>
                  {files.map((url: string, idx: number) => ( 
                    <a key={idx} href={url} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, color: "#4377F1", background: isDark ? "rgba(67, 119, 241, 0.1)" : "#eef2ff", padding: "8px 16px", borderRadius: 8, textDecoration: "none", fontWeight: 600 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                      {getFileNameFromUrl(url)}
                    </a> 
                  ))}
                </div>
              )}
              <div className={isDark ? "quill-dark" : "quill-light"}>
                <div className="ql-editor" style={{ padding: 0, margin: 0, color: textMain }} dangerouslySetInnerHTML={{ __html: post.content }} />
              </div>
              {images.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 24, alignItems: "center", borderTop: `1px solid ${border}`, paddingTop: 40, marginTop: 40 }}>
                  {images.map((url: string, idx: number) => ( 
                    <img key={idx} src={url} alt={`첨부 이미지 ${idx + 1}`} style={{ maxWidth: "100%", maxHeight: 600, objectFit: "contain", borderRadius: 16, border: `1px solid ${border}` }} /> 
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
      {showModal.show && ( 
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: isDark ? "#1e293b" : "#fff", padding: "40px 32px", borderRadius: 24, textAlign: "center", maxWidth: 400, width: "90%", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
            <h2 style={{ color: textMain, marginBottom: 12, fontSize: 22 }}>{showModal.type === 'delete' ? '게시물 삭제' : '변경사항 저장'}</h2>
            <p style={{ color: textMuted, marginBottom: 32, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
              {showModal.type === 'delete' 
                ? '정말로 이 게시물을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.' 
                : '수정한 내용을 게시판에 즉시 적용하시겠습니까?'}
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={handleConfirmAction} disabled={isSubmitting} style={{ flex: 1, padding: 14, borderRadius: 12, border: "none", background: showModal.type === 'delete' ? "#ff4d4f" : "#4377F1", color: "#fff", fontWeight: 700, cursor: "pointer", opacity: isSubmitting ? 0.5 : 1 }}>
                {isSubmitting ? "처리 중..." : "확인"}
              </button>
              <button onClick={() => setShowModal({ show: false, type: null })} disabled={isSubmitting} style={{ flex: 1, padding: 14, borderRadius: 12, border: `1px solid ${border}`, background: "none", color: textMain, cursor: "pointer" }}>
                취소
              </button>
            </div>
          </div>
        </div> 
      )}
    </PageShell>
  );
}