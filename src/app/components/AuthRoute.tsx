import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { supabase } from "../../lib/supabaseClient";

export function AuthRoute() {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    let mounted = true;

    const syncSession = (session: unknown) => {
      if (!mounted) return;
      setAuthenticated(Boolean(session));
      setLoading(false);
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      syncSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      syncSession(session);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (loading) return <div aria-hidden style={{ visibility: "hidden" }} />;

  if (!authenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }

  return <Outlet />;
}
