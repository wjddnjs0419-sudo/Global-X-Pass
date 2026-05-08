import { Navigate, Outlet } from "react-router";
import { useAdmin } from "../../hooks/useAdmin";

export function AdminRoute() {
  const { isAdmin, loading, mfaRequired, mfaEnrolled } = useAdmin();

  // Navigate 대신 빈 div: Navigate는 초기 로드 시 /admin → / 리디렉트를 유발해 관리자 진입 자체를 막음
  if (loading) return <div aria-hidden style={{ visibility: "hidden" }} />;

  // 1. Not an admin? Go home.
  if (!isAdmin) return <Navigate to="/" replace />;

  // 2. Admin but MFA not enrolled? Force enrollment before granting access.
  if (!mfaEnrolled) {
    sessionStorage.setItem("mfa_setup_required", "true");
    return <Navigate to="/mypage" replace />;
  }

  // 3. Admin with MFA enrolled but challenge pending? Go to login to verify.
  if (mfaRequired) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
