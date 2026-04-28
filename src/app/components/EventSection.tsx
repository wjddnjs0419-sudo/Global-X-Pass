import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { getSectionTheme } from "../utils/sectionTheme";
import { supabase } from "../../lib/supabaseClient";
import { cleanText } from "../../utils/text";
import type { Post } from "../../lib/types";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";

interface EventSectionProps { isDark?: boolean; }


export function EventSection({ isDark = false }: EventSectionProps) {
  const th = getSectionTheme(isDark);
  const navigate = useNavigate();
  const [events, setEvents] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const textMuted = isDark ? "rgba(255,255,255,0.45)" : "rgba(15,23,42,0.45)";

  useEffect(() => {
    const fetchEvents = async () => {
      const { data } = await supabase
        .from("posts")
        .select("*")
        .eq("category", "events")
        .order("created_at", { ascending: false })
        .limit(5);
      setEvents((data as Post[]) || []);
      setLoading(false);
    };
    fetchEvents();
  }, []);

  if (!loading && events.length === 0) return null;

  const featured = events[0];
  const upcomingEvents = events.slice(1);
  const skCls = isDark ? "bg-white/[0.07]" : "bg-black/[0.07]";

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
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0, backgroundImage: `radial-gradient(${th.dotGrid} 1px, transparent 1px)`, backgroundSize: "36px 36px" }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: "1280px", margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "48px", flexWrap: "wrap", gap: "16px" }}>
          {loading ? (
            <>
              <Skeleton className={`h-10 w-28 ${skCls}`} />
              <Skeleton className={`h-8 w-28 rounded-full ${skCls}`} />
            </>
          ) : (
            <>
              <h2 style={{ color: th.headingColor, fontSize: "clamp(24px,3vw,40px)", fontWeight: 800, margin: 0, letterSpacing: "-1.2px", lineHeight: 1.15 }}>
                행사 소식
              </h2>
              <Button variant="outline" shape="pill" size="sm" asChild className={isDark ? "border-green-500/30 text-green-400 hover:bg-green-500/10" : "border-green-500/20 text-green-600 hover:bg-green-50"}>
                <Link to="/events">
                  전체 일정 보기
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ml-1"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                </Link>
              </Button>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 min-[900px]:grid-cols-2 gap-6">
          {loading ? (
            <>
              <Skeleton className={`h-[420px] rounded-3xl ${skCls}`} />
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} style={{ background: th.cardBg, border: `1px solid ${th.cardBorder}`, borderRadius: "16px", padding: "20px 22px", display: "flex", gap: "16px" }}>
                    <div className="shrink-0 w-20 space-y-1.5">
                      <Skeleton className={`h-4 w-12 ${skCls}`} />
                      <Skeleton className={`h-5 w-16 rounded-full ${skCls}`} />
                    </div>
                    <div style={{ width: "1px", background: th.rowDivider, flexShrink: 0 }} />
                    <div className="flex-1 min-w-0 space-y-2">
                      <Skeleton className={`h-4 w-full ${skCls}`} />
                      <Skeleton className={`h-3 w-3/4 ${skCls}`} />
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
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
                  display: "flex", flexDirection: "column", gap: "20px", position: "relative", overflow: "hidden", height: "100%",
                }}
              >
                <div style={{ position: "relative", zIndex: 1 }}>
                  <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
                    <Badge variant="green" shape="pill" showDot className="bg-[#18A343] text-white border-transparent">HOT</Badge>
                    <Badge variant="outline" shape="pill" className={isDark ? "border-white/20 text-white/70" : "border-black/20 text-black/70"}>대표 행사</Badge>
                  </div>
                  <h3 style={{ color: th.headingColor, fontSize: "clamp(20px,2.2vw,26px)", fontWeight: 800, margin: "0 0 12px", lineHeight: 1.3 }}>{featured.title}</h3>
                  <p style={{ color: th.subText, fontSize: "14px", lineHeight: 1.6, margin: "0 0 20px 0", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {cleanText(featured.content)}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-6 mt-auto">
                    <Badge variant={isDark ? "glass" : "outline"} shape="pill" className={isDark ? "" : "text-black/50 border-black/10"}>
                      📅 {new Date(featured.created_at).toLocaleDateString()}
                    </Badge>
                    <Badge variant={isDark ? "glass" : "outline"} shape="pill" className={isDark ? "" : "text-black/50 border-black/10"}>
                      📍 NCF 오피스
                    </Badge>
                  </div>
                  <Button shape="pill" className="w-full bg-gradient-to-r from-[#18A343] to-[#37AD9A] hover:brightness-110 border-none text-white shadow-lg">
                    자세히 보기 →
                  </Button>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {upcomingEvents.map((ev, i) => {
                  const date = new Date(ev.created_at);
                  return (
                    <div
                      key={ev.id}
                      onClick={() => navigate(`/post/${ev.id}`)}
                      style={{ background: th.cardBg, border: `1px solid ${th.cardBorder}`, borderRadius: "16px", padding: "20px 22px", boxShadow: th.cardShadow, display: "flex", gap: "16px", transition: "all 0.25s ease", cursor: "pointer" }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateX(4px)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = "translateX(0)"; }}
                    >
                      <div style={{ flexShrink: 0, width: "80px" }}>
                        <div style={{ fontSize: "12px", fontWeight: 800, color: "#18A343", marginBottom: "2px" }}>
                          {date.getMonth() + 1}.{date.getDate()}
                        </div>
                        <Badge variant="green" shape="pill">EVENT</Badge>
                      </div>
                      <div style={{ width: "1px", background: th.rowDivider, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: th.itemTitle, fontSize: "14px", fontWeight: 700, marginBottom: "4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ev.title}</div>
                        <div style={{ color: th.itemDesc, fontSize: "12px", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {cleanText(ev.content)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
