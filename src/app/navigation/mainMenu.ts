export type MenuKey = "resources" | "programs" | "news" | "support" | "aroundX";

export type MenuLabel = {
  ko: string;
  en: string;
};

export type MenuItem = {
  label: MenuLabel;
  path: string;
  comingSoon?: boolean;
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
      { label: { ko: "자료실", en: "Resources" }, path: "/resources" },
      { label: { ko: "인사이트", en: "Insights" }, path: "/insights" },
      { label: { ko: "사업비 자료실", en: "Expense Center" }, path: "/expenses" },
    ],
  },
  programs: {
    key: "programs",
    label: "Programs",
    items: [
      { label: { ko: "행사", en: "Events" }, path: "/events" },
      { label: { ko: "행사 아카이브", en: "Event Archive" }, path: "/events/archive" },
      { label: { ko: "1:1 컨설팅", en: "Consulting" }, path: "/consulting" },
      { label: { ko: "Founder's Club", en: "Founder's Club" }, path: "/founders-club" },
    ],
  },
  news: {
    key: "news",
    label: "News",
    items: [
      { label: { ko: "공지사항", en: "Notice" }, path: "/notice" },
      { label: { ko: "뉴스", en: "News" }, path: "/news" },
      { label: { ko: "기업 뉴스", en: "Company News" }, path: "/company-news" },
    ],
  },
  support: {
    key: "support",
    label: "Support",
    items: [
      { label: { ko: "자주 묻는 질문", en: "FAQ" }, path: "/faq" },
    ],
  },
  aroundX: {
    key: "aroundX",
    label: "Around X",
    items: [
      { label: { ko: "창구 프로그램", en: "Changgu Program" }, path: AROUND_X_ROUTES.changguProgram },
      { label: { ko: "르노", en: "Renault" }, path: AROUND_X_ROUTES.renault, comingSoon: true },
      { label: { ko: "핀칸티에리", en: "Fincantieri" }, path: AROUND_X_ROUTES.fincantieri, comingSoon: true },
      { label: { ko: "참여 기업", en: "Companies" }, path: "/companies" },
    ],
  },
};

const DESKTOP_MAIN_MENU_ORDER: MenuKey[] = ["resources", "programs", "news", "support", "aroundX"];
const SIDEBAR_MAIN_MENU_ORDER: MenuKey[] = ["resources", "programs", "aroundX", "news", "support"];

const resolveMenus = (order: MenuKey[]) => order.map((key) => MAIN_MENU_BY_KEY[key]);

export const DESKTOP_MAIN_MENUS = resolveMenus(DESKTOP_MAIN_MENU_ORDER);
export const SIDEBAR_MAIN_MENUS = resolveMenus(SIDEBAR_MAIN_MENU_ORDER);
