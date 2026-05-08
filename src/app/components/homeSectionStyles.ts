import type { CSSProperties } from "react";

export type HomeSectionAccent = "blue" | "green" | "red" | "purple" | "yellow";

export const HOME_SECTION_PADDING =
  "clamp(60px, 10vw, 100px) clamp(20px, 5vw, 40px) clamp(70px, 11vw, 110px)";

export const HOME_SECTION_MAX_WIDTH = "1280px";
export const HOME_SECTION_HEADER_GAP = "40px";
export const HOME_SECTION_TITLE_SIZE = "clamp(24px, 3vw, 40px)";
export const HOME_SECTION_BODY_SIZE = "15px";
export const HOME_SECTION_BODY_MAX_WIDTH = "620px";
export const HOME_CARD_RADIUS = "18px";

export const HOME_SECTION_TITLE_STYLE: CSSProperties = {
  fontSize: HOME_SECTION_TITLE_SIZE,
  fontWeight: 800,
  margin: "0 0 14px",
  letterSpacing: 0,
  lineHeight: 1.15,
};

export const HOME_SECTION_TITLE_STYLE_COMPACT: CSSProperties = {
  fontSize: HOME_SECTION_TITLE_SIZE,
  fontWeight: 800,
  margin: 0,
  letterSpacing: 0,
  lineHeight: 1.15,
};

export const HOME_SECTION_BODY_STYLE: CSSProperties = {
  fontSize: HOME_SECTION_BODY_SIZE,
  margin: 0,
  lineHeight: 1.65,
  maxWidth: HOME_SECTION_BODY_MAX_WIDTH,
};

export function getHomeSectionCtaPillClass(
  isDark: boolean,
  _accent: HomeSectionAccent,
) {
  return isDark
    ? "border-white/20 text-white/70 hover:bg-white/10 hover:text-white/90"
    : "border-slate-300 text-slate-600 hover:bg-slate-100 hover:text-slate-800";
}
