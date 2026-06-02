import { Navigate, Outlet } from "react-router";
import { useAdmin, type UseAdminResult } from "../../hooks/useAdmin";
import { shouldGateAdminRender } from "../../hooks/adminGate";

export type AdminRouteContext = Pick<
  UseAdminResult,
  "isAdmin" | "aal" | "mfaRequired" | "mfaEnrolled" | "isSuperAdmin" | "mfaBypass" | "refreshBypassState"
>;

export function AdminRoute() {
  const gate = useAdmin();
  const { isAdmin, loading, mfaRequired, mfaEnrolled } = gate;

  // 초기 진입(아직 admin 미확정)에만 hidden 게이트로 라우팅 보류. 이미 admin 인 상태의 재검증
  // (bypass refocus 등)에는 화면을 유지해 unmount/재fetch 깜빡임을 막는다(강등은 커밋 후 아래 분기로 퇴출).
  // Navigate 대신 빈 div: Navigate는 초기 로드 시 /admin → / 리디렉트를 유발해 관리자 진입 자체를 막음.
  if (shouldGateAdminRender(loading, isAdmin)) return <div aria-hidden style={{ visibility: "hidden" }} />;

  // 1. Not an admin? Go home.
  if (!isAdmin) return <Navigate to="/" replace />;

  // 주의: loading && isAdmin(authoritative 재검증 중) 구간에는 위 게이트를 통과해 여기로 내려오며,
  // 이때 아래 mfaEnrolled/mfaRequired 분기는 직전 커밋된 스냅샷 기준으로 평가된다(라이브 아님).
  // 재검증이 끝나 commit 되면 loading 이 풀리고 갱신된 스냅샷으로 본 분기가 다시 판정된다.

  // 2. Admin but MFA not enrolled? Force enrollment before granting access.
  if (!mfaEnrolled) {
    sessionStorage.setItem("mfa_setup_required", "true");
    return <Navigate to="/mypage" replace />;
  }

  // 3. Admin with MFA enrolled but challenge pending? Go to login to verify.
  if (mfaRequired) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet context={gate satisfies AdminRouteContext} />;
}
