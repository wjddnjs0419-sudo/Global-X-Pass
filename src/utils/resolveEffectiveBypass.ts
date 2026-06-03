// MFA 우회가 실제로 적용되는지 판정. 우회가 켜져 있어도 슈퍼어드민은 무효화한다.
// 슈퍼어드민이 OTP를 통과해 AAL2에 도달해야 토글(noBypass)을 다시 끌 수 있어
// 무기한 우회 시 영구 락을 방지한다. ([[project_admin_mfa_bypass]])
export function resolveEffectiveBypass(bypassed: boolean, isSuperAdmin: boolean): boolean {
  return bypassed && !isSuperAdmin;
}

// 로그인 시 최종 우회 결정. RPC(`is_admin_mfa_bypassed`)가 활성일 때만 우회를 적용하되,
// 슈퍼어드민은 무효화한다. super 판정은 EF 가 아니라 클라(VITE_SUPER_ADMIN_UIDS + user.id,
// `isSuperAdminClient`)에서 오므로, EF 콜드스타트/실패가 일반 admin 우회를 깨뜨리지 않는다.
export function decideLoginBypass(input: {
  rpcBypassed: boolean;
  isSuperAdmin: boolean;
}): boolean {
  if (!input.rpcBypassed) return false;
  return resolveEffectiveBypass(true, input.isSuperAdmin);
}
