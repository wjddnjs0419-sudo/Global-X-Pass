import type { ReactNode } from "react";
import { LAYERS } from "../../../lib/layers";
import { useTheme } from "../../ThemeContext";

interface AdminConfirmModalProps {
  title: string;
  description: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: "primary" | "danger";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function AdminConfirmModal({
  title,
  description,
  confirmLabel,
  cancelLabel = "취소",
  tone = "primary",
  loading = false,
  onConfirm,
  onCancel,
}: AdminConfirmModalProps) {
  const { isDark } = useTheme();
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const textMain = isDark ? "rgba(255,255,255,0.92)" : "rgba(10,16,32,0.88)";
  const textMuted = isDark ? "rgba(255,255,255,0.45)" : "rgba(10,16,32,0.45)";
  const panelBg = "var(--color-bg-elevated)";
  const selectedBg = isDark ? "rgba(255,255,255,0.10)" : "rgba(15,23,42,0.07)";
  const dangerBg = isDark ? "rgba(234,67,53,0.10)" : "rgba(234,67,53,0.07)";
  const dangerBorder = isDark ? "rgba(234,67,53,0.30)" : "rgba(234,67,53,0.24)";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.46)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: LAYERS.modal,
        padding: 20,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          background: panelBg,
          padding: "30px 28px",
          borderRadius: 16,
          border: `1px solid ${border}`,
          textAlign: "center",
          maxWidth: 420,
          width: "100%",
          boxShadow: "0 18px 44px rgba(15,23,42,0.18)",
        }}
      >
        <h2 style={{ color: textMain, margin: "0 0 10px", fontSize: 20, fontWeight: 800 }}>
          {title}
        </h2>
        <div style={{ color: textMuted, marginBottom: 32, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
          {description}
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            style={{
              flex: 1,
              padding: 13,
              borderRadius: 10,
              border: tone === "danger" ? `1px solid ${dangerBorder}` : "none",
              background: tone === "danger" ? dangerBg : "var(--color-accent-blue)",
              color: tone === "danger" ? "var(--color-brand-red)" : "var(--color-on-primary)",
              fontWeight: 750,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.5 : 1,
              boxShadow: "none",
            }}
          >
            {loading ? "처리 중..." : confirmLabel}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            style={{
              flex: 1,
              padding: 13,
              borderRadius: 10,
              border: `1px solid ${border}`,
              background: selectedBg,
              color: textMain,
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: 700,
            }}
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
