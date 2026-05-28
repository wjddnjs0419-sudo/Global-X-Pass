export const CATEGORIES = [
  { id: "notice",         label: "공지사항" },
  { id: "news",           label: "뉴스" },
  { id: "events",         label: "행사" },
  { id: "events-archive", label: "행사 아카이브" },
  { id: "resources",      label: "자료실" },
  { id: "media",          label: "인사이트" },
  { id: "faq",            label: "FAQ" },
  { id: "expenses",       label: "사업비 자료실" },
];

export const CATEGORY_COLOR: Record<string, { color: string; bg: string; bgDark: string }> = {
  notice:           { color: "var(--color-brand-red)",    bg: "#fce8e6", bgDark: "rgba(234,67,53,0.2)"  },
  news:             { color: "var(--color-accent-blue)",  bg: "#eef2ff", bgDark: "rgba(67,119,241,0.2)" },
  events:           { color: "var(--color-accent-green)", bg: "#e6f4ea", bgDark: "rgba(24,163,67,0.2)"  },
  "events-archive": { color: "var(--color-accent-green)", bg: "#e6f4ea", bgDark: "rgba(24,163,67,0.2)"  },
  resources:        { color: "var(--color-accent-blue)",  bg: "#eef2ff", bgDark: "rgba(67,119,241,0.2)" },
  media:            { color: "var(--color-accent-ncf)",   bg: "#e6fffa", bgDark: "rgba(32,214,162,0.2)" },
  faq:              { color: "var(--color-brand-yellow)", bg: "#fef9e7", bgDark: "rgba(251,188,5,0.2)"  },
  expenses:         { color: "var(--color-brand-red)",    bg: "#fce8e6", bgDark: "rgba(234,67,53,0.2)"  },
};

export const getLocalDateString = (d: Date) => {
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().split('T')[0];
};
