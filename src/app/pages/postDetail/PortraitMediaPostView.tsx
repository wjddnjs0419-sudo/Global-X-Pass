import type { Post } from "../../../lib/types";
import type { PostDetailModel } from "../../../utils/postDetailModel";
import { getThumbnailImageStyle } from "../../../utils/postThumbnail";
import { AttachmentPopover } from "../../components/content/AttachmentPopover";
import { PostBodyRenderer } from "../../components/content/PostBodyRenderer";

const MEDIA_COLOR = "var(--color-accent-ncf)";

type Props = {
  post: Post;
  model: PostDetailModel;
  isDark: boolean;
  textMain: string;
  textMuted: string;
  border: string;
};

export function PortraitMediaPostView({ post, model, isDark, textMain, textMuted, border }: Props) {
  const {
    mediaCoverUrl,
    portraitMediaAspectRatio,
    portraitMediaCoverCrop,
    wideVideoBadgeLabel,
    files,
    mediaMeta,
    renderedBodyContent,
    isNaverImport,
    mediaBodyImages,
  } = model;

  return (
    <>
      <div className="grid grid-cols-1 min-[680px]:grid-cols-[var(--size-media-cover-portrait)_minmax(0,1fr)] gap-8 items-start">
        <div style={{ width: "100%", maxWidth: "var(--size-media-cover-portrait)", justifySelf: "start" }}>
          {mediaCoverUrl ? (
            <div style={{ position: "relative", width: "100%", aspectRatio: portraitMediaAspectRatio, borderRadius: "var(--radius-sm)", overflow: "hidden", boxShadow: "var(--shadow-media-cover)", background: "var(--color-skeleton-bg)" }}>
              <img
                src={mediaCoverUrl}
                alt=""
                style={getThumbnailImageStyle(portraitMediaCoverCrop)}
              />
            </div>
          ) : (
            <div style={{ width: "100%", aspectRatio: portraitMediaAspectRatio, borderRadius: "var(--radius-sm)", background: "var(--color-skeleton-bg)", display: "flex", alignItems: "center", justifyContent: "center", color: textMuted, fontSize: 12 }}>
              표지 이미지 없음
            </div>
          )}
        </div>

        <div style={{ minWidth: 0 }}>
          {post.tags && (
            <span style={{ display: "inline-flex", alignItems: "center", minHeight: 26, padding: "5px 12px", borderRadius: "var(--radius-pill)", background: "var(--color-accent-ncf-badge-bg)", color: MEDIA_COLOR, fontSize: 12, fontWeight: 900 }}>
              {wideVideoBadgeLabel}
            </span>
          )}
          <h1 style={{ margin: "var(--space-md) 0 var(--space-sm)", color: textMain, fontSize: "clamp(22px,2.8vw,36px)", fontWeight: 850, lineHeight: 1.3, letterSpacing: 0 }}>
            {post.title}
          </h1>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-md)", flexWrap: "wrap", marginBottom: "var(--space-lg)" }}>
            <p style={{ margin: 0, fontSize: 14, color: textMuted }}>
              {new Date(post.created_at).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}
            </p>
            {files.length > 0 && <AttachmentPopover files={files} />}
          </div>

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
            <PostBodyRenderer
              renderedBodyContent={renderedBodyContent}
              isNaverImport={isNaverImport}
              isDark={isDark}
              textColor={textMain}
            />
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
  );
}
