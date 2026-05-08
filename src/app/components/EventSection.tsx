import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { getSectionTheme } from "../utils/sectionTheme";
import { supabase } from "../../lib/supabaseClient";
import { cleanText } from "../../utils/text";
import type { Post } from "../../lib/types";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";
import {
  HOME_CARD_RADIUS,
  getHomeSectionCtaPillClass,
  HOME_SECTION_BODY_STYLE,
  HOME_SECTION_HEADER_GAP,
  HOME_SECTION_MAX_WIDTH,
  HOME_SECTION_PADDING,
  HOME_SECTION_TITLE_STYLE,
} from "./homeSectionStyles";

interface EventSectionProps { isDark?: boolean; }

export function EventSection({ isDark = false }: EventSectionProps) {
  const th = getSectionTheme(isDark);
  const navigate = useNavigate();
  const [events, setEvents] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    const { data } = await supabase
      .from("posts")
      .select("*")
      .eq("category", "events")
      .order("created_at", { ascending: false })
      .limit(20);
    setEvents((data as Post[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchEvents(); }, []);

  // 대표 행사 또는 첫 번째 이벤트
  const featured = events.find(e => e.is_featured) ?? events[0];
  const upcomingEvents = events.filter(e => e.id !== featured?.id).slice(0, 4);

  if (!loading && events.length === 0) return null;

  const displayDate = featured
    ? (featured.event_date || new Date(featured.created_at).toLocaleDateString("ko-KR"))
    : "";
  const displayLocation = featured?.location || "NCF 오피스";

  return (
    <section style={{
      position: "relative", width: "100vw", maxWidth: "100%",
      left: "50%", transform: "translateX(-50%)",
      padding: HOME_SECTION_PADDING,
      background: th.sectionBg,
      fontFamily: "'Pretendard', -apple-system, sans-serif",
      boxSizing: "border-box", overflow: "hidden",
      transition: "background 0.4s ease",
    }}>
      <div style={{ position: "relative", zIndex: 1, maxWidth: HOME_SECTION_MAX_WIDTH, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: HOME_SECTION_HEADER_GAP, flexWrap: "wrap", gap: "16px" }}>
          {loading ? (
            <>
              <Skeleton className="h-10 w-28" />
              <Skeleton className="h-8 w-28 rounded-full" />
            </>
          ) : (
            <>
              <div>
                <h2 style={{ ...HOME_SECTION_TITLE_STYLE, color: th.headingColor }}>
                  행사 소식
                </h2>
                <p style={{ ...HOME_SECTION_BODY_STYLE, color: th.subText }}>
                  대표 행사와 최신 프로그램 일정을 한눈에 확인할 수 있도록 정리했습니다.
                </p>
              </div>
              <Button variant="outline" shape="pill" size="sm" asChild className={getHomeSectionCtaPillClass(isDark, "green")}>
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
              <Skeleton className="h-[420px] rounded-3xl" />
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} style={{ background: th.cardBg, border: `1px solid ${th.cardBorder}`, borderRadius: "16px", padding: "20px 22px", display: "flex", gap: "16px" }}>
                    <div className="shrink-0 w-20 space-y-1.5">
                      <Skeleton className="h-4 w-12" />
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                    <div style={{ width: "1px", background: th.rowDivider, flexShrink: 0 }} />
                    <div className="flex-1 min-w-0 space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : featured ? (
            <>
              {/* ── 대표 행사 카드 ── */}
              <div style={{
                background: th.cardBg,
                border: `1px solid ${th.cardBorder}`,
                borderRadius: HOME_CARD_RADIUS, padding: "clamp(22px, 5vw, 36px)",
                display: "flex", flexDirection: "column", gap: "20px", position: "relative", overflow: "hidden", height: "100%",
              }}>
                {featured.image_url && (
                  <div
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      inset: 0,
                      backgroundImage: `url(${featured.image_url})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      opacity: isDark ? 0.14 : 0.09,
                      pointerEvents: "none",
                    }}
                  />
                )}
                <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", minHeight: "100%", height: "100%" }}>

                  <div style={{ display: "flex", gap: "8px", marginBottom: "20px", alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "12px", fontWeight: 800, color: th.mutedText, letterSpacing: "0.02em" }}>
                      대표 행사
                    </span>
                  </div>

                  <div style={{ maxHeight: "176px", overflow: "hidden" }}>
                    <h3
                      onClick={() => navigate(`/post/${featured.id}`)}
                      style={{
                        color: th.headingColor,
                        fontSize: "clamp(20px,2.2vw,26px)",
                        fontWeight: 800,
                        margin: "0 0 12px",
                        lineHeight: 1.3,
                        cursor: "pointer",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {featured.title}
                    </h3>
                    <p style={{ color: th.subText, fontSize: "14px", lineHeight: 1.6, margin: 0, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {cleanText(featured.content)}
                    </p>
                  </div>

                  <div style={{ marginTop: "auto", paddingTop: "20px" }}>
                    <div className="flex flex-wrap gap-x-4 gap-y-1" style={{ marginBottom: "20px", color: th.subText, fontSize: "12px", fontWeight: 650 }}>
                      <span>일시 {displayDate}</span>
                      <span>장소 {displayLocation}</span>
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => navigate(`/post/${featured.id}`)}
                      shape="pill"
                      className={`w-full ${getHomeSectionCtaPillClass(isDark, "green")}`}
                    >
                      자세히 보기 →
                    </Button>
                  </div>
                </div>
              </div>

              {/* ── 우측 목록 ── */}
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {upcomingEvents.map((ev) => {
                  const date = new Date(ev.created_at);
                  return (
                    <div
                      key={ev.id}
                      onClick={() => navigate(`/post/${ev.id}`)}
                      style={{ background: th.cardBg, border: `1px solid ${th.cardBorder}`, borderRadius: HOME_CARD_RADIUS, padding: "18px 20px", display: "flex", gap: "16px", outline: "1px solid transparent", transition: "transform 0.18s ease, outline-color 0.18s ease, border-color 0.18s ease", cursor: "pointer" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.outlineColor = "rgba(24,163,67,0.35)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.outlineColor = "transparent";
                      }}
                    >
                      <div style={{ flexShrink: 0, width: "80px" }}>
                        <div style={{ fontSize: "12px", fontWeight: 800, color: th.mutedText, marginBottom: "2px" }}>
                          {date.getMonth() + 1}.{date.getDate()}
                        </div>
                        <div style={{ fontSize: "10px", fontWeight: 800, color: th.mutedText, letterSpacing: "0.04em" }}>EVENT</div>
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
          ) : null}
        </div>
      </div>

    </section>
  );
}
