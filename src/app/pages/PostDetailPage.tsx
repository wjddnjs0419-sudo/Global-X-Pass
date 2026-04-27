import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import { PageShell } from "../components/PageShell";
import { useTheme } from "../ThemeContext";
import { supabase } from "../../lib/supabaseClient";
import { isImage, getFileNameFromUrl } from "../../utils/file";
import { useAdmin } from "../../hooks/useAdmin";
import type { Post } from "../../lib/types";

import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

const BOARD_INFO: Record<string, { title: string; subtitle: string }> = {
  notice:           { title: "공지사항",       subtitle: "중요한 안내 사항을 확인하세요." },
  news:             { title: "뉴스",           subtitle: "새로운 소식을 확인하세요." },
  events:           { title: "행사",           subtitle: "NCF × Around X가 준비한 소식을 확인하세요." },
  "events-archive": { title: "행사 아카이브",   subtitle: "지나간 행사의 기록을 확인하세요." },
  resources:        { title: "자료실",          subtitle: "필요한 서식과 자료를 다운로드하세요." },
  blog:             { title: "블로그",          subtitle: "다양한 인사이트와 이야기를 만나보세요." },
  faq:              { title: "자주 묻는 질문",  subtitle: "궁금한 점을 빠르게 찾아보세요." },
};

