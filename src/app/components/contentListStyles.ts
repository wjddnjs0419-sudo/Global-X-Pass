import type { CSSProperties } from "react";

export function getFilterTabStyle(isDark: boolean, active: boolean): CSSProperties {
  const border = isDark ? "rgba(255,255,255,0.14)" : "rgba(15,23,42,0.12)";
  return {
    padding: "7px 14px",
    borderRadius: 9,
    border: `1px solid ${active ? (isDark ? "rgba(255,255,255,0.28)" : "rgba(15,23,42,0.22)") : border}`,
    cursor: "pointer",
    fontWeight: active ? 800 : 650,
    fontSize: 13,
    transition: "background 0.15s, border-color 0.15s, color 0.15s",
    width: "fit-content",
    background: active
      ? (isDark ? "rgba(255,255,255,0.12)" : "#0f172a")
      : (isDark ? "rgba(255,255,255,0.035)" : "#ffffff"),
    color: active
      ? "#fff"
      : (isDark ? "rgba(255,255,255,0.62)" : "rgba(15,23,42,0.58)"),
  };
}

export function getMutedLabelStyle(isDark: boolean): CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    alignSelf: "flex-start",
    padding: "3px 8px",
    borderRadius: 6,
    border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(15,23,42,0.1)"}`,
    background: isDark ? "rgba(255,255,255,0.035)" : "rgba(15,23,42,0.025)",
    color: isDark ? "rgba(255,255,255,0.52)" : "rgba(15,23,42,0.5)",
    fontSize: 11,
    fontWeight: 700,
    lineHeight: 1.2,
  };
}

export function getStatusPillStyle(color: string, isDark: boolean): CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    alignSelf: "flex-start",
    padding: "3px 9px",
    borderRadius: 999,
    border: `1px solid ${color}33`,
    background: isDark ? `${color}16` : `${color}12`,
    color,
    fontSize: 12,
    fontWeight: 800,
    lineHeight: 1.2,
  };
}
