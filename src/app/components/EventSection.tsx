import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router";
import { getSectionTheme } from "../utils/sectionTheme";
import { supabase } from "../../lib/supabaseClient";
import { cleanText } from "../../utils/text";
import type { Post } from "../../lib/types";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";
import { useAdmin } from "../../hooks/useAdmin";

interface EventSectionProps { isDark?: boolean; }

export function EventSection({ isDark = false }: EventSectionProps) {
  const th = getSectionTheme(isDark);
  const navigate = useNavigate();
  const { isAdmin } = useAdmin();
  const [events, setEvents] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 인라인 편집 상태
  const [editingDate, setEditingDate] = useState(false);
  const [editingLocation, setEditingLocation] = useState(false);
  const [dateVal, setDateVal] = useState("");
  const [locationVal, setLocationVal] = useState("");
  const [showPicker, setShowPicker] = useState(false);

  const dateRef = useRef<HTMLInputElement>(null);
  const locationRef = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showPicker) return;
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showPicker]);

  const textMuted = isDark ? "rgba(255,255,255,0.45)" : "rgba(15,23,42,0.45)";

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

  // featured 또는 첫 번째 이벤트
  const featured = events.find(e => e.status === "featured") ?? events[0];
  const upcomingEvents = events.filter(e => e.id !== featured?.id).slice(0, 4);

  // featured 바뀔 때 로컬 값 동기화
  useEffect(() => {
    if (!featured) return;
    setDateVal(featured.event_date || new Date(featured.created_at).toLocaleDateString("ko-KR"));
    setLocationVal(featured.location || "NCF 오피스");
  }, [featured?.id]);

  const saveDate = async () => {
    if (!featured || saving) return;
    setSaving(true);
    await supabase.from("posts").update({ event_date: dateVal }).eq("id", featured.id);
    setSaving(false);
    setEditingDate(false);
    fetchEvents();
  };

  const saveLocation = async () => {
    if (!featured || saving) return;
    setSaving(true);
    await supabase.from("posts").update({ location: locationVal }).eq("id", featured.id);
    setSaving(false);
    setEditingLocation(false);
    fetchEvents();
  };

  const setFeatured = async (post: Post) => {
    setSaving(true);
    // 기존 featured 해제
    if (featured?.status === "featured") {
      await supabase.from("posts").update({ status: "모집중" }).eq("id", featured.id);
    }
    // 새 featured 설정
    await supabase.from("posts").update({ status: "featured" }).eq("id", post.id);
    setShowPicker(false);
    setSaving(false);
    fetchEvents();
  };

  if (!loading && events.length === 0) return null;

  const skCls = isDark ? "bg-white/[0.07]" : "bg-black/[0.07]";
  const displayDate = featured
    ? (featured.event_date || new Date(featured.created_at).toLocaleDateString("ko-KR"))
    : "";
  const displayLocation = featured?.location || "NCF 오피스";

  // 어드민 편집 버튼 공통 스타일
  const editBtnStyle: React.CSSProperties = {
    background: "none", border: "none", cursor: "pointer", padding: "2px 5px",
    borderRadius: 4, opacity: 0.5, fontSize: 11, color: isDark ? "#fff" : "#000",
    lineHeight: 1, transition: "opacity 0.15s",
  };

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
          ) : featured ? (
            <>
              {/* ── 대표 행사 카드 ── */}
              <div style={{
                background: isDark
                  ? `linear-gradient(rgba(7,13,26,0.85), rgba(7,13,26,0.85)), url(${featured.image_url})`
                  : `linear-gradient(rgba(255,255,255,0.92), rgba(255,255,255,0.92)), url(${featured.image_url})`,
                backgroundSize: "cover", backgroundPosition: "center",
                border: `1px solid rgba(24,163,67,${isDark ? "0.25" : "0.18"})`,
                borderRadius: "24px", padding: "clamp(22px, 5vw, 36px)",
                boxShadow: isDark ? "none" : "0 4px 24px rgba(24,163,67,0.08)",
                display: "flex", flexDirection: "column", gap: "20px", position: "relative", overflow: "hidden", height: "100%",
              }}>
                <div style={{ position: "relative", zIndex: 1 }}>

                  {/* 배지 행 + 어드민: 대표 행사 변경 버튼 */}
                  <div style={{ display: "flex", gap: "8px", marginBottom: "20px", alignItems: "center", flexWrap: "wrap" }}>
                    <Badge variant="green" shape="pill" showDot className="bg-[#18A343] text-white border-transparent">HOT</Badge>
                    <Badge variant="outline" shape="pill" className={isDark ? "border-white/20 text-white/70" : "border-black/20 text-black/70"}>대표 행사</Badge>

                    {isAdmin && (
                      <div ref={pickerRef} style={{ position: "relative", marginLeft: "auto" }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); setShowPicker(v => !v); }}
                          style={{
                            fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 99,
                            border: `1px solid rgba(24,163,67,0.35)`, background: "rgba(24,163,67,0.08)",
                            color: "#18A343", cursor: "pointer", whiteSpace: "nowrap",
                          }}
                        >
                          변경
                        </button>

                        {showPicker && (
                          <div
                            style={{
                              position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: 100,
                              background: isDark ? "#1a2235" : "#fff",
                              border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "#e5e7eb"}`,
                              borderRadius: 12, padding: 8, minWidth: 240,
                              boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                            }}
                          >
                            <div style={{ fontSize: 11, fontWeight: 700, color: textMuted, padding: "4px 8px 8px", letterSpacing: "0.05em" }}>
                              대표 행사 선택
                            </div>
                            {events.map(ev => (
                              <button
                                key={ev.id}
                                onClick={() => setFeatured(ev)}
                                disabled={saving}
                                style={{
                                  display: "block", width: "100%", textAlign: "left",
                                  padding: "9px 10px", borderRadius: 8, border: "none",
                                  background: ev.id === featured.id
                                    ? (isDark ? "rgba(24,163,67,0.15)" : "rgba(24,163,67,0.08)")
                                    : "transparent",
                                  color: ev.id === featured.id ? "#18A343" : (isDark ? "rgba(255,255,255,0.8)" : "#111827"),
                                  fontSize: 13, fontWeight: ev.id === featured.id ? 700 : 500,
                                  cursor: "pointer", lineHeight: 1.4,
                                }}
                              >
                                {ev.id === featured.id && <span style={{ marginRight: 6 }}>✓</span>}
                                {ev.title}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <h3
                    onClick={() => !showPicker && navigate(`/post/${featured.id}`)}
                    style={{ color: th.headingColor, fontSize: "clamp(20px,2.2vw,26px)", fontWeight: 800, margin: "0 0 12px", lineHeight: 1.3, cursor: "pointer" }}
                  >
                    {featured.title}
                  </h3>
                  <p style={{ color: th.subText, fontSize: "14px", lineHeight: 1.6, margin: "0 0 20px 0", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {cleanText(featured.content)}
                  </p>

                  {/* 날짜 / 장소 배지 — 어드민: 클릭 편집 */}
                  <div className="flex flex-wrap gap-2 mb-6 mt-auto" onClick={e => e.stopPropagation()}>

                    {/* 날짜 */}
                    {editingDate ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <input
                          ref={dateRef}
                          autoFocus
                          value={dateVal}
                          onChange={e => setDateVal(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter") saveDate(); if (e.key === "Escape") setEditingDate(false); }}
                          style={{
                            fontSize: 12, padding: "4px 8px", borderRadius: 8, outline: "none",
                            border: `1px solid rgba(24,163,67,0.4)`, background: isDark ? "rgba(255,255,255,0.06)" : "#fff",
                            color: isDark ? "rgba(255,255,255,0.8)" : "#111827", width: 160,
                          }}
                        />
                        <button onClick={saveDate} disabled={saving} style={{ fontSize: 11, padding: "4px 8px", borderRadius: 6, border: "none", background: "#18A343", color: "#fff", cursor: "pointer", fontWeight: 700 }}>저장</button>
                        <button onClick={() => setEditingDate(false)} style={{ fontSize: 11, padding: "4px 8px", borderRadius: 6, border: "none", background: "transparent", color: textMuted, cursor: "pointer" }}>취소</button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Badge variant={isDark ? "glass" : "outline"} shape="pill" className={isDark ? "" : "text-black/50 border-black/10"}>
                          📅 {displayDate}
                        </Badge>
                        {isAdmin && (
                          <button
                            style={editBtnStyle}
                            onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
                            onMouseLeave={e => (e.currentTarget.style.opacity = "0.5")}
                            onClick={() => { setEditingDate(true); setTimeout(() => dateRef.current?.focus(), 50); }}
                          >✏</button>
                        )}
                      </div>
                    )}

                    {/* 장소 */}
                    {editingLocation ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <input
                          ref={locationRef}
                          autoFocus
                          value={locationVal}
                          onChange={e => setLocationVal(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter") saveLocation(); if (e.key === "Escape") setEditingLocation(false); }}
                          style={{
                            fontSize: 12, padding: "4px 8px", borderRadius: 8, outline: "none",
                            border: `1px solid rgba(24,163,67,0.4)`, background: isDark ? "rgba(255,255,255,0.06)" : "#fff",
                            color: isDark ? "rgba(255,255,255,0.8)" : "#111827", width: 140,
                          }}
                        />
                        <button onClick={saveLocation} disabled={saving} style={{ fontSize: 11, padding: "4px 8px", borderRadius: 6, border: "none", background: "#18A343", color: "#fff", cursor: "pointer", fontWeight: 700 }}>저장</button>
                        <button onClick={() => setEditingLocation(false)} style={{ fontSize: 11, padding: "4px 8px", borderRadius: 6, border: "none", background: "transparent", color: textMuted, cursor: "pointer" }}>취소</button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Badge variant={isDark ? "glass" : "outline"} shape="pill" className={isDark ? "" : "text-black/50 border-black/10"}>
                          📍 {displayLocation}
                        </Badge>
                        {isAdmin && (
                          <button
                            style={editBtnStyle}
                            onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
                            onMouseLeave={e => (e.currentTarget.style.opacity = "0.5")}
                            onClick={() => { setEditingLocation(true); setTimeout(() => locationRef.current?.focus(), 50); }}
                          >✏</button>
                        )}
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={() => navigate(`/post/${featured.id}`)}
                    shape="pill"
                    className="w-full bg-gradient-to-r from-[#18A343] to-[#37AD9A] hover:brightness-110 border-none text-white shadow-lg"
                  >
                    자세히 보기 →
                  </Button>
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
          ) : null}
        </div>
      </div>

    </section>
  );
}
