const timelineItems = [
  {
    year: "2019",
    label: "프로그램 런칭",
    desc: "1기 모집 시작",
    color: "#4285F4",
    glow: "rgba(66,133,244,0.5)",
    position: "top",
  },
  {
    year: "2021",
    label: "혜택 확대",
    desc: "지원 규모 대폭 증가",
    color: "#34A853",
    glow: "rgba(52,168,83,0.5)",
    position: "bottom",
  },
  {
    year: "2023",
    label: "400개 돌파",
    desc: "누적 참여 기업 기록",
    color: "#FBBC05",
    glow: "rgba(251,188,5,0.5)",
    position: "top",
  },
  {
    year: "2026",
    label: "8기 오픈",
    desc: "포털 및 신규 모집",
    color: "#EA4335",
    glow: "rgba(234,67,53,0.5)",
    position: "bottom",
  },
];

const supportItems = [
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: "18px", height: "18px" }}>
        <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
      </svg>
    ),
    color: "#4285F4",
    title: "맞춤형 교육",
    desc: "성장 단계별 커리큘럼",
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: "18px", height: "18px" }}>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    color: "#34A853",
    title: "구글 전문가 멘토링",
    desc: "현직 구글 전문가 1:1 연결",
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: "18px", height: "18px" }}>
        <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
    ),
    color: "#FBBC05",
    title: "글로벌 마케팅 지원",
    desc: "구글플레이 피처링 & 퍼블리싱",
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: "18px", height: "18px" }}>
        <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    ),
    color: "#EA4335",
    title: "투자 유치 기회",
    desc: "IR 피칭 & 네트워킹 데이",
  },
];

interface AboutSectionProps {
  isDark?: boolean;
}

