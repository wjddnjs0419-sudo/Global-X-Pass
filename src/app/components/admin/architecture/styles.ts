import type { CSSProperties } from "react";

export const sideTitleStyle: CSSProperties = {
  color: "#e8e8e8",
  fontSize: 12,
  fontWeight: 900,
  margin: "18px 0 8px",
};

export const sideItemStyle: CSSProperties = {
  color: "#bbbbbb",
  fontSize: 11,
  lineHeight: 1.6,
  marginBottom: 6,
};

export const sideLabelStyle: CSSProperties = {
  color: "#8a8a8a",
  fontSize: 10,
  fontWeight: 800,
  margin: "14px 0 5px",
  textTransform: "uppercase",
};

export const sideValueStyle: CSSProperties = {
  color: "#e8e8e8",
  fontSize: 12,
  lineHeight: 1.55,
};

export const findingStyle: CSSProperties = {
  background: "#1a1010",
  borderLeft: "3px solid #ff3860",
  color: "#e8c8c8",
  borderRadius: "0 6px 6px 0",
  padding: "8px 10px",
  marginBottom: 8,
  fontSize: 11,
  lineHeight: 1.6,
};

export const mapDiffPanelStyle: CSSProperties = {
  border: "1px solid var(--color-glass-border)",
  background: "var(--color-glass-bg)",
  borderRadius: "var(--radius-sm)",
  padding: "var(--space-sm)",
  margin: "0 0 var(--space-md)",
};

export const plainSidebarButtonStyle: CSSProperties = {
  width: "100%",
  border: 0,
  borderTop: "1px solid #2a2a2a",
  background: "transparent",
  padding: "10px 0",
  textAlign: "left",
  cursor: "pointer",
};

export const iconButtonStyle: CSSProperties = {
  width: 30,
  height: 30,
  border: "1px solid #2a2a2a",
  background: "#1c1c1c",
  color: "#8a8a8a",
  borderRadius: 7,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};

export const floatingCloseButtonStyle: CSSProperties = {
  width: 34,
  height: 34,
  border: "1px solid var(--color-border-soft)",
  background: "transparent",
  color: "var(--color-text-muted)",
  borderRadius: 10,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  flex: "0 0 auto",
};

export const compactButtonStyle: CSSProperties = {
  border: "1px solid #2a2a2a",
  background: "#1c1c1c",
  color: "#e8e8e8",
  borderRadius: 6,
  padding: "6px 8px",
  fontSize: 10,
  fontWeight: 850,
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  cursor: "pointer",
};

export const compactDangerButtonStyle: CSSProperties = {
  ...compactButtonStyle,
  color: "#ffb4b4",
  border: "1px solid #3a2020",
  background: "#1a1010",
};

export const compactInputStyle: CSSProperties = {
  minWidth: 0,
  border: "1px solid #2a2a2a",
  background: "#1c1c1c",
  color: "#e8e8e8",
  borderRadius: 6,
  padding: "8px 9px",
  fontSize: 11,
  outline: "none",
};

export const compactTextareaStyle: CSSProperties = {
  ...compactInputStyle,
  width: "100%",
  minHeight: 112,
  resize: "vertical",
  fontFamily: "inherit",
  lineHeight: 1.6,
};

export const linkButtonStyle: CSSProperties = {
  border: "1px solid #2a2a2a",
  background: "transparent",
  color: "#4ea1ff",
  borderRadius: 6,
  padding: "5px 7px",
  fontSize: 10,
  fontWeight: 850,
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  cursor: "pointer",
};

export const qaMetricStyle: CSSProperties = {
  border: "1px solid #2a2a2a",
  background: "#111",
  color: "#8a8a8a",
  borderRadius: 999,
  padding: "4px 8px",
  fontSize: 10,
  fontWeight: 850,
};

export const opsResultRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "72px minmax(0, 1fr)",
  gap: 8,
  color: "#bbbbbb",
  fontSize: 11,
  lineHeight: 1.45,
};

export const opsCodeBlockStyle: CSSProperties = {
  border: "1px solid #2a2a2a",
  background: "#0d1117",
  color: "#c9d1d9",
  borderRadius: 8,
  padding: "10px 12px",
  fontSize: 11,
  lineHeight: 1.7,
  wordBreak: "break-word",
};

export const opsSectionLabelStyle: CSSProperties = {
  color: "#8a8a8a",
  fontSize: 10,
  fontWeight: 900,
  marginBottom: 6,
};

export const issueActionButtonStyle: CSSProperties = {
  border: "1px solid #2a2a2a",
  background: "#1c1c1c",
  color: "#e8e8e8",
  borderRadius: 6,
  padding: "7px 10px",
  fontSize: 11,
  fontWeight: 800,
  cursor: "pointer",
};

export function fixButtonStyle(accentColor: string): CSSProperties {
  return {
    border: `1px solid ${accentColor}`,
    background: "transparent",
    color: accentColor,
    borderRadius: 6,
    padding: "6px 10px",
    fontSize: 11,
    fontWeight: 800,
    cursor: "pointer",
  };
}

export const explainLabelStyle: CSSProperties = {
  color: "#e8e8e8",
  fontSize: 10,
  fontWeight: 900,
  marginTop: 7,
  marginBottom: 2,
};

export const explainTextStyle: CSSProperties = {
  color: "#bbbbbb",
  fontSize: 11,
  lineHeight: 1.55,
};
