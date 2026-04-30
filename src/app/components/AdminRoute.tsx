import { Navigate, Outlet } from "react-router";
import { useAdmin } from "../../hooks/useAdmin";

export function AdminRoute() {
  const { isAdmin, loading, mfaRequired, mfaEnrolled } = useAdmin();

  if (loading) return null;

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