export function AboutSection({ isDark = false }: AboutSectionProps) {
  // ── Theme tokens ────────────────────────────────────────
  const t = isDark ? {
    sectionBg:
      "radial-gradient(circle at 15% 60%, rgba(30,15,60,0.5) 0%, transparent 55%), " +
      "radial-gradient(circle at 85% 20%, rgba(10,30,70,0.4) 0%, transparent 55%), " +
      "linear-gradient(180deg, #070d1a 0%, #0a1020 60%, #0c1228 100%)",
    dotGrid: "rgba(255,255,255,0.04)",
    glowBlue: "rgba(66,133,244,0.08)",
    glowRed: "rgba(234,67,53,0.07)",
    badgeBg: "rgba(66,133,244,0.1)",
    badgeBorder: "rgba(66,133,244,0.28)",
    badgeColor: "#4285F4",
    headingColor: "#fff",
    subText: "rgba(255,255,255,0.4)",
    timelineDesc: "rgba(255,255,255,0.45)",
    timelineCaption: "rgba(255,255,255,0.25)",
    nodeInnerBg: (c: string) => `radial-gradient(circle at 35% 35%, ${c}33, rgba(10,15,30,0.9))`,
    endDotBg: "rgba(255,255,255,0.25)",
    endDotGlow: "rgba(255,255,255,0.2)",
    cardBg: "rgba(255,255,255,0.04)",
    cardBorder: "rgba(255,255,255,0.1)",
    cardShadow: "none",
    cardBackdrop: "blur(16px)",
    supportItemBg: "rgba(255,255,255,0.04)",
    supportItemBorder: "rgba(255,255,255,0.08)",
    supportHoverBg: "rgba(255,255,255,0.07)",
    supportHoverBorder: "rgba(255,255,255,0.18)",
    itemTitle: "#fff",
    itemDesc: "rgba(255,255,255,0.45)",
    dividerColor: "rgba(255,255,255,0.1)",
    footerText: "rgba(255,255,255,0.22)",
  } : {
    sectionBg:
      "radial-gradient(circle at 15% 60%, rgba(66,133,244,0.04) 0%, transparent 55%), " +
      "radial-gradient(circle at 85% 20%, rgba(52,168,83,0.03) 0%, transparent 55%), " +
      "linear-gradient(180deg, #ffffff 0%, #F4F6FB 60%, #EEF1F8 100%)",
    dotGrid: "rgba(0,0,0,0.04)",
    glowBlue: "rgba(66,133,244,0.06)",
    glowRed: "rgba(234,67,53,0.04)",
    badgeBg: "rgba(66,133,244,0.08)",
    badgeBorder: "rgba(66,133,244,0.22)",
    badgeColor: "#4285F4",
    headingColor: "#0D1117",
    subText: "rgba(0,0,0,0.42)",
    timelineDesc: "rgba(0,0,0,0.48)",
    timelineCaption: "rgba(0,0,0,0.32)",
    nodeInnerBg: (c: string) => `radial-gradient(circle at 35% 35%, ${c}22, #f8faff)`,
    endDotBg: "rgba(0,0,0,0.18)",
    endDotGlow: "rgba(0,0,0,0.08)",
    cardBg: "#ffffff",
    cardBorder: "rgba(0,0,0,0.08)",
    cardShadow: "0 4px 24px rgba(0,0,0,0.07)",
    cardBackdrop: "none",
    supportItemBg: "#F7F8FC",
    supportItemBorder: "rgba(0,0,0,0.07)",
    supportHoverBg: "#EEF2FF",
    supportHoverBorder: "rgba(66,133,244,0.2)",
    itemTitle: "#0D1117",
    itemDesc: "rgba(0,0,0,0.48)",
    dividerColor: "rgba(0,0,0,0.08)",
    footerText: "rgba(0,0,0,0.28)",
  };

  return (
    <>
      <style>{`
        @keyframes timelinePulse {
          0%, 100% { box-shadow: 0 0 0 0 transparent; }
          50% { box-shadow: 0 0 0 8px rgba(66,133,244,0.06); }
        }
        .timeline-node {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .timeline-node:hover {
          transform: scale(1.15);
        }
        .support-item {
          transition: background 0.25s ease, border-color 0.25s ease;
        }
        .support-item[data-dark="true"]:hover {
          background: rgba(255,255,255,0.07) !important;
          border-color: rgba(255,255,255,0.18) !important;
        }
        .support-item[data-dark="false"]:hover {
          background: #EEF2FF !important;
          border-color: rgba(66,133,244,0.2) !important;
        }
        @media (max-width: 900px) {
          .about-main-grid { grid-template-columns: 1fr !important; gap: 36px !important; }
        }
      `}</style>

      <section
        style={{
          position: "relative",
          width: "100vw",
          maxWidth: "100%",
          left: "50%",
          transform: "translateX(-50%)",
          padding: "clamp(60px, 10vw, 100px) clamp(20px, 5vw, 40px) clamp(70px, 11vw, 110px)",
          background: t.sectionBg,
          fontFamily: "'Pretendard', -apple-system, sans-serif",
          boxSizing: "border-box",
          overflow: "hidden",
          transition: "background 0.4s ease",
        }}
      >
        {/* Dot grid */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
          backgroundImage: `radial-gradient(${t.dotGrid} 1px, transparent 1px)`,
          backgroundSize: "36px 36px",
        }} />

        {/* Ambient glows */}
        <div style={{
          position: "absolute", top: "-60px", left: "8%", width: "360px", height: "360px",
          borderRadius: "50%", pointerEvents: "none", zIndex: 0,
          background: `radial-gradient(circle, ${t.glowBlue} 0%, transparent 70%)`,
        }} />
        <div style={{
          position: "absolute", bottom: "-60px", right: "6%", width: "320px", height: "320px",
          borderRadius: "50%", pointerEvents: "none", zIndex: 0,
          background: `radial-gradient(circle, ${t.glowRed} 0%, transparent 70%)`,
        }} />

        <div style={{ position: "relative", zIndex: 1, maxWidth: "1280px", margin: "0 auto" }}>

          {/* Section Header */}
          <div style={{ textAlign: "center", marginBottom: "72px" }}>
            <h2 style={{
              color: t.headingColor, fontSize: "clamp(26px, 3.5vw, 42px)",
              fontWeight: 800, margin: "0 0 14px", letterSpacing: "-1.5px", lineHeight: 1.2,
            }}>
              구글 창구 프로그램
            </h2>
            <p style={{ color: t.subText, fontSize: "15px", margin: 0, lineHeight: 1.7 }}>
              당신의 기업이 글로벌 시장에서 PLAY 될 때까지 함께합니다.
            </p>
          </div>

          {/* Main Layout: Timeline (left) + Support (right) */}
          <div className="about-main-grid" style={{
            display: "grid",
            gridTemplateColumns: "1fr 340px",
            gap: "48px",
            alignItems: "center",
          }}>

            {/* ── Left: Timeline ── */}
            <div style={{ position: "relative" }}>
              <div style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "80px 0",
              }}>
                {/* Connecting line */}
                <div style={{
                  position: "absolute", top: "50%", left: "5%", right: "5%",
                  height: "2px", transform: "translateY(-50%)",
                  background: "linear-gradient(to right, #4285F4, #34A853, #FBBC05, #EA4335)",
                  opacity: isDark ? 0.35 : 0.45,
                  borderRadius: "2px", zIndex: 0,
                }} />
                {/* Glow line */}
                <div style={{
                  position: "absolute", top: "50%", left: "5%", right: "5%",
                  height: "1px", transform: "translateY(-50%)",
                  background: "linear-gradient(to right, #4285F4, #34A853, #FBBC05, #EA4335)",
                  filter: "blur(4px)",
                  opacity: isDark ? 0.25 : 0.3,
                  zIndex: 0,
                }} />

                {/* START dot */}
                <div style={{
                  position: "absolute", left: "0", top: "50%",
                  transform: "translateY(-50%)", zIndex: 1,
                }}>
                  <div style={{
                    width: "14px", height: "14px", borderRadius: "50%",
                    background: "#4285F4", boxShadow: "0 0 12px #4285F4",
                  }} />
                  <span style={{
                    position: "absolute", top: "-28px", left: "50%",
                    transform: "translateX(-50%)",
                    color: "#4285F4", fontSize: "11px", fontWeight: 800,
                    letterSpacing: "1px", whiteSpace: "nowrap",
                  }}>START</span>
                </div>

                {/* Nodes */}
                {timelineItems.map((item, i) => (
                  <div key={i} style={{
                    position: "relative", display: "flex", flexDirection: "column",
                    alignItems: "center", zIndex: 1, flex: 1,
                  }}>
                    {/* Top label */}
                    {item.position === "top" && (
                      <div style={{
                        textAlign: "center", marginBottom: "20px", minHeight: "64px",
                        display: "flex", flexDirection: "column",
                        alignItems: "center", justifyContent: "flex-end",
                      }}>
                        <span style={{
                          color: item.color, fontSize: "clamp(11px, 1.2vw, 13px)",
                          fontWeight: 800, letterSpacing: "0.5px", display: "block", marginBottom: "4px",
                        }}>
                          {item.label}
                        </span>
                        <span style={{ color: t.timelineDesc, fontSize: "clamp(10px, 1vw, 12px)" }}>
                          {item.desc}
                        </span>
                      </div>
                    )}
                    {item.position === "bottom" && (
                      <div style={{ minHeight: "64px", marginBottom: "20px" }} />
                    )}

                    {/* Node circle */}
                    <div
                      className="timeline-node"
                      style={{
                        width: "clamp(56px, 6vw, 72px)",
                        height: "clamp(56px, 6vw, 72px)",
                        borderRadius: "50%",
                        background: t.nodeInnerBg(item.color),
                        border: `2px solid ${item.color}66`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: isDark
                          ? `0 0 20px ${item.glow}, 0 0 40px ${item.glow.replace("0.5", "0.15")}`
                          : `0 4px 16px ${item.color}30, 0 0 0 1px ${item.color}22`,
                        cursor: "default", position: "relative", zIndex: 2,
                      }}
                    >
                      {/* Connector to label (extends toward text) */}
                      <div style={{
                        position: "absolute",
                        [item.position === "top" ? "top" : "bottom"]: "-22px",
                        left: "50%", transform: "translateX(-50%)",
                        width: "2px", height: "22px",
                        background: `linear-gradient(${item.position === "top" ? "to top" : "to bottom"}, ${item.color}88, transparent)`,
                      }} />
                      <span style={{
                        color: item.color, fontSize: "clamp(13px, 1.4vw, 16px)",
                        fontWeight: 900, letterSpacing: "-0.5px",
                      }}>
                        {item.year}
                      </span>
                    </div>

                    {/* Bottom label */}
                    {item.position === "bottom" && (
                      <div style={{
                        textAlign: "center", marginTop: "20px", minHeight: "64px",
                        display: "flex", flexDirection: "column",
                        alignItems: "center", justifyContent: "flex-start",
                      }}>
                        <span style={{
                          color: item.color, fontSize: "clamp(11px, 1.2vw, 13px)",
                          fontWeight: 800, letterSpacing: "0.5px", display: "block", marginBottom: "4px",
                        }}>
                          {item.label}
                        </span>
                        <span style={{ color: t.timelineDesc, fontSize: "clamp(10px, 1vw, 12px)" }}>
                          {item.desc}
                        </span>
                      </div>
                    )}
                    {item.position === "top" && (
                      <div style={{ minHeight: "64px", marginTop: "20px" }} />
                    )}
                  </div>
                ))}

                {/* END dot */}
                <div style={{
                  position: "absolute", right: "0", top: "50%",
                  transform: "translateY(-50%)", zIndex: 1,
                }}>
                  <div style={{
                    width: "10px", height: "10px", borderRadius: "50%",
                    background: t.endDotBg,
                    boxShadow: `0 0 8px ${t.endDotGlow}`,
                  }} />
                </div>
              </div>

              {/* Timeline caption */}
              <p style={{
                textAlign: "center", color: t.timelineCaption,
                fontSize: "13px", marginTop: "8px",
                fontWeight: 500, letterSpacing: "0.03em",
              }}>
                2019 → 현재까지 함께 성장한 여정
              </p>
            </div>

            {/* ── Right: Support ── */}
            <div style={{
              padding: "8px 4px",
              position: "relative",
            }}>
              <h3 style={{
                color: t.headingColor, fontSize: "20px", fontWeight: 800,
                margin: "0 0 24px", letterSpacing: "-0.5px", lineHeight: 1.3,
              }}>
                무엇을 지원하나요?
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {supportItems.map((item, i) => (
                  <div
                    key={i}
                    className="support-item"
                    data-dark={String(isDark)}
                    style={{
                      display: "flex", alignItems: "center", gap: "14px",
                      background: t.supportItemBg,
                      border: `1px solid ${t.supportItemBorder}`,
                      borderRadius: "14px",
                      padding: "14px 16px",
                      cursor: "default",
                    }}
                  >
                    <div style={{
                      width: "38px", height: "38px", flexShrink: 0,
                      borderRadius: "10px",
                      background: `${item.color}15`,
                      border: `1px solid ${item.color}40`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: item.color,
                    }}>
                      {item.icon}
                    </div>
                    <div>
                      <div style={{ color: t.itemTitle, fontSize: "14px", fontWeight: 700, marginBottom: "2px" }}>
                        {item.title}
                      </div>
                      <div style={{ color: t.itemDesc, fontSize: "12px", lineHeight: 1.4 }}>
                        {item.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Bottom divider */}
          <div style={{ marginTop: "72px", display: "flex", alignItems: "center", gap: "24px" }}>
            <div style={{ flex: 1, height: "1px", background: `linear-gradient(to right, transparent, ${t.dividerColor})` }} />
            <span style={{
              color: t.footerText, fontSize: "12px",
              fontWeight: 500, whiteSpace: "nowrap", letterSpacing: "0.05em",
            }}>
              NCF × GOOGLE PLAY × MSS × KISED
            </span>
            <div style={{ flex: 1, height: "1px", background: `linear-gradient(to left, transparent, ${t.dividerColor})` }} />
          </div>

        </div>
      </section>
    </>
  );
}