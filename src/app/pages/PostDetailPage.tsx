import { lazy, Suspense, useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router";
import { PageShell } from "../components/PageShell";
import { useTheme } from "../ThemeContext";
import { supabase } from "../../lib/supabaseClient";
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
} from "../../utils/file";
import {
  buildNaverRenderModel,
  getNaverImportDiagnostics,
  sanitizeRichHtml,
} from "../../utils/htmlSecurity";
import { useAdmin } from "../../hooks/useAdmin";
import { LAYERS } from "../../lib/layers";
import type { Post } from "../../lib/types";
import { useBoardTagPresets } from "../../hooks/useBoardTagPresets";
import { normalizePublicStorageUrl } from "../../utils/urlSecurity";
import {
  getMediaCategoryAspectRatio,
  getMediaCategoryLabel,
  isWideMediaCategory,
  resolveMediaCategoryId,
} from "../constants/mediaCategories";
import { useMediaCategories } from "../../hooks/useMediaCategories";
import {
  getExternalMediaThumbnailUrl,
  getYouTubeVideoId,
  parseMediaMeta,
  stripMediaMeta,
} from "../../utils/mediaPost";
import {
  getPostThumbnailAspect,
  getThumbnailCandidates,
  getThumbnailSavePayload,
  uploadThumbnailIfDataUrl,
} from "../../utils/postThumbnail";
import { AdvancedThumbnailEditor } from "../components/admin/AdvancedThumbnailEditor";
import { getBackLinkStyle } from "../components/contentListStyles";

import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

const AdminPostCreate = lazy(() => import("../components/admin/AdminPostCreate"));

const MEDIA_COLOR = "var(--color-accent-ncf)";
type PostAccessInfo = {
  category: string;
  requires_auth: boolean;
  requires_participant_role: boolean;
};
const PUBLIC_DETAIL_CATEGORIES = new Set(["news", "faq", "events-archive"]);
const requiresPostDetailAuth = (category?: string | null) => !PUBLIC_DETAIL_CATEGORIES.has(category || "");
const CATEGORY_EDIT_THEME: Record<string, { accent: string; softBg: string; softBorder: string; strongBorder: string }> = {
  blog: {
    accent: "var(--color-accent-purple)",
    softBg: "var(--color-accent-purple-soft-bg)",
    softBorder: "var(--color-accent-purple-soft-border)",
    strongBorder: "var(--color-accent-purple-soft-border-strong)",
  },
  notice: {
    accent: "var(--color-brand-red)",
    softBg: "var(--color-danger-soft-bg)",
    softBorder: "var(--color-danger-soft-border)",
    strongBorder: "var(--color-danger-soft-border)",
  },
  news: {
    accent: "var(--color-accent-blue)",
    softBg: "var(--color-accent-blue-soft-bg)",
    softBorder: "var(--color-accent-blue-soft-border)",
    strongBorder: "var(--color-accent-blue-soft-border-strong)",
  },
  events: {
    accent: "var(--color-accent-green)",
    softBg: "var(--color-success-soft-bg)",
    softBorder: "var(--color-success-soft-border)",
    strongBorder: "var(--color-success-soft-border)",
  },
  "events-archive": {
    accent: "var(--color-accent-green)",
    softBg: "var(--color-success-soft-bg)",
    softBorder: "var(--color-success-soft-border)",
    strongBorder: "var(--color-success-soft-border)",
  },
};

const getOrCreateVisitorId = () => {
  let visitorId = localStorage.getItem("visitor_id");
  if (!visitorId) {
    visitorId = crypto.randomUUID();
    localStorage.setItem("visitor_id", visitorId);
  }
  return visitorId;
};

const BOARD_INFO: Record<string, { title: string; subtitle: string }> = {
  notice:           { title: "공지사항",       subtitle: "중요한 안내 사항을 확인하세요." },
  news:             { title: "뉴스",           subtitle: "새로운 소식을 확인하세요." },
  events:           { title: "행사",           subtitle: "NCF × Around X가 준비한 소식을 확인하세요." },
  "events-archive": { title: "행사 아카이브",   subtitle: "지나간 행사의 기록을 확인하세요." },
  resources:        { title: "자료실",          subtitle: "필요한 서식과 자료를 다운로드하세요." },
  media:            { title: "미디어",          subtitle: "직접 제작한 콘텐츠를 확인하세요." },
  blog:             { title: "블로그",          subtitle: "다양한 인사이트와 이야기를 만나보세요." },
  faq:              { title: "자주 묻는 질문",  subtitle: "궁금한 점을 빠르게 찾아보세요." },
};

