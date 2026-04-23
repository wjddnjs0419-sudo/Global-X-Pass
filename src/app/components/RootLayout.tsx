import { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router";
import { useTheme } from "../ThemeContext";
import { HeaderSection } from "./HeaderSection";
import { FooterSection } from "./FooterSection"; // 💡 새로 만든 푸터 불러오기
import { DesignSystemPage } from "./DesignSystemPage";
import { supabase } from "../../lib/supabaseClient";

const NAV_TABS = [
  { id: "site", label: "🌐 사이트 미리보기", path: "/" },
  { id: "design-system", label: "🎨 디자인 시스템", path: "/design-system" },
] as const;

export function RootLayout() {
  const { isDark, toggle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAdmin(session?.user?.email === "admin@test.com");
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAdmin(session?.user?.email === "admin@test.com");
    });

    return () => subscription.unsubscribe();
  }, []);

  const isDesignSystem = location.pathname === "/design-system";
  const currentTab = isDesignSystem ? "design-system" : "site";

  const navBg = isDark ? "rgba(10,16,32,0.92)" : "rgba(255,255,255,0.94)";
  const navBorder = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.10)";
  const navShadow = isDark ? "0 8px 32px rgba(0,0,0,0.5)" : "0 8px 32px rgba(0,0,0,0.10)";
  const tabInactive = isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)";

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh", // 화면 최소 높이를 100%로 설정
        background: isDark ? "#0a1020" : "#F7F8FC",
        transition: "background 0.4s ease",
        display: "flex",
        flexDirection: "column", // 💡 푸터를 맨 아래로 밀어내기 위한 설정
      }}
    >
      {/* Fixed site header */}
      {!isDesignSystem && <HeaderSection isDark={isDark} />}

      {/* Page content (flex: 1을 주어 내용이 짧아도 푸터가 하단에 붙게 만듭니다) */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {isDesignSystem ? <DesignSystemPage isDark={isDark} /> : <Outlet />}
      </main>

      {/* 💡 방금 만든 하단 푸터 (디자인 시스템 페이지가 아닐 때만 노출) */}
      {!isDesignSystem && <FooterSection isDark={isDark} />}

      {/* ── Dev Nav (always visible) ── */}
      <nav
        className="dev-nav"
        style={{
          position: "fixed", bottom: "24px", left: "50%", transform: "translateX(-50%)",
          zIndex: 9999, display: "flex", gap: "6px", alignItems: "center",
          background: navBg, backdropFilter: "blur(20px)", border: `1px solid ${navBorder}`,
          borderRadius: "100px", padding: "6px", boxShadow: navShadow,
          maxWidth: "calc(100vw - 24px)", flexWrap: "wrap", justifyContent: "center",
        }}
      >
        <style>{`
          @media (max-width: 480px) {
            .dev-nav button { padding: 6px 12px !important; font-size: 12px !important; }
          }
        `}</style>
        
        {isAdmin && (
          <>
            {NAV_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => navigate(tab.path)}
                style={{
                  background: currentTab === tab.id ? "#4285F4" : "transparent",
                  color: currentTab === tab.id ? "#fff" : tabInactive,
                  border: "none", borderRadius: "100px", padding: "8px 18px",
                  fontSize: "13px", fontWeight: 700, cursor: "pointer",
                  transition: "all 0.2s ease", fontFamily: "'Pretendard', sans-serif",
                }}
              >
                {tab.label}
              </button>
            ))}
            <div style={{ width: "1px", height: "22px", background: navBorder, margin: "0 2px" }} />
          </>
        )}

        <button
          onClick={toggle}
          title={isDark ? "라이트 모드로 전환" : "다크 모드로 전환"}
          style={{
            width: "36px", height: "36px", borderRadius: "50%", border: "none",
            background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.2s ease", flexShrink: 0,
          }}
        >
          {isDark ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
            </svg>
          ) : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>
      </nav>
    </div>
  );
}