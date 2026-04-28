import { useState, useEffect } from "react";
import { PageShell } from "../components/PageShell";
import { useTheme } from "../ThemeContext";
import { supabase } from "../../lib/supabaseClient";
import { Skeleton } from "../components/ui/skeleton";
import type { FoundersClubSession, FoundersClubApplication } from "../../lib/types";

interface Applicant { id: string; name: string; email: string; company: string; }

interface SessionWithCount extends FoundersClubSession {
  accepted_count: number;
  user_application?: FoundersClubApplication | null;
  accepted_applicants?: Applicant[];
}

export function FoundersClubPage() {
  const { isDark } = useTheme();
  const [sessions, setSessions] = useState<SessionWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [applyTarget, setApplyTarget] = useState<SessionWithCount | null>(null);
  const [message, setMessage] = useState("");
  const [applying, setApplying] = useState(false);
  const [appliedId, setAppliedId] = useState<string | null>(null);
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) =>
    setExpandedSessions(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const card = isDark ? "rgba(255,255,255,0.04)" : "#ffffff";
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const textMain = isDark ? "rgba(255,255,255,0.92)" : "#0f172a";
  const textMuted = isDark ? "rgba(255,255,255,0.45)" : "rgba(15,23,42,0.45)";
  const skCls = isDark ? "bg-white/[0.07]" : "bg-black/[0.07]";

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const uid = user?.id ?? null;
      setUserId(uid);
      let admin = false;
      if (user) {
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
        admin = profile?.role === 'admin';
        setIsAdmin(admin);
      }
      fetchSessions(uid, admin);
    };
    init();
  }, []);

  const fetchSessions = async (uid: string | null, admin: boolean) => {
    setLoading(true);
    const { data } = await supabase
      .from("founders_club_sessions")
      .select("*")
      .order("created_at", { ascending: false });

    if (!data) { setLoading(false); return; }

    const enriched = await Promise.all(data.map(async (s) => {
      const { count } = await supabase
        .from("founders_club_applications")
        .select("*", { count: "exact", head: true })
        .eq("session_id", s.id)
        .eq("status", "accepted");

      let userApp = null;
      if (uid && !admin) {
        const { data: appData } = await supabase
          .from("founders_club_applications")
          .select("*")
          .eq("session_id", s.id)
          .eq("user_id", uid)
          .maybeSingle();
        userApp = appData;
      }

      let acceptedApplicants: Applicant[] = [];
      if (admin) {
        const { data: apps } = await supabase
          .from("founders_club_applications")
          .select("user_id")
          .eq("session_id", s.id)
          .eq("status", "accepted");
        if (apps && apps.length > 0) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, name, email, company")
            .in("id", apps.map(a => a.user_id));
          acceptedApplicants = (profiles || []).map(p => ({
            id: p.id, name: p.name || '이름 없음', email: p.email || '', company: p.company || '',
          }));
        }
      }

      return { ...s, accepted_count: count || 0, user_application: userApp, accepted_applicants: acceptedApplicants };
    }));

    setSessions(enriched as SessionWithCount[]);
    setLoading(false);
  };

  const handleApply = async () => {
    if (!applyTarget || !userId) return;
    setApplying(true);
    const { error } = await supabase.from("founders_club_applications").insert({
      session_id: applyTarget.id,
      user_id: userId,
      message: message.trim() || null,
    });
    if (error) { alert(error.code === "23505" ? "이미 신청하셨습니다." : "신청 실패: " + error.message); }
    else { setAppliedId(applyTarget.id); fetchSessions(userId, isAdmin); }
    setApplying(false);
  };

  const statusCfg = {
    recruiting: { label: "모집중", bg: "#18A34322", color: "#18A343" },
    closed:     { label: "마감",   bg: "#EA433522", color: "#EA4335" },
    completed:  { label: "완료",   bg: "#88888822", color: "#888" },
  };

  return (
    <PageShell title="Founder's Club" subtitle="동료 창업자와 함께하는 주제별 소그룹 피어 러닝" accentColor="#A855F7">
      <div style={{ maxWidth: 900, margin: "0 auto", paddingBottom: 80 }}>
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ background: card, border: `1px solid ${border}`, borderRadius: 20, padding: 28 }}>
                <div className="flex justify-between items-start mb-4">
                  <Skeleton className={`h-6 w-48 ${skCls}`} />
                  <Skeleton className={`h-6 w-16 rounded-full ${skCls}`} />
                </div>
                <Skeleton className={`h-4 w-full mb-2 ${skCls}`} />
                <Skeleton className={`h-4 w-3/4 ${skCls}`} />
              </div>
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px", color: textMuted }}>등록된 세션이 없습니다.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {sessions.map(s => {
              const cfg = statusCfg[s.status];
              const spotsLeft = s.max_participants - s.accepted_count;
              const alreadyApplied = !!s.user_application;
              const appStatus = s.user_application?.status;

              return (
                <div key={s.id} style={{ background: card, border: `1px solid ${border}`, borderRadius: 20, padding: 28, boxShadow: isDark ? "none" : "0 2px 16px rgba(0,0,0,0.05)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
                    <div>
                      <h3 style={{ margin: "0 0 6px", fontWeight: 800, color: textMain, fontSize: 18 }}>{s.theme}</h3>
                      {s.session_date && (
                        <span style={{ fontSize: 13, color: textMuted }}>
                          {new Date(s.session_date).toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" })}
                          {s.session_time && ` ${s.session_time.slice(0, 5)}`}
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: cfg.color, background: cfg.bg, padding: "4px 12px", borderRadius: 99 }}>{cfg.label}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: textMuted }}>{s.accepted_count}/{s.max_participants}명</span>
                    </div>
                  </div>

                  {s.description && (
                    <p style={{ color: textMuted, fontSize: 14, lineHeight: 1.65, margin: "0 0 16px" }}>{s.description}</p>
                  )}

                  {/* Spots indicator */}
                  <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
                    {Array.from({ length: s.max_participants }).map((_, i) => (
                      <div key={i} style={{ height: 6, flex: 1, borderRadius: 99, background: i < s.accepted_count ? "#A855F7" : (isDark ? "rgba(255,255,255,0.1)" : "#e2e8f0") }} />
                    ))}
                  </div>

                  {isAdmin ? (
                    <div>
                      <button
                        onClick={() => toggleExpanded(s.id)}
                        style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", padding: 0, color: textMuted, fontSize: 13, fontWeight: 700 }}
                      >
                        <span>수락된 참여자 {s.accepted_count}명</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                          style={{ transform: expandedSessions.has(s.id) ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
                          <polyline points="6 9 12 15 18 9"/>
                        </svg>
                      </button>
                      {expandedSessions.has(s.id) && (
                        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                          {s.accepted_applicants && s.accepted_applicants.length > 0 ? s.accepted_applicants.map(a => (
                            <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: textMain, padding: "8px 12px", background: isDark ? "rgba(168,85,247,0.06)" : "#faf5ff", borderRadius: 10 }}>
                              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#A855F7", flexShrink: 0 }} />
                              <span style={{ fontWeight: 600 }}>{a.name}</span>
                              {a.company && <span style={{ color: textMuted }}>· {a.company}</span>}
                              <span style={{ color: textMuted, marginLeft: "auto", fontSize: 12 }}>{a.email}</span>
                            </div>
                          )) : (
                            <p style={{ color: textMuted, fontSize: 13, margin: 0 }}>수락된 참여자가 없습니다.</p>
                          )}
                        </div>
                      )}
                    </div>
                  ) : alreadyApplied ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: 12, background: appStatus === "accepted" ? "#18A34322" : appStatus === "rejected" ? "#EA433522" : "#A855F722" }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: appStatus === "accepted" ? "#18A343" : appStatus === "rejected" ? "#EA4335" : "#A855F7" }}>
                        {{ pending: "신청 완료 — 검토 중", accepted: "수락됨", rejected: "신청이 거절되었습니다" }[appStatus!] ?? "신청함"}
                      </span>
                    </div>
                  ) : (
                    <button
                      onClick={() => { if (!userId) { alert("로그인이 필요합니다."); return; } setApplyTarget(s); setMessage(""); }}
                      disabled={s.status !== "recruiting" || spotsLeft <= 0}
                      style={{ padding: "11px 24px", borderRadius: 12, border: "none", background: s.status === "recruiting" && spotsLeft > 0 ? "#A855F7" : (isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0"), color: s.status === "recruiting" && spotsLeft > 0 ? "#fff" : textMuted, fontWeight: 700, cursor: s.status === "recruiting" && spotsLeft > 0 ? "pointer" : "not-allowed", fontSize: 14, transition: "filter 0.2s" }}
                    >
                      {s.status !== "recruiting" ? "모집 마감" : spotsLeft <= 0 ? "정원 마감" : `지금 신청 (${spotsLeft}자리 남음)`}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Apply modal */}
      {applyTarget && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, padding: 20 }} onClick={e => { if (e.target === e.currentTarget) setApplyTarget(null); }}>
          <div style={{ background: isDark ? "#1e293b" : "#fff", borderRadius: 24, padding: "36px 32px", width: "100%", maxWidth: 440, boxShadow: "0 24px 60px rgba(0,0,0,0.25)" }}>
            {appliedId === applyTarget.id ? (
              <div style={{ textAlign: "center" }}>
                <h3 style={{ color: textMain, fontWeight: 800, marginBottom: 12 }}>신청 완료!</h3>
                <p style={{ color: textMuted, lineHeight: 1.6, marginBottom: 24 }}>신청이 접수되었습니다. 운영자 검토 후 수락 여부가 결정됩니다.</p>
                <button onClick={() => { setApplyTarget(null); setAppliedId(null); }} style={{ padding: "12px 32px", borderRadius: 12, border: "none", background: "#A855F7", color: "#fff", fontWeight: 700, cursor: "pointer" }}>닫기</button>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <h3 style={{ color: textMain, fontWeight: 800, margin: 0, fontSize: 18 }}>{applyTarget.theme}</h3>
                  <button onClick={() => setApplyTarget(null)} style={{ background: "none", border: "none", cursor: "pointer", color: textMuted, fontSize: 22 }}>×</button>
                </div>
                {applyTarget.description && (
                  <p style={{ color: textMain, fontSize: 14, lineHeight: 1.7, margin: "0 0 20px" }}>{applyTarget.description}</p>
                )}
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="참여 동기나 기대하는 점을 자유롭게 작성해주세요. (선택)"
                  rows={4}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)"}`, background: isDark ? "rgba(255,255,255,0.05)" : "#f8fafc", color: textMain, outline: "none", resize: "vertical", fontSize: 14, lineHeight: 1.6, boxSizing: "border-box", marginBottom: 16, fontFamily: "inherit" }}
                />
                <button
                  onClick={handleApply}
                  disabled={applying}
                  style={{ width: "100%", padding: "14px", borderRadius: 12, border: "none", background: "#A855F7", color: "#fff", fontWeight: 800, cursor: "pointer", fontSize: 15, opacity: applying ? 0.6 : 1 }}
                >
                  {applying ? "신청 중..." : "신청하기 (선착순)"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </PageShell>
  );
}
