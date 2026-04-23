import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import logoImg from "../../imports/Logo.png";
import { supabase } from "../../lib/supabaseClient";

type MenuKey = "resources" | "programs" | "news" | "support";

const MENUS: { key: MenuKey; label: string; items: { label: string; path: string }[] }[] = [
  {
    key: "resources", label: "Resources",
    items: [
      { label: "자료실", path: "/resources" },
      { label: "블로그", path: "/blog" },
    ],
  },
  {
    key: "programs", label: "Programs",
    items: [
      { label: "행사", path: "/events" },
      { label: "행사 아카이브", path: "/events/archive" },
    ],
  },
  {
    key: "news", label: "News",
    items: [
      { label: "공지사항", path: "/notice" },
      { label: "뉴스", path: "/news" },
    ],
  },
  {
    key: "support", label: "Support",
    items: [
      { label: "FAQ", path: "/faq" },
    ],
  },
];

interface HeaderSectionProps {
  isDark?: boolean;
}

export function HeaderSection({ isDark = false }: HeaderSectionProps) {
  const [scrolled, setScrolled] = useState(false);
  const [openMenu, setOpenMenu] = useState<MenuKey | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [session, setSession] = useState<any>(null); 
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    await supabase.auth.signOut();
    alert("안전하게 로그아웃 되었습니다.");
    navigate("/");
    setSidebarOpen(false);
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    if (location.pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // 💡 관리자 계정일 때만 'Admin' 링크를 추가하도록 수정됨
  const utilLinks = session
    ? [
        ...(session.user?.email === "admin@test.com" ? [{ label: "Admin", path: "/admin" }] : []),
        { label: "Mypage", path: "/mypage" },
        { label: "Search", path: "/search" },
        { label: "Logout", path: "#", isLogout: true },
      ]
    : [
        { label: "Login", path: "/login" },
        { label: "Sign up", path: "/signup" },
        { label: "Search", path: "/search" },
      ];

  const useLightText = !scrolled;
  const textColor = useLightText ? "rgba(255,255,255,0.92)" : isDark ? "rgba(255,255,255,0.92)" : "rgba(10,16,32,0.88)";
  const textColorMuted = useLightText ? "rgba(255,255,255,0.7)" : isDark ? "rgba(255,255,255,0.7)" : "rgba(10,16,32,0.65)";
  const headerBg = scrolled
    ? isDark ? "rgba(10,16,32,0.82)" : "rgba(255,255,255,0.86)"
    : "transparent";
  const headerBorder = scrolled
    ? isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.06)"
    : "1px solid transparent";

  return (
    <>
      <header
        style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000, height: "72px",
          display: "flex", alignItems: "center", padding: "0 clamp(12px, 3vw, 32px)",
          background: headerBg, backdropFilter: scrolled ? "blur(18px)" : "none",
          borderBottom: headerBorder, transition: "background 0.3s ease, border-color 0.3s ease",
          fontFamily: "'Pretendard', sans-serif",
        }}
        onMouseLeave={() => setOpenMenu(null)}
      >
        <button
          aria-label="메뉴 열기"
          onClick={() => setSidebarOpen(true)}
          style={{ width: 40, height: 40, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "none", cursor: "pointer", marginRight: 12 }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={textColor} strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
        </button>

        <nav className="header-left-nav" style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {MENUS.map((m) => (
            <div key={m.key} onMouseEnter={() => setOpenMenu(m.key)} style={{ position: "relative" }}>
              <button style={{ background: "transparent", border: "none", cursor: "pointer", padding: "10px 16px", color: textColor, fontFamily: "'Pretendard', sans-serif", fontSize: 14, fontWeight: 600, letterSpacing: "-0.01em", transition: "color 0.2s ease" }}>{m.label}</button>
              {openMenu === m.key && (
                <div style={{ position: "absolute", top: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)", minWidth: 160, background: isDark ? "rgba(16,22,42,0.96)" : "rgba(255,255,255,0.98)", border: `1px solid ${isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)"}`, borderRadius: 12, boxShadow: "0 12px 32px rgba(0,0,0,0.18)", padding: 8, backdropFilter: "blur(20px)" }}>
                  {m.items.map((it) => (
                    <Link key={it.path} to={it.path} onClick={() => setOpenMenu(null)} style={{ display: "block", padding: "10px 14px", borderRadius: 8, color: isDark ? "rgba(255,255,255,0.88)" : "rgba(10,16,32,0.82)", fontSize: 14, fontWeight: 500, textDecoration: "none", transition: "background 0.15s ease" }} onMouseEnter={(e) => (e.currentTarget.style.background = isDark ? "rgba(32,214,162,0.12)" : "rgba(32,214,162,0.10)")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>{it.label}</Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", display: "flex", alignItems: "center" }}>
          <Link to="/" onClick={handleLogoClick} style={{ display: "flex", alignItems: "center", textDecoration: "none", cursor: "pointer" }}>
            <img src={logoImg} alt="로고" style={{ height: 24, width: "auto", objectFit: "contain", filter: useLightText ? "brightness(0) invert(1)" : isDark ? "brightness(0) invert(1)" : "none", transition: "filter 0.3s ease" }} />
          </Link>
        </div>

        <div className="header-right-utils" style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
          {utilLinks.map((u) => (
            <Link key={u.label} to={u.path} onClick={u.isLogout ? handleLogout : undefined} style={{ padding: "10px 14px", color: textColorMuted, fontSize: 13, fontWeight: 600, textDecoration: "none", transition: "color 0.2s ease" }} onMouseEnter={(e) => (e.currentTarget.style.color = textColor)} onMouseLeave={(e) => (e.currentTarget.style.color = textColorMuted)}>{u.label}</Link>
          ))}
        </div>
      </header>

      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 1100, background: "rgba(5,8,20,0.55)", backdropFilter: "blur(4px)", animation: "fadeIn 0.25s ease" }} />}

      <aside style={{ position: "fixed", top: 0, left: 0, bottom: 0, width: 320, zIndex: 1200, background: isDark ? "#0a1020" : "#ffffff", boxShadow: "8px 0 40px rgba(0,0,0,0.25)", transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)", transition: "transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)", display: "flex", flexDirection: "column", fontFamily: "'Pretendard', sans-serif" }}>
        <div style={{ height: 72, padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}` }}>
          <Link to="/" onClick={() => setSidebarOpen(false)}><img src={logoImg} alt="로고" style={{ height: 22, filter: isDark ? "brightness(0) invert(1)" : "none", objectFit: "contain" }} /></Link>
          <button onClick={() => setSidebarOpen(false)} style={{ width: 36, height: 36, borderRadius: 10, background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isDark ? "rgba(255,255,255,0.85)" : "rgba(10,16,32,0.75)"} strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg></button>
        </div>
        <nav style={{ flex: 1, overflowY: "auto", padding: "20px 16px" }}>
          {MENUS.map((m) => (
            <div key={m.key} style={{ marginBottom: 18 }}>
              <div style={{ padding: "6px 12px", color: isDark ? "rgba(190,255,249,0.75)" : "rgba(32,214,162,0.95)", fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" }}>{m.label}</div>
              {m.items.map((it) => (
                <Link key={it.path} to={it.path} onClick={() => setSidebarOpen(false)} style={{ display: "block", padding: "10px 12px", borderRadius: 10, color: isDark ? "rgba(255,255,255,0.9)" : "rgba(10,16,32,0.85)", fontSize: 15, fontWeight: 600, textDecoration: "none", transition: "background 0.15s ease" }} onMouseEnter={(e) => (e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.06)" : "rgba(10,16,32,0.04)")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>{it.label}</Link>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @media (max-width: 900px) { .header-left-nav { display: none !important; } }
        @media (max-width: 640px) { .header-right-utils a { padding: 8px 8px !important; font-size: 12px !important; } }
      `}</style>
    </>
  );
}