import { forwardRef } from "react";
import { sanitizeRichHtml } from "../../../utils/htmlSecurity";

type Props = {
  renderedBodyContent: string;
  isNaverImport: boolean;
  isDark: boolean;
  textColor: string;
};

export const PostBodyRenderer = forwardRef<HTMLDivElement, Props>(function PostBodyRenderer(
  { renderedBodyContent, isNaverImport, isDark, textColor },
  ref,
) {
  return (
    <div
      className={`${isDark ? "quill-dark" : "quill-light"}${isNaverImport ? " naver-se-content" : ""}`}
      data-gxp-se-renderer={isNaverImport ? "canonical" : undefined}
    >
      <div
        ref={ref}
        className="ql-editor p-0 m-0"
        style={{ color: textColor }}
        dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(renderedBodyContent) }}
      />
    </div>
  );
});
