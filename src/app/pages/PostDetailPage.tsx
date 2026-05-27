import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router";
import { PageShell } from "../components/PageShell";
import { useTheme } from "../ThemeContext";
import { supabase } from "../../lib/supabaseClient";
import {
  getFileNameFromUrl,
  isImage,
} from "../../utils/file";
import {
  buildNaverRenderModel,
  getNaverImportDiagnostics,
  sanitizeRichHtml,
} from "../../utils/htmlSecurity";
import { useAdmin } from "../../hooks/useAdmin";
import type { BoardAccessLevel, Post } from "../../lib/types";
import { normalizePublicStorageUrl } from "../../utils/urlSecurity";
import { safeRandomUUID } from "../../utils/uuid";
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
  isVideoArchiveTag,
} from "../../utils/mediaPost";
import { getBackLinkStyle } from "../components/contentListStyles";

const MEDIA_COLOR = "var(--color-accent-ncf)";
type PostAccessInfo = {
  category: string;
  requires_auth: boolean;
  requires_participant_role: boolean;
};

const getOrCreateVisitorId = () => {
  let visitorId = localStorage.getItem("visitor_id");
  if (!visitorId) {
    visitorId = safeRandomUUID();
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
  const mediaCategories = useMediaCategories();
  const contentRef = useRef<HTMLDivElement>(null);

  const textMain = "var(--color-text-primary)";
  const textMuted = "var(--color-text-muted)";
  const border = "var(--color-border-soft)";
  const card = "var(--color-surface-card)";
  const canRenderAdminControls = !adminLoading && isAdmin && !mfaRequired && mfaEnrolled;

  const applyPostData = (data: Post, viewDelta = 0) => {
    setPost({ ...data, views: (data.views || 0) + viewDelta } as Post);
  };

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

      // RPC 미응답 시 게시판 access_level 로 보수적 fallback (public 외에는 상세 로그인).
      if (!accessInfo && !session) {
        const { data: cat } = await supabase
          .from("post_categories")
          .select("access_level")
          .eq("id", data.category)
          .maybeSingle<{ access_level: BoardAccessLevel }>();
        if ((cat?.access_level ?? "private") !== "public") {
          navigate("/login", {
            replace: true,
            state: { from: `${location.pathname}${location.search}` },
          });
          return;
        }
      }

      if (data.category === "events" && new URLSearchParams(location.search).get("edit") !== "1") {
        navigate(`/events/${data.id}/apply`, { replace: true });
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

  const headerInfo = BOARD_INFO[post?.category ?? ""] ?? { title: "게시판", subtitle: "상세 보기" };
  const attachmentUrls = post?.image_url ? post.image_url.split(",") : [];
  const mediaMeta = post?.category === "media" ? parseMediaMeta(post.content || "") : { externalUrl: "" };
  const eventArchiveMeta = post?.category === "events-archive" ? parseMediaMeta(post.content || "") : { externalUrl: "" };
  const isArchiveVideoType = post?.category === "events-archive" && isVideoArchiveTag(post.tags);
  const isMediaWideType = post?.category === "media" && isWideMediaCategory(post.tags);
  const isWideVideoDetail = isMediaWideType || isArchiveVideoType;
  const externalMediaThumbnailUrl = isMediaWideType ? getExternalMediaThumbnailUrl(mediaMeta.externalUrl) : null;
  const archiveVideoThumbnailUrl = isArchiveVideoType ? getExternalMediaThumbnailUrl(eventArchiveMeta.externalUrl) : null;
  const wideVideoExternalUrl = isArchiveVideoType ? eventArchiveMeta.externalUrl : mediaMeta.externalUrl;
  const wideVideoCoverUrl = isArchiveVideoType ? archiveVideoThumbnailUrl ?? attachmentUrls.find(isImage) : null;
  const wideVideoBadgeLabel = isArchiveVideoType
    ? post?.tags || "영상"
    : mediaCategories.find((c) => c.id === resolveMediaCategoryId(post?.tags))?.label ?? getMediaCategoryLabel(post?.tags);
  const images = attachmentUrls.filter(isImage);
  const files = isWideVideoDetail
    ? []
    : attachmentUrls
      .filter((url) => !isImage(url))
      .map(normalizePublicStorageUrl)
      .filter(Boolean);
  const rawBodyContent = post?.category === "media" || post?.category === "events-archive" ? stripMediaMeta(post.content || "") : post?.content || "";
  const {
    isNaverImport,
    normalizedContent: renderedBodyContent,
    bodyImageUrls,
    dedupedAttachmentUrls: dedupedImages,
  } = buildNaverRenderModel(rawBodyContent, images);
  const mediaCoverUrl = post?.category === "media" ? (isMediaWideType ? externalMediaThumbnailUrl ?? images[0] : images[0]) : null;
  const mediaBodyImages = post?.category === "media" ? (isMediaWideType ? [] : images.slice(1)) : images;

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

  useEffect(() => {
    if (!post) return;
    if (new URLSearchParams(location.search).get("edit") !== "1") return;
    if (!canRenderAdminControls) return;
    navigate(`/admin?editPostId=${post.id}`, { replace: true });
  }, [canRenderAdminControls, location.search, navigate, post]);

  if (loading) return <PageShell title="로딩 중..."><p>불러오는 중입니다.</p></PageShell>;
  if (!post) return <PageShell title="오류"><p>{loadError ?? "게시물을 찾을 수 없습니다."}</p></PageShell>;

  return (
    <PageShell title={headerInfo.title} subtitle={headerInfo.subtitle}>
      <div className={`${(post?.category === "media" || isArchiveVideoType) ? "max-w-[1100px]" : "max-w-[900px]"} mx-auto pb-[100px]`}>
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={() => post?.category === "media" ? navigate("/insights") : navigate(-1)}
            style={getBackLinkStyle()}
          >
            ← 목록으로 돌아가기
          </button>
          {canRenderAdminControls && (
            <button
              type="button"
              onClick={() => navigate(`/admin?editPostId=${post.id}`)}
              className="px-5 py-2 rounded-lg font-bold cursor-pointer"
              style={{ border: `1px solid ${border}`, background: card, color: "var(--color-accent-blue)" }}
            >
              수정
            </button>
          )}
        </div>

        {post?.category === "media" || isArchiveVideoType ? (
          <>
            {isWideVideoDetail ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-xl)" }}>
                <div>
                  {wideVideoBadgeLabel && (
                    <span style={{ display: "inline-flex", alignItems: "center", minHeight: 26, padding: "5px 12px", borderRadius: "var(--radius-pill)", background: "var(--color-accent-ncf-badge-bg)", color: MEDIA_COLOR, fontSize: 12, fontWeight: 900 }}>
                      {wideVideoBadgeLabel}
                    </span>
                  )}
                  <h1 style={{ margin: "var(--space-md) 0 var(--space-sm)", color: textMain, fontSize: "clamp(26px,3.5vw,42px)", fontWeight: 850, lineHeight: 1.25, letterSpacing: 0 }}>
                    {post.title}
                  </h1>
                  <p style={{ margin: 0, fontSize: 14, color: textMuted }}>
                    {new Date(post.created_at).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}
                  </p>
                </div>

                {(() => {
                  const youtubeId = getYouTubeVideoId(wideVideoExternalUrl);
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
                  return (
                    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
                      <div style={{ width: "100%", aspectRatio: "16 / 9", borderRadius: "var(--radius-md)", overflow: "hidden", boxShadow: "var(--shadow-media-cover)", background: "var(--color-skeleton-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {(isArchiveVideoType ? wideVideoCoverUrl : mediaCoverUrl) ? (
                          <img src={(isArchiveVideoType ? wideVideoCoverUrl : mediaCoverUrl) ?? ""} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                        ) : (
                          <span style={{ fontSize: 13, color: textMuted }}>자동 썸네일 없음</span>
                        )}
                      </div>
                      {wideVideoExternalUrl && (
                        <a
                          href={wideVideoExternalUrl}
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
              {post?.category === "events-archive" && isArchiveVideoType && (
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)", marginBottom: "var(--space-lg)" }}>
                  <div style={{ width: "100%", aspectRatio: "16 / 9", borderRadius: "var(--radius-md)", overflow: "hidden", boxShadow: "var(--shadow-media-cover)", background: "var(--color-skeleton-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {archiveVideoThumbnailUrl ? (
                      <img src={archiveVideoThumbnailUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    ) : (
                      <span style={{ fontSize: 13, color: textMuted }}>자동 썸네일 없음</span>
                    )}
                  </div>
                  {eventArchiveMeta.externalUrl && (
                    <a
                      href={eventArchiveMeta.externalUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: "var(--space-xs)", fontSize: 13, padding: "var(--space-xs) var(--space-md)", borderRadius: "var(--radius-sm)", textDecoration: "none", fontWeight: 700, color: "var(--color-bg-base)", background: "var(--color-accent-green)" }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                      외부 링크 열기
                    </a>
                  )}
                </div>
              )}

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
    </PageShell>
  );
}
