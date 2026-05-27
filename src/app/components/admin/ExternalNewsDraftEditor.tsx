import type { CSSProperties } from "react";
import { useTheme } from "../../ThemeContext";
import type { ExternalNewsDraftValues } from "./externalNewsTypes";

interface ExternalNewsDraftEditorProps {
  draft: ExternalNewsDraftValues;
  onChange: (patch: Partial<ExternalNewsDraftValues>) => void;
}

export function ExternalNewsDraftEditor({ draft, onChange }: ExternalNewsDraftEditorProps) {
  const { isDark } = useTheme();
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const textMain = isDark ? "rgba(255,255,255,0.92)" : "rgba(10,16,32,0.88)";
  const textMuted = isDark ? "rgba(255,255,255,0.45)" : "rgba(10,16,32,0.45)";
  const inputBg = isDark ? "rgba(255,255,255,0.04)" : "#fff";

  const inputStyle: CSSProperties = {
    padding: "12px 14px",
    borderRadius: 10,
    background: inputBg,
    border: `1px solid ${border}`,
    color: textMain,
    outline: "none",
    boxSizing: "border-box",
    width: "100%",
    fontFamily: "inherit",
    fontSize: 14,
  };

  const textareaStyle: CSSProperties = {
    ...inputStyle,
    minHeight: 128,
    resize: "vertical",
    lineHeight: 1.6,
  };

  return (
    <div
      className="rounded-[20px] p-5 flex flex-col gap-4"
      style={{ background: "var(--color-surface-card)", border: `1px solid var(--color-border-soft)` }}
    >
      <div>
        <h3 className="m-0 text-[18px] font-extrabold" style={{ color: textMain }}>
          편집
        </h3>
        <p className="mt-1 mb-0 text-[13px] leading-relaxed" style={{ color: textMuted }}>
          미리보기로 불러온 값은 여기서 바로 수정할 수 있습니다.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="flex flex-col gap-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.06em]" style={{ color: textMuted }}>
            제목
          </span>
          <input
            type="text"
            value={draft.title}
            onChange={(event) => onChange({ title: event.currentTarget.value })}
            style={inputStyle}
            placeholder="기사 제목"
            maxLength={180}
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.06em]" style={{ color: textMuted }}>
            출처
          </span>
          <input
            type="text"
            value={draft.source_name}
            onChange={(event) => onChange({ source_name: event.currentTarget.value })}
            style={inputStyle}
            placeholder="매체명"
            maxLength={80}
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.06em]" style={{ color: textMuted }}>
            발행일
          </span>
          <input
            type="date"
            value={draft.published_date}
            onChange={(event) => onChange({ published_date: event.currentTarget.value })}
            style={inputStyle}
          />
        </label>

        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.06em]" style={{ color: textMuted }}>
            원문 링크
          </span>
          <div className="min-h-[44px] flex items-center rounded-[10px] px-3" style={{ background: inputBg, border: `1px solid ${border}` }}>
            <span className="text-[13px] font-medium break-all" style={{ color: textMuted }}>
              상단 링크 입력란에서 수정됩니다.
            </span>
          </div>
        </div>
      </div>

      <label className="flex flex-col gap-2">
        <span className="text-[11px] font-bold uppercase tracking-[0.06em]" style={{ color: textMuted }}>
          요약
        </span>
        <textarea
          value={draft.summary}
          onChange={(event) => onChange({ summary: event.currentTarget.value })}
          style={textareaStyle}
          placeholder="카드에 표시될 짧은 설명"
          maxLength={280}
        />
      </label>
    </div>
  );
}

