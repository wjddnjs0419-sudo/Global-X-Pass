import { Outlet, useNavigate, useLocation } from "react-router";
import { useTheme } from "../ThemeContext";
import { HeaderSection } from "./HeaderSection";
import { FooterSection } from "./FooterSection";
import { DesignSystemPage } from "./DesignSystemPage";
import { useTracker } from "../../hooks/useTracker";
import { useAdmin } from "../../hooks/useAdmin";

const NAV_TABS = [
  { id: "site", label: "🌐 사이트 미리보기", path: "/" },
  { id: "admin", label: "📊 관리자 페이지", path: "/admin" },
  { id: "design-system", label: "🎨 디자인 시스템", path: "/design-system" },
] as const;

export function RootLayout() {
  const { isDark, toggle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useAdmin();

  useTracker();

  const isAdminPage = location.pathname.startsWith("/admin");
  const isDesignSystem = location.pathname === "/design-system";

  const currentTab = isDesignSystem
    ? "design-system"
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
