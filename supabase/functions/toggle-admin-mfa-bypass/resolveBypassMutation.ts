// MFA 우회 토글의 duration_days → DB 변이값 매핑(순수함수).
// -1 = 무기한(만료 없음), 0 = 해제, 1·3·7 = 해당 일수 후 만료.
// is_active 판정의 단일 진실원천: enabled=true && (expires_at IS NULL || expires_at > now()).
export type BypassMutation = {
  enabled: boolean;
  expiresAt: string | null;
  enabledAt: string | null;
};

export function resolveBypassMutation(days: number, now: Date): BypassMutation {
  if (days === -1) {
    return { enabled: true, expiresAt: null, enabledAt: now.toISOString() };
  }
  if (days <= 0) {
    return { enabled: false, expiresAt: null, enabledAt: null };
  }
  const expiresAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
  return { enabled: true, expiresAt, enabledAt: now.toISOString() };
}
