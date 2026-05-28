import { useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import type { AdminMfaBypassState } from "../../../hooks/useAdmin";

type AdminMfaBypassPanelProps = {
  isSuperAdmin: boolean;
  bypass: AdminMfaBypassState | null;
  onChanged: () => Promise<void> | void;
};

type DurationOption = 0 | 1 | 3 | 7;

const DURATION_OPTIONS: { value: DurationOption; label: string }[] = [
  { value: 0, label: "안 함" },
  { value: 1, label: "1일" },
  { value: 3, label: "3일" },
  { value: 7, label: "7일" },
];

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

export function AdminMfaBypassPanel({ isSuperAdmin, bypass, onChanged }: AdminMfaBypassPanelProps) {
  const [selected, setSelected] = useState<DurationOption>(0);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hoveredOption, setHoveredOption] = useState<DurationOption | null>(null);
  const [submitHover, setSubmitHover] = useState(false);

  if (!isSuperAdmin) return null;

  const isActive = Boolean(bypass?.is_active);

  const handleSubmit = async () => {
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const { data, error } = await supabase.functions.invoke("toggle-admin-mfa-bypass", {
        body: { duration_days: selected, reason: reason.trim() || null },
      });
      if (error) {
        setErrorMsg(error.message || "토글 변경에 실패했습니다.");
      } else if (data?.error) {
        setErrorMsg(data.error);
      } else {
        setReason("");
        setSelected(0);
        await onChanged();
      }
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "토글 변경 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      style={{
        borderRadius: 16,
        padding: "20px 22px",
        background: "var(--color-bg-elevated)",
        border: "1px solid var(--color-border-subtle)",
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>MFA 우회 토글 (Super Admin)</h3>
          <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-muted)" }}>
            일정 기간 동안 다른 어드민의 MFA(2차 인증) 요구를 임시로 우회합니다. 만료 시각이 지나면 자동으로 다시 강제됩니다.
          </p>
        </div>
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            padding: "4px 10px",
            borderRadius: 999,
            background: isActive ? "rgba(239,68,68,0.12)" : "rgba(16,185,129,0.12)",
            color: isActive ? "#ef4444" : "#10b981",
          }}
        >
          {isActive ? "우회 활성" : "정상 (MFA 강제)"}
        </span>
      </header>

      {bypass && (
        <div style={{ fontSize: 12, color: "var(--color-text-muted)", display: "flex", flexDirection: "column", gap: 2 }}>
          <span>현재 만료: {formatExpiresAt(bypass.expires_at)}</span>
          <span>활성화 시각: {formatExpiresAt(bypass.enabled_at)}</span>
          {bypass.enabled_by_email && <span>활성화한 super admin: {bypass.enabled_by_email}</span>}
          {bypass.reason && <span>사유: {bypass.reason}</span>}
        </div>
      )}

      <div role="radiogroup" aria-label="MFA 우회 기간" style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {DURATION_OPTIONS.map((opt) => {
          const checked = selected === opt.value;
          const hovered = hoveredOption === opt.value && !submitting;
          const borderColor = checked
            ? "var(--color-accent-blue)"
            : hovered
              ? "var(--color-accent-blue-soft-border-strong)"
              : "var(--color-border-subtle)";
          const background = checked
            ? "var(--color-accent-blue-soft-bg)"
            : hovered
              ? "var(--color-accent-blue-soft-bg-hover)"
              : "transparent";
          const textColor = checked ? "var(--color-accent-blue)" : "var(--color-text-primary)";
          return (
            <label
              key={opt.value}
              onMouseEnter={() => setHoveredOption(opt.value)}
              onMouseLeave={() => setHoveredOption((prev) => (prev === opt.value ? null : prev))}
              style={{
                cursor: submitting ? "not-allowed" : "pointer",
                padding: "8px 14px",
                borderRadius: 999,
                border: `1.5px solid ${borderColor}`,
                background,
                color: textColor,
                fontSize: 13,
                fontWeight: checked ? 700 : 500,
                opacity: submitting ? 0.6 : 1,
                boxShadow: checked ? "0 0 0 3px var(--color-accent-blue-soft-bg)" : "none",
                transition: "background 120ms ease, border-color 120ms ease, box-shadow 120ms ease, color 120ms ease",
              }}
            >
              <input
                type="radio"
                name="mfa-bypass-duration"
                value={opt.value}
                checked={checked}
                onChange={() => setSelected(opt.value)}
                disabled={submitting}
                style={{ display: "none" }}
              />
              {opt.label}
            </label>
          );
        })}
      </div>

      <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12 }}>
        <span>사유 (선택)</span>
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="예) 행사 진행으로 임시 우회"
          maxLength={200}
          disabled={submitting}
          style={{
            padding: "8px 12px",
            borderRadius: 10,
            border: "1px solid var(--color-border-subtle)",
            background: "var(--color-bg-surface)",
            color: "var(--color-text-primary)",
            fontSize: 13,
          }}
        />
      </label>

      {errorMsg && (
        <p style={{ margin: 0, fontSize: 12, color: "#ef4444" }}>{errorMsg}</p>
      )}

      <div>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          onMouseEnter={() => setSubmitHover(true)}
          onMouseLeave={() => setSubmitHover(false)}
          style={{
            padding: "10px 18px",
            borderRadius: 12,
            border: "none",
            background: submitting
              ? "var(--color-disabled-bg)"
              : submitHover
                ? "var(--color-accent-blue-hover)"
                : "var(--color-accent-blue)",
            color: "var(--color-on-primary)",
            fontSize: 13,
            fontWeight: 600,
            cursor: submitting ? "not-allowed" : "pointer",
            opacity: submitting ? 0.6 : 1,
            boxShadow: submitting ? "none" : "var(--shadow-primary)",
            transition: "background 120ms ease, box-shadow 120ms ease",
          }}
        >
          {submitting ? "적용 중…" : "적용"}
        </button>
      </div>
    </section>
  );
}

export default AdminMfaBypassPanel;
