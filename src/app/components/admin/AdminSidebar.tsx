import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useTheme } from "../../ThemeContext";

type TabId = "dashboard" | "users" | "create" | "manage" | "events" | "consulting" | "founders" | "blog-queue" | "company-news";

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: TabId) => void;
  adminEmail: string;
}

const SECTIONS: { label: string; items: { id: TabId; label: string; icon: ReactNode }[] }[] = [
  {
    label: "Overview",
    items: [
      {
        id: "dashboard", label: "관리 대시보드",
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>,
      },
    ],
  },
  {
    label: "멤버",
    items: [
      {
        id: "users", label: "회원 관리",
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
      },
    ],
  },
  {
    label: "콘텐츠",
    items: [
      {
        id: "create", label: "게시물 작성",
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
      },
      {
        id: "manage", label: "게시물 관리",
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
      },
      {
        id: "blog-queue", label: "블로그 동기화",
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
      },
      {
        id: "company-news", label: "기업 뉴스 관리",
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z"/><path d="M8 7h8"/><path d="M8 11h8"/><path d="M8 15h5"/></svg>,
      },
    ],
  },
  {
    label: "프로그램",
    items: [
      {
        id: "events", label: "행사 관리",
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 10h18"/><path d="m9 16 2 2 4-4"/></svg>,
      },
      {
        id: "consulting", label: "컨설팅 관리",
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
      },
      {
        id: "founders", label: "Founder's Club",
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
      },
    ],
  },
];

