import { X } from "lucide-react";
import type { ReactNode, CSSProperties } from "react";
import { LAYERS } from "../../lib/layers";

const modalCloseButtonStyle = {
  position: "absolute",
  top: "var(--space-md)",
  right: "var(--space-md)",
  width: "var(--size-event-application-action-sm, 36px)",
  height: "var(--size-event-application-action-sm, 36px)",
  borderRadius: "50%",
  border: "1px solid var(--color-border-soft)",
  background: "var(--color-field-bg)",
  color: "var(--color-text-muted)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  zIndex: 1,
} as const;

interface ModalShellProps {
  onClose: () => void;
  children: ReactNode;
  /** 우상단 둥근 X 닫기 버튼 표시 (예약/신청 완료 화면용) */
  showCloseButton?: boolean;
  maxWidth?: number;
}

/** 모달 공용 셸: 백드롭 + 카드 + (옵션) 우상단 닫기 버튼. 본문은 children으로 주입. */
export function ModalShell({ onClose, children, showCloseButton = false, maxWidth = 500 }: ModalShellProps) {
  return (
    <div
      style={{ position: "fixed", inset: 0, background: "var(--color-backdrop)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: LAYERS.modal, padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ position: "relative", background: "var(--color-bg-elevated)", borderRadius: 24, padding: "36px 32px", width: "100%", maxWidth, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 60px rgba(0,0,0,0.25)" }}>
        {showCloseButton && (
          <button type="button" aria-label="모달 닫기" onClick={onClose} style={modalCloseButtonStyle}>
            <X size={16} />
          </button>
        )}
        {children}
      </div>
    </div>
  );
}

/** 모달 내부 입력 필드 공용 스타일 (textarea/input). */
export function getModalFieldStyle(isDark: boolean): CSSProperties {
  const border = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)";
  const textMain = isDark ? "rgba(255,255,255,0.92)" : "#0f172a";
  const inputBg = isDark ? "rgba(255,255,255,0.06)" : "#fff";
  return { padding: "11px 14px", borderRadius: 10, background: inputBg, border: `1px solid ${border}`, color: textMain, outline: "none", width: "100%", boxSizing: "border-box", fontSize: 14, fontFamily: "inherit" };
}
