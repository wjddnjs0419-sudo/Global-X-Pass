import type { CSSProperties, ReactNode } from "react";
import {
  CHANGGU_PROGRAM_TIMELINE_COPY,
  CHANGGU_PROGRAM_TIMELINE_PHASES,
  type ChangguProgramTimelinePhase,
} from "./timelineData";

const CONTAINER_HEIGHT = 500;
const OUTER_RING_SIZE = 168;
const CONNECTOR_HEIGHT = 42;
const VERTICAL_SPACER = 45;

interface ChangguProgramTimelineProps {
  isDark?: boolean;
  title?: string;
  subtitle?: string;
  showHeader?: boolean;
  beforeTimeline?: ReactNode;
  sectionPadding?: string;
  contentMaxWidth?: CSSProperties["maxWidth"];
  style?: CSSProperties;
}

interface ChangguProgramTimelineTheme {
  sectionBg: string;
  dotGrid: string;
  glowBlue: string;
  glowRed: string;
  headingColor: string;
  subText: string;
  innerBg: string;
  innerShadow: string;
  ringGlow: string;
  dashColor: string;
  lineColor: string;
  dotColor: string;
  labelColor: string;
  descColor: string;
  bulletColor: string;
}

const alphaIndigo = (opacity: number) => `rgba(107,110,232,${opacity})`;
const connectorColor = "#6B6EE8";

function getTimelineTheme(isDark: boolean): ChangguProgramTimelineTheme {
  if (isDark) {
    return {
      sectionBg:
        "radial-gradient(circle at 15% 60%, rgba(30,15,60,0.5) 0%, transparent 55%), " +
        "radial-gradient(circle at 85% 20%, rgba(10,30,70,0.4) 0%, transparent 55%), " +
        "linear-gradient(180deg, #070d1a 0%, #0a1020 60%, #0c1228 100%)",
      dotGrid: "rgba(255,255,255,0.04)",
      glowBlue: alphaIndigo(0.1),
      glowRed: "rgba(234,67,53,0.07)",
      headingColor: "#fff",
      subText: "rgba(255,255,255,0.4)",
      innerBg: "#14183a",
      innerShadow: "inset 2px 2px 10px rgba(0,0,0,0.5)",
      ringGlow: "5px 5px 18px rgba(0,0,0,0.5), -3px -3px 10px rgba(255,255,255,0.04)",
      dashColor: alphaIndigo(0.4),
      lineColor: alphaIndigo(0.35),
      dotColor: connectorColor,
      labelColor: "#e8e8ff",
      descColor: "rgba(200,200,255,0.68)",
      bulletColor: "rgba(200,200,255,0.55)",
    };
  }

  return {
    sectionBg:
      "radial-gradient(circle at 15% 60%, rgba(107,110,232,0.05) 0%, transparent 55%), " +
      "radial-gradient(circle at 85% 20%, rgba(107,110,232,0.03) 0%, transparent 55%), " +
      "linear-gradient(180deg, #ffffff 0%, #F4F6FB 60%, #EEF1F8 100%)",
    dotGrid: "rgba(0,0,0,0.04)",
    glowBlue: alphaIndigo(0.07),
    glowRed: "rgba(234,67,53,0.04)",
    headingColor: "#0D1117",
    subText: "rgba(0,0,0,0.42)",
    innerBg: "#ffffff",
    innerShadow: "inset 2px 2px 8px rgba(0,0,0,0.07)",
    ringGlow: "5px 5px 18px rgba(0,0,0,0.12), -3px -3px 10px rgba(255,255,255,0.9)",
    dashColor: alphaIndigo(0.35),
    lineColor: alphaIndigo(0.35),
    dotColor: connectorColor,
    labelColor: "#1e1e50",
    descColor: "rgba(30,30,80,0.72)",
    bulletColor: "rgba(30,30,80,0.62)",
  };
}

