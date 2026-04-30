import { useState, useEffect, useRef, useMemo, useCallback, lazy, Suspense } from "react";
import type ReactQuillType from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useTheme } from "../../ThemeContext";
import { CATEGORIES } from "./adminConstants";
import { encodeFilename, getFileNameFromUrl } from "../../../utils/file";
import { getActivePresets, addCategory, deleteCategory } from "../../../utils/categoryStore";
import { supabase } from "../../../lib/supabaseClient";
import { AdminPostModal } from "./AdminPostModal";

const ReactQuill = lazy(() => import('react-quill'));

type EventMeta = { event_date: string; location: string; event_status: string; capacity: string; slots_remaining: string; tags: string };

const EMPTY_META: EventMeta = { event_date: "", location: "", event_status: "접수예정", capacity: "", slots_remaining: "", tags: "" };

interface AdminPostCreateProps {
  editingPost: any | null;
  onSaved: () => void;
  onCancelled: () => void;
}

export function AdminPostCreate({ editingPost, onSaved, onCancelled }: AdminPostCreateProps) {
  const { isDark } = useTheme();

  const [category, setCategory]           = useState("notice");
  const [title, setTitle]                 = useState("");
  const [content, setContent]             = useState("");
  const [files, setFiles]                 = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [eventMeta, setEventMeta]         = useState<EventMeta>(EMPTY_META);
  const [loading, setLoading]             = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [tagInput, setTagInput]           = useState("");
  const [presets, setPresets]             = useState(() => getActivePresets());

  const quillRef = useRef<ReactQuillType>(null);

  const card     = isDark ? "rgba(255,255,255,0.04)" : "#ffffff";
  const border   = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const textMain = isDark ? "rgba(255,255,255,0.92)" : "rgba(10,16,32,0.88)";
  const textMuted= isDark ? "rgba(255,255,255,0.45)" : "rgba(10,16,32,0.45)";
  const inputBg  = isDark ? "rgba(255,255,255,0.04)" : "#fff";
  const skBg     = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)";

  const inputStyle = { padding: "12px 16px", borderRadius: 10, background: inputBg, border: `1px solid ${border}`, color: textMain, outline: "none", boxSizing: "border-box" as const };

  // editingPost가 바뀔 때 폼 상태 동기화
  useEffect(() => {
    if (editingPost) {
      setCategory(editingPost.category || "notice");
      setTitle(editingPost.title || "");
      setContent(editingPost.content || "");
      setExistingImages(editingPost.image_url ? editingPost.image_url.split(',') : []);
      setFiles([]);
      setEventMeta({
        event_date:      editingPost.event_date || "",
        location:        editingPost.location || "",
        event_status:    editingPost.event_status || "접수예정",
        capacity:        editingPost.capacity != null ? String(editingPost.capacity) : "",
        slots_remaining: editingPost.slots_remaining != null ? String(editingPost.slots_remaining) : "",
        tags:            editingPost.tags || "",
      });
    } else {
      setCategory("notice");
      setTitle("");
      setContent("");
      setExistingImages([]);
      setFiles([]);
      setEventMeta(EMPTY_META);
    }
  }, [editingPost?.id]);

  const imageHandler = useCallback(() => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) { alert("이미지 파일만 업로드 가능합니다."); return; }
      if (file.size > 10 * 1024 * 1024) { alert("이미지 파일은 10MB 이하만 업로드 가능합니다."); return; }
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { alert("로그인이 필요합니다."); return; }
        const safeName = encodeFilename(file.name);
        const fileName = `${Date.now()}---editor---${Math.random().toString(36).substr(2, 9)}---${safeName}`;
        const { error: upError } = await supabase.storage.from('images').upload(fileName, file);
        if (upError) throw upError;
        const url = supabase.storage.from('images').getPublicUrl(fileName).data.publicUrl;
        const quill = quillRef.current?.getEditor();
        const range = quill?.getSelection();
        quill?.insertEmbed(range?.index || 0, 'image', url);
      } catch {
        alert("에디터 이미지 업로드에 실패했습니다.");
      }
    };
  }, []);

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        [{ size: ['small', false, 'large', 'huge'] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ color: [] }, { background: [] }],
        [{ align: [] }],
        ['blockquote', 'code-block'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link', 'image', 'video'],
        ['clean'],
      ],
      handlers: { image: imageHandler },
    },
  }), [imageHandler]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    const typeOk = selected.filter(f => f.type.startsWith("image/"));
    const sizeOk = typeOk.filter(f => f.size <= 10 * 1024 * 1024);
    if (typeOk.length < selected.length) alert("이미지 파일만 업로드 가능합니다.");
    if (sizeOk.length < typeOk.length) alert("10MB 이하의 파일만 첨부할 수 있습니다.");
    setFiles(prev => [...prev, ...sizeOk]);
    e.target.value = "";
  };

  const handleSubmitClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content || content === "<p><br></p>") return alert("제목과 내용을 입력해주세요.");
    setShowSaveModal(true);
  };

  const handleConfirmSave = async () => {
    setLoading(true);
    try {
      let imageUrls = [...existingImages];
      for (const f of files) {
        if (f.size > 10 * 1024 * 1024) { alert(`"${f.name}" 파일이 10MB를 초과합니다.`); setLoading(false); return; }
        const safeName = encodeFilename(f.name);
        const fileName = `${Date.now()}---${Math.random().toString(36).substr(2, 9)}---${safeName}`;
        const { error: upError } = await supabase.storage.from('images').upload(fileName, f);
        if (upError) throw new Error(`파일 업로드 실패 (${f.name}): ${upError.message}`);
        imageUrls.push(supabase.storage.from('images').getPublicUrl(fileName).data.publicUrl);
      }

      const finalImageUrl = imageUrls.length > 0 ? imageUrls.join(',') : null;
      const extraFields = category === 'events'
        ? { event_date: eventMeta.event_date || null, location: eventMeta.location || null, event_status: eventMeta.event_status || null, capacity: eventMeta.capacity ? Number(eventMeta.capacity) : null, slots_remaining: eventMeta.slots_remaining ? Number(eventMeta.slots_remaining) : null, tags: eventMeta.tags || null }
        : ['blog', 'events-archive', 'notice', 'news'].includes(category)
          ? { tags: eventMeta.tags || null }
          : {};

      if (editingPost) {
        const { error } = await supabase.from('posts').update({ category, title, content, image_url: finalImageUrl, updated_at: new Date().toISOString(), ...extraFields }).eq('id', editingPost.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('posts').insert([{ category, title, content, image_url: finalImageUrl, ...extraFields }]);
        if (error) throw error;
      }
      onSaved();
    } catch (err: any) {
      alert("처리 중 오류가 발생했습니다!\n\n" + err.message);
    } finally {
      setLoading(false);
      setShowSaveModal(false);
    }
  };

  // 태그 피커
  const selectedTag = eventMeta.tags?.trim() ?? "";
  const selectTag = (tag: string) => setEventMeta(m => ({ ...m, tags: m.tags === tag ? "" : tag }));
  const addCustomTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed) { addCategory(trimmed); setPresets(getActivePresets()); setEventMeta(m => ({ ...m, tags: trimmed })); }
    setTagInput("");
  };
  const removePreset = (tag: string) => {
    deleteCategory(tag); setPresets(getActivePresets());
    setEventMeta(m => m.tags === tag ? { ...m, tags: "" } : m);
  };

  const renderTagPicker = (accentColor: string, bgAlpha: string) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "16px 20px", background: isDark ? `rgba(${bgAlpha},0.06)` : `rgba(${bgAlpha},0.04)`, border: `1px solid rgba(${bgAlpha},0.2)`, borderRadius: 16 }}>
      <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: accentColor }}>카테고리 <span style={{ fontWeight: 400, color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.35)", fontSize: 12 }}>(1개 선택)</span></p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {presets.map(tag => {
          const isSelected = selectedTag === tag;
          return (
            <div key={tag} style={{ position: "relative", display: "inline-flex" }}>
              <button type="button" onClick={() => selectTag(tag)} style={{ padding: "5px 12px", borderRadius: 99, fontSize: 13, fontWeight: isSelected ? 700 : 500, cursor: "pointer", border: isSelected ? "none" : `1px solid rgba(${bgAlpha},0.4)`, background: isSelected ? accentColor : isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)", color: isSelected ? "#fff" : isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.5)" }}>{tag}</button>
              <button type="button" onClick={() => removePreset(tag)} style={{ position: "absolute", top: -5, right: -5, width: 16, height: 16, borderRadius: "50%", background: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.18)", border: "none", color: "#fff", fontSize: 10, fontWeight: 900, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1, padding: 0 }}>×</button>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input value={tagInput} onChange={e => setTagInput(e.target.value)} placeholder="목록에 없으면 직접 입력 후 추가" style={{ ...inputStyle, flex: 1, fontSize: 13 }} />
        <button type="button" onClick={addCustomTag} style={{ padding: "8px 16px", borderRadius: 10, border: "none", background: accentColor, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}>추가</button>
      </div>
      {selectedTag && (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 12, color: isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.4)" }}>선택됨:</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", background: accentColor, color: "#fff", borderRadius: 99, fontSize: 13, fontWeight: 600 }}>
            {selectedTag}
            <button type="button" onClick={() => setEventMeta(m => ({ ...m, tags: "" }))} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", padding: 0, lineHeight: 1, fontSize: 14 }}>×</button>
          </span>
        </div>
      )}
    </div>
  );

  return (
    <>
      <form onSubmit={handleSubmitClick} style={{ background: card, border: `1px solid ${border}`, borderRadius: "24px", padding: "40px", display: "flex", flexDirection: "column", gap: "20px", marginBottom: "40px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, color: textMain, fontSize: "22px", fontWeight: 800 }}>{editingPost ? "게시물 수정" : "새 게시물 등록"}</h3>
          {editingPost && (
            <button type="button" onClick={onCancelled} style={{ background: "none", border: "none", color: "#4377F1", fontWeight: 700, cursor: "pointer", fontSize: 14 }}>← 목록으로 돌아가기</button>
          )}
        </div>

        <div style={{ display: "flex", gap: "16px" }}>
          <select value={category} onChange={e => setCategory(e.target.value)} style={{ ...inputStyle, width: "200px" }}>
            {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="제목을 입력하세요" style={{ ...inputStyle, flex: 1 }} required />
        </div>

        {['events', 'blog', 'events-archive', 'notice', 'news'].includes(category) && renderTagPicker(
          category === "blog" ? "#A855F7" : category === "notice" ? "#EA4335" : category === "news" ? "#4377F1" : "#18A343",
          category === "blog" ? "168,85,247" : category === "notice" ? "234,67,53" : category === "news" ? "67,119,241" : "24,163,67",
        )}

        <div className={isDark ? "quill-dark" : "quill-light"} style={{ background: inputBg, borderRadius: "10px", border: `1px solid ${border}`, overflow: "hidden" }}>
          <Suspense fallback={<div style={{ height: 300, background: skBg, animation: "pulse 1.5s ease-in-out infinite" }} />}>
            <ReactQuill
              ref={quillRef}
              theme="snow"
              value={content}
              onChange={setContent}
              modules={modules}
              placeholder="자유롭게 글과 이미지를 작성해 보세요!"
            />
          </Suspense>
        </div>

        {category === "events" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "20px 24px", background: isDark ? "rgba(24,163,67,0.06)" : "rgba(24,163,67,0.04)", border: `1px solid rgba(24,163,67,0.2)`, borderRadius: 16 }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "#18A343" }}>행사 상세 정보</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { label: "상태", render: () => (
                  <select style={{ ...inputStyle, fontSize: 14 }} value={eventMeta.event_status} onChange={e => setEventMeta(m => ({ ...m, event_status: e.target.value }))}>
                    <option value="접수예정">접수예정</option><option value="접수중">접수중</option><option value="마감임박">마감임박</option><option value="마감">마감</option>
                  </select>
                )},
                { label: "일시 (예: 2026.05.08 (목) 18:00)", render: () => <input style={{ ...inputStyle, fontSize: 14 }} placeholder="2026.05.08 (목) 18:00" value={eventMeta.event_date} onChange={e => setEventMeta(m => ({ ...m, event_date: e.target.value }))} /> },
                { label: "장소", render: () => <input style={{ ...inputStyle, fontSize: 14 }} placeholder="서울 강남 NCF 센터" value={eventMeta.location} onChange={e => setEventMeta(m => ({ ...m, location: e.target.value }))} /> },
                { label: "정원 (명)", render: () => <input type="number" min={0} style={{ ...inputStyle, fontSize: 14 }} placeholder="200" value={eventMeta.capacity} onChange={e => setEventMeta(m => ({ ...m, capacity: e.target.value }))} /> },
                { label: "잔여석 (명)", render: () => <input type="number" min={0} style={{ ...inputStyle, fontSize: 14 }} placeholder="47" value={eventMeta.slots_remaining} onChange={e => setEventMeta(m => ({ ...m, slots_remaining: e.target.value }))} /> },
              ].map(({ label, render }) => (
                <div key={label} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: textMuted }}>{label}</label>
                  {render()}
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "20px" }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: "14px", color: textMuted }}>별도 첨부파일 관리 (문서, PDF 등)</p>
          {existingImages.map((url, idx) => (
            <div key={`exist-${idx}`} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px", background: inputBg, border: `1px solid ${border}`, borderRadius: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", color: textMain }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4377F1" strokeWidth="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
                <span style={{ fontWeight: 600, fontSize: "14px" }}>{getFileNameFromUrl(url)}</span>
              </div>
              <button type="button" onClick={() => setExistingImages(prev => prev.filter((_, i) => i !== idx))} style={{ border: "none", background: "rgba(239,68,68,0.1)", color: "#ef4444", padding: "6px 12px", borderRadius: "8px", cursor: "pointer", fontWeight: 700, fontSize: "13px" }}>삭제</button>
            </div>
          ))}
          {files.map((f, idx) => (
            <div key={`new-${idx}`} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px", background: inputBg, border: `1px solid ${border}`, borderRadius: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", color: textMain }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4377F1" strokeWidth="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
                <span style={{ fontWeight: 600, fontSize: "14px" }}>{f.name}</span>
              </div>
              <button type="button" onClick={() => setFiles(prev => prev.filter((_, i) => i !== idx))} style={{ border: "none", background: "rgba(239,68,68,0.1)", color: "#ef4444", padding: "6px 12px", borderRadius: "8px", cursor: "pointer", fontWeight: 700, fontSize: "13px" }}>취소</button>
            </div>
          ))}
          <label style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "30px 20px", background: isDark ? "rgba(255,255,255,0.02)" : "#fafafa", border: `2px dashed ${border}`, borderRadius: "16px", cursor: "pointer", color: textMain, gap: "10px" }}>
            <input type="file" multiple onChange={handleFileChange} style={{ display: "none" }} />
            <span style={{ fontWeight: 700, color: "#4377F1" }}>+ 파일 추가하기</span>
            <span style={{ fontSize: "13px", color: textMuted }}>최대 10MB / 여러 파일 동시 선택 가능</span>
          </label>
        </div>

        <button type="submit" disabled={loading} style={{ padding: "18px", borderRadius: "16px", border: "none", background: "#4377F1", color: "#fff", fontWeight: 800, fontSize: "16px", cursor: "pointer", marginTop: "10px" }}>
          {loading ? "처리 중..." : editingPost ? "변경사항 저장" : "게시물 등록하기"}
        </button>
      </form>

      {showSaveModal && (
        <AdminPostModal
          type="save"
          editingId={editingPost?.id ?? null}
          loading={loading}
          onConfirm={handleConfirmSave}
          onCancel={() => setShowSaveModal(false)}
        />
      )}
    </>
  );
}

export default AdminPostCreate;
