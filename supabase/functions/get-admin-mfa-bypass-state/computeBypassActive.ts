// MFA 우회 활성 여부 판정(순수함수).
// is_active = enabled=true && (expires_at IS NULL[무기한] || expires_at > now).
// DB의 is_admin_mfa_bypassed() 와 동일 의미를 프론트/EF에서 재사용.
export function computeBypassActive(
  enabled: boolean,
  expiresAt: string | null,
  nowMs: number,
): boolean {
  if (!enabled) return false;
  if (expiresAt === null) return true;
  return new Date(expiresAt).getTime() > nowMs;
}
