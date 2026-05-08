import { useTheme } from "../../ThemeContext";
import { LAYERS } from "../../../lib/layers";

interface PendingRoleChange {
  userId: string;
  newRole: string;
  targetName: string;
  currentRole: string;
}

interface AdminRoleModalProps {
  pendingRoleChange: PendingRoleChange;
  roleConfirmPassword: string;
  setRoleConfirmPassword: (v: string) => void;
  showRolePassword: boolean;
  setShowRolePassword: (v: boolean) => void;
  roleConfirmLoading: boolean;
  roleLabels: Record<string, string>;
  onConfirm: () => void;
  onCancel: () => void;
}

export function AdminRoleModal({
  pendingRoleChange,
  roleConfirmPassword,
  setRoleConfirmPassword,
  showRolePassword,
  setShowRolePassword,
  roleConfirmLoading,
  roleLabels,
  onConfirm,
  onCancel,
}: AdminRoleModalProps) {
  const { isDark } = useTheme();
  const border    = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const textMain  = isDark ? "rgba(255,255,255,0.92)" : "rgba(10,16,32,0.88)";
  const textMuted = isDark ? "rgba(255,255,255,0.45)" : "rgba(10,16,32,0.45)";
  const panelBg = isDark ? "#111827" : "#ffffff";
  const subtleBg = isDark ? "rgba(255,255,255,0.045)" : "rgba(15,23,42,0.035)";
  const selectedBg = isDark ? "rgba(255,255,255,0.10)" : "rgba(15,23,42,0.07)";
  const labelBorder = isDark ? "rgba(255,255,255,0.10)" : "rgba(15,23,42,0.09)";

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.46)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: LAYERS.modal, padding: 20, boxSizing: "border-box" }}>
      <div style={{ background: panelBg, padding: "30px 28px", borderRadius: 16, border: `1px solid ${border}`, maxWidth: 420, width: "100%", boxShadow: "0 18px 44px rgba(15,23,42,0.18)" }}>
        <div style={{ textAlign: "center", marginBottom: 22 }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "5px 10px", marginBottom: 12, borderRadius: 99, background: subtleBg, border: `1px solid ${labelBorder}`, color: textMuted, fontSize: 11, fontWeight: 800, letterSpacing: "0.04em" }}>권한 확인</div>
          <h2 style={{ color: textMain, margin: "0 0 10px", fontSize: 20, fontWeight: 800 }}>회원 권한 변경</h2>
          <div style={{ color: textMuted, fontSize: 13, lineHeight: 1.7, margin: 0, padding: "12px 14px", background: subtleBg, border: `1px solid ${labelBorder}`, borderRadius: 12 }}>
            <strong style={{ color: textMain }}>{pendingRoleChange.targetName}</strong>님의 역할을<br />
            <strong style={{ color: textMain }}>{roleLabels[pendingRoleChange.currentRole]}</strong>
            {" → "}
            <strong style={{ color: textMain }}>{roleLabels[pendingRoleChange.newRole]}</strong>으로 변경합니다.
          </div>
        </div>

        <p style={{ color: textMuted, fontSize: 13, marginBottom: 10 }}>본인 비밀번호를 입력해 변경을 승인하세요.</p>

        <div style={{ position: "relative", marginBottom: 20 }}>
          <input
            type={showRolePassword ? "text" : "password"}
            value={roleConfirmPassword}
            onChange={e => setRoleConfirmPassword(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") onConfirm(); }}
            placeholder="현재 비밀번호"
            autoFocus
            style={{ width: "100%", padding: "13px 44px 13px 14px", borderRadius: 10, border: `1px solid ${labelBorder}`, background: isDark ? "rgba(255,255,255,0.04)" : "#f8fafc", color: textMain, fontSize: 14, outline: "none", boxSizing: "border-box" }}
          />
          <button
            type="button"
            onClick={() => setShowRolePassword(!showRolePassword)}
            style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: textMuted, display: "flex", alignItems: "center", padding: 0 }}
          >
            {showRolePassword ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" x2="23" y2="23"/></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            )}
          </button>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={onConfirm}
            disabled={roleConfirmLoading || !roleConfirmPassword}
            style={{ flex: 1, padding: 13, borderRadius: 10, border: "none", background: "#4377F1", color: "#fff", fontWeight: 750, cursor: roleConfirmLoading || !roleConfirmPassword ? "not-allowed" : "pointer", opacity: roleConfirmLoading || !roleConfirmPassword ? 0.5 : 1, boxShadow: "none" }}
          >
            {roleConfirmLoading ? "확인 중..." : "변경 승인"}
          </button>
          <button
            onClick={onCancel}
            disabled={roleConfirmLoading}
            style={{ flex: 1, padding: 13, borderRadius: 10, border: `1px solid ${border}`, background: selectedBg, color: textMain, cursor: roleConfirmLoading ? "not-allowed" : "pointer", fontWeight: 700 }}
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}
