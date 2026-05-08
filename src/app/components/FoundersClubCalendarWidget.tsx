import { useState, useEffect } from "react";
import { Link } from "react-router";
import { supabase } from "../../lib/supabaseClient";
import type { FoundersClubSession } from "../../lib/types";

interface Props { isDark?: boolean; }

export function FoundersClubCalendarWidget({ isDark = false }: Props) {
  const [sessions, setSessions] = useState<FoundersClubSession[]>([]);
  const [loading, setLoading] = useState(true);

  const textMain = isDark ? "rgba(255,255,255,0.92)" : "#0f172a";
  const textMuted = isDark ? "rgba(255,255,255,0.45)" : "rgba(15,23,42,0.45)";
  const card = isDark ? "rgba(255,255,255,0.04)" : "#ffffff";
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";

  useEffect(() => {
    supabase
      .from("founders_club_sessions")
      .select("*")
      .eq("status", "recruiting")
      .gte("session_date", new Date().toISOString().split("T")[0])
      .order("session_date")
      .limit(4)
      .then(({ data }) => {
        setSessions((data as FoundersClubSession[]) || []);
        setLoading(false);
      });
  }, []);

  if (!loading && sessions.length === 0) return null;

  return (
    <section style={{
      position: "relative", width: "100vw", maxWidth: "100%",
      left: "50%", transform: "translateX(-50%)",
      padding: "clamp(60px, 10vw, 100px) clamp(20px, 5vw, 40px)",
      background: "var(--color-bg-elevated)",
      fontFamily: "'Pretendard', -apple-system, sans-serif",
      boxSizing: "border-box",
      transition: "background 0.4s ease",
    }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h2 style={{ color: textMain, fontSize: "clamp(22px,2.8vw,34px)", fontWeight: 800, margin: "0 0 6px", letterSpacing: "-1px" }}>
              Founder's Club
            </h2>
            <p style={{ color: textMuted, margin: 0, fontSize: 14 }}>모집 중인 소그룹 피어 러닝 세션</p>
          </div>
          <Link to="/founders-club" style={{ fontSize: 13, fontWeight: 700, color: "#A855F7", textDecoration: "none", padding: "8px 18px", borderRadius: 99, border: "1px solid #A855F733", background: "#A855F711" }}>
            전체 보기 →
          </Link>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
          {loading ? (
            [0, 1, 2, 3].map(i => (
              <div key={i} style={{ background: card, border: `1px solid ${border}`, borderRadius: 16, padding: 20, height: 120, opacity: 0.6 }} className="animate-pulse" />
            ))
          ) : sessions.map(s => (
            <Link
              key={s.id}
              to="/founders-club"
              style={{ textDecoration: "none", display: "block", background: card, border: `1px solid ${border}`, borderRadius: 16, padding: "20px 22px", transition: "all 0.2s", boxShadow: isDark ? "none" : "0 2px 12px rgba(0,0,0,0.04)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = "#A855F7"; (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = border; (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)"; }}
            >
              <div style={{ fontSize: 11, fontWeight: 800, color: "#A855F7", letterSpacing: "0.1em", marginBottom: 8 }}>
                {s.session_date
                  ? new Date(s.session_date).toLocaleDateString("ko-KR", { month: "short", day: "numeric", weekday: "short" })
                  : "날짜 미정"}
              </div>
              <div style={{ fontWeight: 700, color: textMain, fontSize: 14, lineHeight: 1.4, marginBottom: 10, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                {s.theme}
              </div>
              <div style={{ fontSize: 11, color: textMuted }}>정원 {s.max_participants}명 · 선착순</div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
