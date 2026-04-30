import { useTheme } from "../../ThemeContext";

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

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }}>
      <div style={{ background: isDark ? "#1e293b" : "#fff", padding: "40px 32px", borderRadius: 24, textAlign: "center", maxWidth: 400, width: "90%", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
        <h2 style={{ color: textMain, marginBottom: 12, fontSize: 22 }}>
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
            style={{ flex: 1, padding: 14, borderRadius: 12, border: "none", background: type === "delete" ? "#ff4d4f" : "#4377F1", color: "#fff", fontWeight: 700, cursor: "pointer", opacity: loading ? 0.5 : 1 }}
          >
            {loading ? "처리 중..." : "확인"}
          </button>
          <button
            onClick={onCancel}
            disabled={loading}
            style={{ flex: 1, padding: 14, borderRadius: 12, border: `1px solid ${border}`, background: "none", color: textMain, cursor: "pointer" }}
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}
