import { AlertCircle, ExternalLink, RefreshCw } from "lucide-react";
import { useTheme } from "../../ThemeContext";
import type { ExternalNewsDraftValues } from "./externalNewsTypes";
import type { ExternalNewsPreviewResult } from "../../../lib/types";

interface ExternalNewsPreviewCardProps {
  preview: ExternalNewsPreviewResult | null;
  draft: ExternalNewsDraftValues;
  loading?: boolean;
  error?: string | null;
}

export function ExternalNewsPreviewCard({
  preview,
  draft,
  loading = false,
  error = null,
}: ExternalNewsPreviewCardProps) {
  const { isDark } = useTheme();
  const card = "var(--color-surface-card)";
  const border = "var(--color-border-soft)";
  const textMain = "var(--color-text-primary)";
  const textMuted = "var(--color-text-muted)";
  const skColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";

  if (loading) {
    return (
      <div className="rounded-[20px] p-5 flex flex-col gap-4" style={{ background: card, border: `1px solid ${border}` }}>
        <div className="h-5 w-28 rounded-full" style={{ background: skColor, animation: "pulse 1.5s ease-in-out infinite" }} />
        <div className="h-8 w-3/4 rounded-xl" style={{ background: skColor, animation: "pulse 1.5s ease-in-out infinite" }} />
        <div className="h-4 w-full rounded-full" style={{ background: skColor, animation: "pulse 1.5s ease-in-out infinite" }} />
        <div className="h-4 w-5/6 rounded-full" style={{ background: skColor, animation: "pulse 1.5s ease-in-out infinite" }} />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="rounded-[20px] p-5"
        style={{
          background: isDark ? "rgba(234,67,53,0.10)" : "rgba(234,67,53,0.07)",
          border: `1px solid ${isDark ? "rgba(234,67,53,0.30)" : "rgba(234,67,53,0.24)"}`,
        }}
      >
        <div className="flex items-start gap-3">
          <div
            className="mt-[2px] flex h-8 w-8 items-center justify-center rounded-full"
            style={{ background: "rgba(234,67,53,0.10)", color: "var(--color-brand-red)" }}
          >
            <AlertCircle size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="m-0 font-extrabold" style={{ color: textMain }}>
              미리보기 생성 실패
            </p>
            <p className="mt-1 mb-0 text-[13px] leading-relaxed" style={{ color: textMuted }}>
              {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!preview) {
    return (
      <div
        className="rounded-[20px] p-5"
        style={{
          background: card,
          border: `1px solid ${border}`,
          borderStyle: "dashed",
        }}
      >
        <div className="flex items-start gap-3">
          <div
            className="mt-[2px] flex h-8 w-8 items-center justify-center rounded-full"
            style={{ background: "var(--color-accent-blue-soft-bg)", color: "var(--color-accent-blue)" }}
          >
            <RefreshCw size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="m-0 font-extrabold" style={{ color: textMain }}>
              링크를 넣고 미리보기를 생성해 주세요.
            </p>
            <p className="mt-1 mb-0 text-[13px] leading-relaxed" style={{ color: textMuted }}>
              메타데이터를 읽은 뒤 제목, 요약, 출처, 발행일을 바로 수정할 수 있습니다.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const publishedDate = new Date(draft.published_date);
  const publishedLabel = Number.isNaN(publishedDate.getTime())
    ? draft.published_date
    : publishedDate.toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

  return (
    <div className="rounded-[20px] overflow-hidden" style={{ background: card, border: `1px solid ${border}` }}>
      <div className="p-5 flex flex-col gap-4">
        <div className="flex items-start gap-2 flex-wrap">
          <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold" style={{ borderColor: "var(--color-border-soft)", color: textMuted }}>
            미리보기
          </span>
          <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold" style={{ borderColor: "var(--color-border-soft)", color: textMuted }}>
            {preview.source_name}
          </span>
        </div>

        <h3 className="m-0 font-extrabold leading-snug line-clamp-2" style={{ fontSize: "clamp(17px, 2vw, 20px)", color: textMain }}>
          {draft.title || preview.title}
        </h3>

        {draft.summary || preview.summary ? (
          <p className="m-0 text-[14px] leading-relaxed line-clamp-3" style={{ color: textMuted }}>
            {draft.summary || preview.summary}
          </p>
        ) : (
          <p className="m-0 text-[14px] leading-relaxed italic" style={{ color: textMuted }}>
            요약이 없습니다.
          </p>
        )}

        {preview.warnings.length > 0 && (
          <div
            className="rounded-2xl p-4 flex flex-col gap-2"
            style={{
              background: isDark ? "rgba(251,188,5,0.10)" : "rgba(251,188,5,0.08)",
              border: `1px solid ${isDark ? "rgba(251,188,5,0.28)" : "rgba(251,188,5,0.20)"}`,
            }}
          >
            <p className="m-0 text-[13px] font-extrabold" style={{ color: textMain }}>
              자동 추출 참고
            </p>
            <ul className="m-0 pl-4 text-[13px] leading-relaxed" style={{ color: textMuted }}>
              {preview.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-col gap-2 pt-1">
          <span className="text-[12px] font-medium" style={{ color: textMuted }}>
            발행일 {publishedLabel}
          </span>
          <a
            href={draft.external_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[12px] font-bold"
            style={{ color: "var(--color-accent-blue)", textDecoration: "none" }}
          >
            원문 보기 <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </div>
  );
}
