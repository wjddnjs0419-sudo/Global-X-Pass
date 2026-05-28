import type { RefObject } from "react";
import type { Post } from "../../../lib/types";
import type { PostDetailModel } from "../../../utils/postDetailModel";
import { AttachmentPopover } from "../../components/content/AttachmentPopover";
import { PostBodyRenderer } from "../../components/content/PostBodyRenderer";

type Props = {
  post: Post;
  model: PostDetailModel;
  isDark: boolean;
  textMain: string;
  textMuted: string;
  border: string;
  card: string;
  contentRef: RefObject<HTMLDivElement | null>;
};

export function StandardPostView({ post, model, isDark, textMain, textMuted, border, card, contentRef }: Props) {
  const {
    files,
    isArchiveVideoType,
    archiveVideoThumbnailUrl,
    eventArchiveMeta,
    renderedBodyContent,
    isNaverImport,
    dedupedImages,
  } = model;

  return (
    <>
      <h1 className="text-[32px] font-extrabold mb-3 mt-0 px-[var(--space-md)]" style={{ color: textMain }}>{post.title}</h1>
      <div className="px-[var(--space-md)] mb-10 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[14px] m-0" style={{ color: textMuted }}>{new Date(post.created_at).toLocaleDateString()}</p>
        {files.length > 0 && <AttachmentPopover files={files} />}
      </div>
      <div className="rounded-[var(--radius-md)] p-[var(--space-md)]" style={{ background: card, border: `1px solid ${border}`, boxShadow: "var(--shadow-card-subtle)" }}>
        {post.category === "events-archive" && isArchiveVideoType && (
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
        <PostBodyRenderer
          ref={contentRef}
          renderedBodyContent={renderedBodyContent}
          isNaverImport={isNaverImport}
          isDark={isDark}
          textColor={textMain}
        />
        {!isNaverImport && dedupedImages.length > 0 && (
          <div className="flex flex-col gap-6 items-center pt-10 mt-10" style={{ borderTop: `1px solid ${border}` }}>
            {dedupedImages.map((url, idx) => (
              <img key={idx} src={url} alt={`첨부 이미지 ${idx + 1}`} className="max-w-full max-h-[600px] object-contain rounded-2xl" style={{ border: `1px solid ${border}` }} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
