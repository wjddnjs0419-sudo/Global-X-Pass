import { useState, useEffect, useRef, useMemo, useCallback, lazy, Suspense } from "react";
import type ReactQuillType from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useTheme } from "../../ThemeContext";
import { CATEGORIES } from "./adminConstants";
import {
  containsDocumentFile,
  DOCUMENT_UPLOAD_ACCEPT,
  encodeFilename,
  getFileNameFromUrl,
  isAllowedDocumentFile,
  isAllowedUploadFile,
  isBrowserSafeImageFile,
  isImage,
  PUBLIC_DOCUMENT_UPLOAD_WARNING,
} from "../../../utils/file";
import { useBoardTagPresets } from "../../../hooks/useBoardTagPresets";
import {
  EMPTY_MEDIA_META,
  getExternalMediaThumbnailUrl,
  parseMediaMeta,
  normalizeMediaExternalUrl,
  serializeMediaMeta,
  type MediaMeta,
} from "../../../utils/mediaPost";
import { supabase } from "../../../lib/supabaseClient";
import { AdminPostModal } from "./AdminPostModal";
import {
  getMediaCategories,
  getMediaCategoryAspectRatio,
  isWideMediaCategory,
  resolveMediaCategoryId,
  type MediaCategoryId,
} from "../../constants/mediaCategories";
import { useMediaCategories } from "../../../hooks/useMediaCategories";
import {
  getPostThumbnailCandidates,
  getPostThumbnailAspect,
  getThumbnailCandidates,
  getThumbnailSavePayload,
  uploadThumbnailIfDataUrl,
} from "../../../utils/postThumbnail";
import {
  composeLocalDateTimeIso,
  getDayOptions,
  getDaysInMonth,
  getHourOptions,
  getMinuteOptions,
  getMonthOptions,
  getYearOptions,
  parseDateTimeParts,
} from "../../../utils/scheduleFields";
import { AdvancedThumbnailEditor } from "./AdvancedThumbnailEditor";

const ReactQuill = lazy(() => import('react-quill'));

type EventMeta = {
  event_date: string;
  location: string;
  event_status: string;
  capacity: string;
  application_deadline_y: string;
  application_deadline_m: string;
  application_deadline_d: string;
  application_deadline_h: string;
  application_deadline_minute: string;
  tags: string;
};