export function PostDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { isAdmin } = useAdmin();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editFiles, setEditFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState<{ show: boolean; type: "save" | "delete" | null }>({ show: false, type: null });
  const quillRef = useRef<ReactQuill>(null);

  const textMain = isDark ? "rgba(255,255,255,0.92)" : "#0f172a";
  const textMuted = isDark ? "rgba(255,255,255,0.45)" : "rgba(15,23,42,0.45)";
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const card = isDark ? "rgba(255,255,255,0.04)" : "#ffffff";

  useEffect(() => {
    const fetchPost = async () => {
      if (!id) return;
      const { data } = await supabase.from("posts").select("*").eq("id", id).single();

      if (data) {
        const newViews = (data.views || 0) + 1;
        const { error: rpcError } = await supabase.rpc("increment_view_count", { row_id: id });
        if (rpcError) {
          await supabase.from("posts").update({ views: newViews }).eq("id", id);
        }
        setPost({ ...data, views: newViews } as Post);
        setEditTitle(data.title);
        setEditContent(data.content);
        setExistingImages(data.image_url ? data.image_url.split(",") : []);
      }
      setLoading(false);
    };

    fetchPost();
  }, [id]);

  const encodeFilename = (name: string) => {
    return encodeURIComponent(name);
  };

  const imageHandler = () => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.click();
    input.onchange = async () => {
      const file = input.files?.[0];
      if (file) {
        try {
          const safeName = encodeFilename(file.name);
          const fileName = `${Date.now()}---editor---${Math.random().toString(36).substr(2, 9)}---${safeName}`;
          const { error: upError } = await supabase.storage.from("images").upload(fileName, file);
          if (upError) throw upError;
          const url = supabase.storage.from("images").getPublicUrl(fileName).data.publicUrl;
          const quill = quillRef.current?.getEditor();
          const range = quill?.getSelection();
          quill?.insertEmbed(range?.index || 0, "image", url);
        } catch (err) {
          alert("에디터 이미지 업로드에 실패했습니다. " + (err instanceof Error ? err.message : ""));
        }
      }
    };
  };

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        [{ size: ["small", false, "large", "huge"] }],
        ["bold", "italic", "underline", "strike"],
        [{ color: [] }, { background: [] }],
        [{ align: [] }],
        ["blockquote", "code-block"],
        [{ list: "ordered" }, { list: "bullet" }],
        ["link", "image", "video"],
        ["clean"],
      ],
      handlers: { image: imageHandler },
    },
  }), []);

  const handleConfirmAction = async () => {
    setIsSubmitting(true);
    try {
      if (showModal.type === "delete") {
        await supabase.from("posts").delete().eq("id", id);
        navigate(-1);
      } else if (showModal.type === "save") {
        let imageUrls = [...existingImages];
        for (const f of editFiles) {
          const safeName = encodeFilename(f.name);
          const fileName = `${Date.now()}---${Math.random().toString(36).substr(2, 9)}---${safeName}`;
          const { error: upError } = await supabase.storage.from("images").upload(fileName, f);
          if (upError) throw upError;
          const url = supabase.storage.from("images").getPublicUrl(fileName).data.publicUrl;
          imageUrls.push(url);
        }
        const { data, error } = await supabase
          .from("posts")
          .update({ title: editTitle, content: editContent, image_url: imageUrls.join(",") || null })
          .eq("id", id)
          .select();
        
        if (error) throw error;
        
        if (data?.[0]) {
          setPost(data[0] as Post);
          setIsEditing(false);
          setEditFiles([]);
        } else {
          throw new Error("게시물을 업데이트하지 못했습니다. (데이터가 반환되지 않음)");
        }
      }
    } catch (err: unknown) {
      alert("오류 발생: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsSubmitting(false);
      setShowModal({ show: false, type: null });
    }
  };

  if (loading) return <PageShell title="로딩 중..."><p>불러오는 중입니다.</p></PageShell>;
  if (!post && !isSubmitting) return <PageShell title="오류"><p>게시물을 찾을 수 없습니다.</p></PageShell>;

  const headerInfo = BOARD_INFO[post?.category ?? ""] ?? { title: "게시판", subtitle: "상세 보기" };
  const attachmentUrls = post?.image_url ? post.image_url.split(",") : [];
  const images = attachmentUrls.filter(isImage);
  const files = attachmentUrls.filter((url) => !isImage(url));

  return (
    <PageShell title={headerInfo.title} subtitle={headerInfo.subtitle}>
      <div className="max-w-[900px] mx-auto pb-[100px]">
        <div className="flex justify-between items-center mb-8">
          <button onClick={() => navigate(-1)} className="bg-none border-none text-[#4377F1] font-bold cursor-pointer p-0">← 목록으로 돌아가기</button>
          {isAdmin && (
            <div className="flex gap-2.5">
              {isEditing ? (
                <>
                  <button 
                    onClick={() => setShowModal({ show: true, type: "save" })} 
                    disabled={isSubmitting} 
                    className={`px-5 py-2 rounded-lg bg-[#4377F1] text-white border-none font-bold cursor-pointer ${isSubmitting ? 'opacity-50' : 'opacity-100'}`}
                  >
                    {isSubmitting ? "저장 중..." : "저장하기"}
                  </button>
                  <button 
                    onClick={() => { setIsEditing(false); setEditFiles([]); }} 
                    className="px-5 py-2 rounded-lg cursor-pointer"
                    style={{ border: `1px solid ${border}`, background: card, color: textMain }}
                  >
                    취소
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => setIsEditing(true)} 
                    className="px-5 py-2 rounded-lg text-[#4377F1] font-bold cursor-pointer"
                    style={{ border: `1px solid ${border}`, background: card }}
                  >
                    수정
                  </button>
                  <button 
                    onClick={() => setShowModal({ show: true, type: "delete" })} 
                    className="px-5 py-2 rounded-lg bg-[#ff4d4f]/10 text-[#ff4d4f] border-none font-bold cursor-pointer"
                  >
                    삭제
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {isEditing ? (
          <div className="flex flex-col gap-5">
            <input 
              value={editTitle} 
              onChange={(e) => setEditTitle(e.target.value)} 
              className="w-full p-4 rounded-xl text-[24px] font-extrabold outline-none"
              style={{ border: `1px solid ${border}`, background: card, color: textMain }} 
            />
            <div className={`overflow-hidden rounded-[10px] ${isDark ? "quill-dark" : "quill-light"}`} style={{ background: isDark ? "rgba(255,255,255,0.04)" : "#fff", border: `1px solid ${border}` }}>
              <ReactQuill ref={quillRef} theme="snow" value={editContent} onChange={setEditContent} modules={modules} placeholder="자유롭게 글과 이미지를 작성해 보세요!" />
            </div>
            <div className="p-5 rounded-xl flex flex-col gap-3" style={{ border: `1px solid ${border}`, background: card }}>
              <p className="m-0 text-[14px] font-bold" style={{ color: textMuted }}>첨부파일 관리</p>
              {existingImages.map((url, idx) => (
                <div key={`exist-${idx}`} className="flex items-center justify-between p-3 rounded-lg" style={{ background: isDark ? "rgba(255,255,255,0.02)" : "#f8fafc" }}>
                  <span className="text-[14px] overflow-hidden text-ellipsis whitespace-nowrap" style={{ color: textMain }}>{getFileNameFromUrl(url)}</span>
                  <button onClick={() => setExistingImages((prev) => prev.filter((_, i) => i !== idx))} className="bg-[#ef4444]/10 text-[#ef4444] border-none px-2 py-1 rounded-md cursor-pointer font-bold">삭제</button>
                </div>
              ))}
              {editFiles.map((f, idx) => (
                <div key={`new-${idx}`} className="flex items-center justify-between p-3 rounded-lg" style={{ background: isDark ? "rgba(255,255,255,0.02)" : "#f8fafc" }}>
                  <span className="text-[14px] text-[#4377F1]">{f.name} (새 파일)</span>
                  <button onClick={() => setEditFiles((prev) => prev.filter((_, i) => i !== idx))} className="bg-[#ef4444]/10 text-[#ef4444] border-none px-2 py-1 rounded-md cursor-pointer font-bold">취소</button>
                </div>
              ))}
              <label className="inline-block mt-2.5 px-4 py-2.5 rounded-lg text-[#4377F1] font-bold cursor-pointer text-center" style={{ background: isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9" }}>
                <input type="file" multiple onChange={(e) => setEditFiles((prev) => [...prev, ...Array.from(e.target.files || [])])} className="hidden" />
                + 문서 및 기타 파일 추가
              </label>
            </div>
          </div>
        ) : (
          <>
            <h1 className="text-[32px] font-extrabold mb-3 mt-0" style={{ color: textMain }}>{post?.title}</h1>
            <p className="text-[14px] mb-10 m-0" style={{ color: textMuted }}>{post && new Date(post.created_at).toLocaleDateString()}</p>
            <div className="rounded-3xl p-10 shadow-[0_10px_30px_rgba(0,0,0,0.02)]" style={{ background: card, border: `1px solid ${border}` }}>
              {files.length > 0 && (
                <div className="flex flex-col items-end gap-2 mb-8">
                  {files.map((url, idx) => (
                    <a key={idx} href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-[13px] text-[#4377F1] px-4 py-2 rounded-lg no-underline font-semibold" style={{ background: isDark ? "rgba(67,119,241,0.1)" : "#eef2ff" }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                      {getFileNameFromUrl(url, "첨부파일")}
                    </a>
                  ))}
                </div>
              )}
              <div className={isDark ? "quill-dark" : "quill-light"}>
                <div className="ql-editor p-0 m-0" style={{ color: textMain }} dangerouslySetInnerHTML={{ __html: post?.content ?? "" }} />
              </div>
              {images.length > 0 && (
                <div className="flex flex-col gap-6 items-center pt-10 mt-10" style={{ borderTop: `1px solid ${border}` }}>
                  {images.map((url, idx) => (
                    <img key={idx} src={url} alt={`첨부 이미지 ${idx + 1}`} className="max-w-full max-h-[600px] object-contain rounded-2xl" style={{ border: `1px solid ${border}` }} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {showModal.show && (
        <div className="fixed top-0 left-0 w-full h-full bg-black/60 flex items-center justify-center z-[1000]">
          <div className="py-10 px-8 rounded-3xl text-center max-w-[400px] w-[90%] shadow-[0_20px_40px_rgba(0,0,0,0.2)]" style={{ background: isDark ? "#1e293b" : "#fff" }}>
            <h2 className="mb-3 text-[22px] mt-0" style={{ color: textMain }}>
              {showModal.type === "delete" ? "게시물 삭제" : "변경사항 저장"}
            </h2>
            <p className="mb-8 leading-[1.6] whitespace-pre-wrap m-0" style={{ color: textMuted }}>
              {showModal.type === "delete"
                ? "정말로 이 게시물을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다."
                : "수정한 내용을 게시판에 즉시 적용하시겠습니까?"}
            </p>
            <div className="flex gap-3">
              <button 
                onClick={handleConfirmAction} 
                disabled={isSubmitting} 
                className={`flex-1 p-[14px] rounded-xl border-none text-white font-bold cursor-pointer ${isSubmitting ? 'opacity-50' : 'opacity-100'}`}
                style={{ background: showModal.type === "delete" ? "#ff4d4f" : "#4377F1" }}
              >
                {isSubmitting ? "처리 중..." : "확인"}
              </button>
              <button 
                onClick={() => setShowModal({ show: false, type: null })} 
                disabled={isSubmitting} 
                className="flex-1 p-[14px] rounded-xl bg-transparent cursor-pointer m-0"
                style={{ border: `1px solid ${border}`, color: textMain }}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
