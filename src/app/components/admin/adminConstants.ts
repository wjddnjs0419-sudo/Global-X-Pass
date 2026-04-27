export const CATEGORIES = [
  { id: "notice", label: "공지사항" },
  { id: "news", label: "뉴스" },
  { id: "events", label: "행사" },
  { id: "events-archive", label: "행사 아카이브" },
  { id: "resources", label: "자료실" },
  { id: "blog", label: "블로그" },
  { id: "faq", label: "FAQ" },
];

export const getLocalDateString = (d: Date) => {
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().split('T')[0];
};
