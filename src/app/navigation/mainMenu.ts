export type MenuKey = "resources" | "programs" | "news" | "support" | "aroundX";

export type MenuLabel = {
  ko: string;
  en: string;
};

export type MenuItem = {
  label: MenuLabel;
  path: string;
  comingSoon?: boolean;
  /** post_categories.id. 지정 시 한국어 라벨을 DB 게시판 이름으로 동적 표시. */
  category?: string;
};

export type MainMenu = {
  key: MenuKey;
  label: string;
  items: MenuItem[];
};

export const AROUND_X_ROUTES = {
  changguProgram: "/around-x/changgu-program",
  renault: "/around-x/renault",
  fincantieri: "/around-x/fincantieri",
} as const;

const MAIN_MENU_BY_KEY: Record<MenuKey, MainMenu> = {
  resources: {
    key: "resources",
    label: "Resources",
    items: [
      { label: { ko: "자료실", en: "Resources" }, path: "/resources", category: "resources" },
      { label: { ko: "인사이트", en: "Insights" }, path: "/insights", category: "media" },
      // expenses 는 게시판 관리에서 잠금(is_locked) 처리되어 라벨/설명 편집이 비활성화되므로
      // 의도적으로 category 를 연동하지 않고 정적 라벨을 사용한다.
      { label: { ko: "사업비 자료실", en: "Expense Center" }, path: "/expenses" },
    ],
  },
  programs: {
    key: "programs",
    label: "Programs",
    items: [
      { label: { ko: "행사", en: "Events" }, path: "/events", category: "events" },
      { label: { ko: "행사 아카이브", en: "Event Archive" }, path: "/events/archive", category: "events-archive" },
      { label: { ko: "1:1 컨설팅", en: "Consulting" }, path: "/consulting", category: "consulting" },
      { label: { ko: "Founder's Club", en: "Founder's Club" }, path: "/founders-club", category: "founders-club" },
    ],
  },
  news: {
    key: "news",
    label: "News",
    items: [
      { label: { ko: "공지사항", en: "Notice" }, path: "/notice", category: "notice" },
      { label: { ko: "뉴스", en: "News" }, path: "/news", category: "news" },
      { label: { ko: "기업 뉴스", en: "Company News" }, path: "/company-news", category: "company-news" },
    ],
  },
  support: {
    key: "support",
    label: "Support",
    items: [
      { label: { ko: "자주 묻는 질문", en: "FAQ" }, path: "/faq", category: "faq" },
    ],
  },
  aroundX: {
    key: "aroundX",
    label: "Around X",
    items: [
      { label: { ko: "창구 프로그램", en: "Changgu Program" }, path: AROUND_X_ROUTES.changguProgram },
      { label: { ko: "르노", en: "Renault" }, path: AROUND_X_ROUTES.renault, comingSoon: true },
      { label: { ko: "핀칸티에리", en: "Fincantieri" }, path: AROUND_X_ROUTES.fincantieri, comingSoon: true },
      { label: { ko: "참여 기업", en: "Companies" }, path: "/companies", category: "companies" },
    ],
  },
};

const MAIN_MENU_ORDER: MenuKey[] = ["resources", "programs", "news", "support", "aroundX"];

export const DESKTOP_MAIN_MENUS = MAIN_MENU_ORDER.map((key) => MAIN_MENU_BY_KEY[key]);
export const SIDEBAR_MAIN_MENUS = DESKTOP_MAIN_MENUS;
