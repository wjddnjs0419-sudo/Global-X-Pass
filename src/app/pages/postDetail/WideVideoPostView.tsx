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
    <div className="flex flex-col gap-9">
      <div>
        {wideVideoBadgeLabel && (
          <span
            className="inline-flex items-center px-3 py-[5px] rounded-full text-xs font-black"
            style={{ minHeight: 26, background: "var(--color-accent-ncf-badge-bg)", color: MEDIA_COLOR }}
          >
            {wideVideoBadgeLabel}
          </span>
        )}
        <h1 className="mt-4 mb-3 font-[850] leading-tight tracking-normal" style={{ color: textMain, fontSize: "clamp(26px,3.5vw,42px)" }}>
          {post.title}
        </h1>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <p className="m-0 text-sm" style={{ color: textMuted }}>
            {new Date(post.created_at).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}
          </p>
          {files.length > 0 && <AttachmentPopover files={files} />}
        </div>
      </div>

      {youtubeId ? (
        <div className="bg-skeleton w-full aspect-video rounded-[var(--radius-md)] overflow-hidden" style={{ boxShadow: "var(--shadow-media-cover)" }}>
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}`}
            title={post.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full border-0 block"
          />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="bg-skeleton w-full aspect-video rounded-[var(--radius-md)] overflow-hidden flex items-center justify-center" style={{ boxShadow: "var(--shadow-media-cover)" }}>
            {coverUrl ? (
              <img src={coverUrl} alt="" className="w-full h-full object-cover block" />
            ) : (
              <span className="text-[13px]" style={{ color: textMuted }}>자동 썸네일 없음</span>
            )}
          </div>
          {wideVideoExternalUrl && (
            <a
              href={wideVideoExternalUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="text-surface-base self-start inline-flex items-center gap-2 text-[13px] py-2 px-4 rounded-lg no-underline font-bold"
              style={{ background: MEDIA_COLOR }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
              외부 링크 열기
            </a>
          )}
        </div>
      )}

      {renderedBodyContent && (
        <div className="pt-6" style={{ borderTop: `1px solid ${border}` }}>
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
