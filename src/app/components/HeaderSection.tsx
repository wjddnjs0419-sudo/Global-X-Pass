import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import logoImg from "../../imports/Logo.png";
import { supabase } from "../../lib/supabaseClient";
import { useLanguage } from "../LanguageContext";
import { useTheme } from "../ThemeContext";
import { useAdmin } from "../../hooks/useAdmin";

type MenuKey = "resources" | "programs" | "news" | "support";

const MENUS: {
  key: MenuKey;
  label: string;
  items: { label: { ko: string; en: string }; path: string }[];
}[] = [
  {
    key: "resources",
    label: "Resources",
    items: [
      { label: { ko: "자료실", en: "Resources" }, path: "/resources" },
      { label: { ko: "블로그", en: "Blog" }, path: "/blog" },
      { label: { ko: "사업비 자료실", en: "Expense Center" }, path: "/expenses" },
    ],
  },
  {
    key: "programs",
    label: "Programs",
    items: [
      { label: { ko: "행사", en: "Events" }, path: "/events" },
      { label: { ko: "행사 아카이브", en: "Event Archive" }, path: "/events/archive" },
      { label: { ko: "1:1 컨설팅", en: "Consulting" }, path: "/consulting" },
      { label: { ko: "Founder's Club", en: "Founder's Club" }, path: "/founders-club" },
    ],
  },
  {
    key: "news",
    label: "News",
    items: [
      { label: { ko: "공지사항", en: "Notice" }, path: "/notice" },
      { label: { ko: "뉴스", en: "News" }, path: "/news" },
    ],
  },
  {
    key: "support",
    label: "Support",
    items: [
      { label: { ko: "자주 묻는 질문", en: "FAQ" }, path: "/faq" },
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
  const [session, setSession] = useState<{ user: { email?: string; id: string } } | null>(null);
  const { isAdmin } = useAdmin();
  const { isDark: themeDark, toggle: toggleTheme } = useTheme();

  const navigate = useNavigate();
  const location = useLocation();
  const { lang, toggleLang } = useLanguage();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    await supabase.auth.signOut();
    alert(lang === "ko" ? "안전하게 로그아웃 되었습니다." : "Logged out successfully.");
    navigate("/");
    setSidebarOpen(false);
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    if (location.pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const utilLinks = session
    ? [
        ...(isAdmin ? [{ label: "Admin", path: "/admin" }] : []),
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
  const headerBg = scrolled ? (isDark ? "rgba(10,16,32,0.82)" : "rgba(255,255,255,0.86)") : "transparent";
  const headerBorder = scrolled ? (isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.06)") : "1px solid transparent";

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-[1000] h-[72px] flex items-center px-[clamp(12px,3vw,32px)] font-['Pretendard',sans-serif] transition-colors duration-300 ease-out ${scrolled ? "backdrop-blur-[18px]" : ""}`}
        style={{ background: headerBg, borderBottom: headerBorder }}
        onMouseLeave={() => setOpenMenu(null)}
      >
        <button
          aria-label="메뉴 열기"
          onClick={() => setSidebarOpen(true)}
          className="w-[40px] h-[40px] rounded-[10px] flex items-center justify-center bg-transparent border-none cursor-pointer mr-[12px]"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={textColor} strokeWidth="2" strokeLinecap="round">
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        </button>

        <nav className="header-left-nav flex items-center gap-[4px] max-[900px]:hidden">
          {MENUS.map((m) => (
            <div key={m.key} onMouseEnter={() => setOpenMenu(m.key)} className="relative">
              <button className="bg-transparent border-none cursor-pointer px-[16px] py-[10px] font-['Pretendard',sans-serif] text-[14px] font-semibold tracking-[-0.01em] transition-colors duration-200 ease-in-out" style={{ color: textColor }}>
                {m.label}
              </button>
              {openMenu === m.key && (
                <div className="absolute top-[calc(100%+6px)] left-1/2 -translate-x-1/2 min-w-[160px] rounded-[12px] shadow-[0_12px_32px_rgba(0,0,0,0.18)] p-[8px] backdrop-blur-[20px]" style={{ background: isDark ? "rgba(16,22,42,0.96)" : "rgba(255,255,255,0.98)", border: `1px solid ${isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)"}` }}>
                  {m.items.map((it) => (
                    <Link key={it.path} to={it.path} onClick={() => setOpenMenu(null)} className="block px-[14px] py-[10px] rounded-[8px] text-[14px] font-medium no-underline transition-colors duration-150 ease-in-out" style={{ color: isDark ? "rgba(255,255,255,0.88)" : "rgba(10,16,32,0.82)" }} onMouseEnter={(e) => (e.currentTarget.style.background = isDark ? "rgba(32,214,162,0.12)" : "rgba(32,214,162,0.10)")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                      {it.label[lang]}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center pointer-events-none">
          <Link to="/" onClick={handleLogoClick} className="flex items-center no-underline cursor-pointer pointer-events-auto">
            <img src={logoImg} alt="로고" className="h-[24px] max-[640px]:h-[20px] w-auto object-contain transition-all duration-300 ease-in-out" style={{ filter: useLightText ? "brightness(0) invert(1)" : isDark ? "brightness(0) invert(1)" : "none" }} />
          </Link>
        </div>

        <div className="header-right-utils ml-auto flex items-center gap-[12px] max-[640px]:gap-[4px] relative z-[10]">
          <button
            onClick={toggleLang}
            className="flex items-center gap-[6px] max-[640px]:gap-[2px] px-[12px] py-[6px] max-[640px]:px-[6px] max-[640px]:py-[4px] rounded-[20px] bg-transparent text-[12px] max-[640px]:text-[10px] font-bold cursor-pointer transition-opacity duration-200"
            style={{ border: `1px solid ${textColorMuted}`, color: textColor }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.8")}
          >
            <span className="transition-opacity duration-200" style={{ opacity: lang === "ko" ? 1 : 0.4 }}>KO</span>
            <span className="opacity-40">|</span>
            <span className="transition-opacity duration-200" style={{ opacity: lang === "en" ? 1 : 0.4 }}>EN</span>
          </button>
          <button
            onClick={toggleTheme}
            aria-label="테마 전환"
            className="w-[40px] h-[40px] rounded-[10px] flex items-center justify-center bg-transparent border-none cursor-pointer"
          >
            {themeDark ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={textColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={textColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>

          <div className="flex gap-[6px] max-[900px]:hidden">
            {utilLinks.map((u) => (
              <Link key={u.label} to={u.path} onClick={u.isLogout ? handleLogout : undefined} className="px-[14px] py-[10px] text-[13px] font-semibold no-underline transition-colors duration-200 ease-in-out max-[640px]:px-[8px] max-[640px]:py-[8px] max-[640px]:text-[12px]" style={{ color: textColorMuted }} onMouseEnter={(e) => (e.currentTarget.style.color = textColor)} onMouseLeave={(e) => (e.currentTarget.style.color = textColorMuted)}>
                {u.label}
              </Link>
            ))}
          </div>
        </div>
      </header>

      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-[1100] bg-[rgba(5,8,20,0.55)] backdrop-blur-[4px] animate-[fadeIn_0.25s_ease]" />
      )}

      <aside className={`fixed top-0 left-0 bottom-0 w-[320px] z-[1200] shadow-[8px_0_40px_rgba(0,0,0,0.25)] flex flex-col font-['Pretendard',sans-serif] transition-transform duration-[350ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`} style={{ background: isDark ? "#0a1020" : "#ffffff" }}>
        <div className="h-[72px] px-[24px] flex items-center justify-between" style={{ borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}` }}>
          <Link to="/" onClick={() => setSidebarOpen(false)}>
            <img src={logoImg} alt="로고" className="h-[22px] object-contain" style={{ filter: isDark ? "brightness(0) invert(1)" : "none" }} />
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="w-[36px] h-[36px] rounded-[10px] bg-transparent border-none cursor-pointer flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isDark ? "rgba(255,255,255,0.85)" : "rgba(10,16,32,0.75)"} strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-[16px] py-[20px]">
          {MENUS.map((m) => (
            <div key={m.key} className="mb-[18px]">
              <div className="px-[12px] py-[6px] text-[12px] font-extrabold tracking-[0.08em] uppercase" style={{ color: isDark ? "rgba(190,255,249,0.75)" : "rgba(32,214,162,0.95)" }}>
                {m.label}
              </div>
              {m.items.map((it) => (
                <Link key={it.path} to={it.path} onClick={() => setSidebarOpen(false)} className="block px-[12px] py-[10px] rounded-[10px] text-[15px] font-semibold no-underline transition-colors duration-150 ease-in-out" style={{ color: isDark ? "rgba(255,255,255,0.9)" : "rgba(10,16,32,0.85)" }} onMouseEnter={(e) => (e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.06)" : "rgba(10,16,32,0.04)")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                  {it.label[lang]}
                </Link>
              ))}
            </div>
          ))}

          <div className="mt-[24px] pt-[20px] hidden max-[900px]:block" style={{ borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}` }}>
            <div className="px-[12px] py-[6px] text-[12px] font-extrabold tracking-[0.08em] uppercase" style={{ color: isDark ? "rgba(190,255,249,0.75)" : "rgba(32,214,162,0.95)" }}>
              ACCOUNT
            </div>
            {utilLinks.map((u) => (
              <Link key={u.label} to={u.path} onClick={(e) => { if(u.isLogout) handleLogout(e); else setSidebarOpen(false); }} className="block px-[12px] py-[10px] rounded-[10px] text-[15px] font-semibold no-underline transition-colors duration-150 ease-in-out" style={{ color: isDark ? "rgba(255,255,255,0.9)" : "rgba(10,16,32,0.85)" }} onMouseEnter={(e) => (e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.06)" : "rgba(10,16,32,0.04)")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                {u.label}
              </Link>
            ))}
          </div>
        </nav>
      </aside>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
      `}</style>
    </>
  );
}
