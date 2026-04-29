import { Navigate, Outlet } from "react-router";
import { useAdmin } from "../../hooks/useAdmin";

export function AdminRoute() {
  const { isAdmin, loading, mfaRequired } = useAdmin();

  if (loading) return null;
  
  // 1. Not an admin? Go home.
  if (!isAdmin) return <Navigate to="/" replace />;
  
  // 2. Admin but MFA challenge pending? Go to login to verify.
  if (mfaRequired) {
    // We don't want to alert here as it might trigger on every render.
    // LoginPage will handle the challenge UI.
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
