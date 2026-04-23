// ─── Shared light/dark theme tokens for all sections ───────────
export interface SectionTheme {
  sectionBg: string;
  dotGrid: string;
  headingColor: string;
  subText: string;
  mutedText: string;
  badgeBg: string;
  badgeBorder: string;
  cardBg: string;
  cardBorder: string;
  cardShadow: string;
  cardHoverBg: string;
  cardHoverBorder: string;
  itemTitle: string;
  itemDesc: string;
  dividerColor: string;
  footerText: string;
  rowDivider: string;
  tagBg: string;
  tagBorder: string;
  inputBg: string;
  inputBorder: string;
  inputText: string;
  inputPlaceholder: string;
  pillBg: string;
  pillBorder: string;
  pillText: string;
}

export function getSectionTheme(isDark: boolean): SectionTheme {
  if (isDark) {
    return {
      sectionBg: "linear-gradient(180deg, #0a1020 0%, #0e1628 100%)",
      dotGrid: "rgba(255,255,255,0.04)",
      headingColor: "#ffffff",
      subText: "rgba(255,255,255,0.55)",
      mutedText: "rgba(255,255,255,0.32)",
      badgeBg: "rgba(66,133,244,0.1)",
      badgeBorder: "rgba(66,133,244,0.28)",
      cardBg: "rgba(255,255,255,0.04)",
      cardBorder: "rgba(255,255,255,0.1)",
      cardShadow: "none",
      cardHoverBg: "rgba(255,255,255,0.07)",
      cardHoverBorder: "rgba(255,255,255,0.18)",
      itemTitle: "#ffffff",
      itemDesc: "rgba(255,255,255,0.55)",
      dividerColor: "rgba(255,255,255,0.08)",
      footerText: "rgba(255,255,255,0.22)",
      rowDivider: "rgba(255,255,255,0.06)",
      tagBg: "rgba(255,255,255,0.06)",
      tagBorder: "rgba(255,255,255,0.12)",
      inputBg: "rgba(255,255,255,0.05)",
      inputBorder: "rgba(255,255,255,0.14)",
      inputText: "#ffffff",
      inputPlaceholder: "rgba(255,255,255,0.3)",
      pillBg: "rgba(255,255,255,0.06)",
      pillBorder: "rgba(255,255,255,0.12)",
      pillText: "rgba(255,255,255,0.6)",
    };
  }
  return {
    sectionBg: "linear-gradient(180deg, #F7F8FC 0%, #F0F2F8 100%)",
    dotGrid: "rgba(0,0,0,0.035)",
    headingColor: "#0D1117",
    subText: "rgba(0,0,0,0.52)",
    mutedText: "rgba(0,0,0,0.32)",
    badgeBg: "rgba(66,133,244,0.07)",
    badgeBorder: "rgba(66,133,244,0.2)",
    cardBg: "#ffffff",
    cardBorder: "rgba(0,0,0,0.08)",
    cardShadow: "0 2px 16px rgba(0,0,0,0.06)",
    cardHoverBg: "#F0F4FF",
    cardHoverBorder: "rgba(66,133,244,0.22)",
    itemTitle: "#0D1117",
    itemDesc: "rgba(0,0,0,0.52)",
    dividerColor: "rgba(0,0,0,0.07)",
    footerText: "rgba(0,0,0,0.28)",
    rowDivider: "rgba(0,0,0,0.06)",
    tagBg: "#F0F2F8",
    tagBorder: "rgba(0,0,0,0.08)",
    inputBg: "#ffffff",
    inputBorder: "rgba(0,0,0,0.14)",
    inputText: "#0D1117",
    inputPlaceholder: "rgba(0,0,0,0.32)",
    pillBg: "#F0F2F8",
    pillBorder: "rgba(0,0,0,0.08)",
    pillText: "rgba(0,0,0,0.52)",
  };
}
