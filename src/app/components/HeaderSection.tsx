import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import logoImg from "../../imports/Logo.png";
import { supabase } from "../../lib/supabaseClient";
import { useLanguage } from "../LanguageContext";
import { useTheme } from "../ThemeContext";
import { useAdmin } from "../../hooks/useAdmin";
import { LAYERS } from "../../lib/layers";
import { DESKTOP_MAIN_MENUS, SIDEBAR_MAIN_MENUS, type MenuKey } from "../navigation/mainMenu";

interface HeaderSectionProps {
  isDark?: boolean;
}

export function HeaderSection({ isDark = false }: HeaderSectionProps) {
  const [scrolled, setScrolled] = useState(false);
  const [openMenu, setOpenMenu] = useState<MenuKey | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [session, setSession] = useState<{ user: { email?: string; id: string } } | null>(null);
  const menuToggleRef = useRef<HTMLButtonElement | null>(null);
  const desktopMenuButtonRefs = useRef<Partial<Record<MenuKey, HTMLButtonElement | null>>>({});
  const sidebarRef = useRef<HTMLElement | null>(null);
  const sidebarCloseButtonRef = useRef<HTMLButtonElement | null>(null);
  const prevSidebarOpenRef = useRef(false);
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

  useEffect(() => {
    const wasSidebarOpen = prevSidebarOpenRef.current;
    prevSidebarOpenRef.current = sidebarOpen;

    if (!sidebarOpen) {
      if (wasSidebarOpen) {
        menuToggleRef.current?.focus();
      }
      return;
    }

    const rafId = window.requestAnimationFrame(() => {
      sidebarCloseButtonRef.current?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setSidebarOpen(false);
        return;
      }

      if (event.key !== "Tab") return;

      const panel = sidebarRef.current;
      if (!panel) return;

      const focusables = Array.from(
        panel.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'),
      ).filter((element) => element.offsetParent !== null);

      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [sidebarOpen]);

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

  const textColor      = !scrolled || isDark ? "var(--header-text)"       : "var(--header-text-on-light)";
  const textColorMuted = !scrolled || isDark ? "var(--header-text-muted)" : "var(--header-text-on-light-muted)";
  const headerBg       = scrolled ? "var(--header-bg-scrolled)" : "transparent";
  const headerBorder   = scrolled ? "1px solid var(--header-border-scrolled)" : "1px solid transparent";
  const menuBorder     = "var(--header-menu-border)";
  const menuSelectedBg = "var(--header-menu-hover)";
  const sidebarText    = "var(--header-sidebar-text)";
  const sidebarSection = "var(--header-sidebar-section)";

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 h-[72px] px-[clamp(12px,3vw,32px)] font-['Pretendard',sans-serif] transition-colors duration-300 ease-out ${scrolled ? "backdrop-blur-[18px]" : ""}`}
        style={{ zIndex: LAYERS.header, background: headerBg, borderBottom: headerBorder }}
        onMouseLeave={() => setOpenMenu(null)}
      >
        <div className="grid h-full w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-[8px] min-[380px]:gap-[10px] md:gap-[16px]">
          <div className="flex min-w-0 items-center justify-start gap-[10px] md:gap-[14px]">
            <button
              aria-label="메뉴 열기"
              ref={menuToggleRef}
              onClick={() => setSidebarOpen(true)}
              className="h-[38px] w-[38px] shrink-0 rounded-[10px] border-none bg-transparent flex items-center justify-center cursor-pointer md:h-[40px] md:w-[40px]"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={textColor} strokeWidth="2" strokeLinecap="round">
                <path d="M3 6h18M3 12h18M3 18h18" />
              </svg>
            </button>

            <nav className="header-left-nav hidden min-w-0 items-center gap-[4px] xl:flex">
              {DESKTOP_MAIN_MENUS.map((m) => (
                <div
                  key={m.key}
                  className="relative"
                  onMouseEnter={() => setOpenMenu(m.key)}
                  onFocusCapture={() => setOpenMenu(m.key)}
                  onBlurCapture={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                      setOpenMenu(null);
                    }
                  }}
                >
                  <button
                    type="button"
                    ref={(element) => {
                      desktopMenuButtonRefs.current[m.key] = element;
                    }}
                    aria-controls={`desktop-nav-${m.key}`}
                    aria-expanded={openMenu === m.key}
                    onClick={() => setOpenMenu((current) => (current === m.key ? null : m.key))}
                    onKeyDown={(event) => {
                      if (event.key === "Escape") {
                        event.preventDefault();
                        setOpenMenu(null);
                        event.currentTarget.focus();
                      }
                    }}
                    className="border-none bg-transparent cursor-pointer px-[16px] py-[10px] font-['Pretendard',sans-serif] text-[14px] font-semibold tracking-[-0.01em] transition-colors duration-200 ease-in-out"
                    style={{ color: textColor }}
                  >
                    {m.label}
                  </button>
                  {openMenu === m.key && (
                    <div
                      id={`desktop-nav-${m.key}`}
                      aria-label={`${m.label} 메뉴`}
                      onKeyDown={(event) => {
                        if (event.key === "Escape") {
                          event.preventDefault();
                          setOpenMenu(null);
                          desktopMenuButtonRefs.current[m.key]?.focus();
                        }
                      }}
                      className="absolute left-1/2 top-[calc(100%+6px)] min-w-[160px] -translate-x-1/2 rounded-[14px] p-[8px] backdrop-blur-[20px]"
                      style={{ background: "var(--header-dropdown-bg)", border: `1px solid ${menuBorder}`, boxShadow: "var(--header-dropdown-shadow)" }}
                    >
                      {m.items.map((it) => (
                        <Link
                          key={it.path}
                          to={it.path}
                          onClick={() => setOpenMenu(null)}
                          className="block rounded-[8px] px-[14px] py-[10px] text-[14px] font-medium no-underline transition-colors duration-150 ease-in-out"
                          style={{ color: "var(--header-dropdown-text)" }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = menuSelectedBg)}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          {it.label[lang]}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </div>

          <div className="flex min-w-0 items-center justify-center px-[4px] min-[380px]:px-[8px]">
            <Link to="/" onClick={handleLogoClick} className="flex max-w-full items-center no-underline cursor-pointer">
              <img
                src={logoImg}
                alt="로고"
                className="h-[18px] max-w-[140px] w-auto object-contain transition-all duration-300 ease-in-out min-[380px]:h-[19px] min-[380px]:max-w-[160px] sm:h-[20px] sm:max-w-[190px] md:h-[22px] md:max-w-[230px] xl:h-[24px] xl:max-w-[280px]"
                style={{ filter: !scrolled || isDark ? "brightness(0) invert(1)" : "none" }}
              />
            </Link>
          </div>

          <div className="header-right-utils relative z-[10] flex min-w-0 items-center justify-end gap-[4px] min-[380px]:gap-[6px] md:gap-[10px] xl:gap-[12px]">
            <button
              onClick={toggleLang}
              className="flex items-center gap-[2px] rounded-[18px] bg-transparent px-[4px] py-[4px] text-[9px] font-bold cursor-pointer transition-opacity duration-200 min-[380px]:gap-[4px] min-[380px]:px-[6px] min-[380px]:text-[10px] sm:px-[8px] sm:py-[5px] sm:text-[11px] md:gap-[6px] md:px-[10px] md:py-[6px] md:text-[12px]"
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
              className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] border-none bg-transparent cursor-pointer min-[380px]:h-[36px] min-[380px]:w-[36px] md:h-[40px] md:w-[40px]"
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

            <div className="hidden items-center gap-[6px] xl:flex">
              {utilLinks.map((u) => (
                <Link
                  key={u.label}
                  to={u.path}
                  onClick={u.isLogout ? handleLogout : undefined}
                  className="px-[14px] py-[10px] text-[13px] font-semibold no-underline transition-colors duration-200 ease-in-out"
                  style={{ color: textColorMuted }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = textColor)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = textColorMuted)}
                >
                  {u.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </header>

      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-[var(--header-backdrop)] backdrop-blur-[4px] animate-[fadeIn_0.25s_ease]" style={{ zIndex: LAYERS.mobileMenuBackdrop }} />
      )}

      <aside
        ref={sidebarRef}
        role="dialog"
        aria-modal="true"
        aria-label="모바일 메뉴"
        tabIndex={-1}
        className={`fixed top-0 left-0 bottom-0 w-[320px] flex flex-col font-['Pretendard',sans-serif] transition-transform duration-[350ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
        style={{
          zIndex: LAYERS.mobileMenuPanel,
          background: "var(--color-bg-surface)",
          borderRight: `1px solid ${menuBorder}`,
          boxShadow: "var(--header-shadow)",
          visibility: sidebarOpen ? "visible" : "hidden",
          pointerEvents: sidebarOpen ? "auto" : "none",
        }}
      >
        <div className="h-[72px] px-[24px] flex items-center justify-between" style={{ borderBottom: "1px solid var(--header-sidebar-divider)" }}>
          <Link to="/" onClick={() => setSidebarOpen(false)}>
            <img src={logoImg} alt="로고" className="h-[22px] object-contain" style={{ filter: isDark ? "brightness(0) invert(1)" : "none" }}  />
          </Link>
          <button ref={sidebarCloseButtonRef} type="button" aria-label="모바일 메뉴 닫기" onClick={() => setSidebarOpen(false)} className="w-[36px] h-[36px] rounded-[10px] bg-transparent border-none cursor-pointer flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ stroke: "var(--header-close-icon)" }} strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-[16px] py-[20px]">
          {SIDEBAR_MAIN_MENUS.map((m) => (
            <div key={m.key} className="mb-[18px]">
              <div className="px-[12px] py-[6px] text-[12px] font-black tracking-[0.10em] uppercase" style={{ color: sidebarSection }}>
                {m.label}
              </div>
              {m.items.map((it) => (
                <Link key={it.path} to={it.path} onClick={() => setSidebarOpen(false)} className="block px-[12px] py-[10px] rounded-[10px] text-[15px] font-semibold no-underline transition-colors duration-150 ease-in-out" style={{ color: sidebarText }} onMouseEnter={(e) => (e.currentTarget.style.background = menuSelectedBg)} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                  {it.label[lang]}
                </Link>
              ))}
            </div>
          ))}

          <div className="mt-[24px] pt-[20px] xl:hidden" style={{ borderTop: "1px solid var(--header-sidebar-divider)" }}>
            <div className="px-[12px] py-[6px] text-[12px] font-black tracking-[0.10em] uppercase" style={{ color: sidebarSection }}>
              ACCOUNT
            </div>
            {utilLinks.map((u) => (
              <Link key={u.label} to={u.path} onClick={(e) => { if(u.isLogout) handleLogout(e); else setSidebarOpen(false); }} className="block px-[12px] py-[10px] rounded-[10px] text-[15px] font-semibold no-underline transition-colors duration-150 ease-in-out" style={{ color: sidebarText }} onMouseEnter={(e) => (e.currentTarget.style.background = menuSelectedBg)} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
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
