import type { CSSProperties } from "react";

export function getFilterTabStyle(isDark: boolean, active: boolean): CSSProperties {
  const border = isDark ? "rgba(255,255,255,0.14)" : "rgba(15,23,42,0.12)";
  return {
    padding: "8px 15px",
    borderRadius: 10,
    border: `1px solid ${active ? (isDark ? "rgba(255,255,255,0.28)" : "rgba(15,23,42,0.22)") : border}`,
    cursor: "pointer",
    fontWeight: active ? 800 : 650,
    fontSize: 14,
    lineHeight: 1.25,
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

export function getMutedLabelStyle(_isDark?: boolean): CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    alignSelf: "flex-start",
    padding: "4px 9px",
    borderRadius: 7,
    border: "1px solid var(--color-border-subtle)",
    background: "var(--color-surface-subtle)",
    color: "var(--color-text-muted)",
    fontSize: 12,
    fontWeight: 700,
    lineHeight: 1.2,
  };
}

export function getStatusPillStyle(color: string, _isDark?: boolean): CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    alignSelf: "flex-start",
    padding: "4px 10px",
    borderRadius: 999,
    border: `1px solid color-mix(in srgb, ${color} 24%, transparent)`,
    background: `color-mix(in srgb, ${color} 12%, transparent)`,
    color,
    fontSize: 13,
    fontWeight: 800,
    lineHeight: 1.2,
  };
}

export function getBackLinkStyle(): CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    padding: 0,
    border: "none",
    background: "none",
    color: "var(--color-accent-blue)",
    fontSize: "var(--text-body-sm)",
    fontWeight: "var(--weight-bold)",
    lineHeight: "var(--leading-snug)",
    cursor: "pointer",
    textDecoration: "none",
  };
}
