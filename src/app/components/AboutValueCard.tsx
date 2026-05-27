import type { ReactNode } from "react";
import type { SectionTheme } from "../utils/sectionTheme";
import { HOME_CARD_RADIUS } from "./homeSectionStyles";

export const ABOUT_VALUE_CARD_MIN_HEIGHT = "172px";

interface AboutValueCardProps {
  icon: ReactNode;
  index: number;
  title: string;
  description: string;
  theme: SectionTheme;
}

export function AboutValueCard({ icon, index, title, description, theme }: AboutValueCardProps) {
  return (
    <article
      className="about-value-card"
      style={{
        background: theme.cardBg,
        border: `1px solid ${theme.cardBorder}`,
        borderRadius: HOME_CARD_RADIUS,
        padding: "var(--space-lg)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-md)",
        minHeight: ABOUT_VALUE_CARD_MIN_HEIGHT,
        outline: "1px solid transparent",
        outlineOffset: "-1px",
        transition: "transform 0.18s ease, outline-color 0.18s ease, background 0.18s ease",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-sm)" }}>
        <span
          aria-hidden="true"
          style={{
            color: theme.mutedText,
            display: "inline-flex",
            opacity: 0.72,
          }}
        >
          {icon}
        </span>
        <span
          style={{
            color: theme.mutedText,
            fontSize: "11px",
            fontWeight: 800,
            letterSpacing: "0.08em",
          }}
        >
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-xs)" }}>
        <h3
          style={{
            color: theme.itemTitle,
            fontSize: "var(--text-body-lg)",
            fontWeight: 800,
            lineHeight: 1.35,
            letterSpacing: 0,
            margin: 0,
            wordBreak: "keep-all",
          }}
        >
          {title}
        </h3>
        <p
          style={{
            color: theme.itemDesc,
            fontSize: "13px",
            lineHeight: 1.7,
            margin: 0,
            wordBreak: "keep-all",
          }}
        >
          {description}
        </p>
      </div>
    </article>
  );
}
