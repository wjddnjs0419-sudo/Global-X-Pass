import type { CSSProperties, ReactNode } from "react";

interface ProgramIntroSectionProps {
  logoSrc: string;
  logoAlt: string;
  logoMaxWidth: CSSProperties["maxWidth"];
  tagline: string;
  description: ReactNode;
  isDark?: boolean;
}

export function ProgramIntroSection({
  logoSrc,
  logoAlt,
  logoMaxWidth,
  tagline,
  description,
  isDark = false,
}: ProgramIntroSectionProps) {
  const textColor = isDark ? "rgba(236,242,255,0.82)" : "rgba(30,30,80,0.72)";
  const emphasisColor = isDark ? "#ffffff" : "#0D1117";

  return (
    <section
      style={{
        maxWidth: 980,
        margin: "0 auto clamp(56px, 8vw, 84px)",
        padding: "calc(clamp(44px, 7vw, 76px) + clamp(20px, 5vw, 44px)) clamp(20px, 5vw, 40px) 0",
        textAlign: "center",
      }}
    >
      <style>{`
        .program-intro-description strong {
          color: ${emphasisColor};
          font-weight: 850;
        }
      `}</style>
      <img
        src={logoSrc}
        alt={logoAlt}
        style={{
          display: "block",
          width: "100%",
          maxWidth: logoMaxWidth,
          height: "auto",
          margin: "0 auto clamp(28px, 5vw, 44px)",
        }}
      />

      <p
        style={{
          margin: 0,
          color: textColor,
          fontSize: "clamp(14px, 1.4vw, 18px)",
          fontWeight: 500,
          letterSpacing: 0,
          lineHeight: 1.85,
          wordBreak: "keep-all",
        }}
      >
        {tagline}
      </p>

      <p
        className="program-intro-description"
        style={{
          maxWidth: 980,
          margin: "clamp(14px, 3vw, 16px) auto 0",
          color: textColor,
          fontSize: "clamp(14px, 1.4vw, 18px)",
          fontWeight: 500,
          letterSpacing: 0,
          lineHeight: 1.85,
          wordBreak: "keep-all",
        }}
      >
        {description}
      </p>
    </section>
  );
}