function TimelineCircle({ phase, theme }: { phase: ChangguProgramTimelinePhase; theme: ChangguProgramTimelineTheme }) {
  return (
    <div
      aria-hidden="true"
      style={{
        width: OUTER_RING_SIZE,
        height: OUTER_RING_SIZE,
        borderRadius: "50%",
        border: `2px dashed ${phase.solidColor}66`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: 144,
          height: 144,
          borderRadius: "50%",
          background: phase.gradient,
          boxShadow: theme.ringGlow,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 100,
            height: 100,
            borderRadius: "50%",
            background: theme.innerBg,
            boxShadow: theme.innerShadow,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ fontSize: 22, fontWeight: 900, color: phase.solidColor, letterSpacing: 0, lineHeight: 1 }}>
            {phase.year}
          </span>
        </div>
      </div>
    </div>
  );
}

function TimelineConnector({ isTop, theme }: { isTop: boolean; theme: ChangguProgramTimelineTheme }) {
  const dot = <div style={{ width: 10, height: 10, borderRadius: "50%", background: theme.dotColor, flexShrink: 0 }} />;
  const line = <div style={{ flex: 1, borderLeft: `2px dashed ${theme.dashColor}` }} />;

  return (
    <div
      aria-hidden="true"
      style={{
        height: CONNECTOR_HEIGHT,
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        flexShrink: 0,
      }}
    >
      {isTop ? (
        <>
          {line}
          {dot}
        </>
      ) : (
        <>
          {dot}
          {line}
        </>
      )}
    </div>
  );
}

function TimelineText({ phase, theme }: { phase: ChangguProgramTimelinePhase; theme: ChangguProgramTimelineTheme }) {
  return (
    <ul style={{ listStyle: "none", padding: 0, margin: 0, textAlign: "left", width: "100%" }}>
      <li style={{ fontWeight: 700, fontSize: 15, color: theme.labelColor, lineHeight: 1.4, marginBottom: 6 }}>
        {phase.label}
      </li>
      <li style={{ fontSize: 12, color: theme.descColor, lineHeight: 1.6, marginBottom: 3 }}>{phase.desc}</li>
      {phase.bullets.map((bullet) => (
        <li key={bullet} style={{ fontSize: 11.5, color: theme.bulletColor, lineHeight: 1.65 }}>
          {bullet}
        </li>
      ))}
    </ul>
  );
}

