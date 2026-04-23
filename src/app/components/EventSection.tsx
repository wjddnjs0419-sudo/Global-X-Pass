// ─── 행사 소식 섹션 ──────────────────────────────────────────────
import { Link } from "react-router";
import { getSectionTheme } from "../utils/sectionTheme";

interface EventSectionProps { isDark?: boolean; }

const featured = {
  badge: "D-16",
  badgeColor: "#18A343",
  date: "2026.05.08 (목)",
  time: "오후 2:00 – 4:00",
  location: "온라인 ZOOM",
  title: "2026 창구 프로그램 8기\n사전 설명회",
  desc: "8기 모집 공고의 상세 내용, 지원 자격, 선발 프로세스, 혜택 패키지를 현장에서 직접 Q&A로 확인할 수 있는 공식 사전 설명회입니다. Google 담당자와 NCF 매니저가 직접 안내합니다.",
  speakers: ["Google Play 파트너십 팀", "NCF 프로그램 매니저"],
  ctaText: "사전 등록하기",
};

const upcomingEvents = [
  {
    date: "05.15 – 05.22",
    type: "심사",
    typeColor: "#4377F1",
    title: "서류 심사 기간",
    location: "온라인 서류 접수",
    desc: "지원서 및 첨부 서류 검토 기간. 미비 서류 보완 요청은 05.18까지.",
  },
  {
    date: "05.30 (토)",
    type: "발표",
    typeColor: "#EA4335",
    title: "최종 합격 발표",
    location: "이메일 개별 통보",
    desc: "최종 선발 기업 발표 및 OT 일정 안내. 탈락 기업은 피드백 제공.",
  },
  {
    date: "06.14 (토)",
    type: "오프라인",
    typeColor: "#20D6A2",
    title: "8기 Kick-off 네트워킹 데이",
    location: "구글 코리아 오피스 (강남)",
    desc: "8기 참가 기업 CEO 및 Google 전문가 첫 오프라인 만남. 팀 빌딩 및 목표 설정 워크숍.",
  },
  {
    date: "07.09 (수)",
    type: "세미나",
    typeColor: "#FBBC05",
    title: "동남아 시장 진출 전략 세미나",
    location: "온라인 ZOOM",
    desc: "인도네시아, 베트남, 태국 앱 시장 현황 분석 및 현지 파트너십 전략 특강.",
  },
];

