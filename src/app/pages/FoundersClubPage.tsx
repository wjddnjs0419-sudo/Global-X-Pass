import { useState, useEffect } from "react";
import { PageShell } from "../components/PageShell";
import { useTheme } from "../ThemeContext";
import { supabase } from "../../lib/supabaseClient";
import { LAYERS } from "../../lib/layers";
import { Skeleton } from "../components/ui/skeleton";
import type { FoundersClubSession, FoundersClubApplication } from "../../lib/types";
import { getStatusPillStyle } from "../components/contentListStyles";
import { formatStructuredLocation } from "../../utils/scheduleFields";
import { logSupabaseFailure } from "../../lib/uxTelemetry";

interface Applicant { id: string; name: string; email: string; company: string; }

interface ApplicationCounts {
  total_count: number;
  active_count: number;
  pending_count: number;
  accepted_count: number;
  rejected_count: number;
  cancelled_count: number;
}

interface DecryptedProfile {
  id: string;
  name: string | null;
  email: string | null;
  company: string | null;
}

interface SessionWithCount extends FoundersClubSession {
  accepted_count: number;
  application_counts: ApplicationCounts;
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
    const { data, error: sessionsError } = await supabase
      .from("founders_club_sessions")
      .select("*")
      .order("created_at", { ascending: false });

    if (sessionsError) {
      logSupabaseFailure("founders-club", "fetch_founders_club_sessions", sessionsError);
      setLoading(false);
      return;
    }

    if (!data) { setLoading(false); return; }

    const sessionIds = data.map(session => session.id);
    const [{ data: countRows, error: countError }, { data: acceptedApps, error: acceptedAppsError }, { data: userApps, error: userAppsError }] = await Promise.all([
      supabase.rpc("get_founders_club_application_counts"),
      admin
        ? supabase
            .from("founders_club_applications")
            .select("session_id, user_id")
            .in("session_id", sessionIds)
            .eq("status", "accepted")
        : Promise.resolve({ data: null, error: null }),
      uid
        ? supabase
            .from("founders_club_applications")
            .select("*")
            .in("session_id", sessionIds)
            .eq("user_id", uid)
            .in("status", ["pending", "accepted"])
        : Promise.resolve({ data: null, error: null }),
    ]);

    if (countError) {
      console.error("세션 신청 집계 조회 오류:", countError.message);
      logSupabaseFailure("founders-club", "get_founders_club_application_counts", countError);
    }
    if (acceptedAppsError) {
      console.error("세션 수락 인원 조회 오류:", acceptedAppsError.message);
      logSupabaseFailure("founders-club", "fetch_accepted_founders_club_applications", acceptedAppsError, { severity: "low" });
    }
    if (userAppsError) {
      console.error("내 Founder's Club 신청 조회 오류:", userAppsError.message);
      logSupabaseFailure("founders-club", "fetch_my_founders_club_applications", userAppsError);
    }

    let profileById = new Map<string, DecryptedProfile>();
    if (admin && acceptedApps && acceptedApps.length > 0) {
      const { data: profiles, error: profileError } = await supabase.functions.invoke("decrypt-profiles");
      if (profileError) {
        console.error("참여자 프로필 복호화 오류:", profileError.message);
        logSupabaseFailure("founders-club", "decrypt_founders_club_accepted_profiles", profileError);
      } else {
        profileById = new Map(
          ((profiles as DecryptedProfile[] | null) ?? []).map(profile => [profile.id, profile])
        );
      }
    }

    const countsBySession = new Map<string, ApplicationCounts>(
      ((countRows as ({ session_id: string } & ApplicationCounts)[] | null) ?? []).map(row => [
        row.session_id,
        {
          total_count: row.total_count ?? 0,
          active_count: row.active_count ?? 0,
          pending_count: row.pending_count ?? 0,
          accepted_count: row.accepted_count ?? 0,
          rejected_count: row.rejected_count ?? 0,
          cancelled_count: row.cancelled_count ?? 0,
        },
      ])
    );

    const acceptedIdsBySession = new Map<string, string[]>();
    (acceptedApps ?? []).forEach(application => {
      const current = acceptedIdsBySession.get(application.session_id) ?? [];
      current.push(application.user_id);
      acceptedIdsBySession.set(application.session_id, current);
    });

