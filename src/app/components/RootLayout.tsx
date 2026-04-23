import { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router";
import { useTheme } from "../ThemeContext";
import { HeaderSection } from "./HeaderSection";
import { FooterSection } from "./FooterSection"; 
import { DesignSystemPage } from "./DesignSystemPage";
import { supabase } from "../../lib/supabaseClient";
import { useTracker } from "../../hooks/useTracker";

const NAV_TABS = [
  { id: "site", label: "🌐 사이트 미리보기", path: "/" },
  { id: "design-system", label: "🎨 디자인 시스템", path: "/design-system" },
] as const;

export function RootLayout() {
  const { isDark, toggle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);

  // ✅ 실시간 방문자 추적 유지
  useTracker(); 

  // ✅ 관리자 인증 로직 유지
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAdmin(session?.user?.email === "admin@test.com");
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAdmin(session?.user?.email === "admin@test.com");
    });
    return () => subscription.unsubscribe();
  }, []);

  // 💡 레이아웃 조건 변수
  const isAdminPage = location.pathname.startsWith("/admin");
  const isDesignSystem = location.pathname === "/design-system";
  const currentTab = isDesignSystem ? "design-system" : "site";

  // 테마 스타일 설정
  const navBg = isDark ? "rgba(10,16,32,0.92)" : "rgba(255,255,255,0.94)";
  const navBorder = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.10)";
  const navShadow = isDark ? "0 8px 32px rgba(0,0,0,0.5)" : "0 8px 32px rgba(0,0,0,0.10)";
  const tabInactive = isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)";

  return (
    <div style={{
      width: "100%", minHeight: "100vh",
      background: isDark ? "#0a1020" : "#F7F8FC",
      display: "flex", flexDirection: "column",
    }}>
      {/* 💡 어드민 페이지가 아닐 때만 헤더 노출 */}
      {!isDesignSystem && !isAdminPage && <HeaderSection isDark={isDark} />}

      <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {isDesignSystem ? <DesignSystemPage isDark={isDark} /> : <Outlet />}
      </main>

      {/* 💡 어드민 페이지가 아닐 때만 푸터 노출 (사이드바 짤림 해결) */}
      {!isDesignSystem && !isAdminPage && <FooterSection isDark={isDark} />}

      {/* ── 개발자용 하단 내비게이션 (기능 유지) ── */}
      <nav className="dev-nav" style={{
        position: "fixed", bottom: "24px", left: "50%", transform: "translateX(-50%)",
        zIndex: 9999, display: "flex", gap: "6px", alignItems: "center",
        background: navBg, backdropFilter: "blur(20px)", border: `1px solid ${navBorder}`,
        borderRadius: "100px", padding: "6px", boxShadow: navShadow,
      }}>
        {isAdmin && NAV_TABS.map((tab) => (
          <button key={tab.id} onClick={() => navigate(tab.path)} style={{
            background: currentTab === tab.id ? "#4285F4" : "transparent",
            color: currentTab === tab.id ? "#fff" : tabInactive,
            border: "none", borderRadius: "100px", padding: "8px 18px",
            fontSize: "13px", fontWeight: 700, cursor: "pointer",
          }}> {tab.label} </button>
        ))}
        <button onClick={toggle} style={{
          width: "36px", height: "36px", borderRadius: "50%", border: "none",
          background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", cursor: "pointer",
        }}>
          {isDark ? "☀️" : "🌙"}
        </button>
      </nav>
    </div>
  );
}