export function EventSection({ isDark = false }: EventSectionProps) {
  const th = getSectionTheme(isDark);

  return (
    <section style={{
      position: "relative", width: "100vw", maxWidth: "100%",
      left: "50%", transform: "translateX(-50%)",
      padding: "clamp(60px, 10vw, 100px) clamp(20px, 5vw, 40px) clamp(70px, 11vw, 110px)",
      background: isDark
        ? "radial-gradient(circle at 10% 80%, rgba(24,163,67,0.06) 0%, transparent 50%), linear-gradient(180deg, #070d1a 0%, #0a1020 100%)"
        : "radial-gradient(circle at 10% 80%, rgba(24,163,67,0.05) 0%, transparent 50%), linear-gradient(180deg, #F4F6FB 0%, #ffffff 100%)",
      fontFamily: "'Pretendard', -apple-system, sans-serif",
      boxSizing: "border-box", overflow: "hidden",
      transition: "background 0.4s ease",
    }}>
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: `radial-gradient(${th.dotGrid} 1px, transparent 1px)`,
        backgroundSize: "36px 36px",
      }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: "1280px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "48px", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <h2 style={{ color: th.headingColor, fontSize: "clamp(24px,3vw,40px)", fontWeight: 800, margin: 0, letterSpacing: "-1.2px", lineHeight: 1.15 }}>
              행사 소식
            </h2>
          </div>
          <Link to="/events" style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            color: "#18A343", fontSize: "13px", fontWeight: 700, textDecoration: "none",
            padding: "8px 16px",
            background: "rgba(24,163,67,0.08)", border: "1px solid rgba(24,163,67,0.2)",
            borderRadius: "100px",
          }}>
            전체 일정 보기
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
        </div>

        {/* Layout */}
        <div className="event-layout-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          <style>{`
            @media (max-width: 900px) {
              .event-layout-grid { grid-template-columns: 1fr !important; }
            }
          `}</style>

          {/* Featured event */}
          <div style={{
            background: isDark
              ? "linear-gradient(135deg, rgba(24,163,67,0.12) 0%, rgba(55,173,154,0.08) 100%)"
              : "linear-gradient(135deg, rgba(24,163,67,0.08) 0%, rgba(55,173,154,0.05) 100%)",
            border: `1px solid rgba(24,163,67,${isDark ? "0.25" : "0.18"})`,
            borderRadius: "24px", padding: "clamp(22px, 5vw, 36px)",
            boxShadow: isDark ? "none" : "0 4px 24px rgba(24,163,67,0.08)",
            display: "flex", flexDirection: "column", gap: "20px",
            position: "relative", overflow: "hidden",
          }}>
            {/* Glow */}
            <div style={{
              position: "absolute", top: "-40px", left: "-40px", width: "200px", height: "200px",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(24,163,67,0.15) 0%, transparent 70%)",
              pointerEvents: "none",
            }} />
            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
                <span style={{
                  fontSize: "11px", fontWeight: 800, letterSpacing: "1px",
                  color: "#fff", background: "#18A343",
                  padding: "4px 10px", borderRadius: "6px",
                }}>{featured.badge}</span>
                <span style={{
                  fontSize: "11px", fontWeight: 700,
                  color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.45)",
                  background: th.tagBg, border: `1px solid ${th.tagBorder}`,
                  padding: "4px 10px", borderRadius: "6px",
                }}>다음 행사</span>
              </div>

              <h3 style={{
                color: th.headingColor, fontSize: "clamp(20px,2.2vw,26px)",
                fontWeight: 800, margin: "0 0 12px", letterSpacing: "-0.8px", lineHeight: 1.3,
                whiteSpace: "pre-line",
              }}>{featured.title}</h3>
              <p style={{ color: th.subText, fontSize: "14px", margin: "0 0 20px", lineHeight: 1.7 }}>
                {featured.desc}
              </p>

              {/* Event meta chips */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "20px" }}>
                {[
                  { icon: "📅", text: featured.date },
                  { icon: "🕐", text: featured.time },
                  { icon: "📍", text: featured.location },
                ].map((m) => (
                  <div key={m.text} style={{
                    display: "flex", alignItems: "center", gap: "6px",
                    background: th.tagBg, border: `1px solid ${th.tagBorder}`,
                    borderRadius: "100px", padding: "6px 12px",
                    fontSize: "12px", color: th.itemTitle, fontWeight: 600,
                  }}>
                    <span>{m.icon}</span>
                    <span>{m.text}</span>
                  </div>
                ))}
              </div>

              {/* Speakers */}
              <div style={{ marginBottom: "24px" }}>
                <div style={{ color: th.mutedText, fontSize: "11px", fontWeight: 700, letterSpacing: "1px", marginBottom: "8px" }}>발표자</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  {featured.speakers.map((s) => (
                    <div key={s} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#18A343", flexShrink: 0 }} />
                      <span style={{ color: th.itemTitle, fontSize: "13px", fontWeight: 600 }}>{s}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button style={{
                background: "linear-gradient(135deg, #18A343 0%, #37AD9A 100%)",
                color: "#fff", border: "none",
                borderRadius: "100px", padding: "12px 28px",
                fontSize: "14px", fontWeight: 800, cursor: "pointer",
                boxShadow: "0 4px 16px rgba(24,163,67,0.35)",
                width: "100%",
              }}>
                {featured.ctaText} →
              </button>
            </div>
          </div>

          {/* Upcoming events list */}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {upcomingEvents.map((ev, i) => (
              <div key={i} style={{
                background: th.cardBg, border: `1px solid ${th.cardBorder}`,
                borderRadius: "16px", padding: "20px 22px",
                boxShadow: th.cardShadow, display: "flex", gap: "16px",
                transition: "transform 0.25s ease, box-shadow 0.25s ease",
                cursor: "default",
              }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform = "translateX(4px)";
                  (e.currentTarget as HTMLDivElement).style.boxShadow = isDark ? "0 4px 20px rgba(0,0,0,0.3)" : "0 4px 20px rgba(0,0,0,0.08)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform = "translateX(0)";
                  (e.currentTarget as HTMLDivElement).style.boxShadow = th.cardShadow;
                }}
              >
                {/* Date column */}
                <div style={{ flexShrink: 0, width: "80px" }}>
                  <div style={{ fontSize: "12px", fontWeight: 800, color: ev.typeColor, marginBottom: "2px" }}>{ev.date}</div>
                  <span style={{
                    fontSize: "10px", fontWeight: 800, letterSpacing: "0.5px",
                    color: ev.typeColor,
                    background: `${ev.typeColor}15`,
                    border: `1px solid ${ev.typeColor}35`,
                    padding: "2px 7px", borderRadius: "4px",
                  }}>{ev.type}</span>
                </div>
                {/* Divider */}
                <div style={{ width: "1px", background: th.rowDivider, flexShrink: 0 }} />
                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: th.itemTitle, fontSize: "14px", fontWeight: 700, marginBottom: "4px" }}>{ev.title}</div>
                  <div style={{ color: th.mutedText, fontSize: "11px", marginBottom: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    {ev.location}
                  </div>
                  <div style={{ color: th.itemDesc, fontSize: "12px", lineHeight: 1.5 }}>{ev.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
