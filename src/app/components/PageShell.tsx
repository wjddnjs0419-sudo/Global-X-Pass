import { ReactNode } from "react";

interface PageShellProps {
  title: string;
  subtitle?: string;
  accentColor?: string;
  children: ReactNode;
}

export function PageShell({ title, subtitle, children }: PageShellProps) {
  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "var(--color-bg-surface)",
        fontFamily: "'Pretendard', sans-serif",
        transition: "background 0.4s ease",
      }}
    >
      {/* Page banner */}
      <div
        style={{
          paddingTop: 72,
          background: "var(--page-banner-bg)",
          borderBottom: "1px solid var(--page-banner-border)",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "clamp(40px, 7vw, 56px) clamp(18px, 4vw, 32px) clamp(36px, 6vw, 52px)" }}>
          <h1
            style={{
              margin: 0,
              fontSize: "clamp(28px, 4vw, 44px)",
              fontWeight: 800,
              color: "var(--color-on-primary)",
              letterSpacing: "-0.03em",
              lineHeight: 1.15,
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              style={{
                margin: "var(--space-sm) 0 0",
                fontSize: "var(--text-body)",
                color: "var(--page-banner-subtext)",
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
