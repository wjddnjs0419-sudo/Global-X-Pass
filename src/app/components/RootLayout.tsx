import { Outlet, useNavigate, useLocation } from "react-router";
import { useEffect } from "react";
import { useTheme } from "../ThemeContext";
import { HeaderSection } from "./HeaderSection";
import { FooterSection } from "./FooterSection";
import { DesignSystemPage } from "./DesignSystemPage";
import { useTracker } from "../../hooks/useTracker";
import { useAdmin } from "../../hooks/useAdmin";
import { useIdleLogout } from "../../hooks/useIdleLogout";
import { supabase } from "../../lib/supabaseClient";

const NAV_TABS = [
  { id: "site",         label: "🌐 사이트 미리보기", path: "/" },
  { id: "admin",        label: "📊 관리자 페이지",   path: "/admin" },
  { id: "design-system",label: "🎨 디자인 시스템",   path: "/design-system" },
  { id: "flow-map",     label: "🗂 서비스 흐름도",    path: "/flow-map" },
] as const;

export function RootLayout() {
  const { isDark, toggle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useAdmin();

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

  const currentTab = isDesignSystem
    ? "design-system"
    : location.pathname.startsWith("/flow-map")
    ? "flow-map"
    : location.pathname.startsWith("/admin")
    ? "admin"
    : "site";

  const navBg = isDark ? "rgba(10,16,32,0.92)" : "rgba(255,255,255,0.94)";
  const navBorder = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.10)";
  const navShadow = isDark ? "0 8px 32px rgba(0,0,0,0.5)" : "0 8px 32px rgba(0,0,0,0.10)";
  const tabInactive = isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)";

  return (
    <div style={{ width: "100%", minHeight: "100dvh", background: isDark ? "#0a1020" : "#F7F8FC", display: "flex", flexDirection: "column", transition: "background 0.4s ease" }}>
      {!isDesignSystem && !isAdminPage && <HeaderSection isDark={isDark} />}

      <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {isDesignSystem ? <DesignSystemPage isDark={isDark} /> : <Outlet />}
      </main>

      {!isDesignSystem && <FooterSection isDark={isDark} />}

      {warningVisible && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 99999,
          background: "rgba(0,0,0,0.55)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            background: isDark ? "#1a2235" : "#ffffff",
            border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)"}`,
            borderRadius: 20, padding: "36px 40px",
            maxWidth: 400, width: "90%", textAlign: "center",
            boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
          }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: isDark ? "#fff" : "#0f172a", marginBottom: 10 }}>
              자동 로그아웃 안내
            </div>
            <div style={{ fontSize: 14, color: isDark ? "rgba(255,255,255,0.6)" : "rgba(15,23,42,0.6)", marginBottom: 28, lineHeight: 1.7 }}>
              30분 동안 활동이 감지되지 않았습니다.<br />계속 이용하시겠습니까?
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button onClick={extendSession} style={{
                padding: "11px 22px", borderRadius: 10, border: "none",
                background: "#4377F1", color: "#fff", fontWeight: 600,
                fontSize: 14, cursor: "pointer",
              }}>계속 사용하기</button>
              <button onClick={logout} style={{
                padding: "11px 22px", borderRadius: 10,
                border: `1px solid ${isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)"}`,
                background: "transparent",
                color: isDark ? "rgba(255,255,255,0.7)" : "rgba(15,23,42,0.6)",
                fontWeight: 600, fontSize: 14, cursor: "pointer",
              }}>로그아웃</button>
            </div>
          </div>
        </div>
      )}

      <nav className="fixed bottom-[24px] left-1/2 -translate-x-1/2 z-[9999] flex gap-[4px] sm:gap-[6px] items-center rounded-full p-[6px] w-[90%] max-w-max justify-center overflow-x-auto whitespace-nowrap scrollbar-hide" style={{
        background: navBg, backdropFilter: "blur(20px)", border: `1px solid ${navBorder}`,
        boxShadow: navShadow,
      }}>
        {isAdmin && NAV_TABS.map((tab) => (
          <button key={tab.id} onClick={() => navigate(tab.path)} className="border-none rounded-full px-[12px] py-[6px] sm:px-[18px] sm:py-[8px] text-[11px] sm:text-[13px] font-bold cursor-pointer transition-all duration-200 whitespace-nowrap flex-shrink-0" style={{
            background: currentTab === tab.id ? "#4285F4" : "transparent",
            color: currentTab === tab.id ? "#fff" : tabInactive,
          }}>
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
