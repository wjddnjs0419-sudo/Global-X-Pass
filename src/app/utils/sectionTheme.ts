// ─── Shared section theme tokens — values resolved via CSS variables ───────
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

export function getSectionTheme(): SectionTheme {
  return {
    sectionBg:          "var(--section-bg)",
    dotGrid:            "var(--section-dot-grid)",
    headingColor:       "var(--section-heading)",
    subText:            "var(--section-subtext)",
    mutedText:          "var(--section-muted)",
    badgeBg:            "var(--section-badge-bg)",
    badgeBorder:        "var(--section-badge-border)",
    cardBg:             "var(--section-card-bg)",
    cardBorder:         "var(--section-card-border)",
    cardShadow:         "var(--section-card-shadow)",
    cardHoverBg:        "var(--section-card-hover-bg)",
    cardHoverBorder:    "var(--section-card-hover-border)",
    itemTitle:          "var(--section-heading)",
    itemDesc:           "var(--section-subtext)",
    dividerColor:       "var(--section-divider)",
    footerText:         "var(--section-footer-text)",
    rowDivider:         "var(--section-row-divider)",
    tagBg:              "var(--section-tag-bg)",
    tagBorder:          "var(--section-tag-border)",
    inputBg:            "var(--section-input-bg)",
    inputBorder:        "var(--section-input-border)",
    inputText:          "var(--section-heading)",
    inputPlaceholder:   "var(--section-input-placeholder)",
    pillBg:             "var(--section-tag-bg)",
    pillBorder:         "var(--section-tag-border)",
    pillText:           "var(--section-pill-text)",
  };
}
