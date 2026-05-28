import type { AdminMfaBypassState } from "../../../hooks/useAdmin";

type AdminMfaBypassBannerProps = {
  bypass: AdminMfaBypassState | null;
  isSuperAdmin: boolean;
};

function formatExpiresAt(iso: string | null): string {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function AdminMfaBypassBanner({ bypass, isSuperAdmin }: AdminMfaBypassBannerProps) {
  if (!isSuperAdmin) return null;
  if (!bypass?.is_active) return null;

  return (
    <div
      role="status"
      style={{
        marginBottom: 18,
        padding: "10px 14px",
        borderRadius: 12,
        background: "rgba(239,68,68,0.12)",
        border: "1px solid rgba(239,68,68,0.4)",
        color: "#ef4444",
        fontSize: 13,
        fontWeight: 600,
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 8,
      }}
    >
      <span aria-hidden>⚠</span>
      <span>MFA 우회 활성중</span>
      <span style={{ fontWeight: 500 }}>— 만료: {formatExpiresAt(bypass.expires_at)}</span>
      {bypass.enabled_by_email && (
        <span style={{ fontWeight: 500 }}>(활성화: {bypass.enabled_by_email})</span>
      )}
    </div>
  );
}

export default AdminMfaBypassBanner;
