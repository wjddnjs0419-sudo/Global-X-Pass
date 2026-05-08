import { useTheme } from "../../ThemeContext";
import { LAYERS } from "../../../lib/layers";

interface AdminPostModalProps {
  type: "save" | "delete";
  editingId: string | null;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function AdminPostModal({ type, editingId, loading, onConfirm, onCancel }: AdminPostModalProps) {
  const { isDark } = useTheme();
  const border   = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const textMain = isDark ? "rgba(255,255,255,0.92)" : "rgba(10,16,32,0.88)";
  const textMuted = isDark ? "rgba(255,255,255,0.45)" : "rgba(10,16,32,0.45)";
  const panelBg = isDark ? "#111827" : "#ffffff";
  const selectedBg = isDark ? "rgba(255,255,255,0.10)" : "rgba(15,23,42,0.07)";
  const dangerBg = isDark ? "rgba(234,67,53,0.10)" : "rgba(234,67,53,0.07)";
  const dangerBorder = isDark ? "rgba(234,67,53,0.30)" : "rgba(234,67,53,0.24)";

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.46)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: LAYERS.modal, padding: 20, boxSizing: "border-box" }}>
      <div style={{ background: panelBg, padding: "30px 28px", borderRadius: 16, border: `1px solid ${border}`, textAlign: "center", maxWidth: 400, width: "100%", boxShadow: "0 18px 44px rgba(15,23,42,0.18)" }}>
        <h2 style={{ color: textMain, margin: "0 0 10px", fontSize: 20, fontWeight: 800 }}>
          {type === "delete" ? "게시물 삭제" : editingId ? "변경사항 저장" : "새 게시물 등록"}
        </h2>
        <p style={{ color: textMuted, marginBottom: 32, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
          {type === "delete"
            ? "정말로 이 게시물을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다."
            : editingId ? "수정한 내용을 게시판에 즉시 적용하시겠습니까?" : "새 게시물을 즉시 등록하시겠습니까?"}
        </p>
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{ flex: 1, padding: 13, borderRadius: 10, border: type === "delete" ? `1px solid ${dangerBorder}` : "none", background: type === "delete" ? dangerBg : "#4377F1", color: type === "delete" ? "#EA4335" : "#fff", fontWeight: 750, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.5 : 1, boxShadow: "none" }}
          >
            {loading ? "처리 중..." : "확인"}
          </button>
          <button
            onClick={onCancel}
            disabled={loading}
            style={{ flex: 1, padding: 13, borderRadius: 10, border: `1px solid ${border}`, background: selectedBg, color: textMain, cursor: loading ? "not-allowed" : "pointer", fontWeight: 700 }}
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}
