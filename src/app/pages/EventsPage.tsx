import { PageShell } from "../components/PageShell";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { useTheme } from "../ThemeContext";

const EVENT_IMAGES = [
  "https://images.unsplash.com/photo-1776039325163-f45315a484f3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080&q=80",
  "https://images.unsplash.com/photo-1571645163064-77faa9676a46?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080&q=80",
  "https://images.unsplash.com/photo-1762968274962-20c12e6e8ecd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080&q=80",
  "https://images.unsplash.com/photo-1558008258-3256797b43f3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080&q=80",
  "https://images.unsplash.com/photo-1508997449629-303059a039c0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080&q=80",
];

const EVENTS = [
  {
    id: 1,
    status: "접수중",
    statusColor: "#20D6A2",
    category: "네트워킹",
    date: "2026.05.08 (목) 18:00",
    location: "서울 성수 Studio X",
    title: "NCF Spring Networking Night 2026",
    desc: "스타트업 대표·투자자·멘토 200명이 모이는 상반기 최대 네트워킹 이벤트입니다. 피칭 세션, 멘토 매칭, 미니 IR 데모데이가 포함됩니다.",
    spots: "200명 / 잔여 47석",
    tags: ["네트워킹", "피칭", "투자자"],
  },
  {
    id: 2,
    status: "접수중",
    statusColor: "#20D6A2",
    category: "워크숍",
    date: "2026.05.15 (목) 10:00–17:00",
    location: "서울 강남 NCF 센터",
    title: "글로벌 진출 전략 워크숍 — 동남아 편",
    desc: "싱가포르·베트남·인도네시아 현지 전문가와 함께하는 반일 워크숍. 시장 진입 전략, 법인 설립, 파트너십 구축 전반을 다룹니다.",
    spots: "40명 / 잔여 12석",
    tags: ["글로벌", "동남아", "워크숍"],
  },
  {
    id: 3,
    status: "마감임박",
    statusColor: "#F59E0B",
    category: "데모데이",
    date: "2026.05.22 (금) 13:00",
    location: "코엑스 컨퍼런스 룸 E",
    title: "창구 프로그램 3기 데모데이",
    desc: "창구 프로그램 3기 선발 스타트업 15개 팀의 최종 성과 발표 및 투자 미팅 행사입니다. 국내외 VC 50+ 참석 예정.",
    spots: "300명 / 잔여 8석",
    tags: ["데모데이", "창구", "IR"],
  },
  {
    id: 4,
    status: "예정",
    statusColor: "#60A5FA",
    category: "컨퍼런스",
    date: "2026.06.04 (목) 09:00",
    location: "그랜드 인터컨티넨탈 서울 파르나스",
    title: "NCF Global Innovation Summit 2026",
    desc: "국내외 혁신 생태계 리더들이 한자리에 모이는 연례 서밋. 기조연설, 패널 토론, 1:1 비즈니스 매칭이 예정되어 있습니다.",
    spots: "500명 (사전 등록 예정)",
    tags: ["서밋", "글로벌", "컨퍼런스"],
  },
  {
    id: 5,
    status: "예정",
    statusColor: "#60A5FA",
    category: "해외 탐방",
    date: "2026.06.15–20 (5박 6일)",
    location: "일본 도쿄",
    title: "Japan Tech Tour 2026 — 도쿄 스타트업 생태계 탐방",
    desc: "소프트뱅크, 500 Startups Japan 등 현지 VC 및 액셀러레이터 방문. 한일 스타트업 교류 네트워킹 포함.",
    spots: "20명 (별도 선발)",
    tags: ["해외", "일본", "탐방"],
  },
];

