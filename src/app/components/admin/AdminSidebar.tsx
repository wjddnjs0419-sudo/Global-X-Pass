import { useTheme } from "../../ThemeContext";

type TabId = "dashboard" | "users" | "create" | "manage" | "events" | "consulting" | "founders" | "blog-queue";

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: TabId) => void;
  adminEmail: string;
}

const SECTIONS: { label: string; items: { id: TabId; label: string; icon: React.ReactNode }[] }[] = [
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

  const bg = "var(--color-bg-elevated)";
  const border  = isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.08)";
  const textMain  = isDark ? "rgba(255,255,255,0.92)" : "#111827";
  const textMuted = isDark ? "rgba(255,255,255,0.42)" : "rgba(15,23,42,0.46)";
  const activeBg = isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.055)";
  const hoverBg = isDark ? "rgba(255,255,255,0.055)" : "rgba(15,23,42,0.04)";
  const activeBorder = isDark ? "rgba(255,255,255,0.14)" : "rgba(15,23,42,0.1)";

  return (
    <aside style={{
      width: 240,
      flexShrink: 0,
      position: "sticky",
      top: 72,
      height: "calc(100vh - 72px)",
      overflowY: "auto",
      background: bg,
      borderRight: `1px solid ${border}`,
      display: "flex",
      flexDirection: "column",
      padding: "28px 14px 24px",
      gap: 0,
    }}>
      {/* 로고 영역 */}
      <div style={{ paddingLeft: 12, marginBottom: 28 }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: textMuted }}>Admin Panel</div>
      </div>

      {/* 네비게이션 */}
      <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
        {SECTIONS.map((section, si) => (
          <div key={si} style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: textMuted, paddingLeft: 12, marginBottom: 4 }}>
              {section.label}
            </div>
            {section.items.map(item => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "9px 12px",
                    borderRadius: 9,
                    border: `1px solid ${isActive ? activeBorder : "transparent"}`,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    fontSize: 13,
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
                  <span style={{ opacity: isActive ? 0.9 : 0.56, flexShrink: 0 }}>{item.icon}</span>
                  {item.label}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

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
            fontSize: 12, fontWeight: 800, color: textMain, flexShrink: 0,
          }}>
            {adminEmail[0].toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: textMain, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {adminEmail}
            </div>
            <div style={{ fontSize: 10, color: textMuted, marginTop: 1 }}>관리자</div>
          </div>
        </div>
      )}
    </aside>
  );
}
