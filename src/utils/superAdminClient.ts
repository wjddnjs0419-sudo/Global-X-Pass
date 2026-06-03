// 클라이언트 측 super admin 판정. 서버 supabase/functions/_shared/superAdmin.ts 와 동일 로직.
// 우회 활성은 RPC(is_admin_mfa_bypassed)가 권위를 가지지만, "슈퍼어드민은 우회 무효화"
// 판정은 EF(get-admin-mfa-bypass-state) 없이도 가능해야 게이트가 EF 콜드스타트/실패에
// 묶이지 않는다(무기한 우회 시 일반 admin 로그인 루프 방지). UID 는 인증수단이 아니라
// 식별자일 뿐이며 실제 보안경계(토글 AAL2 강제·RLS)는 서버가 지키므로 클라 노출은 무해.
export function parseSuperAdminUids(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function isSuperAdminClient(
  userId: string | null | undefined,
  raw: string | undefined,
): boolean {
  if (!userId) return false;
  return parseSuperAdminUids(raw).includes(userId);
}
