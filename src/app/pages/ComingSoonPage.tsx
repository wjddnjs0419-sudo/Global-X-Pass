import { Link, useLocation } from "react-router";
import { DESKTOP_MAIN_MENUS } from "../navigation/mainMenu";

function getMenuLabel(pathname: string): string {
  for (const menu of DESKTOP_MAIN_MENUS) {
    const item = menu.items.find((i) => i.path === pathname);
    if (item) return item.label.ko;
  }
  return "페이지";
}

export function ComingSoonPage() {
  const { pathname } = useLocation();
  const pageLabel = getMenuLabel(pathname);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center font-['Pretendard',sans-serif] text-center px-6"
      style={{ background: "var(--color-bg-surface)" }}
    >
      <p
        className="text-[13px] font-semibold tracking-[0.18em] uppercase mb-4"
        style={{ color: "var(--color-accent-blue)" }}
      >
        Coming Soon
      </p>
      <h1 className="text-[28px] font-extrabold mb-3 leading-tight" style={{ color: "var(--color-text-primary)" }}>
        {pageLabel} 페이지를 준비 중이에요
      </h1>
      <p className="text-[15px] mb-10 leading-[1.7]" style={{ color: "var(--color-text-muted)" }}>
        더 나은 서비스로 곧 찾아올게요.
      </p>
      <Link
        to="/"
        className="inline-block px-8 py-[14px] rounded-xl font-bold text-[15px] no-underline"
        style={{ background: "var(--color-accent-blue)", color: "var(--color-on-primary)" }}
      >
        홈으로 돌아가기
      </Link>
    </div>
  );
}
