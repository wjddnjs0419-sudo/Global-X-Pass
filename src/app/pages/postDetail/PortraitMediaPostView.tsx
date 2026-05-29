import type { Post } from "../../../lib/types";
import type { PostDetailModel } from "../../../utils/postDetailModel";
import { getThumbnailImageStyle } from "../../../utils/thumbnail/renderer";
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
        <div className="w-full justify-self-start" style={{ maxWidth: "var(--size-media-cover-portrait)" }}>
          {mediaCoverUrl ? (
            <div className="bg-skeleton relative w-full rounded-lg overflow-hidden" style={{ aspectRatio: portraitMediaAspectRatio, boxShadow: "var(--shadow-media-cover)" }}>
              <img
                src={mediaCoverUrl}
                alt=""
                style={getThumbnailImageStyle(portraitMediaCoverCrop)}
              />
            </div>
          ) : (
            <div className="bg-skeleton w-full rounded-lg flex items-center justify-center text-xs" style={{ aspectRatio: portraitMediaAspectRatio, color: textMuted }}>
              표지 이미지 없음
            </div>
          )}
        </div>

        <div className="min-w-0">
          {post.tags && (
            <span
              className="inline-flex items-center px-3 py-[5px] rounded-full text-xs font-black"
              style={{ minHeight: 26, background: "var(--color-accent-ncf-badge-bg)", color: MEDIA_COLOR }}
            >
              {wideVideoBadgeLabel}
            </span>
          )}
          <h1 className="mt-4 mb-3 font-[850] leading-[1.3] tracking-normal" style={{ color: textMain, fontSize: "clamp(22px,2.8vw,36px)" }}>
            {post.title}
          </h1>
          <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
            <p className="m-0 text-sm" style={{ color: textMuted }}>
              {new Date(post.created_at).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}
            </p>
            {files.length > 0 && <AttachmentPopover files={files} />}
          </div>

          {mediaMeta.externalUrl && (
            <a
              href={mediaMeta.externalUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="text-surface-base inline-flex items-center gap-2 text-[13px] py-2 px-4 rounded-lg no-underline font-bold mb-6"
              style={{ background: MEDIA_COLOR }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
              외부 링크 열기
            </a>
          )}

          <div className="pt-6" style={{ borderTop: `1px solid ${border}` }}>
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
        <div className="flex flex-col gap-6 items-center pt-9 mt-9" style={{ borderTop: `1px solid ${border}` }}>
          {mediaBodyImages.map((url, idx) => (
            <img key={idx} src={url} alt={`첨부 이미지 ${idx + 1}`} className="max-w-full max-h-[600px] object-contain rounded-[var(--radius-md)]" style={{ border: `1px solid ${border}` }} />
          ))}
        </div>
      )}
    </>
  );
}
