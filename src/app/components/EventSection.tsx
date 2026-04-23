import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router"; // 💡 useNavigate 추가
import { getSectionTheme } from "../utils/sectionTheme";
import { supabase } from "../../lib/supabaseClient";

interface EventSectionProps { isDark?: boolean; }

// 💡 디자인 일관성을 위한 타입 컬러 맵
const TYPE_COLORS = ["#18A343", "#4377F1", "#EA4335", "#FBBC05"];

export function EventSection({ isDark = false }: EventSectionProps) {
  const th = getSectionTheme(isDark);
  const navigate = useNavigate(); // 💡 이동 함수 선언
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 💡 에러의 주범이었던 변수들을 여기서 선언해줍니다.
  const textMain = isDark ? "rgba(255,255,255,0.92)" : "#0f172a";
  const textMuted = isDark ? "rgba(255,255,255,0.45)" : "rgba(15,23,42,0.45)";

  useEffect(() => {
    const fetchEvents = async () => {
      // 최신 행사 5개 가져오기
      const { data } = await supabase
        .from('posts')
        .select('*')
        .eq('category', 'events')
        .order('created_at', { ascending: false })
        .limit(5);
      
      setEvents(data || []);
      setLoading(false);
    };
    fetchEvents();
  }, []);

  if (loading || events.length === 0) return null;

  const featured = events[0];
  const upcomingEvents = events.slice(1);

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
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "48px", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <h2 style={{ color: th.headingColor, fontSize: "clamp(24px,3vw,40px)", fontWeight: 800, margin: 0, letterSpacing: "-1.2px", lineHeight: 1.15 }}>
              행사 소식
            </h2>
          </div>
          <Link to="/events" style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            color: "#18A343", fontSize: "13px", fontWeight: 700, textDecoration: "none",
            padding: "8px 16px", background: "rgba(24,163,67,0.08)", border: "1px solid rgba(24,163,67,0.2)", borderRadius: "100px",
          }}>
            전체 일정 보기
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
        </div>

        <div className="event-layout-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          <style>{`@media (max-width: 900px) { .event-layout-grid { grid-template-columns: 1fr !important; } }`}</style>

          {/* Featured Card */}
          <div 
            onClick={() => navigate(`/post/${featured.id}`)}
            style={{
              cursor: "pointer",
              background: isDark
                ? `linear-gradient(rgba(7,13,26,0.85), rgba(7,13,26,0.85)), url(${featured.image_url})`
                : `linear-gradient(rgba(255,255,255,0.92), rgba(255,255,255,0.92)), url(${featured.image_url})`,
              backgroundSize: "cover", backgroundPosition: "center",
              border: `1px solid rgba(24,163,67,${isDark ? "0.25" : "0.18"})`,
              borderRadius: "24px", padding: "clamp(22px, 5vw, 36px)",
              boxShadow: isDark ? "none" : "0 4px 24px rgba(24,163,67,0.08)",
              display: "flex", flexDirection: "column", gap: "20px", position: "relative", overflow: "hidden", height: "100%"
            }}
          >
            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
                <span style={{ fontSize: "11px", fontWeight: 800, color: "#fff", background: "#18A343", padding: "4px 10px", borderRadius: "6px" }}>HOT</span>
                <span style={{ fontSize: "11px", fontWeight: 700, color: textMuted, background: th.tagBg, border: `1px solid ${th.tagBorder}`, padding: "4px 10px", borderRadius: "6px" }}>대표 행사</span>
              </div>

              <h3 style={{ color: th.headingColor, fontSize: "clamp(20px,2.2vw,26px)", fontWeight: 800, margin: "0 0 12px", lineHeight: 1.3 }}>{featured.title}</h3>
              <p style={{ color: th.subText, fontSize: "14px", margin: "0 0 20px", lineHeight: 1.7, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                {featured.content}
              </p>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "20px" }}>
                <div style={{ background: th.tagBg, border: `1px solid ${th.tagBorder}`, borderRadius: "100px", padding: "6px 12px", fontSize: "12px", color: th.itemTitle, fontWeight: 600 }}>
                  📅 {new Date(featured.created_at).toLocaleDateString()}
                </div>
                <div style={{ background: th.tagBg, border: `1px solid ${th.tagBorder}`, borderRadius: "100px", padding: "6px 12px", fontSize: "12px", color: th.itemTitle, fontWeight: 600 }}>
                  📍 NCF 오피스
                </div>
              </div>

              <button style={{ background: "linear-gradient(135deg, #18A343 0%, #37AD9A 100%)", color: "#fff", border: "none", borderRadius: "100px", padding: "12px 28px", fontSize: "14px", fontWeight: 800, width: "100%" }}>
                자세히 보기 →
              </button>
            </div>
          </div>

          {/* Upcoming List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {upcomingEvents.map((ev, i) => (
              <div 
                key={ev.id} 
                onClick={() => navigate(`/post/${ev.id}`)}
                style={{
                  background: th.cardBg, border: `1px solid ${th.cardBorder}`, borderRadius: "16px", padding: "20px 22px",
                  boxShadow: th.cardShadow, display: "flex", gap: "16px", transition: "all 0.25s ease", cursor: "pointer"
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateX(4px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "translateX(0)"; }}
              >
                <div style={{ flexShrink: 0, width: "80px" }}>
                  <div style={{ fontSize: "12px", fontWeight: 800, color: TYPE_COLORS[i % 4], marginBottom: "2px" }}>
                    {new Date(ev.created_at).getMonth() + 1}.{new Date(ev.created_at).getDate()}
                  </div>
                  <span style={{ fontSize: "10px", fontWeight: 800, color: TYPE_COLORS[i % 4], background: `${TYPE_COLORS[i % 4]}15`, border: `1px solid ${TYPE_COLORS[i % 4]}35`, padding: "2px 7px", borderRadius: "4px" }}>
                    EVENT
                  </span>
                </div>
                <div style={{ width: "1px", background: th.rowDivider, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: th.itemTitle, fontSize: "14px", fontWeight: 700, marginBottom: "4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ev.title}</div>
                  <div style={{ color: th.itemDesc, fontSize: "12px", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{ev.content}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}