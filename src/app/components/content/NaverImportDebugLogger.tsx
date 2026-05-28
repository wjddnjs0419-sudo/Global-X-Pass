import { useEffect } from "react";
import type { RefObject } from "react";
import type { Post } from "../../../lib/types";
import type { PostDetailModel } from "../../../utils/postDetailModel";
import { getNaverImportDiagnostics } from "../../../utils/htmlSecurity";

type Props = {
  post: Post;
  model: PostDetailModel;
  contentRef: RefObject<HTMLDivElement | null>;
};

export function NaverImportDebugLogger({ post, model, contentRef }: Props) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!import.meta.env.DEV) return;

    const { attachmentUrls, images, bodyImageUrls, dedupedImages, isNaverImport, rawBodyContent } = model;
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
      diagnostics: {
        attachmentCount: diagnostics.attachmentCount,
        imageCount: diagnostics.imageCount,
        paragraphCount: diagnostics.paragraphCount,
        emptyParagraphCount: diagnostics.emptyParagraphCount,
        emptyTableRowCount: diagnostics.emptyTableRowCount,
        spacingStyleCount: diagnostics.spacingStyleCount,
        duplicateAttachmentUrlCount: diagnostics.duplicateAttachmentUrls.length,
        hasMeta: diagnostics.hasMeta,
        hasSeContainer: diagnostics.hasSeContainer,
        isNaverImport: diagnostics.isNaverImport,
      },
      render: {
        attachmentCount: attachmentUrls.length,
        bodyImageCount: bodyImageUrls.length,
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
              marginTop: paragraphStyle?.marginTop,
              marginBottom: paragraphStyle?.marginBottom,
              lineHeight: paragraphStyle?.lineHeight,
            }
          : null,
        firstImage: firstImage
          ? {
              display: imageStyle?.display,
              width: imageStyle?.width,
              height: imageStyle?.height,
            }
          : null,
      },
    });
    console.groupEnd();
  }, [model, post, contentRef]);

  return null;
}
