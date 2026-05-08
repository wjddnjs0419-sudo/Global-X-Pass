// Layout constants (px)
const CTH = 500;   // container height
const CO  = 168;   // outer dashed ring diameter
const CH  = 42;    // connector height
const SP  = 45; // dot center = SP + CO + CH - 5 = 250 = midline

const phases = [
  {
    year: "2019",
    solidColor: "#4377F1",
    gradient: "linear-gradient(135deg, #4377F1 0%, #16DBBB 100%)",
    label: "프로그램 런칭",
    desc: "1기 모집 시작",
    bullets: [
      "구글플레이 공식 파트너십 체결",
      "스타트업 30개사 1기 선발",
      "글로벌 마케팅 컨설팅 론칭",
      "교육 · 멘토링 프로그램 시작",
    ],
  },
  {
    year: "2021",
    solidColor: "#18A343",
    gradient: "linear-gradient(135deg, #18A343 0%, #37AD9A 100%)",
    label: "혜택 확대",
    desc: "지원 규모 대폭 증가",
    bullets: [
      "참여사 100개사 돌파",
      "글로벌 진출 지원 프로그램 신설",
      "구글 전문가 1:1 멘토링 강화",
      "교육 커리큘럼 전면 개편",
    ],
  },
  {
    year: "2023",
    solidColor: "#FBBC05",
    gradient: "linear-gradient(135deg, #FFEE56 0%, #FFC2B4 100%)",
    label: "400개 돌파",
    desc: "누적 참여 기업 기록",
    bullets: [
      "누적 400개 참여사 기록 달성",
      "IR 피칭 데이 정례화",
      "해외 파트너십 다각화",
      "네트워킹 커뮤니티 플랫폼 확장",
    ],
  },
  {
    year: "2026",
    solidColor: "#EA4335",
    gradient: "linear-gradient(135deg, #FF4340 0%, #FF7C44 100%)",
    label: "8기 오픈",
    desc: "포털 및 신규 모집",
    bullets: [
      "디지털 포털 플랫폼 구축",
      "AI · 글로벌 특화 트랙 신설",
      "100개사 신규 모집",
      "창업 생태계 협력 확대",
    ],
  },
];

interface AboutSectionProps {
  isDark?: boolean;
}

