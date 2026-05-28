import type { Post } from "../../../lib/types";
import type { PostDetailModel } from "../../../utils/postDetailModel";
import { getYouTubeVideoId } from "../../../utils/mediaPost";
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

export function WideVideoPostView({ post, model, isDark, textMain, textMuted, border }: Props) {
  const {
    isArchiveVideoType,
    wideVideoBadgeLabel,
    wideVideoExternalUrl,
    wideVideoCoverUrl,
    mediaCoverUrl,
    renderedBodyContent,
    isNaverImport,
    files,
  } = model;

  const youtubeId = getYouTubeVideoId(wideVideoExternalUrl);
  const coverUrl = isArchiveVideoType ? wideVideoCoverUrl : mediaCoverUrl;

  return (
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-md)", flexWrap: "wrap" }}>
          <p style={{ margin: 0, fontSize: 14, color: textMuted }}>
            {new Date(post.created_at).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}
          </p>
          {files.length > 0 && <AttachmentPopover files={files} />}
        </div>
      </div>

      {youtubeId ? (
        <div style={{ width: "100%", aspectRatio: "16 / 9", borderRadius: "var(--radius-md)", overflow: "hidden", boxShadow: "var(--shadow-media-cover)", background: "var(--color-skeleton-bg)" }}>
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}`}
            title={post.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ width: "100%", height: "100%", border: "none", display: "block" }}
          />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
          <div style={{ width: "100%", aspectRatio: "16 / 9", borderRadius: "var(--radius-md)", overflow: "hidden", boxShadow: "var(--shadow-media-cover)", background: "var(--color-skeleton-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {coverUrl ? (
              <img src={coverUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
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
      )}

      {renderedBodyContent && (
        <div style={{ paddingTop: "var(--space-lg)", borderTop: `1px solid ${border}` }}>
          <PostBodyRenderer
            renderedBodyContent={renderedBodyContent}
            isNaverImport={isNaverImport}
            isDark={isDark}
            textColor={textMain}
          />
        </div>
      )}
    </div>
  );
}