    const userApplicationBySession = new Map(
      ((userApps as FoundersClubApplication[] | null) ?? []).map(application => [application.session_id, application])
    );

    const enriched = await Promise.all(data.map(async (s) => {
      const applicationCounts = countsBySession.get(s.id) ?? {
        total_count: 0,
        active_count: 0,
        pending_count: 0,
        accepted_count: 0,
        rejected_count: 0,
        cancelled_count: 0,
      };
      const acceptedUserIds = acceptedIdsBySession.get(s.id) ?? [];
      let acceptedApplicants: Applicant[] = [];
      if (admin && acceptedUserIds.length > 0) {
        acceptedApplicants = acceptedUserIds
          .map(userId => profileById.get(userId))
          .filter((profile): profile is DecryptedProfile => Boolean(profile))
          .map(profile => ({
            id: profile.id,
            name: profile.name || "이름 없음",
            email: profile.email || "",
            company: profile.company || "",
          }));
      }

      return {
        ...s,
        accepted_count: applicationCounts.accepted_count,
        application_counts: applicationCounts,
        user_application: userApplicationBySession.get(s.id) ?? null,
        accepted_applicants: acceptedApplicants,
      };
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
    recruiting: { label: "모집중", bg: "var(--color-success-soft-bg)",  color: "var(--color-accent-green)" },
    closed:     { label: "마감",   bg: "var(--color-danger-soft-bg)",   color: "var(--color-brand-red)" },
    completed:  { label: "완료",   bg: "var(--color-glass-bg)",         color: "var(--color-text-muted)" },
  };

  return (
    <PageShell title="Founder's Club" subtitle="동료 창업자와 함께하는 주제별 소그룹 피어 러닝" accentColor="var(--color-accent-purple)">
      <div style={{ maxWidth: 900, margin: "0 auto", paddingBottom: 80 }}>
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ background: "var(--color-surface-card)", border: "1px solid var(--color-border-soft)", borderRadius: 20, padding: 28 }}>
                <div className="flex justify-between items-start mb-4">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px", color: "var(--color-text-muted)" }}>등록된 세션이 없습니다.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {sessions.map(s => {
              const cfg = statusCfg[s.status];
              const spotsLeft = s.max_participants - s.accepted_count;
              const alreadyApplied = !!s.user_application;
              const appStatus = s.user_application?.status;
              const appColor = appStatus === "accepted" ? "var(--color-accent-green)" : appStatus === "rejected" ? "var(--color-brand-red)" : appStatus === "cancelled" ? "var(--color-neutral)" : "var(--color-warning)";

              return (
                <div key={s.id} style={{ background: "var(--color-surface-card)", border: "1px solid var(--color-border-soft)", borderRadius: 20, padding: 28, boxShadow: "var(--shadow-card-rest)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
                    <div>
                      <h3 style={{ margin: "0 0 6px", fontWeight: 800, color: "var(--color-text-primary)", fontSize: 18 }}>{s.theme}</h3>
                      {s.session_date && (
                        <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
                          {new Date(s.session_date).toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" })}
                          {s.session_time && ` ${s.session_time.slice(0, 5)}`}
                        </span>
                      )}
                      <div style={{ fontSize: 13, color: "var(--color-text-muted)", marginTop: 4 }}>{formatStructuredLocation(s.location)}</div>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={getStatusPillStyle(cfg.color, isDark)}>{cfg.label}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-muted)" }}>수락 {s.accepted_count}/{s.max_participants}명</span>
                      {isAdmin && (
                        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-muted)" }}>신청 {s.application_counts.total_count}건</span>
                      )}
                    </div>
                  </div>

                  {s.description && (
                    <p style={{ color: "var(--color-text-muted)", fontSize: 14, lineHeight: 1.65, margin: "0 0 16px" }}>{s.description}</p>
                  )}

                  {/* Spots indicator */}
                  <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
                    {Array.from({ length: s.max_participants }).map((_, i) => (
                      <div key={i} style={{ height: 6, flex: 1, borderRadius: 99, background: i < s.accepted_count ? "var(--color-capacity-fill)" : "var(--color-capacity-track)" }} />
                    ))}
                  </div>

                  {isAdmin ? (
                    <div>
                      <button
                        onClick={() => toggleExpanded(s.id)}
                        style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", padding: 0, color: "var(--color-text-muted)", fontSize: 13, fontWeight: 700 }}
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
                            <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--color-text-primary)", padding: "8px 12px", background: "var(--color-field-bg)", borderRadius: 10 }}>
                              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--color-text-muted)", flexShrink: 0 }} />
                              <span style={{ fontWeight: 600 }}>{a.name}</span>
                              {a.company && <span style={{ color: "var(--color-text-muted)" }}>· {a.company}</span>}
                              <span style={{ color: "var(--color-text-muted)", marginLeft: "auto", fontSize: 12 }}>{a.email}</span>
                            </div>
                          )) : (
                            <p style={{ color: "var(--color-text-muted)", fontSize: 13, margin: 0 }}>수락된 참여자가 없습니다.</p>
                          )}
                        </div>
                      )}
                    </div>
                  ) : alreadyApplied ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 0" }}>
                      <span style={getStatusPillStyle(appColor, isDark)}>
                        {{ pending: "신청 완료 — 검토 중", accepted: "수락됨", rejected: "신청이 거절되었습니다", cancelled: "신청이 취소되었습니다" }[appStatus!] ?? "신청함"}
                      </span>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setApplyTarget(s); setMessage(""); }}
                      disabled={s.status !== "recruiting" || spotsLeft <= 0}
                      style={{ padding: "11px 24px", borderRadius: 12, border: "none", background: s.status === "recruiting" && spotsLeft > 0 ? "var(--color-accent-blue)" : "var(--color-glass-bg-hover)", color: s.status === "recruiting" && spotsLeft > 0 ? "var(--color-on-primary)" : "var(--color-text-muted)", fontWeight: 700, cursor: s.status === "recruiting" && spotsLeft > 0 ? "pointer" : "not-allowed", fontSize: 14, transition: "filter 0.2s" }}
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
        <div style={{ position: "fixed", inset: 0, background: "var(--color-backdrop)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: LAYERS.modal, padding: 20 }} onClick={e => { if (e.target === e.currentTarget) setApplyTarget(null); }}>
          <div style={{ background: "var(--color-bg-elevated)", borderRadius: 24, padding: "36px 32px", width: "100%", maxWidth: 440, boxShadow: "var(--shadow-dialog)" }}>
            {appliedId === applyTarget.id ? (
              <div style={{ textAlign: "center" }}>
                <h3 style={{ color: "var(--color-text-primary)", fontWeight: 800, marginBottom: 12 }}>신청 완료!</h3>
                <p style={{ color: "var(--color-text-muted)", lineHeight: 1.6, marginBottom: 24 }}>신청이 접수되었습니다. 운영자 검토 후 수락 여부가 결정됩니다.</p>
                <button onClick={() => { setApplyTarget(null); setAppliedId(null); }} style={{ padding: "12px 32px", borderRadius: 12, border: "none", background: "var(--color-accent-blue)", color: "var(--color-on-primary)", fontWeight: 700, cursor: "pointer" }}>닫기</button>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <h3 style={{ color: "var(--color-text-primary)", fontWeight: 800, margin: 0, fontSize: 18 }}>{applyTarget.theme}</h3>
                  <button onClick={() => setApplyTarget(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", fontSize: 22 }}>×</button>
                </div>
                {applyTarget.description && (
                  <p style={{ color: "var(--color-text-primary)", fontSize: 14, lineHeight: 1.7, margin: "0 0 20px" }}>{applyTarget.description}</p>
                )}
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="참여 동기나 기대하는 점을 자유롭게 작성해주세요. (선택)"
                  rows={4}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1px solid var(--color-border-soft)", background: "var(--color-field-bg)", color: "var(--color-text-primary)", outline: "none", resize: "vertical", fontSize: 14, lineHeight: 1.6, boxSizing: "border-box", marginBottom: 16, fontFamily: "inherit" }}
                />
                <button
                  onClick={handleApply}
                  disabled={applying}
                  style={{ width: "100%", padding: "14px", borderRadius: 12, border: "none", background: "var(--color-accent-blue)", color: "var(--color-on-primary)", fontWeight: 800, cursor: "pointer", fontSize: 15, opacity: applying ? 0.6 : 1 }}
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
