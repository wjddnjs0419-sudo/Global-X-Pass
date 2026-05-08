export const CATEGORIES = [
  { id: "notice",         label: "공지사항" },
  { id: "news",           label: "뉴스" },
  { id: "events",         label: "행사" },
  { id: "events-archive", label: "행사 아카이브" },
  { id: "resources",      label: "자료실" },
  { id: "media",          label: "미디어" },
  { id: "blog",           label: "블로그" },
  { id: "faq",            label: "FAQ" },
  { id: "expenses",       label: "사업비 자료실 (비공개)" },
];

export const CATEGORY_COLOR: Record<string, { color: string; bg: string; bgDark: string }> = {
  notice:           { color: "#EA4335", bg: "#fce8e6", bgDark: "rgba(234,67,53,0.2)"  },
  news:             { color: "#4377F1", bg: "#eef2ff", bgDark: "rgba(67,119,241,0.2)" },
  events:           { color: "#18A343", bg: "#e6f4ea", bgDark: "rgba(24,163,67,0.2)"  },
  "events-archive": { color: "#18A343", bg: "#e6f4ea", bgDark: "rgba(24,163,67,0.2)"  },
  resources:        { color: "#4377F1", bg: "#eef2ff", bgDark: "rgba(67,119,241,0.2)" },
  media:            { color: "#20D6A2", bg: "#e6fffa", bgDark: "rgba(32,214,162,0.2)" },
  blog:             { color: "#A855F7", bg: "#f5eeff", bgDark: "rgba(168,85,247,0.2)" },
  faq:              { color: "#FBBC05", bg: "#fef9e7", bgDark: "rgba(251,188,5,0.2)"  },
  expenses:         { color: "#EA4335", bg: "#fce8e6", bgDark: "rgba(234,67,53,0.2)"  },
};

export const getLocalDateString = (d: Date) => {
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().split('T')[0];
};