export function ChangguProgramTimeline({
  isDark = false,
  title = CHANGGU_PROGRAM_TIMELINE_COPY.title,
  subtitle = CHANGGU_PROGRAM_TIMELINE_COPY.subtitle,
  showHeader = true,
  beforeTimeline,
  sectionPadding = "clamp(60px, 10vw, 100px) clamp(20px, 5vw, 40px) clamp(56px, 8vw, 84px)",
  contentMaxWidth = 1280,
  style,
}: ChangguProgramTimelineProps) {
  const theme = getTimelineTheme(isDark);

  return (
    <>
      <style>{`
        .changgu-program-tl-desktop { display: block; }
        .changgu-program-tl-mobile  { display: none; }
        @media (max-width: 900px) {
          .changgu-program-tl-desktop { display: none !important; }
          .changgu-program-tl-mobile  { display: flex !important; }
        }
      `}</style>

      <section
        style={{
          position: "relative",
          width: "100vw",
          maxWidth: "100%",
          left: "50%",
          transform: "translateX(-50%)",
          padding: sectionPadding,
          background: theme.sectionBg,
          fontFamily: "'Pretendard', -apple-system, sans-serif",
          boxSizing: "border-box",
          overflow: "hidden",
          transition: "background 0.4s ease",
          ...style,
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            zIndex: 0,
            backgroundImage: `radial-gradient(${theme.dotGrid} 1px, transparent 1px)`,
            backgroundSize: "36px 36px",
          }}
        />
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: -60,
            left: "8%",
            width: 360,
            height: 360,
            borderRadius: "50%",
            pointerEvents: "none",
            zIndex: 0,
            background: `radial-gradient(circle, ${theme.glowBlue} 0%, transparent 70%)`,
          }}
        />
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            bottom: -60,
            right: "6%",
            width: 320,
            height: 320,
            borderRadius: "50%",
            pointerEvents: "none",
            zIndex: 0,
            background: `radial-gradient(circle, ${theme.glowRed} 0%, transparent 70%)`,
          }}
        />

        <div style={{ position: "relative", zIndex: 1, maxWidth: contentMaxWidth, margin: "0 auto" }}>
          {showHeader && (
            <div style={{ textAlign: "center", marginBottom: 56 }}>
              <h2
                style={{
                  color: theme.headingColor,
                  fontSize: "clamp(24px, 3vw, 40px)",
                  fontWeight: 800,
                  margin: "0 0 14px",
                  letterSpacing: 0,
                  lineHeight: 1.15,
                }}
              >
                {title}
              </h2>
              <p style={{ color: theme.subText, fontSize: "clamp(15px, 3.8vw, 18px)", margin: 0, lineHeight: 1.65 }}>
                {subtitle}
              </p>
            </div>
          )}

          {beforeTimeline}

          <div className="changgu-program-tl-desktop" style={{ position: "relative", height: CONTAINER_HEIGHT }}>
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                top: CONTAINER_HEIGHT / 2,
                left: "12.5%",
                right: "12.5%",
                height: 2,
                background: theme.lineColor,
                transform: "translateY(-50%)",
              }}
            />

            {CHANGGU_PROGRAM_TIMELINE_PHASES.map((phase, index) => {
              const isTop = index % 2 === 0;
              const leftPct = `${(index + 0.5) * 25}%`;

              return (
                <div
                  key={phase.year}
                  style={{
                    position: "absolute",
                    left: leftPct,
                    transform: "translateX(-50%)",
                    width: "22%",
                    height: CONTAINER_HEIGHT,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  {isTop ? (
                    <>
                      <div style={{ height: VERTICAL_SPACER, flexShrink: 0 }} />
                      <TimelineCircle phase={phase} theme={theme} />
                      <TimelineConnector isTop theme={theme} />
                      <div style={{ height: 12, flexShrink: 0 }} />
                      <div
                        style={{
                          flex: 1,
                          width: "100%",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "flex-start",
                        }}
                      >
                        <TimelineText phase={phase} theme={theme} />
                      </div>
                    </>
                  ) : (
                    <>
                      <div
                        style={{
                          flex: 1,
                          width: "100%",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "flex-end",
                        }}
                      >
                        <TimelineText phase={phase} theme={theme} />
                      </div>
                      <div style={{ height: 12, flexShrink: 0 }} />
                      <TimelineConnector isTop={false} theme={theme} />
                      <TimelineCircle phase={phase} theme={theme} />
                      <div style={{ height: VERTICAL_SPACER, flexShrink: 0 }} />
                    </>
                  )}
                </div>
              );
            })}
          </div>

          <ol
            className="changgu-program-tl-mobile"
            style={{ flexDirection: "column", gap: 32, listStyle: "none", padding: 0, margin: 0 }}
          >
            {CHANGGU_PROGRAM_TIMELINE_PHASES.map((phase) => (
              <li key={phase.year} style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
                <div
                  aria-hidden="true"
                  style={{
                    width: 84,
                    height: 84,
                    borderRadius: "50%",
                    flexShrink: 0,
                    background: phase.gradient,
                    boxShadow: theme.ringGlow,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span style={{ fontSize: 18, fontWeight: 900, color: "#fff", lineHeight: 1, letterSpacing: 0 }}>
                    {phase.year}
                  </span>
                </div>

                <div style={{ flex: 1, paddingTop: 7 }}>
                  <div style={{ fontWeight: 700, fontSize: 17, color: theme.labelColor, marginBottom: 5, lineHeight: 1.35 }}>
                    {phase.label}
                  </div>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 4 }}>
                    <li style={{ fontSize: 13.5, color: theme.descColor, marginBottom: 3, lineHeight: 1.55 }}>{phase.desc}</li>
                    {phase.bullets.map((bullet) => (
                      <li
                        key={bullet}
                        style={{
                          display: "flex",
                          gap: 8,
                          alignItems: "flex-start",
                          fontSize: 13,
                          color: theme.bulletColor,
                          lineHeight: 1.6,
                        }}
                      >
                        <span
                          aria-hidden="true"
                          style={{
                            width: 5,
                            height: 5,
                            borderRadius: "50%",
                            background: phase.solidColor,
                            flexShrink: 0,
                            marginTop: 8,
                          }}
                        />
                        {bullet}
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}
