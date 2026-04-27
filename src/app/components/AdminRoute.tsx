import { Navigate, Outlet } from "react-router";
import { useAdmin } from "../../hooks/useAdmin";

export function AdminRoute() {
  const { isAdmin, loading } = useAdmin();

  if (loading) return null;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <Outlet />;
}