export function AboutSection({ isDark = false }: AboutSectionProps) {
  const ac = "#6B6EE8"; // structural indigo for connectors & line
  const aA = (o: number) => `rgba(107,110,232,${o})`;

  const t = isDark ? {
    sectionBg:
      "radial-gradient(circle at 15% 60%, rgba(30,15,60,0.5) 0%, transparent 55%), " +
      "radial-gradient(circle at 85% 20%, rgba(10,30,70,0.4) 0%, transparent 55%), " +
      "linear-gradient(180deg, #070d1a 0%, #0a1020 60%, #0c1228 100%)",
    dotGrid:      "rgba(255,255,255,0.04)",
    glowBlue:     aA(0.1),
    glowRed:      "rgba(234,67,53,0.07)",
    headingColor: "#fff",
    subText:      "rgba(255,255,255,0.4)",
    innerBg:      "#14183a",
    innerShadow:  "inset 2px 2px 10px rgba(0,0,0,0.5)",
    ringGlow:     `5px 5px 18px rgba(0,0,0,0.5), -3px -3px 10px rgba(255,255,255,0.04)`,
    dashColor:    aA(0.4),
    lineColor:    aA(0.35),
    dotColor:     ac,
    labelColor:   "#e8e8ff",
    descColor:    "rgba(200,200,255,0.68)",
    bulletColor:  "rgba(200,200,255,0.55)",
  } : {
    sectionBg:
      "radial-gradient(circle at 15% 60%, rgba(107,110,232,0.05) 0%, transparent 55%), " +
      "radial-gradient(circle at 85% 20%, rgba(107,110,232,0.03) 0%, transparent 55%), " +
      "linear-gradient(180deg, #ffffff 0%, #F4F6FB 60%, #EEF1F8 100%)",
    dotGrid:      "rgba(0,0,0,0.04)",
    glowBlue:     aA(0.07),
    glowRed:      "rgba(234,67,53,0.04)",
    headingColor: "#0D1117",
    subText:      "rgba(0,0,0,0.42)",
    innerBg:      "#ffffff",
    innerShadow:  "inset 2px 2px 8px rgba(0,0,0,0.07)",
    ringGlow:     `5px 5px 18px rgba(0,0,0,0.12), -3px -3px 10px rgba(255,255,255,0.9)`,
    dashColor:    aA(0.35),
    lineColor:    aA(0.35),
    dotColor:     ac,
    labelColor:   "#1e1e50",
    descColor:    "rgba(30,30,80,0.72)",
    bulletColor:  "rgba(30,30,80,0.62)",
  };

  const renderCircle = (phase: typeof phases[0]) => (
    <div
      aria-hidden="true"
      style={{
        width: CO, height: CO, borderRadius: "50%",
        border: `2px dashed ${phase.solidColor}66`,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {/* Gradient ring */}
      <div style={{
        width: 144, height: 144, borderRadius: "50%",
        background: phase.gradient,
        boxShadow: t.ringGlow,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {/* Inner circle — year only */}
        <div style={{
          width: 100, height: 100, borderRadius: "50%",
          background: t.innerBg,
          boxShadow: t.innerShadow,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{
            fontSize: "22px", fontWeight: 900,
            color: phase.solidColor, letterSpacing: "-1px", lineHeight: 1,
          }}>
            {phase.year}
          </span>
        </div>
      </div>
    </div>
  );

  const renderConnector = (isTop: boolean) => (
    <div
      aria-hidden="true"
      style={{
        height: CH, width: "100%",
        display: "flex", flexDirection: "column", alignItems: "center",
        flexShrink: 0,
      }}
    >
      {isTop ? (
        <>
          <div style={{ flex: 1, borderLeft: `2px dashed ${t.dashColor}` }} />
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: t.dotColor, flexShrink: 0 }} />
        </>
      ) : (
        <>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: t.dotColor, flexShrink: 0 }} />
          <div style={{ flex: 1, borderLeft: `2px dashed ${t.dashColor}` }} />
        </>
      )}
    </div>
  );

  const renderText = (phase: typeof phases[0]) => (
    <ul style={{
      listStyle: "none", padding: 0, margin: 0,
      textAlign: "left", width: "100%",
    }}>
      <li style={{
        fontWeight: 700, fontSize: "15px",
        color: t.labelColor, lineHeight: 1.4, marginBottom: "6px",
      }}>
        {phase.label}
      </li>
      <li style={{
        fontSize: "12px", color: t.descColor,
        lineHeight: 1.6, marginBottom: "3px",
      }}>
        {phase.desc}
      </li>
      {phase.bullets.map((b) => (
        <li key={b} style={{ fontSize: "11.5px", color: t.bulletColor, lineHeight: 1.65 }}>
          {b}
        </li>
      ))}
    </ul>
  );

  return (
    <>
      <style>{`
        .about-tl-desktop { display: block; }
        .about-tl-mobile  { display: none; }
        @media (max-width: 900px) {
          .about-tl-desktop { display: none !important; }
          .about-tl-mobile  { display: flex !important; }
        }
      `}</style>

      <section
        style={{
          position: "relative",
          width: "100vw", maxWidth: "100%",
          left: "50%", transform: "translateX(-50%)",
          padding: "clamp(60px, 10vw, 100px) clamp(20px, 5vw, 40px) clamp(56px, 8vw, 84px)",
          background: t.sectionBg,
          fontFamily: "'Pretendard', -apple-system, sans-serif",
          boxSizing: "border-box",
          overflow: "hidden",
          transition: "background 0.4s ease",
        }}
      >
        {/* Dot grid */}
        <div aria-hidden="true" style={{
          position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
          backgroundImage: `radial-gradient(${t.dotGrid} 1px, transparent 1px)`,
          backgroundSize: "36px 36px",
        }} />

        {/* Ambient glows */}
        <div aria-hidden="true" style={{
          position: "absolute", top: "-60px", left: "8%",
          width: "360px", height: "360px",
          borderRadius: "50%", pointerEvents: "none", zIndex: 0,
          background: `radial-gradient(circle, ${t.glowBlue} 0%, transparent 70%)`,
        }} />
        <div aria-hidden="true" style={{
          position: "absolute", bottom: "-60px", right: "6%",
          width: "320px", height: "320px",
          borderRadius: "50%", pointerEvents: "none", zIndex: 0,
          background: `radial-gradient(circle, ${t.glowRed} 0%, transparent 70%)`,
        }} />

        <div style={{ position: "relative", zIndex: 1, maxWidth: "1280px", margin: "0 auto" }}>

          {/* Section Header */}
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <h2 style={{
              color: t.headingColor,
              fontSize: "clamp(24px, 3vw, 40px)",
              fontWeight: 800, margin: "0 0 14px",
              letterSpacing: 0, lineHeight: 1.15,
            }}>
              구글 창구 프로그램
            </h2>
            <p style={{ color: t.subText, fontSize: "15px", margin: 0, lineHeight: 1.65 }}>
              당신의 기업이 글로벌 시장에서 PLAY 될 때까지 함께합니다.
            </p>
          </div>

          {/* ── Desktop: zigzag timeline ── */}
          <div
            className="about-tl-desktop"
            style={{ position: "relative", height: CTH }}
          >
            {/* Horizontal connecting line */}
            <div aria-hidden="true" style={{
              position: "absolute",
              top: CTH / 2,
              left: "12.5%", right: "12.5%",
              height: "2px",
              background: t.lineColor,
              transform: "translateY(-50%)",
            }} />

            {/* 4 phase columns */}
            {phases.map((phase, i) => {
              const isTop = i % 2 === 0;
              const leftPct = `${(i + 0.5) * 25}%`;

              return (
                <div
                  key={phase.year}
                  style={{
                    position: "absolute",
                    left: leftPct,
                    transform: "translateX(-50%)",
                    width: "22%",
                    height: CTH,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  {isTop ? (
                    <>
                      {/* top spacer → circle → connector → gap → text */}
                      <div style={{ height: SP, flexShrink: 0 }} />
                      {renderCircle(phase)}
                      {renderConnector(true)}
                      <div style={{ height: 12, flexShrink: 0 }} />
                      <div style={{
                        flex: 1, width: "100%",
                        display: "flex", flexDirection: "column",
                        alignItems: "center", justifyContent: "flex-start",
                      }}>
                        {renderText(phase)}
                      </div>
                    </>
                  ) : (
                    <>
                      {/* text → gap → connector → circle → bottom spacer */}
                      <div style={{
                        flex: 1, width: "100%",
                        display: "flex", flexDirection: "column",
                        alignItems: "center", justifyContent: "flex-end",
                      }}>
                        {renderText(phase)}
                      </div>
                      <div style={{ height: 12, flexShrink: 0 }} />
                      {renderConnector(false)}
                      {renderCircle(phase)}
                      <div style={{ height: SP, flexShrink: 0 }} />
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Mobile: vertical list ── */}
          <ol
            className="about-tl-mobile"
            style={{
              flexDirection: "column", gap: "28px",
              listStyle: "none", padding: 0, margin: 0,
            }}
          >
            {phases.map((phase) => (
              <li key={phase.year} style={{ display: "flex", gap: "18px", alignItems: "flex-start" }}>
                {/* Mini circle — year only */}
                <div
                  aria-hidden="true"
                  style={{
                    width: 72, height: 72, borderRadius: "50%", flexShrink: 0,
                    background: phase.gradient,
                    boxShadow: t.ringGlow,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <span style={{ fontSize: "15px", fontWeight: 900, color: "#fff", lineHeight: 1, letterSpacing: "-0.5px" }}>
                    {phase.year}
                  </span>
                </div>

                {/* Text */}
                <div style={{ flex: 1, paddingTop: "6px" }}>
                  <div style={{ fontWeight: 700, fontSize: "15px", color: t.labelColor, marginBottom: "4px" }}>
                    {phase.label}
                  </div>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "2px" }}>
                    <li style={{ fontSize: "12px", color: t.descColor, marginBottom: "2px" }}>{phase.desc}</li>
                    {phase.bullets.map((b) => (
                      <li key={b} style={{ display: "flex", gap: "7px", alignItems: "flex-start", fontSize: "11.5px", color: t.bulletColor }}>
                        <span aria-hidden="true" style={{ width: 4, height: 4, borderRadius: "50%", background: phase.solidColor, flexShrink: 0, marginTop: 5 }} />
                        {b}
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