export function EventsPage() {
  const { isDark } = useTheme();

  const card = isDark ? "rgba(255,255,255,0.04)" : "#ffffff";
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)";
  const textMain = isDark ? "rgba(255,255,255,0.92)" : "#0f172a";
  const textMuted = isDark ? "rgba(255,255,255,0.45)" : "rgba(15,23,42,0.45)";

  return (
    <PageShell
      title="행사"
      subtitle="NCF × Around X가 준비한 네트워킹·워크숍·데모데이를 확인하세요."
      accentColor="#20D6A2"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {EVENTS.map((ev, idx) => (
          <div
            key={ev.id}
            style={{
              background: card,
              border: `1px solid ${border}`,
              borderRadius: 20,
              overflow: "hidden",
              display: "grid",
              gridTemplateColumns: "minmax(160px, 260px) 1fr auto",
              gap: 0,
              alignItems: "stretch",
              cursor: "pointer",
              transition: "all 0.25s ease",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLDivElement;
              el.style.borderColor = ev.statusColor;
              el.style.boxShadow = isDark
                ? `0 8px 32px rgba(0,0,0,0.3)`
                : `0 8px 32px rgba(0,0,0,0.08)`;
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLDivElement;
              el.style.borderColor = border;
              el.style.boxShadow = "none";
            }}
          >
            {/* Cover image */}
            <div style={{ position: "relative", width: "100%", height: "100%", minHeight: 200, overflow: "hidden", background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }}>
              <ImageWithFallback
                src={EVENT_IMAGES[idx % EVENT_IMAGES.length]}
                alt={ev.title}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
              <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, transparent 50%, ${isDark ? "rgba(0,0,0,0.55)" : "rgba(0,0,0,0.25)"} 100%)` }} />
            </div>
            <div style={{ padding: "28px 32px" }}>
              {/* Status + category */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <span
                  style={{
                    padding: "4px 12px", borderRadius: 100,
                    background: `${ev.statusColor}22`,
                    color: ev.statusColor,
                    fontSize: 12, fontWeight: 700,
                    border: `1px solid ${ev.statusColor}44`,
                  }}
                >
                  {ev.status}
                </span>
                <span
                  style={{
                    padding: "4px 12px", borderRadius: 100,
                    background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
                    color: textMuted,
                    fontSize: 12, fontWeight: 600,
                  }}
                >
                  {ev.category}
                </span>
              </div>

              {/* Title */}
              <h2
                style={{
                  margin: "0 0 10px",
                  fontSize: 22, fontWeight: 800,
                  color: textMain, letterSpacing: "-0.03em",
                }}
              >
                {ev.title}
              </h2>

              {/* Desc */}
              <p style={{ margin: "0 0 18px", fontSize: 14, color: textMuted, lineHeight: 1.7 }}>
                {ev.desc}
              </p>

              {/* Tags */}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {ev.tags.map((t) => (
                  <span
                    key={t}
                    style={{
                      padding: "3px 10px", borderRadius: 6,
                      background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                      color: textMuted, fontSize: 12, fontWeight: 500,
                    }}
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>

            {/* Right info */}
            <div
              style={{
                minWidth: 220, flexShrink: 0,
                background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)",
                borderLeft: `1px solid ${border}`,
                padding: "28px 24px",
                margin: 0,
                display: "flex", flexDirection: "column", gap: 12,
              }}
            >
              {[
                { icon: "📅", label: "일시", value: ev.date },
                { icon: "📍", label: "장소", value: ev.location },
                { icon: "👥", label: "정원", value: ev.spots },
              ].map((info) => (
                <div key={info.label}>
                  <div style={{ fontSize: 11, color: textMuted, fontWeight: 600, marginBottom: 2 }}>
                    {info.icon} {info.label}
                  </div>
                  <div style={{ fontSize: 13, color: textMain, fontWeight: 600 }}>{info.value}</div>
                </div>
              ))}
              <button
                style={{
                  marginTop: 6, padding: "10px 0", borderRadius: 10, border: "none",
                  background: ev.status === "예정" ? (isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)") : ev.statusColor,
                  color: ev.status === "예정" ? textMuted : "#0a1020",
                  fontSize: 13, fontWeight: 700, cursor: ev.status === "예정" ? "default" : "pointer",
                  fontFamily: "'Pretendard', sans-serif",
                  transition: "all 0.2s ease",
                }}
              >
                {ev.status === "예정" ? "사전 알림 신청" : "신청하기 →"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