const EMPTY_META: EventMeta = {
  event_date: "",
  location: "",
  event_status: "접수예정",
  capacity: "",
  application_deadline_y: "",
  application_deadline_m: "",
  application_deadline_d: "",
  application_deadline_h: "",
  application_deadline_minute: "00",
  tags: "",
};

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
  const [mediaCoverFile, setMediaCoverFile] = useState<File | null>(null);
  const [mediaAttachmentFiles, setMediaAttachmentFiles] = useState<File[]>([]);
  const [mediaMeta, setMediaMeta] = useState<MediaMeta>(EMPTY_MEDIA_META);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [pendingThumbnailFile, setPendingThumbnailFile] = useState<File | null>(null);
  const [fileObjectUrls, setFileObjectUrls] = useState<string[]>([]);
  const [eventMeta, setEventMeta]         = useState<EventMeta>(EMPTY_META);
  const [loading, setLoading]             = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [tagInput, setTagInput]           = useState("");
  const { presets, addTag, hideTag } = useBoardTagPresets(category);
  const mediaCategories = useMediaCategories();
  const [mediaLabelDrafts, setMediaLabelDrafts] = useState<Record<MediaCategoryId, string>>(() =>
    Object.fromEntries(getMediaCategories().map((c) => [c.id, c.label])) as Record<MediaCategoryId, string>
  );

  // Supabase에서 표시명이 로드·변경되면 draft 입력값도 동기화
  useEffect(() => {
    setMediaLabelDrafts(
      Object.fromEntries(mediaCategories.map((c) => [c.id, c.label])) as Record<MediaCategoryId, string>
    );
  }, [mediaCategories]);

  const quillRef = useRef<ReactQuillType>(null);

  const card = "var(--color-surface-card)";
  const border = "var(--color-border-soft)";
  const textMain = "var(--color-text-primary)";
  const textMuted = "var(--color-text-muted)";
  const inputBg = "var(--color-field-bg)";
  const skBg = "var(--color-skeleton-bg)";
  const panelBg = "var(--color-surface-subtle)";
  const selectedBg = "var(--color-surface-selected)";
  const labelBg = "var(--color-surface-subtle)";
  const labelBorder = "var(--color-border-subtle)";
  const deleteBg = "var(--color-danger-soft-bg)";
  const deleteBorder = "var(--color-danger-soft-border)";

  const inputStyle = { padding: "12px 16px", borderRadius: 10, background: inputBg, border: `1px solid ${border}`, color: textMain, outline: "none", boxSizing: "border-box" as const };
  const supportsManualThumbnail = category === "news" || category === "events-archive" || category === "media";
  const thumbnailAspect = getPostThumbnailAspect(category, eventMeta.tags);
  const thumbnailCandidates = useMemo(() => {
    if (!supportsManualThumbnail) return [];
    const candidateContent = category === "media" && isWideMediaCategory(eventMeta.tags)
      ? serializeMediaMeta(content, { externalUrl: normalizeMediaExternalUrl(mediaMeta.externalUrl) })
      : content;
    const base = category === "media"
      ? getPostThumbnailCandidates({
        category,
        content: candidateContent,
        image_url: existingImages.join(","),
        tags: eventMeta.tags,
      })
      : getThumbnailCandidates(content, existingImages.join(","));
    const existingUrls = new Set(base.map(c => c.url));
    const fileCandidates = fileObjectUrls
      .map((url, i) => ({ url, label: `새 첨부 이미지 ${i + 1}`, source: "attachment" as const }))
      .filter(c => !existingUrls.has(c.url));
    return [...base, ...fileCandidates];
  }, [category, content, eventMeta.tags, existingImages, supportsManualThumbnail, fileObjectUrls, mediaMeta.externalUrl]);
  const deadlineYears = useMemo(() => {
    const years = getYearOptions();
    return eventMeta.application_deadline_y && !years.includes(eventMeta.application_deadline_y)
      ? [eventMeta.application_deadline_y, ...years]
      : years;
  }, [eventMeta.application_deadline_y]);
  const deadlineMonths = useMemo(() => getMonthOptions(), []);
  const deadlineDays = useMemo(
    () => getDayOptions(eventMeta.application_deadline_y, eventMeta.application_deadline_m),
    [eventMeta.application_deadline_m, eventMeta.application_deadline_y]
  );
  const deadlineHours = useMemo(() => getHourOptions(), []);
  const deadlineMinutes = useMemo(() => getMinuteOptions(), []);

  // editingPost가 바뀔 때 폼 상태 동기화
  useEffect(() => {
    if (editingPost) {
      const deadlineParts = parseDateTimeParts(editingPost.application_deadline);
      setCategory(editingPost.category || "notice");
      setTitle(editingPost.title || "");
      setContent(editingPost.content || "");
      setExistingImages(editingPost.image_url ? editingPost.image_url.split(',') : []);
      setThumbnailUrl(editingPost.thumbnail_url || null);
      setFiles([]);
      setMediaCoverFile(null);
      setMediaAttachmentFiles([]);
      setMediaMeta(parseMediaMeta(editingPost.content || ""));
      setEventMeta({
        event_date:      editingPost.event_date || "",
        location:        editingPost.location || "",
        event_status:    editingPost.event_status || "접수예정",
        capacity:        editingPost.capacity != null ? String(editingPost.capacity) : "",
        application_deadline_y: deadlineParts.year,
        application_deadline_m: deadlineParts.month,
        application_deadline_d: deadlineParts.day,
        application_deadline_h: deadlineParts.hour,
        application_deadline_minute: deadlineParts.minute,
        tags:            editingPost.category === "media" ? resolveMediaCategoryId(editingPost.tags) || "" : editingPost.tags || "",
      });
    } else {
      setCategory("notice");
      setTitle("");
      setContent("");
      setExistingImages([]);
      setThumbnailUrl(null);
      setFiles([]);
      setMediaCoverFile(null);
      setMediaAttachmentFiles([]);
      setMediaMeta(EMPTY_MEDIA_META);
      setEventMeta(EMPTY_META);
    }
  }, [editingPost?.id]);

  useEffect(() => {
    if (!supportsManualThumbnail) {
      if (thumbnailUrl !== null) setThumbnailUrl(null);
      return;
    }
  }, [supportsManualThumbnail, thumbnailUrl]);

  useEffect(() => {
    const imageFiles = files.filter(isBrowserSafeImageFile);
    const urls = imageFiles.map(f => URL.createObjectURL(f));
    setFileObjectUrls(urls);
    setPendingThumbnailFile(prev => (prev && !files.includes(prev) ? null : prev));
    return () => urls.forEach(url => URL.revokeObjectURL(url));
  }, [files]);

  const imageHandler = useCallback(() => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      if (!isBrowserSafeImageFile(file)) { alert("SVG를 제외한 이미지 파일만 업로드 가능합니다."); return; }
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
    const typeOk = selected.filter(isAllowedUploadFile);
    const sizeOk = typeOk.filter(f => f.size <= 10 * 1024 * 1024);

    if (typeOk.length < selected.length) alert("이미지 및 허용된 문서 파일(PDF, ZIP, DOC/DOCX, XLS/XLSX, PPT/PPTX, HWP)만 업로드 가능합니다.");
    if (sizeOk.length < typeOk.length) alert("10MB 이하의 파일만 첨부할 수 있습니다.");
    if (containsDocumentFile(sizeOk) && !window.confirm(PUBLIC_DOCUMENT_UPLOAD_WARNING)) {
      e.target.value = "";
      return;
    }

    setFiles(prev => [...prev, ...sizeOk]);
    e.target.value = "";
  };

  const handleMediaCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("표지 이미지는 이미지 파일만 업로드 가능합니다.");
      e.target.value = "";
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("표지 이미지는 10MB 이하만 업로드 가능합니다.");
      e.target.value = "";
      return;
    }
    setMediaCoverFile(file);
    e.target.value = "";
  };

  const handleMediaAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    const typeOk = selected.filter(isAllowedDocumentFile);
    const sizeOk = typeOk.filter(f => f.size <= 10 * 1024 * 1024);

    if (typeOk.length < selected.length) alert("PDF, ZIP, DOC/DOCX, XLS/XLSX, PPT/PPTX, HWP 파일만 첨부할 수 있습니다.");
    if (sizeOk.length < typeOk.length) alert("10MB 이하의 파일만 첨부할 수 있습니다.");
    if (sizeOk.length > 0 && !window.confirm(PUBLIC_DOCUMENT_UPLOAD_WARNING)) {
      e.target.value = "";
      return;
    }

    setMediaAttachmentFiles(prev => [...prev, ...sizeOk]);
    e.target.value = "";
  };

  const handleSubmitClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content || content === "<p><br></p>") return alert("제목과 내용을 입력해주세요.");
    if (category === "media") {
      const currentCoverUrl = existingImages.find(isImage);
      const mediaCategoryId = resolveMediaCategoryId(eventMeta.tags);
      const normalizedMediaUrl = normalizeMediaExternalUrl(mediaMeta.externalUrl);
      if (!mediaCategoryId) return alert("미디어 유형을 선택해주세요. (리포트, 영상, 인터뷰 등)");
      if (!isWideMediaCategory(mediaCategoryId) && !currentCoverUrl && !mediaCoverFile) return alert("미디어 표지 이미지를 등록해주세요.");
      if (isWideMediaCategory(mediaCategoryId) && !normalizedMediaUrl) {
        return alert("팟캐스트/영상/인터뷰 유형은 외부 링크를 입력해주세요.");
      }
    }
    setShowSaveModal(true);
  };

  const handleConfirmSave = async () => {
    setLoading(true);
    try {
      const uploadFile = async (f: File) => {
        if (f.size > 10 * 1024 * 1024) { alert(`"${f.name}" 파일이 10MB를 초과합니다.`); setLoading(false); return; }
        if (!isAllowedUploadFile(f)) {
          throw new Error(`허용되지 않은 파일 형식입니다: ${f.name}`);
        }

        const isImageFile = isBrowserSafeImageFile(f);
        const targetBucket = isImageFile ? 'images' : 'documents';

        const safeName = encodeFilename(f.name);
        const fileName = `${Date.now()}---${Math.random().toString(36).substr(2, 9)}---${safeName}`;

        const { error: upError } = await supabase.storage.from(targetBucket).upload(fileName, f);
        if (upError) throw new Error(`파일 업로드 실패 (${f.name}): ${upError.message}`);

        return supabase.storage.from(targetBucket).getPublicUrl(fileName).data.publicUrl;
      };

      const finalMediaCategoryId = category === 'media' ? resolveMediaCategoryId(eventMeta.tags) : null;
      const isFinalMediaWideType = isWideMediaCategory(finalMediaCategoryId);
      const normalizedMediaUrl = normalizeMediaExternalUrl(mediaMeta.externalUrl);
      const finalContent = category === "media"
        ? serializeMediaMeta(content, isFinalMediaWideType ? { externalUrl: normalizedMediaUrl } : EMPTY_MEDIA_META)
        : content;
      let imageUrls: string[] = [];
      if (category === "media") {
        const currentCoverUrl = existingImages.find(isImage) ?? null;
        if (isFinalMediaWideType) {
          const externalThumbnailUrl = getExternalMediaThumbnailUrl(normalizedMediaUrl);
          imageUrls = Array.from(new Set([...(externalThumbnailUrl ? [externalThumbnailUrl] : []), ...existingImages])).filter(Boolean);
        } else {
          const existingAttachmentUrls = existingImages.filter(url => url !== currentCoverUrl);
          const coverUrl = mediaCoverFile ? await uploadFile(mediaCoverFile) : currentCoverUrl;
          const uploadedAttachments: string[] = [];
          for (const f of mediaAttachmentFiles) {
            const uploadedUrl = await uploadFile(f);
            if (uploadedUrl) uploadedAttachments.push(uploadedUrl);
          }
          imageUrls = [coverUrl, ...existingAttachmentUrls, ...uploadedAttachments].filter(Boolean) as string[];
        }
      } else {
        imageUrls = [...existingImages];
        for (const f of files) {
          const uploadedUrl = await uploadFile(f);
          if (uploadedUrl) imageUrls.push(uploadedUrl);
        }
      }

      const finalImageUrl = imageUrls.length > 0 ? imageUrls.join(',') : null;
      const supportsFinalThumbnail = category === "news" || category === "events-archive" || category === "media";
      let pendingThumbResolved: string | null = thumbnailUrl;
      if (pendingThumbnailFile) {
        const uploadedUrl = await uploadFile(pendingThumbnailFile);
        pendingThumbResolved = uploadedUrl ?? null;
      }
      const resolvedThumbnailUrl = await uploadThumbnailIfDataUrl(pendingThumbResolved);
      const thumbnailPayload = getThumbnailSavePayload({
        supportsManualThumbnail: supportsFinalThumbnail,
        nextThumbnailUrl: resolvedThumbnailUrl,
        previousThumbnailUrl: editingPost?.thumbnail_url,
        previousThumbnailCrop: editingPost?.thumbnail_crop,
      });
      const applicationDeadline = composeLocalDateTimeIso(
        eventMeta.application_deadline_y,
        eventMeta.application_deadline_m,
        eventMeta.application_deadline_d,
        eventMeta.application_deadline_h,
        eventMeta.application_deadline_minute,
      );
      const extraFields = category === 'events'
        ? { event_date: eventMeta.event_date || null, location: eventMeta.location || null, event_status: eventMeta.event_status || null, application_deadline: applicationDeadline, capacity: eventMeta.capacity ? Number(eventMeta.capacity) : null, tags: eventMeta.tags || null }
        : ['blog', 'events-archive', 'notice', 'news', 'media'].includes(category)
          ? { tags: category === 'media' ? finalMediaCategoryId : eventMeta.tags || null }
          : {};

      if (editingPost) {
        const { error } = await supabase.from('posts').update({ category, title, content: finalContent, image_url: finalImageUrl, updated_at: new Date().toISOString(), ...thumbnailPayload, ...extraFields }).eq('id', editingPost.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('posts').insert([{ category, title, content: finalContent, image_url: finalImageUrl, ...thumbnailPayload, ...extraFields }]);
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
  const selectedMediaCategoryId = resolveMediaCategoryId(eventMeta.tags);
  const isMediaWideType = isWideMediaCategory(selectedMediaCategoryId);
  const existingMediaCoverUrl = category === "media" ? existingImages.find(isImage) : null;
  const existingMediaAttachmentUrls = category === "media" ? existingImages.filter(url => url !== existingMediaCoverUrl) : [];
  const normalizedMediaUrl = normalizeMediaExternalUrl(mediaMeta.externalUrl);
  const externalMediaThumbnailUrl = category === "media" && isMediaWideType ? getExternalMediaThumbnailUrl(normalizedMediaUrl) : null;
  const saveMediaCategoryLabel = async (id: MediaCategoryId) => {
    const label = mediaLabelDrafts[id]?.trim();
    if (!label) {
      alert("카테고리 이름을 입력해주세요.");
      return;
    }
    const { error } = await supabase
      .from("media_category_labels")
      .upsert({ id, label }, { onConflict: "id" });
    if (error) {
      alert(`저장 실패: ${error.message}`);
    }
    // Realtime 구독이 자동으로 state를 갱신
  };
  const selectTag = (tag: string) => setEventMeta(m => ({ ...m, tags: m.tags === tag ? "" : tag }));
  const addCustomTag = async () => {
    const trimmed = tagInput.trim();
    if (trimmed) { await addTag(trimmed); setEventMeta(m => ({ ...m, tags: trimmed })); }
    setTagInput("");
  };
  const removePreset = async (tag: string) => {
    await hideTag(tag);
    setEventMeta(m => m.tags === tag ? { ...m, tags: "" } : m);
  };
  const renderTagPicker = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "14px 18px", background: panelBg, border: `1px solid ${labelBorder}`, borderRadius: 14 }}>
      <p style={{ margin: 0, fontWeight: 750, fontSize: 13, color: textMain }}>카테고리 <span style={{ fontWeight: 500, color: textMuted, fontSize: 12 }}>(1개 선택)</span></p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {presets.map(tag => {
          const isSelected = selectedTag === tag;
          return (
            <div key={tag} style={{ position: "relative", display: "inline-flex" }}>
              <button type="button" onClick={() => selectTag(tag)} style={{ padding: "5px 12px", borderRadius: 99, fontSize: 13, fontWeight: isSelected ? 750 : 600, cursor: "pointer", border: `1px solid ${isSelected ? labelBorder : "transparent"}`, background: isSelected ? selectedBg : labelBg, color: isSelected ? textMain : textMuted }}>{tag}</button>
              <button type="button" onClick={() => removePreset(tag)} style={{ position: "absolute", top: -5, right: -5, width: 16, height: 16, borderRadius: "50%", background: "var(--color-surface-selected)", border: `1px solid ${labelBorder}`, color: "var(--color-on-primary)", fontSize: 10, fontWeight: 900, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1, padding: 0 }}>×</button>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input value={tagInput} onChange={e => setTagInput(e.target.value)} placeholder="목록에 없으면 직접 입력 후 추가" style={{ ...inputStyle, flex: 1, fontSize: 13 }} />
        <button type="button" onClick={addCustomTag} style={{ padding: "8px 16px", borderRadius: 10, border: `1px solid ${labelBorder}`, background: selectedBg, color: textMain, fontWeight: 750, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}>추가</button>
      </div>
      {selectedTag && (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 12, color: textMuted }}>선택됨:</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", background: selectedBg, border: `1px solid ${labelBorder}`, color: textMain, borderRadius: 99, fontSize: 13, fontWeight: 700 }}>
            {selectedTag}
            <button type="button" onClick={() => setEventMeta(m => ({ ...m, tags: "" }))} style={{ background: "none", border: "none", color: textMuted, cursor: "pointer", padding: 0, lineHeight: 1, fontSize: 14 }}>×</button>
          </span>
        </div>
      )}
    </div>
  );

  const renderThumbnailPicker = () => {
    if (!supportsManualThumbnail) return null;

    return (
      <AdvancedThumbnailEditor
        aspect={thumbnailAspect}
        candidates={thumbnailCandidates}
        value={thumbnailUrl}
        onChange={(url) => {
          setThumbnailUrl(url);
          if (url && fileObjectUrls.includes(url)) {
            const imgFiles = files.filter(isBrowserSafeImageFile);
            setPendingThumbnailFile(imgFiles[fileObjectUrls.indexOf(url)] ?? null);
          } else {
            setPendingThumbnailFile(null);
          }
        }}
      />
    );
  };

  const renderMediaTypePicker = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "14px 18px", background: panelBg, border: `1px solid ${labelBorder}`, borderRadius: 14 }}>
      <div>
        <p style={{ margin: 0, fontWeight: 800, fontSize: 13, color: textMain }}>미디어 유형 <span style={{ fontWeight: 500, color: textMuted, fontSize: 12 }}>(고정 유형 / 표시명만 수정 가능)</span></p>
        <p style={{ margin: "6px 0 0", fontSize: 12, color: textMuted, lineHeight: 1.5 }}>유형 ID는 레이아웃 비율을 결정합니다. 리포트 계열은 세로 표지, 팟캐스트/영상/인터뷰는 16:9로 표시됩니다.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
        {mediaCategories.map(item => {
          const isSelected = selectedMediaCategoryId === item.id;
          return (
            <div
              key={item.id}
              style={{ display: "flex", flexDirection: "column", gap: 8, padding: 12, borderRadius: 12, border: `1px solid ${isSelected ? labelBorder : border}`, background: isSelected ? selectedBg : inputBg }}
            >
              <button
                type="button"
                onClick={() => setEventMeta(m => ({ ...m, tags: item.id }))}
                aria-pressed={isSelected}
                style={{ width: "100%", border: "none", background: "transparent", padding: 0, textAlign: "left", cursor: "pointer" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${isSelected ? textMain : textMuted}`, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {isSelected && <span style={{ width: 8, height: 8, borderRadius: "50%", background: textMain }} />}
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", minHeight: 24, padding: "4px 10px", borderRadius: 99, background: labelBg, border: `1px solid ${isSelected ? labelBorder : "transparent"}`, color: isSelected ? textMain : textMuted, fontSize: 12, fontWeight: 850 }}>
                    {item.label}
                  </span>
                </div>
                <div style={{ marginTop: 8, color: textMuted, fontSize: 11, fontWeight: 700 }}>
                  {item.shape === "wide" ? "16:9 자동 썸네일" : "세로 표지 540x675"}
                </div>
              </button>

              <div style={{ display: "flex", gap: 6 }} onClick={e => e.stopPropagation()}>
                <input
                  value={mediaLabelDrafts[item.id] ?? item.label}
                  onChange={e => setMediaLabelDrafts(prev => ({ ...prev, [item.id]: e.target.value }))}
                  placeholder={item.defaultLabel}
                  style={{ ...inputStyle, flex: 1, padding: "8px 10px", fontSize: 12 }}
                />
                <button
                  type="button"
                  onClick={() => saveMediaCategoryLabel(item.id)}
                  style={{ padding: "8px 10px", borderRadius: 9, border: `1px solid ${labelBorder}`, background: selectedBg, color: textMain, fontWeight: 800, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" }}
                >
                  저장
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {selectedMediaCategoryId && (
        <div style={{ fontSize: 12, color: textMuted }}>
          선택됨: <strong style={{ color: textMain }}>{mediaCategories.find((c) => c.id === selectedMediaCategoryId)?.label ?? selectedMediaCategoryId}</strong> · 썸네일 비율 {getMediaCategoryAspectRatio(selectedMediaCategoryId)}
        </div>
      )}
    </div>
  );

  return (
    <>
      <form onSubmit={handleSubmitClick} style={{ background: card, border: `1px solid ${border}`, borderRadius: "16px", padding: "clamp(20px, 5vw, 28px)", display: "flex", flexDirection: "column", gap: "18px", marginBottom: "40px", overflow: "hidden" }}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h3 style={{ margin: 0, color: textMain, fontSize: "22px", fontWeight: 800 }}>{editingPost ? "게시물 수정" : "새 게시물 등록"}</h3>
          {editingPost && (
            <button type="button" onClick={onCancelled} style={{ background: "none", border: "none", color: textMuted, fontWeight: 700, cursor: "pointer", fontSize: 14 }}>← 목록으로 돌아가기</button>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
          <select value={category} onChange={e => setCategory(e.target.value)} className="w-full sm:w-[200px] sm:shrink-0" style={inputStyle}>
            {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="제목을 입력하세요" className="w-full min-w-0" style={inputStyle} required />
        </div>

        {category === "media" ? renderMediaTypePicker() : ['events', 'blog', 'events-archive', 'notice', 'news'].includes(category) && renderTagPicker()}

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

        {renderThumbnailPicker()}

        {category === "media" && selectedMediaCategoryId && isMediaWideType && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "14px 18px", background: panelBg, border: `1px solid ${labelBorder}`, borderRadius: 14 }}>
            <label style={{ fontSize: 13, fontWeight: 800, color: textMain }}>
              외부 링크
            </label>
            <input
              type="url"
              value={mediaMeta.externalUrl}
              onChange={e => setMediaMeta({ externalUrl: e.target.value })}
              placeholder="YouTube, 팟캐스트, 인터뷰 영상 URL을 입력하세요"
              style={{ ...inputStyle, fontSize: 14 }}
            />
            {externalMediaThumbnailUrl ? (
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, background: inputBg, border: `1px solid ${border}`, borderRadius: 12 }}>
                <img src={externalMediaThumbnailUrl} alt="" style={{ width: 128, aspectRatio: "16 / 9", objectFit: "cover", borderRadius: 10, flexShrink: 0 }} />
                <p style={{ margin: 0, color: textMuted, fontSize: 12, lineHeight: 1.5 }}>
                  YouTube 썸네일을 자동으로 사용합니다. 별도 표지 이미지를 등록하지 않아도 됩니다.
                </p>
              </div>
            ) : (
              <p style={{ margin: 0, color: textMuted, fontSize: 12, lineHeight: 1.5 }}>
                상세 페이지에서 보기/듣기 버튼으로 연결됩니다. YouTube 링크는 썸네일이 자동 생성되고, 그 외 링크는 기본 플레이스홀더로 표시됩니다.
              </p>
            )}
          </div>
        )}

        {category === "events" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "16px 18px", background: panelBg, border: `1px solid ${labelBorder}`, borderRadius: 14 }}>
            <p style={{ margin: 0, fontWeight: 750, fontSize: 14, color: textMain }}>행사 상세 정보</p>
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
              ].map(({ label, render }) => (
                <div key={label} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: textMuted }}>{label}</label>
                  {render()}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: textMuted }}>신청 마감일시 (선택)</label>
              <div className="grid grid-cols-2 sm:grid-cols-5" style={{ gap: 8 }}>
                <select style={{ ...inputStyle, fontSize: 14 }} value={eventMeta.application_deadline_y} onChange={e => setEventMeta(m => ({ ...m, application_deadline_y: e.target.value, application_deadline_d: Number(m.application_deadline_d) > getDaysInMonth(e.target.value, m.application_deadline_m) ? "" : m.application_deadline_d }))}>
                  <option value="">연도</option>
                  {deadlineYears.map(year => <option key={year} value={year}>{year}</option>)}
                </select>
                <select style={{ ...inputStyle, fontSize: 14 }} value={eventMeta.application_deadline_m} onChange={e => setEventMeta(m => ({ ...m, application_deadline_m: e.target.value, application_deadline_d: Number(m.application_deadline_d) > getDaysInMonth(m.application_deadline_y, e.target.value) ? "" : m.application_deadline_d }))}>
                  <option value="">월</option>
                  {deadlineMonths.map(month => <option key={month} value={month}>{month}</option>)}
                </select>
                <select style={{ ...inputStyle, fontSize: 14 }} value={eventMeta.application_deadline_d} onChange={e => setEventMeta(m => ({ ...m, application_deadline_d: e.target.value }))}>
                  <option value="">일</option>
                  {deadlineDays.map(day => <option key={day} value={day}>{day}</option>)}
                </select>
                <select style={{ ...inputStyle, fontSize: 14 }} value={eventMeta.application_deadline_h} onChange={e => setEventMeta(m => ({ ...m, application_deadline_h: e.target.value }))}>
                  <option value="">시</option>
                  {deadlineHours.map(hour => <option key={hour} value={hour}>{hour}시</option>)}
                </select>
                <select style={{ ...inputStyle, fontSize: 14 }} value={eventMeta.application_deadline_minute} onChange={e => setEventMeta(m => ({ ...m, application_deadline_minute: e.target.value }))}>
                  {deadlineMinutes.map(minute => <option key={minute} value={minute}>{minute}분</option>)}
                </select>
              </div>
              <button
                type="button"
                onClick={() => setEventMeta(m => ({ ...m, application_deadline_y: "", application_deadline_m: "", application_deadline_d: "", application_deadline_h: "", application_deadline_minute: "00" }))}
                style={{ alignSelf: "flex-start", border: "none", background: "transparent", color: textMuted, fontSize: 12, fontWeight: 700, cursor: "pointer", padding: 0 }}
              >
                마감일시 비우기
              </button>
            </div>
          </div>
        )}

        {category === "media" ? selectedMediaCategoryId && !isMediaWideType ? (
          <div style={{ display: "grid", gridTemplateColumns: isMediaWideType ? "minmax(0, 1fr)" : "minmax(0, 0.9fr) minmax(0, 1.1fr)", gap: 16, marginTop: 20 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: 18, background: panelBg, border: `1px solid ${labelBorder}`, borderRadius: 14 }}>
              <div>
                <p style={{ margin: 0, fontWeight: 800, fontSize: 14, color: textMain }}>표지 이미지</p>
                <p style={{ margin: "6px 0 0", fontSize: 12, color: textMuted, lineHeight: 1.5 }}>미디어 목록 썸네일과 상세 좌측 표지로 사용됩니다.</p>
              </div>
              {existingMediaCoverUrl && (
                <div style={{ display: "flex", gap: 12, alignItems: "center", padding: 12, background: inputBg, border: `1px solid ${border}`, borderRadius: 12 }}>
                  <img src={existingMediaCoverUrl} alt="" style={{ width: 64, height: 80, objectFit: "cover", borderRadius: 8, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: textMain, fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{getFileNameFromUrl(existingMediaCoverUrl, "표지 이미지")}</div>
                    <button type="button" onClick={() => setExistingImages(prev => prev.filter(url => url !== existingMediaCoverUrl))} style={{ marginTop: 8, border: `1px solid ${deleteBorder}`, background: deleteBg, color: "var(--color-brand-red)", padding: "5px 9px", borderRadius: 8, cursor: "pointer", fontWeight: 800, fontSize: 12 }}>삭제</button>
                  </div>
                </div>
              )}
              {mediaCoverFile && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 12, background: inputBg, border: `1px solid ${border}`, borderRadius: 12 }}>
                  <span style={{ color: textMain, fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{mediaCoverFile.name}</span>
                  <button type="button" onClick={() => setMediaCoverFile(null)} style={{ border: `1px solid ${deleteBorder}`, background: deleteBg, color: "var(--color-brand-red)", padding: "5px 9px", borderRadius: 8, cursor: "pointer", fontWeight: 800, fontSize: 12 }}>취소</button>
                </div>
              )}
              <label style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 112, padding: "22px 18px", background: "var(--color-surface-card)", border: `2px dashed ${labelBorder}`, borderRadius: 14, cursor: "pointer", color: textMain, gap: 8 }}>
                <input type="file" accept="image/*" onChange={handleMediaCoverChange} style={{ display: "none" }} />
                <span style={{ fontWeight: 800, color: textMain }}>+ 표지 이미지 선택</span>
                <span style={{ fontSize: 12, color: textMuted, textAlign: "center" }}>리포트 표지는 540x675, 영상형은 16:9 권장</span>
              </label>
            </div>

            {!isMediaWideType && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: 18, background: inputBg, border: `1px solid ${border}`, borderRadius: 14 }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 800, fontSize: 14, color: textMuted }}>첨부 PDF / 자료 파일</p>
                  <p style={{ margin: "6px 0 0", fontSize: 12, color: textMuted, lineHeight: 1.5 }}>상세 페이지의 다운로드 영역에 표시됩니다.</p>
                </div>
                {existingMediaAttachmentUrls.map((url) => (
                  <div key={url} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: 12, background: "var(--color-surface-subtle)", borderRadius: 12 }}>
                    <span style={{ color: textMain, fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{getFileNameFromUrl(url, "첨부파일")}</span>
                    <button type="button" onClick={() => setExistingImages(prev => prev.filter(item => item !== url))} style={{ border: `1px solid ${deleteBorder}`, background: deleteBg, color: "var(--color-brand-red)", padding: "5px 9px", borderRadius: 8, cursor: "pointer", fontWeight: 800, fontSize: 12 }}>삭제</button>
                  </div>
                ))}
                {mediaAttachmentFiles.map((f, idx) => (
                  <div key={`${f.name}-${idx}`} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: 12, background: "var(--color-surface-subtle)", borderRadius: 12 }}>
                    <span style={{ color: textMain, fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</span>
                    <button type="button" onClick={() => setMediaAttachmentFiles(prev => prev.filter((_, i) => i !== idx))} style={{ border: `1px solid ${deleteBorder}`, background: deleteBg, color: "var(--color-brand-red)", padding: "5px 9px", borderRadius: 8, cursor: "pointer", fontWeight: 800, fontSize: 12 }}>취소</button>
                  </div>
                ))}
                <label style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 112, padding: "22px 18px", background: "var(--color-surface-subtle)", border: `2px dashed ${border}`, borderRadius: 14, cursor: "pointer", color: textMain, gap: 8 }}>
                  <input type="file" multiple onChange={handleMediaAttachmentChange} style={{ display: "none" }} />
                  <span style={{ fontWeight: 800, color: textMain }}>+ PDF / 자료 파일 추가</span>
                  <span style={{ fontSize: 12, color: textMuted, textAlign: "center" }}>최대 10MB / PDF, ZIP, DOCX, XLSX, PPTX, HWP 지원</span>
                  <span style={{ fontSize: 11, color: textMuted, textAlign: "center" }}>문서 파일은 공개 URL로 저장됩니다.</span>
                </label>
              </div>
            )}
          </div>
        ) : null : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "20px" }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: "14px", color: textMuted }}>별도 첨부파일 관리 (문서, PDF 등)</p>
            {existingImages.map((url, idx) => (
              <div key={`exist-${idx}`} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px", background: inputBg, border: `1px solid ${border}`, borderRadius: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", color: textMain }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.55"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
                  <span style={{ fontWeight: 600, fontSize: "14px" }}>{getFileNameFromUrl(url)}</span>
                </div>
                <button type="button" onClick={() => setExistingImages(prev => prev.filter((_, i) => i !== idx))} style={{ border: `1px solid ${deleteBorder}`, background: deleteBg, color: "var(--color-brand-red)", padding: "6px 12px", borderRadius: "8px", cursor: "pointer", fontWeight: 700, fontSize: "13px" }}>삭제</button>
              </div>
            ))}
            {files.map((f, idx) => (
              <div key={`new-${idx}`} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px", background: inputBg, border: `1px solid ${border}`, borderRadius: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", color: textMain }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.55"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
                  <span style={{ fontWeight: 600, fontSize: "14px" }}>{f.name}</span>
                </div>
                <button type="button" onClick={() => setFiles(prev => prev.filter((_, i) => i !== idx))} style={{ border: `1px solid ${deleteBorder}`, background: deleteBg, color: "var(--color-brand-red)", padding: "6px 12px", borderRadius: "8px", cursor: "pointer", fontWeight: 700, fontSize: "13px" }}>취소</button>
              </div>
            ))}
            <label style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "30px 20px", background: "var(--color-surface-subtle)", border: `2px dashed ${border}`, borderRadius: "16px", cursor: "pointer", color: textMain, gap: "10px" }}>
              <input type="file" accept={DOCUMENT_UPLOAD_ACCEPT} multiple onChange={handleFileChange} style={{ display: "none" }} />
              <span style={{ fontWeight: 750, color: textMain }}>+ 파일 추가하기</span>
              <span style={{ fontSize: "13px", color: textMuted }}>최대 10MB / 이미지 및 문서(PDF, ZIP, DOCX 등) 지원</span>
              <span style={{ fontSize: "11px", color: textMuted, textAlign: "center" }}>문서 파일은 public `documents` 버킷에 공개 URL로 저장됩니다.</span>
            </label>
          </div>
        )}

        <button type="submit" disabled={loading} style={{ padding: "15px", borderRadius: "12px", border: "none", background: "var(--color-accent-blue)", color: "var(--color-on-primary)", fontWeight: 800, fontSize: "15px", cursor: "pointer", marginTop: "6px", boxShadow: "none", opacity: loading ? 0.65 : 1 }}>
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
