import { Outlet, useNavigate, useLocation, Navigate } from "react-router";
import { useEffect } from "react";
import { useTheme } from "../ThemeContext";
import { HeaderSection } from "./HeaderSection";
import { FooterSection } from "./FooterSection";
import { DesignSystemPage } from "./DesignSystemPage";
import { ErrorBoundary } from "./ErrorBoundary";
import { useTracker } from "../../hooks/useTracker";
import { useAdmin } from "../../hooks/useAdmin";
import { useIdleLogout } from "../../hooks/useIdleLogout";
import { supabase } from "../../lib/supabaseClient";
import { LAYERS } from "../../lib/layers";
import { logError, guessSourceFromStack } from "../../lib/errorLogger";
import { installUxHealthChecks } from "../../lib/uxHealth";

export function RootLayout() {
  const { isDark, toggle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin, loading: adminLoading, mfaRequired, mfaEnrolled } = useAdmin();

  useTracker();
  const { warningVisible, extendSession, logout } = useIdleLogout();

  // 브라우저/탭 닫히는 순간 시간 기록 (두 이벤트 모두 등록해서 안정성 확보)
  useEffect(() => {
    const save = () => localStorage.setItem("gxp_last_active", Date.now().toString());
    window.addEventListener("pagehide", save);
    window.addEventListener("beforeunload", save);
    return () => {
      window.removeEventListener("pagehide", save);
      window.removeEventListener("beforeunload", save);
    };
  }, []);

  // 글로벌 에러 핸들러: React 외부에서 발생한 런타임 에러 + unhandled promise rejection 수집
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      const error = event.error instanceof Error ? event.error : new Error(event.message);
      const source = guessSourceFromStack(error.stack);
      void logError(source, error, {
        severity: "high",
        context: { kind: "window.onerror", filename: event.filename, line: event.lineno, col: event.colno },
      });
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const error = reason instanceof Error ? reason : new Error(String(reason));
      const source = guessSourceFromStack(error.stack);
      void logError(source, error, {
        severity: "high",
        context: { kind: "unhandledrejection" },
      });
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  useEffect(() => installUxHealthChecks(), []);

  // 재방문 시 30분 이상 지났으면 자동 로그아웃
  useEffect(() => {
    const STALE_MS = 30 * 60 * 1000;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      const last = localStorage.getItem("gxp_last_active");
      if (last && Date.now() - parseInt(last) > STALE_MS) {
        supabase.auth.signOut().then(() => {
          localStorage.removeItem("gxp_last_active");
          navigate("/");
        });
      }
    });
  }, [navigate]);

  const isAdminPage = location.pathname.startsWith("/admin");
  const isDesignSystem = location.pathname === "/design-system";

  return (
    <div style={{ width: "100%", minHeight: "100dvh", background: "var(--color-bg-surface)", display: "flex", flexDirection: "column", transition: "background 0.4s ease" }}>
      {!isDesignSystem && !isAdminPage && <HeaderSection isDark={isDark} />}

      <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <ErrorBoundary>
          {isDesignSystem
            ? (!adminLoading && isAdmin && !mfaRequired && mfaEnrolled ? <DesignSystemPage isDark={isDark} /> : (!adminLoading ? <Navigate to="/" replace /> : null))
            : <Outlet />}
        </ErrorBoundary>
      </main>

      {!isDesignSystem && <FooterSection isDark={isDark} />}

      {warningVisible && (
        <div style={{
          position: "fixed", inset: 0, zIndex: LAYERS.blockingModal,
          background: "var(--color-backdrop)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            background: "var(--color-bg-overlay)",
            border: `1px solid var(--color-glass-border-strong)`,
            borderRadius: 20, padding: "36px 40px",
            maxWidth: 400, width: "90%", textAlign: "center",
            boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
          }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 10 }}>
              자동 로그아웃 안내
            </div>
            <div style={{ fontSize: 14, color: "var(--color-text-secondary)", marginBottom: 28, lineHeight: 1.7 }}>
              30분 동안 활동이 감지되지 않았습니다.<br />계속 이용하시겠습니까?
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button onClick={extendSession} style={{
                padding: "11px 22px", borderRadius: 10, border: "none",
                background: "var(--color-accent-blue)", color: "var(--color-on-primary)", fontWeight: 600,
                fontSize: 14, cursor: "pointer",
              }}>계속 사용하기</button>
              <button onClick={logout} style={{
                padding: "11px 22px", borderRadius: 10,
                border: `1px solid var(--color-glass-border-strong)`,
                background: "transparent",
                color: "var(--color-text-secondary)",
                fontWeight: 600, fontSize: 14, cursor: "pointer",
              }}>로그아웃</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
