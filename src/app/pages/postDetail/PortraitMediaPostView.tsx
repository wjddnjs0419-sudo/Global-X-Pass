import type { Post } from "../../../lib/types";
import type { PostDetailModel } from "../../../utils/postDetailModel";
import { getThumbnailImageStyle } from "../../../utils/thumbnail/renderer";
import { isPdf } from "../../../utils/file";
import { resolveMediaCategoryId } from "../../constants/mediaCategories";
import { AttachmentPopover } from "../../components/content/AttachmentPopover";
import { CardNewsSlider } from "../../components/insight/CardNewsSlider";
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

  // 카드뉴스(마켓/테크/CEO 포트레이트) + PDF 첨부가 있으면 표지 대신 스와이프 슬라이더를 노출한다.
  const resolvedCategoryId = resolveMediaCategoryId(post.tags);
  const cardNewsCategory =
    resolvedCategoryId === "report" || resolvedCategoryId === "issue-paper" || resolvedCategoryId === "trend-report"
      ? resolvedCategoryId
      : null;
  const cardNewsPdfUrl = files.find(isPdf) ?? null;
  const formattedDate = new Date(post.created_at).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });

  // 카드뉴스: 좌측 표지 슬롯을 쓰지 않고, 본문 영역에 크게(단일 컬럼) 슬라이더를 노출한다.
  if (cardNewsCategory && cardNewsPdfUrl) {
    const hasBody = renderedBodyContent.trim().length > 0;
    return (
      <article className="mx-auto w-full max-w-[680px]">
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
          <p className="m-0 text-sm" style={{ color: textMuted }}>{formattedDate}</p>
          {files.length > 0 && <AttachmentPopover files={files} />}
        </div>

        {hasBody && (
          // .ql-editor 전역 min-height(400px) 때문에 짧은 본문에도 큰 여백이 생겨 카드뉴스가 밀린다.
          // card-news-body 클래스로 해당 본문 한정 min-height를 푼다(styles/index.css).
          <div className="mb-4 card-news-body">
            <PostBodyRenderer
              renderedBodyContent={renderedBodyContent}
              isNaverImport={isNaverImport}
              isDark={isDark}
              textColor={textMain}
            />
          </div>
        )}

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

        <CardNewsSlider pdfUrl={cardNewsPdfUrl} category={cardNewsCategory} />

        {mediaBodyImages.length > 0 && (
          <div className="flex flex-col gap-6 items-center pt-9 mt-9" style={{ borderTop: `1px solid ${border}` }}>
            {mediaBodyImages.map((url, idx) => (
              <img key={idx} src={url} alt={`첨부 이미지 ${idx + 1}`} className="max-w-full max-h-[600px] object-contain rounded-[var(--radius-md)]" style={{ border: `1px solid ${border}` }} />
            ))}
          </div>
        )}
      </article>
    );
  }

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