export function AdminSidebar({ activeTab, onTabChange, adminEmail }: AdminSidebarProps) {
  const { isDark } = useTheme();
  const navRef = useRef<HTMLElement | null>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const bg = "var(--color-bg-elevated)";
  const border  = isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.08)";
  const textMain  = isDark ? "rgba(255,255,255,0.92)" : "#111827";
  const textMuted = isDark ? "rgba(255,255,255,0.42)" : "rgba(15,23,42,0.46)";
  const activeBg = isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.055)";
  const hoverBg = isDark ? "rgba(255,255,255,0.055)" : "rgba(15,23,42,0.04)";
  const activeBorder = isDark ? "rgba(255,255,255,0.14)" : "rgba(15,23,42,0.1)";
  const arrowBg = isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.07)";
  const arrowBorder = isDark ? "rgba(255,255,255,0.14)" : "rgba(15,23,42,0.12)";

  const updateScrollState = () => {
    const nav = navRef.current;
    if (!nav) return;
    const maxScroll = nav.scrollWidth - nav.clientWidth;
    setCanScrollPrev(nav.scrollLeft > 4);
    setCanScrollNext(nav.scrollLeft < maxScroll - 4);
  };

  const scrollNav = (direction: -1 | 1) => {
    const nav = navRef.current;
    const firstCard = nav?.querySelector<HTMLElement>("[data-admin-nav-section]");
    if (!nav || !firstCard) return;
    const gap = 12;
    nav.scrollBy({ left: direction * (firstCard.offsetWidth + gap), behavior: "smooth" });
  };

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    updateScrollState();
    nav.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);
    return () => {
      nav.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, []);

  useEffect(() => {
    const nav = navRef.current;
    const activeButton = nav?.querySelector<HTMLElement>("[aria-current='page']");
    activeButton?.closest<HTMLElement>("[data-admin-nav-section]")?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [activeTab]);

  return (
    <aside
      className="w-full xl:w-[240px] xl:shrink-0 xl:sticky xl:top-[72px] xl:h-[calc(100vh-72px)]"
      style={{
        overflowY: "auto",
        background: bg,
        borderRight: `1px solid ${border}`,
        borderBottom: `1px solid ${border}`,
        display: "flex",
        flexDirection: "column",
        padding: "18px 14px 18px",
        gap: 0,
      }}
    >
      {/* 로고 영역 */}
      <div style={{ paddingLeft: 12, marginBottom: 18 }}>
        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: textMuted }}>Admin Panel</div>
      </div>

      {/* 네비게이션 */}
      <div className="relative min-w-0">
        <button
          type="button"
          aria-label="이전 어드민 메뉴"
          onClick={() => scrollNav(-1)}
          disabled={!canScrollPrev}
          className="admin-nav-arrow admin-nav-arrow-prev xl:hidden"
          style={{ background: arrowBg, border: `1px solid ${arrowBorder}`, color: textMain, opacity: canScrollPrev ? 1 : 0 }}
        >
          <ChevronLeft size={18} strokeWidth={2.5} />
        </button>
        <button
          type="button"
          aria-label="다음 어드민 메뉴"
          onClick={() => scrollNav(1)}
          disabled={!canScrollNext}
          className="admin-nav-arrow admin-nav-arrow-next xl:hidden"
          style={{ background: arrowBg, border: `1px solid ${arrowBorder}`, color: textMain, opacity: canScrollNext ? 1 : 0 }}
        >
          <ChevronRight size={18} strokeWidth={2.5} />
        </button>

        <nav
          ref={navRef}
          className="admin-mobile-nav flex gap-3 overflow-x-auto pb-1 xl:flex-1 xl:flex-col xl:gap-4 xl:overflow-visible xl:pb-0"
          style={{ minWidth: 0 }}
        >
          {SECTIONS.map((section, si) => (
            <div
              key={si}
              data-admin-nav-section
              className="min-w-[calc(100vw-104px)] scroll-mx-[52px] sm:min-w-[220px] xl:min-w-0"
              style={{
                marginBottom: 0,
                padding: "10px 8px 8px",
                borderRadius: 14,
                border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.08)"}`,
                background: isDark ? "rgba(255,255,255,0.025)" : "rgba(255,255,255,0.72)",
                scrollSnapAlign: "center",
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: textMuted, paddingLeft: 12, marginBottom: 6 }}>
                {section.label}
              </div>
              {section.items.map(item => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    aria-current={isActive ? "page" : undefined}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 12px",
                      borderRadius: 10,
                      border: `1px solid ${isActive ? activeBorder : "transparent"}`,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      fontSize: 14,
                      fontWeight: isActive ? 750 : 600,
                      textAlign: "left",
                      transition: "background 0.12s, border-color 0.12s, color 0.12s",
                      background: isActive
                        ? activeBg
                        : "transparent",
                      color: isActive
                        ? textMain
                        : textMain,
                    }}
                    onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = hoverBg; }}
                    onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                  >
                    <span style={{ opacity: isActive ? 0.9 : 0.56, flexShrink: 0, transform: "scale(1.05)" }}>{item.icon}</span>
                    {item.label}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      <style>{`
        .admin-mobile-nav {
          scroll-snap-type: x mandatory;
          scrollbar-width: none;
        }
        .admin-mobile-nav::-webkit-scrollbar {
          display: none;
        }
        .admin-nav-arrow {
          position: absolute;
          top: 50%;
          z-index: 2;
          width: 36px;
          height: 56px;
          transform: translateY(-50%);
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: opacity 0.16s ease, background 0.16s ease, border-color 0.16s ease;
        }
        .admin-nav-arrow:disabled {
          pointer-events: none;
        }
        .admin-nav-arrow-prev {
          left: 4px;
        }
        .admin-nav-arrow-next {
          right: 4px;
        }
        @media (min-width: 1280px) {
          .admin-mobile-nav {
            scroll-snap-type: none;
          }
        }
      `}</style>

      {/* 하단 어드민 정보 */}
      {adminEmail && (
        <div style={{
          marginTop: 16,
          paddingTop: 16,
          borderTop: `1px solid ${border}`,
          display: "flex",
          alignItems: "center",
          gap: 10,
          paddingLeft: 4,
        }}>
          <div style={{
            width: 30, height: 30,
            borderRadius: "50%",
            background: isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.06)",
            border: `1px solid ${border}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 800, color: textMain, flexShrink: 0,
          }}>
            {adminEmail[0].toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: textMain, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {adminEmail}
            </div>
            <div style={{ fontSize: 11, color: textMuted, marginTop: 1 }}>관리자</div>
          </div>
        </div>
      )}
    </aside>
  );
}