export function PostDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark } = useTheme();
  const { isAdmin, loading: adminLoading, mfaRequired, mfaEnrolled } = useAdmin();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editThumbnailUrl, setEditThumbnailUrl] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [postCategory, setPostCategory] = useState("");
  const mediaCategories = useMediaCategories();
  const { presets: tagPresets, addTag, hideTag } = useBoardTagPresets(postCategory);
  const [editEventStatus, setEditEventStatus] = useState("접수예정");
  const [editEventDate, setEditEventDate] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editCapacity, setEditCapacity] = useState("");
  const [editFiles, setEditFiles] = useState<File[]>([]);
  const [editFileObjectUrls, setEditFileObjectUrls] = useState<string[]>([]);
  const [pendingThumbnailFile, setPendingThumbnailFile] = useState<File | null>(null);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState<{ show: boolean; type: "save" | "delete" | null }>({ show: false, type: null });
  const quillRef = useRef<ReactQuill>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const textMain = "var(--color-text-primary)";
  const textMuted = "var(--color-text-muted)";
  const border = "var(--color-border-soft)";
  const card = "var(--color-surface-card)";
  const canRenderAdminControls = !adminLoading && isAdmin && !mfaRequired && mfaEnrolled;
  const editFieldStyle = { padding: "12px 16px", borderRadius: 10, background: "var(--color-field-bg)", border: `1px solid ${border}`, color: textMain, outline: "none", fontSize: 14 };

  const applyPostData = (data: Post, viewDelta = 0) => {
    setPost({ ...data, views: (data.views || 0) + viewDelta } as Post);
    setEditTitle(data.title);
    setEditContent(data.content);
    setEditTags(data.category === "media" ? resolveMediaCategoryId(data.tags) || "" : data.tags || "");
    setEditThumbnailUrl(data.thumbnail_url || null);
    setPostCategory(data.category);
    setExistingImages(data.image_url ? data.image_url.split(",") : []);
    setEditEventStatus(data.event_status || "접수예정");
    setEditEventDate(data.event_date || "");
    setEditLocation(data.location || "");
    setEditCapacity(data.capacity != null ? String(data.capacity) : "");
  };

  useEffect(() => {
    if (adminLoading || canRenderAdminControls) return;
    if (isEditing) {
      setIsEditing(false);
      setEditFiles([]);
      setEditThumbnailUrl(post?.thumbnail_url ?? null);
      setPendingThumbnailFile(null);
    }
    if (showModal.show) setShowModal({ show: false, type: null });
  }, [adminLoading, canRenderAdminControls, isEditing, showModal.show]);

  const fetchPost = async (incrementView = false) => {
    if (!id) {
      setPost(null);
      setLoadError("잘못된 게시물 주소입니다.");
      setLoading(false);
      return;
    }

    try {
      setLoadError(null);

      const [{ data: { session } }, accessResult] = await Promise.all([
        supabase.auth.getSession(),
        supabase.rpc("get_post_access_info", { post_id: id }).maybeSingle(),
      ]);
      const accessInfo = accessResult.data as PostAccessInfo | null;

      if (accessInfo?.requires_auth && !session) {
        navigate("/login", {
          replace: true,
          state: { from: `${location.pathname}${location.search}` },
        });
        return;
      }

      if (accessInfo?.requires_participant_role && session) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();
        const role = profile?.role;
        if (role !== "admin" && role !== "participant") {
          setPost(null);
          setLoadError("이 게시물은 참여사 담당자와 관리자만 열람할 수 있습니다.");
          return;
        }
      }

      const { data, error } = await supabase.from("posts").select("*").eq("id", id).maybeSingle();
      if (error) throw error;

      if (!data) {
        setPost(null);
        setLoadError("게시물을 찾을 수 없습니다.");
        return;
      }

      if (!accessInfo && requiresPostDetailAuth(data.category) && !session) {
        navigate("/login", {
          replace: true,
          state: { from: `${location.pathname}${location.search}` },
        });
        return;
      }

      applyPostData(data as Post);

      if (incrementView) {
        const visitorId = getOrCreateVisitorId();
        void supabase
          .rpc("increment_view_count", {
            row_id: id,
            visitor_id: visitorId,
          })
          .then(({ data: incremented, error: rpcError }) => {
            if (rpcError) {
              console.error("Failed to increment post view:", rpcError);
              return;
            }
            if (!incremented) return;
            setPost((current) => (
              current && current.id === data.id
                ? ({ ...current, views: (current.views || 0) + 1 } as Post)
                : current
            ));
          });
      }
    } catch (error) {
      console.error("Failed to load post detail:", { id, error });
      setPost(null);
      setLoadError("게시물을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    setPost(null);
    void fetchPost(true);
  }, [id]);

  const imageHandler = () => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.click();
    input.onchange = async () => {
      const file = input.files?.[0];
      if (file) {
        if (!isBrowserSafeImageFile(file)) {
          alert("SVG를 제외한 이미지 파일만 업로드 가능합니다.");
          return;
        }
        if (file.size > 10 * 1024 * 1024) {
          alert("이미지 파일은 10MB 이하만 업로드 가능합니다.");
          return;
        }
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) { alert("로그인이 필요합니다."); return; }

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

  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    const allowed = selected.filter(isAllowedUploadFile);
    const sizeOk = allowed.filter((file) => file.size <= 10 * 1024 * 1024);

    if (allowed.length < selected.length) {
      alert("이미지 및 허용된 문서 파일(PDF, ZIP, DOC/DOCX, XLS/XLSX, PPT/PPTX, HWP)만 업로드 가능합니다.");
    }
    if (sizeOk.length < allowed.length) {
      alert("10MB 이하의 파일만 첨부할 수 있습니다.");
    }
    if (containsDocumentFile(sizeOk) && !window.confirm(PUBLIC_DOCUMENT_UPLOAD_WARNING)) {
      e.target.value = "";
      return;
    }

    setEditFiles((prev) => [...prev, ...sizeOk]);
    e.target.value = "";
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
          if (f.size > 10 * 1024 * 1024) {
            alert(`"${f.name}" 파일이 10MB를 초과합니다. 10MB 이하 파일만 업로드 가능합니다.`);
            return;
          }
          if (!isAllowedUploadFile(f)) {
            alert(`"${f.name}" 파일 형식은 업로드할 수 없습니다.`);
            return;
          }

          const isImageFile = isBrowserSafeImageFile(f);
          const targetBucket = isImageFile ? 'images' : 'documents';

          const safeName = encodeFilename(f.name);
          const fileName = `${Date.now()}---${Math.random().toString(36).substr(2, 9)}---${safeName}`;
          const { error: upError } = await supabase.storage.from(targetBucket).upload(fileName, f);
          if (upError) throw upError;
          const url = supabase.storage.from(targetBucket).getPublicUrl(fileName).data.publicUrl;
          imageUrls.push(url);
        }
        const isEvent = post?.category === "events";
        const supportsManualThumbnail = post?.category === "news" || post?.category === "events-archive";
        const finalTags = post?.category === "media" ? resolveMediaCategoryId(editTags) : editTags || null;
        let effectiveThumbnailUrl = editThumbnailUrl;
        if (pendingThumbnailFile) {
          const safeName = encodeFilename(pendingThumbnailFile.name);
          const fileName = `${Date.now()}---${Math.random().toString(36).substr(2, 9)}---${safeName}`;
          const { error: thumbUpError } = await supabase.storage.from("images").upload(fileName, pendingThumbnailFile);
          if (thumbUpError) throw thumbUpError;
          effectiveThumbnailUrl = supabase.storage.from("images").getPublicUrl(fileName).data.publicUrl;
        }
        const resolvedThumbnailUrl = await uploadThumbnailIfDataUrl(effectiveThumbnailUrl);
        const thumbnailPayload = getThumbnailSavePayload({
          supportsManualThumbnail,
          nextThumbnailUrl: resolvedThumbnailUrl,
          previousThumbnailUrl: post?.thumbnail_url,
          previousThumbnailCrop: post?.thumbnail_crop,
        });
        const { data, error } = await supabase
          .from("posts")
          .update({
            title: editTitle,
            content: editContent,
            image_url: imageUrls.join(",") || null,
            ...thumbnailPayload,
            tags: finalTags,
            ...(isEvent ? {
              event_status: editEventStatus,
              event_date: editEventDate || null,
              location: editLocation || null,
              capacity: editCapacity ? Number(editCapacity) : null,
            } : {}),
          })
          .eq("id", id)
          .select();
        
        if (error) throw error;
        
        if (data?.[0]) {
          applyPostData(data[0] as Post);
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

  const headerInfo = BOARD_INFO[post?.category ?? ""] ?? { title: "게시판", subtitle: "상세 보기" };
  const attachmentUrls = post?.image_url ? post.image_url.split(",") : [];
  const mediaMeta = post?.category === "media" ? parseMediaMeta(post.content || "") : { externalUrl: "" };
  const isMediaWideType = post?.category === "media" && isWideMediaCategory(post.tags);
  const externalMediaThumbnailUrl = isMediaWideType ? getExternalMediaThumbnailUrl(mediaMeta.externalUrl) : null;
  const images = attachmentUrls.filter(isImage);
  const files = isMediaWideType
    ? []
    : attachmentUrls
      .filter((url) => !isImage(url))
      .map(normalizePublicStorageUrl)
      .filter(Boolean);
  const rawBodyContent = post?.category === "media" ? stripMediaMeta(post.content || "") : post?.content || "";
  const {
    isNaverImport,
    normalizedContent: renderedBodyContent,
    bodyImageUrls,
    dedupedAttachmentUrls: dedupedImages,
  } = buildNaverRenderModel(rawBodyContent, images);
  const mediaCoverUrl = post?.category === "media" ? (isMediaWideType ? externalMediaThumbnailUrl ?? images[0] : images[0]) : null;
  const mediaBodyImages = post?.category === "media" ? (isMediaWideType ? [] : images.slice(1)) : images;
  const useAdminPostEditor = canRenderAdminControls && isEditing && post?.category === "media";
  const supportsManualThumbnailEdit = post?.category === "news" || post?.category === "events-archive";

  useEffect(() => {
    if (!supportsManualThumbnailEdit) return;
    const imageFiles = editFiles.filter(isBrowserSafeImageFile);
    const urls = imageFiles.map(f => URL.createObjectURL(f));
    setEditFileObjectUrls(urls);
    setPendingThumbnailFile(prev => (prev && !editFiles.includes(prev) ? null : prev));
    return () => urls.forEach(u => URL.revokeObjectURL(u));
  }, [editFiles, supportsManualThumbnailEdit]);

  const editThumbnailCandidates = useMemo(() => {
    if (!supportsManualThumbnailEdit) return [];
    const base = getThumbnailCandidates(editContent, existingImages.join(","));
    const existingUrls = new Set(base.map(c => c.url));
    const fileCandidates = editFileObjectUrls
      .map((url, i) => ({ url, label: `새 첨부 이미지 ${i + 1}`, source: "attachment" as const }))
      .filter(c => !existingUrls.has(c.url));
    return [...base, ...fileCandidates];
  }, [editContent, existingImages, supportsManualThumbnailEdit, editFileObjectUrls]);

  useEffect(() => {
    if (!post || typeof window === "undefined") return;

    const debugEnabled =
      import.meta.env.DEV ||
      new URLSearchParams(window.location.search).get("debugNaverImport") === "1" ||
      window.localStorage.getItem("gxp_debug_naver_import") === "1";

    if (!debugEnabled) return;

    const diagnostics = getNaverImportDiagnostics(rawBodyContent, attachmentUrls);
    const shouldLog =
      isNaverImport ||
      diagnostics.canonical.unknownComponentCount > 0 ||
      diagnostics.canonical.markerCoverageRatio < 1 ||
      diagnostics.spacingStyleCount > 0 ||
      diagnostics.emptyParagraphCount > 0 ||
      diagnostics.duplicateAttachmentUrls.length > 0;

    if (!shouldLog) return;

    const firstParagraph = contentRef.current?.querySelector("p");
    const firstImage = contentRef.current?.querySelector("img");
    const paragraphStyle = firstParagraph ? window.getComputedStyle(firstParagraph) : null;
    const imageStyle = firstImage ? window.getComputedStyle(firstImage) : null;

    console.groupCollapsed(`[Naver Import Debug] ${post.title}`);
    console.log({
      postId: post.id,
      category: post.category,
      isNaverImport,
      diagnostics,
      render: {
        attachmentUrls,
        bodyImageUrls: bodyImageUrls.slice(0, 8),
        removedDuplicateImages: images.length - dedupedImages.length,
      },
      canonical: {
        markerCoverageRatio: diagnostics.canonical.markerCoverageRatio,
        seComponentCount: diagnostics.canonical.seComponentCount,
        canonicalBlockCount: diagnostics.canonical.canonicalBlockCount,
        unknownComponentCount: diagnostics.canonical.unknownComponentCount,
        unknownComponentSamples: diagnostics.canonical.unknownComponentSamples,
        blockCounts: diagnostics.canonical.blockCounts,
        flowCounts: diagnostics.canonical.flowCounts,
      },
      anomalyReasons: diagnostics.anomalyReasons,
      computed: {
        rootClassName: contentRef.current?.parentElement?.className ?? "",
        firstParagraph: firstParagraph
          ? {
              text: firstParagraph.textContent?.slice(0, 80) ?? "",
              marginTop: paragraphStyle?.marginTop,
              marginBottom: paragraphStyle?.marginBottom,
              lineHeight: paragraphStyle?.lineHeight,
            }
          : null,
        firstImage: firstImage
          ? {
              src: firstImage.getAttribute("src"),
              display: imageStyle?.display,
              width: imageStyle?.width,
              height: imageStyle?.height,
            }
          : null,
      },
    });
    console.groupEnd();
  }, [attachmentUrls, bodyImageUrls, dedupedImages.length, images.length, isNaverImport, post, rawBodyContent]);

  if (loading) return <PageShell title="로딩 중..."><p>불러오는 중입니다.</p></PageShell>;
  if (!post && !isSubmitting) return <PageShell title="오류"><p>{loadError ?? "게시물을 찾을 수 없습니다."}</p></PageShell>;

  return (
    <PageShell title={headerInfo.title} subtitle={headerInfo.subtitle}>
      <div className={`${post?.category === "media" && !isEditing ? "max-w-[1100px]" : "max-w-[900px]"} mx-auto pb-[100px]`}>
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={() => post?.category === "media" ? navigate("/media") : navigate(-1)}
            style={getBackLinkStyle()}
          >
            ← 목록으로 돌아가기
          </button>
          {canRenderAdminControls && (
            <div className="flex gap-2.5">
              {useAdminPostEditor ? null : isEditing ? (
                <>
                  <button 
                    onClick={() => setShowModal({ show: true, type: "save" })} 
                    disabled={isSubmitting} 
                    className={`px-5 py-2 rounded-lg border-none font-bold cursor-pointer ${isSubmitting ? 'opacity-50' : 'opacity-100'}`}
                    style={{ background: "var(--color-accent-blue)", color: "var(--color-on-primary)" }}
                  >
                    {isSubmitting ? "저장 중..." : "저장하기"}
                  </button>
                  <button 
                    onClick={() => { setIsEditing(false); setEditFiles([]); setEditThumbnailUrl(post?.thumbnail_url ?? null); setPendingThumbnailFile(null); }}
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
                    className="px-5 py-2 rounded-lg font-bold cursor-pointer"
                    style={{ border: `1px solid ${border}`, background: card, color: "var(--color-accent-blue)" }}
                  >
                    수정
                  </button>
                  <button 
                    onClick={() => setShowModal({ show: true, type: "delete" })} 
                    className="px-5 py-2 rounded-lg border-none font-bold cursor-pointer"
                    style={{ background: "var(--color-danger-soft-bg)", color: "var(--color-brand-red)" }}
                  >
                    삭제
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {useAdminPostEditor ? (
          <Suspense fallback={<div className="p-8 rounded-3xl" style={{ background: card, border: `1px solid ${border}`, color: textMuted }}>수정 화면을 불러오는 중입니다.</div>}>
            <AdminPostCreate
              editingPost={post}
              onSaved={() => {
                setIsEditing(false);
                setEditFiles([]);
                void fetchPost(false);
              }}
              onCancelled={() => {
                setIsEditing(false);
                setEditFiles([]);
                if (post) applyPostData(post);
              }}
            />
          </Suspense>
        ) : canRenderAdminControls && isEditing ? (
          <div className="flex flex-col gap-5">
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full p-4 rounded-xl text-[24px] font-extrabold outline-none"
              style={{ border: `1px solid ${border}`, background: card, color: textMain }}
            />

            {/* 카테고리 태그 피커 */}
            {post?.category === "media" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "16px 20px", background: "var(--color-accent-ncf-soft-bg)", border: "1px solid var(--color-accent-ncf-border)", borderRadius: 16 }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: MEDIA_COLOR }}>미디어 유형 <span style={{ fontWeight: 400, fontSize: 12, color: textMuted }}>(고정 유형)</span></p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {mediaCategories.map(item => {
                    const selected = resolveMediaCategoryId(editTags) === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setEditTags(item.id)}
                        style={{ padding: "7px 13px", borderRadius: 99, border: selected ? "none" : "1px solid var(--color-accent-ncf-border-strong)", background: selected ? MEDIA_COLOR : "var(--color-glass-bg)", color: selected ? "var(--color-on-ncf)" : textMuted, fontSize: 13, fontWeight: 800, cursor: "pointer" }}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {(post?.category === "events" || post?.category === "events-archive" || post?.category === "blog" || post?.category === "notice" || post?.category === "news") && (() => {
              const theme = CATEGORY_EDIT_THEME[post.category] ?? CATEGORY_EDIT_THEME.events;
              const accent = theme.accent;
              const inputBg2 = "var(--color-field-bg)";
              const inputStyle2 = { padding: "10px 14px", borderRadius: 10, border: `1px solid ${border}`, background: inputBg2, color: textMain, outline: "none", fontSize: 13, boxSizing: "border-box" as const };
              return (
                <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "16px 20px", background: theme.softBg, border: `1px solid ${theme.softBorder}`, borderRadius: 16 }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: accent }}>카테고리 <span style={{ fontWeight: 400, fontSize: 12, color: textMuted }}>(1개 선택)</span></p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {tagPresets.map(tag => {
                      const selected = editTags === tag;
                      return (
                        <div key={tag} style={{ position: "relative", display: "inline-flex" }}>
                          <button type="button" onClick={() => setEditTags(prev => prev === tag ? "" : tag)} style={{ padding: "5px 12px", borderRadius: 99, fontSize: 13, fontWeight: selected ? 700 : 500, cursor: "pointer", border: selected ? "none" : `1px solid ${theme.strongBorder}`, background: selected ? accent : "var(--color-glass-bg)", color: selected ? "var(--color-on-primary)" : textMuted }}>
                            {tag}
                          </button>
                          <button type="button" onClick={() => { hideTag(tag); if (editTags === tag) setEditTags(""); }} style={{ position: "absolute", top: -5, right: -5, width: 16, height: 16, borderRadius: "50%", background: "var(--color-surface-selected)", border: "none", color: "var(--color-on-primary)", fontSize: 10, fontWeight: 900, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1, padding: 0 }}>×</button>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input value={tagInput} onChange={e => setTagInput(e.target.value)} placeholder="목록에 없으면 직접 입력 후 추가" style={{ ...inputStyle2, flex: 1 }} />
                    <button type="button" onClick={() => { const t = tagInput.trim(); if (t) { addTag(t); setEditTags(t); setTagInput(""); } }} style={{ padding: "8px 16px", borderRadius: 10, border: "none", background: accent, color: "var(--color-on-primary)", fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}>추가</button>
                  </div>
                  {editTags && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 12, color: textMuted }}>선택됨:</span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", background: accent, color: "var(--color-on-primary)", borderRadius: 99, fontSize: 13, fontWeight: 600 }}>
                        {editTags}
                        <button type="button" onClick={() => setEditTags("")} style={{ background: "none", border: "none", color: "var(--color-on-primary)", cursor: "pointer", padding: 0, fontSize: 14 }}>×</button>
                      </span>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* 행사 전용 필드 */}
            {post?.category === "events" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "20px 24px", background: "var(--color-success-soft-bg)", border: "1px solid var(--color-success-soft-border)", borderRadius: 16 }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "var(--color-accent-green)" }}>행사 상세 정보</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: textMuted }}>상태</label>
                    <select style={editFieldStyle} value={editEventStatus} onChange={e => setEditEventStatus(e.target.value)}>
                      <option value="접수예정">접수예정</option>
                      <option value="접수중">접수중</option>
                      <option value="마감임박">마감임박</option>
                      <option value="마감">마감</option>
                    </select>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: textMuted }}>일시 (예: 2026.05.08 (목) 18:00)</label>
                    <input style={editFieldStyle} placeholder="2026.05.08 (목) 18:00" value={editEventDate} onChange={e => setEditEventDate(e.target.value)} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: textMuted }}>장소</label>
                    <input style={editFieldStyle} placeholder="서울 강남 NCF 센터" value={editLocation} onChange={e => setEditLocation(e.target.value)} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: textMuted }}>정원 (명)</label>
                    <input type="number" min={0} style={editFieldStyle} placeholder="200" value={editCapacity} onChange={e => setEditCapacity(e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            <div className={`overflow-hidden rounded-[10px] ${isDark ? "quill-dark" : "quill-light"}`} style={{ background: "var(--color-field-bg)", border: `1px solid ${border}` }}>
              <ReactQuill ref={quillRef} theme="snow" value={editContent} onChange={setEditContent} modules={modules} placeholder="자유롭게 글과 이미지를 작성해 보세요!" />
            </div>

            {supportsManualThumbnailEdit && post && (
              <AdvancedThumbnailEditor
                aspect={getPostThumbnailAspect(post.category)}
                candidates={editThumbnailCandidates}
                value={editThumbnailUrl}
                onChange={(url) => {
                  setEditThumbnailUrl(url);
                  const imageFiles = editFiles.filter(isBrowserSafeImageFile);
                  const idx = editFileObjectUrls.indexOf(url ?? "");
                  setPendingThumbnailFile(idx >= 0 ? (imageFiles[idx] ?? null) : null);
                }}
              />
            )}

            <div className="p-5 rounded-xl flex flex-col gap-3" style={{ border: `1px solid ${border}`, background: card }}>
              <p className="m-0 text-[14px] font-bold" style={{ color: textMuted }}>첨부파일 관리</p>
              {existingImages.map((url, idx) => (
                <div key={`exist-${idx}`} className="flex items-center justify-between p-3 rounded-lg" style={{ background: "var(--color-surface-subtle)" }}>
                  <span className="text-[14px] overflow-hidden text-ellipsis whitespace-nowrap" style={{ color: textMain }}>{getFileNameFromUrl(url)}</span>
                  <button onClick={() => setExistingImages((prev) => prev.filter((_, i) => i !== idx))} className="border-none px-2 py-1 rounded-md cursor-pointer font-bold" style={{ background: "var(--color-danger-soft-bg)", color: "var(--color-brand-red)" }}>삭제</button>
                </div>
              ))}
              {editFiles.map((f, idx) => (
                <div key={`new-${idx}`} className="flex items-center justify-between p-3 rounded-lg" style={{ background: "var(--color-surface-subtle)" }}>
                  <span className="text-[14px]" style={{ color: "var(--color-accent-blue)" }}>{f.name} (새 파일)</span>
                  <button onClick={() => setEditFiles((prev) => prev.filter((_, i) => i !== idx))} className="border-none px-2 py-1 rounded-md cursor-pointer font-bold" style={{ background: "var(--color-danger-soft-bg)", color: "var(--color-brand-red)" }}>취소</button>
                </div>
              ))}
              <label className="inline-block mt-2.5 px-4 py-2.5 rounded-lg font-bold cursor-pointer text-center" style={{ color: "var(--color-accent-blue)", background: "var(--color-glass-bg)" }}>
                <input type="file" accept={DOCUMENT_UPLOAD_ACCEPT} multiple onChange={handleEditFileChange} className="hidden" />
                + 문서 및 기타 파일 추가
              </label>
              <p className="m-0 mt-2 text-[12px]" style={{ color: textMuted }}>문서 파일은 public `documents` 버킷에 공개 URL로 저장됩니다.</p>
            </div>
          </div>
        ) : post?.category === "media" ? (
          <>
            {isMediaWideType ? (
              /* ── 영상형 (팟캐스트·영상·인터뷰): 세로 스택 ── */
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-xl)" }}>
                {/* 헤더 */}
                <div>
                  {post.tags && (
                    <span style={{ display: "inline-flex", alignItems: "center", minHeight: 26, padding: "5px 12px", borderRadius: "var(--radius-pill)", background: "var(--color-accent-ncf-badge-bg)", color: MEDIA_COLOR, fontSize: 12, fontWeight: 900 }}>
                      {mediaCategories.find((c) => c.id === resolveMediaCategoryId(post.tags))?.label ?? getMediaCategoryLabel(post.tags)}
                    </span>
                  )}
                  <h1 style={{ margin: "var(--space-md) 0 var(--space-sm)", color: textMain, fontSize: "clamp(26px,3.5vw,42px)", fontWeight: 850, lineHeight: 1.25, letterSpacing: 0 }}>
                    {post.title}
                  </h1>
                  <p style={{ margin: 0, fontSize: 14, color: textMuted }}>
                    {new Date(post.created_at).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}
                  </p>
                </div>

                {/* 임베드 플레이어 영역 */}
                {(() => {
                  const youtubeId = getYouTubeVideoId(mediaMeta.externalUrl);
                  if (youtubeId) {
                    return (
                      <div style={{ width: "100%", aspectRatio: "16 / 9", borderRadius: "var(--radius-md)", overflow: "hidden", boxShadow: "var(--shadow-media-cover)", background: "var(--color-skeleton-bg)" }}>
                        <iframe
                          src={`https://www.youtube.com/embed/${youtubeId}`}
                          title={post.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          style={{ width: "100%", height: "100%", border: "none", display: "block" }}
                        />
                      </div>
                    );
                  }
                  /* 비유튜브: 커버 이미지(또는 플레이스홀더) + 외부 링크 버튼 */
                  return (
                    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
                      <div style={{ width: "100%", aspectRatio: "16 / 9", borderRadius: "var(--radius-md)", overflow: "hidden", boxShadow: "var(--shadow-media-cover)", background: "var(--color-skeleton-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {mediaCoverUrl ? (
                          <img src={mediaCoverUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                        ) : (
                          <span style={{ fontSize: 13, color: textMuted }}>자동 썸네일 없음</span>
                        )}
                      </div>
                      {mediaMeta.externalUrl && (
                        <a
                          href={mediaMeta.externalUrl}
                          target="_blank"
                          rel="noreferrer noopener"
                          style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: "var(--space-xs)", fontSize: 13, padding: "var(--space-xs) var(--space-md)", borderRadius: "var(--radius-sm)", textDecoration: "none", fontWeight: 700, color: "var(--color-bg-base)", background: MEDIA_COLOR }}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                          외부 링크 열기
                        </a>
                      )}
                    </div>
                  );
                })()}

                {/* 첨부파일 */}
                {files.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-xs)" }}>
                    {files.map((url, idx) => (
                      <a key={idx} href={url} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-xs)", fontSize: 13, padding: "var(--space-xs) var(--space-md)", borderRadius: "var(--radius-sm)", textDecoration: "none", fontWeight: 600, color: "var(--color-on-ncf-muted)", background: "var(--color-accent-ncf-badge-bg)" }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                        {getFileNameFromUrl(url, "첨부파일")}
                      </a>
                    ))}
                  </div>
                )}

                {/* 본문 설명 */}
                {renderedBodyContent && (
                  <div style={{ paddingTop: "var(--space-lg)", borderTop: `1px solid ${border}` }}>
                    <div
                      className={`${isDark ? "quill-dark" : "quill-light"}${isNaverImport ? " naver-se-content" : ""}`}
                      data-gxp-se-renderer={isNaverImport ? "canonical" : undefined}
                    >
                      <div className="ql-editor p-0 m-0" style={{ color: textMain }} dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(renderedBodyContent) }} />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* ── 레포트형 (리포트·이슈페이퍼·트렌드리포트): 좌우 그리드 ── */
              <>
                <div className="grid grid-cols-1 min-[680px]:grid-cols-[var(--size-media-cover-portrait)_minmax(0,1fr)] gap-8 items-start">
                  <div style={{ width: "100%", maxWidth: "var(--size-media-cover-portrait)", justifySelf: "start" }}>
                    {mediaCoverUrl ? (
                      <img
                        src={mediaCoverUrl}
                        alt=""
                        style={{ width: "100%", aspectRatio: getMediaCategoryAspectRatio(post.tags), objectFit: "cover", display: "block", borderRadius: "var(--radius-sm)", boxShadow: "var(--shadow-media-cover)" }}
                      />
                    ) : (
                      <div style={{ width: "100%", aspectRatio: getMediaCategoryAspectRatio(post.tags), borderRadius: "var(--radius-sm)", background: "var(--color-skeleton-bg)", display: "flex", alignItems: "center", justifyContent: "center", color: textMuted, fontSize: 12 }}>
                        표지 이미지 없음
                      </div>
                    )}
                  </div>

                  <div style={{ minWidth: 0 }}>
                    {post.tags && (
                      <span style={{ display: "inline-flex", alignItems: "center", minHeight: 26, padding: "5px 12px", borderRadius: "var(--radius-pill)", background: "var(--color-accent-ncf-badge-bg)", color: MEDIA_COLOR, fontSize: 12, fontWeight: 900 }}>
                        {mediaCategories.find((c) => c.id === resolveMediaCategoryId(post.tags))?.label ?? getMediaCategoryLabel(post.tags)}
                      </span>
                    )}
                    <h1 style={{ margin: "var(--space-md) 0 var(--space-sm)", color: textMain, fontSize: "clamp(22px,2.8vw,36px)", fontWeight: 850, lineHeight: 1.3, letterSpacing: 0 }}>
                      {post.title}
                    </h1>
                    <p style={{ margin: "0 0 var(--space-lg)", fontSize: 14, color: textMuted }}>
                      {new Date(post.created_at).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}
                    </p>

                    {files.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-xs)", marginBottom: "var(--space-lg)" }}>
                        {files.map((url, idx) => (
                          <a key={idx} href={url} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-xs)", fontSize: 13, padding: "var(--space-xs) var(--space-md)", borderRadius: "var(--radius-sm)", textDecoration: "none", fontWeight: 600, color: "var(--color-on-ncf-muted)", background: "var(--color-accent-ncf-badge-bg)" }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                            {getFileNameFromUrl(url, "첨부파일")}
                          </a>
                        ))}
                      </div>
                    )}

                    {mediaMeta.externalUrl && (
                      <a
                        href={mediaMeta.externalUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-xs)", fontSize: 13, padding: "var(--space-xs) var(--space-md)", borderRadius: "var(--radius-sm)", textDecoration: "none", fontWeight: 700, marginBottom: "var(--space-lg)", color: "var(--color-bg-base)", background: MEDIA_COLOR }}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                        외부 링크 열기
                      </a>
                    )}

                    <div style={{ paddingTop: "var(--space-lg)", borderTop: `1px solid ${border}` }}>
                      <div
                        className={`${isDark ? "quill-dark" : "quill-light"}${isNaverImport ? " naver-se-content" : ""}`}
                        data-gxp-se-renderer={isNaverImport ? "canonical" : undefined}
                      >
                        <div className="ql-editor p-0 m-0" style={{ color: textMain }} dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(renderedBodyContent) }} />
                      </div>
                    </div>
                  </div>
                </div>

                {mediaBodyImages.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-lg)", alignItems: "center", paddingTop: "var(--space-xl)", marginTop: "var(--space-xl)", borderTop: `1px solid ${border}` }}>
                    {mediaBodyImages.map((url, idx) => (
                      <img key={idx} src={url} alt={`첨부 이미지 ${idx + 1}`} className="max-w-full max-h-[600px] object-contain" style={{ borderRadius: "var(--radius-md)", border: `1px solid ${border}` }} />
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          <>
            <h1 className="text-[32px] font-extrabold mb-3 mt-0 px-[var(--space-md)]" style={{ color: textMain }}>{post?.title}</h1>
            <p className="text-[14px] mb-10 m-0 px-[var(--space-md)]" style={{ color: textMuted }}>{post && new Date(post.created_at).toLocaleDateString()}</p>
            <div className="rounded-[var(--radius-md)] p-[var(--space-md)]" style={{ background: card, border: `1px solid ${border}`, boxShadow: "var(--shadow-card-subtle)" }}>
              {!isNaverImport && files.length > 0 && (
                <div className="flex flex-col items-end gap-2 mb-8">
                  {files.map((url, idx) => (
                    <a key={idx} href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-[13px] px-4 py-2 rounded-lg no-underline font-semibold" style={{ color: "var(--color-accent-blue)", background: "var(--color-glass-bg)" }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                      {getFileNameFromUrl(url, "첨부파일")}
                    </a>
                  ))}
                </div>
              )}
              <div
                className={`${isDark ? "quill-dark" : "quill-light"}${isNaverImport ? " naver-se-content" : ""}`}
                data-gxp-se-renderer={isNaverImport ? "canonical" : undefined}
              >
                <div ref={contentRef} className="ql-editor p-0 m-0" style={{ color: textMain }} dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(renderedBodyContent) }} />
              </div>
              {/* 이관 게시물은 썸네일이 image_url에 저장되지만 본문 HTML 안에도 포함되므로 중복 렌더링 생략 */}
              {!isNaverImport && dedupedImages.length > 0 && (
                <div className="flex flex-col gap-6 items-center pt-10 mt-10" style={{ borderTop: `1px solid ${border}` }}>
                  {dedupedImages.map((url, idx) => (
                    <img key={idx} src={url} alt={`첨부 이미지 ${idx + 1}`} className="max-w-full max-h-[600px] object-contain rounded-2xl" style={{ border: `1px solid ${border}` }} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {showModal.show && (
        <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center" style={{ background: "var(--color-backdrop)", zIndex: LAYERS.modal }}>
          <div className="py-10 px-8 rounded-3xl text-center max-w-[400px] w-[90%]" style={{ background: "var(--color-bg-elevated)", boxShadow: "var(--shadow-dialog)" }}>
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
                style={{ background: showModal.type === "delete" ? "var(--color-brand-red)" : "var(--color-accent-blue)" }}
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
