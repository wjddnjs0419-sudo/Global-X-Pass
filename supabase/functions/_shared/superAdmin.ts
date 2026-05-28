/**
 * Super admin 식별 helper.
 * SUPER_ADMIN_UIDS 환경변수(쉼표 구분 UID 리스트)에 포함된 사용자만 super admin.
 * MFA bypass 토글 권한 게이팅 등 일부 EF에서만 사용.
 */

export function getSuperAdminUids(): string[] {
  const raw = Deno.env.get("SUPER_ADMIN_UIDS") ?? "";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function isSuperAdminUid(userId: string | null | undefined): boolean {
  if (!userId) return false;
  return getSuperAdminUids().includes(userId);
}
