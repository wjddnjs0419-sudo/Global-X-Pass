import { ReactNode } from "react";
import { useTheme } from "../ThemeContext";

interface PageShellProps {
  title: string;
  subtitle?: string;
  accentColor?: string;
  children: ReactNode;
}

export function PageShell({ title, subtitle, accentColor = "#20D6A2", children }: PageShellProps) {
  const { isDark } = useTheme();
  return (
    <div
      style={{
        minHeight: "100vh",
        background: isDark ? "#0a1020" : "#F7F8FC",
        fontFamily: "'Pretendard', sans-serif",
        transition: "background 0.4s ease",
      }}
    >
      {/* Page banner */}
      <div
        style={{
          paddingTop: 72,
          background: isDark
            ? "linear-gradient(135deg, #0a1020 0%, #101828 100%)"
            : "linear-gradient(135deg, #0f172a 0%, #1a2744 100%)",
          borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.08)"}`,
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "clamp(40px, 7vw, 56px) clamp(18px, 4vw, 32px) clamp(36px, 6vw, 52px)" }}>
          <h1
            style={{
              margin: 0,
              fontSize: "clamp(28px, 4vw, 44px)",
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: "-0.03em",
              lineHeight: 1.15,
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              style={{
                margin: "12px 0 0",
                fontSize: 16,
                color: "rgba(255,255,255,0.55)",
                fontWeight: 500,
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Page content */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "clamp(32px, 6vw, 48px) clamp(18px, 4vw, 32px) clamp(60px, 10vw, 96px)" }}>
        {children}
      </div>
    </div>
  );
}
