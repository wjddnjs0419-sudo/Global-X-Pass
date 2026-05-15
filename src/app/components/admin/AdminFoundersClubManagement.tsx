import { useState, useEffect } from "react";
import { useTheme } from "../../ThemeContext";
import { supabase } from "../../../lib/supabaseClient";
import {
  composeIsoDate,
  composeStructuredLocation,
  composeTime,
  formatStructuredLocation,
  getDayOptions,
  getHourOptions,
  getMonthOptions,
  getTenMinuteOptions,
  getYearOptions,
} from "../../../utils/scheduleFields";
import { Check, Trash2, X } from "lucide-react";
import { getStatusPillStyle } from "../contentListStyles";
import type { FoundersClubSession } from "../../../lib/types";

type SubTab = "sessions" | "applications";

type DecryptedProfile = {
  id: string;
  name: string | null;
  email: string | null;
  company: string | null;
};

type ApplicationCounts = {
  total_count: number;
  active_count: number;
  pending_count: number;
  accepted_count: number;
  rejected_count: number;
  cancelled_count: number;
};

type FoundersClubApplicationRow = {
  id: string;
  user_id: string;
  status: "pending" | "accepted" | "rejected" | "cancelled";
  message: string | null;
  created_at: string;
  profile: DecryptedProfile | null;
};

export function AdminFoundersClubManagement() {
  const { isDark } = useTheme();
  const [subTab, setSubTab] = useState<SubTab>("sessions");
  const [sessions, setSessions] = useState<FoundersClubSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<FoundersClubSession | null>(null);
  const [applications, setApplications] = useState<FoundersClubApplicationRow[]>([]);
  const [countsBySession, setCountsBySession] = useState<Record<string, ApplicationCounts>>({});
  const [form, setForm] = useState({
    theme: "",
    description: "",
    locationName: "",
    locationAddress: "",
    max_participants: 6,
    session_date_y: "",
    session_date_m: "",
    session_date_d: "",
    session_time: "",
  });
  const [statusFilter, setStatusFilter] = useState<"all" | "recruiting" | "closed" | "completed">("all");
  const [loading, setLoading] = useState(false);

  const card = isDark ? "rgba(255,255,255,0.04)" : "#ffffff";
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const textMain = isDark ? "rgba(255,255,255,0.92)" : "rgba(10,16,32,0.88)";
  const textMuted = isDark ? "rgba(255,255,255,0.45)" : "rgba(10,16,32,0.45)";
  const inputBg = isDark ? "rgba(255,255,255,0.04)" : "#fff";
  const inputStyle = { padding: "10px 14px", borderRadius: 10, background: inputBg, border: `1px solid ${border}`, color: textMain, outline: "none", width: "100%", boxSizing: "border-box" as const, fontSize: 14 };

  const skColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const labelBg = isDark ? "rgba(255,255,255,0.045)" : "rgba(15,23,42,0.035)";
  const labelBorder = isDark ? "rgba(255,255,255,0.10)" : "rgba(15,23,42,0.09)";
  const selectedBg = isDark ? "rgba(255,255,255,0.10)" : "rgba(15,23,42,0.07)";
  const deleteBg = isDark ? "rgba(234,67,53,0.08)" : "rgba(234,67,53,0.06)";
  const deleteBorder = isDark ? "rgba(234,67,53,0.28)" : "rgba(234,67,53,0.22)";

  const Sk = ({ h = 78, r = 16 }: { h?: number; r?: number }) => (
    <div style={{ height: h, borderRadius: r, background: skColor, animation: "pulse 1.5s ease-in-out infinite" }} />
  );

  useEffect(() => { 
    setLoading(true);
    fetchSessions().finally(() => setLoading(false));
  }, []);

  useEffect(() => { 
    if (selectedSession) {
      setLoading(true);
      fetchApplications(selectedSession.id).finally(() => setLoading(false));
    }
  }, [selectedSession]);

  const emptyCounts = (): ApplicationCounts => ({
    total_count: 0,
    active_count: 0,
    pending_count: 0,
    accepted_count: 0,
    rejected_count: 0,
    cancelled_count: 0,
  });

  const getSessionCounts = (sessionId?: string | null) =>
    (sessionId ? countsBySession[sessionId] : null) ?? emptyCounts();

  const fetchSessions = async () => {
    const [{ data }, { data: counts, error: countsError }] = await Promise.all([
      supabase.from("founders_club_sessions").select("*").order("created_at", { ascending: false }),
      supabase.rpc("get_founders_club_application_counts"),
    ]);
    if (countsError) console.error("Founder's Club 신청 집계 조회 오류:", countsError.message);
    if (counts) {
      const nextCounts = ((counts as ({ session_id: string } & ApplicationCounts)[] | null) ?? []).reduce<Record<string, ApplicationCounts>>((acc, row) => {
        acc[row.session_id] = {
          total_count: row.total_count ?? 0,
          active_count: row.active_count ?? 0,
          pending_count: row.pending_count ?? 0,
          accepted_count: row.accepted_count ?? 0,
          rejected_count: row.rejected_count ?? 0,
          cancelled_count: row.cancelled_count ?? 0,
        };
        return acc;
      }, {});
      setCountsBySession(nextCounts);
    } else {
      setCountsBySession({});
    }
    if (data) setSessions(data as FoundersClubSession[]);
  };

  const fetchApplications = async (sessionId: string) => {
    const { data, error } = await supabase.functions.invoke("founders-club-admin-applications", {
      body: { sessionId },
    });

    if (error) {
      console.error("Founder's Club 신청 조회 오류:", error.message);
      return;
    }

    setApplications((data?.applications ?? []) as FoundersClubApplicationRow[]);
    if ((data?.deleted ?? 0) > 0) {
      fetchSessions();
    }
  };

  const handleCreateSession = async () => {
    if (!form.theme.trim()) return;
    setLoading(true);
    const { session_date_y: y, session_date_m: m, session_date_d: d } = form;
    const session_date = composeIsoDate(y, m, d) || null;
    const location = composeStructuredLocation(form.locationName, form.locationAddress);
    const { error } = await supabase.from("founders_club_sessions").insert({
      theme: form.theme.trim(),
      description: form.description.trim() || null,
      location: location || null,
      max_participants: form.max_participants,
      session_date,
      session_time: form.session_time || null,
    });
    if (error) alert("생성 실패: " + error.message);
    else { setForm({ theme: "", description: "", locationName: "", locationAddress: "", max_participants: 6, session_date_y: "", session_date_m: "", session_date_d: "", session_time: "" }); fetchSessions(); }
    setLoading(false);
  };

  const handleChangeStatus = async (session: FoundersClubSession, newStatus: FoundersClubSession["status"]) => {
    await supabase.from("founders_club_sessions").update({ status: newStatus }).eq("id", session.id);
    fetchSessions();
    if (selectedSession?.id === session.id) setSelectedSession({ ...session, status: newStatus });
  };

  const handleDeleteSession = async (id: string) => {
    if (!window.confirm("이 세션을 삭제하면 모든 신청이 함께 삭제됩니다.")) return;
    await supabase.from("founders_club_sessions").delete().eq("id", id);
    fetchSessions();
    if (selectedSession?.id === id) setSelectedSession(null);
  };

  const handleUpdateApplication = async (id: string, status: "accepted" | "rejected") => {
    setLoading(true);
    const { error } = await supabase.from("founders_club_applications").update({ status }).eq("id", id);
    if (error) alert(error.message.includes("founders club capacity reached") ? "정원이 마감되어 더 이상 승인할 수 없습니다." : "처리 실패: " + error.message);
    else if (selectedSession) { fetchApplications(selectedSession.id); fetchSessions(); }
    setLoading(false);
  };

  const handleDeleteApplication = async (id: string) => {
    if (!window.confirm("이 신청 내역을 삭제하시겠습니까? 삭제 후에는 복구할 수 없습니다.")) return;
    setLoading(true);
    const { error } = await supabase.from("founders_club_applications").delete().eq("id", id);
    if (error) alert("삭제 실패: " + error.message);
    else if (selectedSession) { fetchApplications(selectedSession.id); fetchSessions(); }
    setLoading(false);
  };

  const statusCfg: Record<string, { label: string; color: string }> = {
    recruiting: { label: "모집중", color: "var(--color-accent-green)" },
    closed:     { label: "마감",   color: "var(--color-brand-red)" },
    completed:  { label: "완료",   color: "var(--color-text-muted)" },
  };

  const appStatusCfg: Record<string, { label: string; color: string }> = {
    pending:  { label: "대기",   color: "var(--color-brand-yellow)" },
    accepted: { label: "승인",   color: "var(--color-accent-green)" },
    rejected: { label: "거절",   color: "var(--color-brand-red)" },
    cancelled: { label: "취소", color: "var(--color-neutral)" },
  };

  const Badge = ({ status, cfg }: { status: string; cfg: Record<string, { label: string; color: string }> }) => {
    const c = cfg[status] ?? { label: status, color: "var(--color-text-muted)" };
    return <span style={{ ...getStatusPillStyle(c.color, isDark), whiteSpace: "nowrap", flexShrink: 0 }}>{c.label}</span>;
  };

  const selectedCounts = getSessionCounts(selectedSession?.id);

  if (loading && sessions.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <h3 style={{ fontSize: "22px", fontWeight: 800, color: textMain }}>Founder's Club 관리</h3>
        <div style={{ display: "flex", gap: "8px" }}>
          {[0, 1].map(i => <div key={i} style={{ width: 100, height: 40, borderRadius: 12, background: skColor, animation: "pulse 1.5s ease-in-out infinite" }} />)}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[0, 1, 2, 3, 4].map(i => <Sk key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <h3 style={{ fontSize: "22px", fontWeight: 800, color: textMain }}>Founder's Club 관리</h3>

      <div style={{ display: "flex", gap: "8px" }}>
        {(["sessions", "applications"] as SubTab[]).map(t => (
          <button key={t} onClick={() => setSubTab(t)} style={{ padding: "10px 20px", borderRadius: 12, border: `1px solid ${subTab === t ? labelBorder : border}`, background: subTab === t ? selectedBg : "transparent", color: subTab === t ? textMain : textMuted, fontWeight: 750, cursor: "pointer" } as any}>
            {{ sessions: "세션 관리", applications: "신청 관리" }[t]}
          </button>
        ))}
      </div>

      {/* Sessions tab */}
      {subTab === "sessions" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 16, padding: 22, display: "flex", flexDirection: "column", gap: 10 }}>
            <p style={{ margin: 0, fontWeight: 700, color: textMain }}>새 세션 등록</p>
            <input style={inputStyle} placeholder="테마 (예: SaaS MRR Growth, Vietnam Marketing)" value={form.theme} onChange={e => setForm(f => ({ ...f, theme: e.target.value }))} />
            <input style={inputStyle} placeholder="설명 (선택)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 10 }}>
              <input style={inputStyle} placeholder="장소 이름 (예: NCF 라운지)" value={form.locationName} onChange={e => setForm(f => ({ ...f, locationName: e.target.value }))} />
              <input style={inputStyle} placeholder="주소 또는 링크 (예: 낙성대역 14길 8)" value={form.locationAddress} onChange={e => setForm(f => ({ ...f, locationAddress: e.target.value }))} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: 12, color: textMuted, fontWeight: 600 }}>날짜</span>
                <div style={{ display: "flex", gap: 6 }}>
                  <select
                    style={{ ...inputStyle, flex: 2 }}
                    value={form.session_date_y}
                    onChange={e => setForm(f => ({ ...f, session_date_y: e.target.value }))}
                  >
                    <option value="">년</option>
                    {getYearOptions().map(y => (
                      <option key={y} value={y}>{y}년</option>
                    ))}
                  </select>
                  <select
                    style={{ ...inputStyle, flex: 1 }}
                    value={form.session_date_m}
                    onChange={e => {
                      const m = e.target.value;
                      const maxD = form.session_date_y && m ? new Date(Number(form.session_date_y), Number(m), 0).getDate() : 31;
                      const validD = form.session_date_d && Number(form.session_date_d) <= maxD ? form.session_date_d : "";
                      setForm(f => ({ ...f, session_date_m: m, session_date_d: validD }));
                    }}
                  >
                    <option value="">월</option>
                    {getMonthOptions().map(m => (
                      <option key={m} value={m}>{Number(m)}월</option>
                    ))}
                  </select>
                  <select
                    style={{ ...inputStyle, flex: 1 }}
                    value={form.session_date_d}
                    onChange={e => setForm(f => ({ ...f, session_date_d: e.target.value }))}
                  >
                    <option value="">일</option>
                    {getDayOptions(form.session_date_y, form.session_date_m).map(d => (
                      <option key={d} value={d}>{Number(d)}일</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: 12, color: textMuted, fontWeight: 600 }}>시간</span>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <select
                    style={{ ...inputStyle, flex: 1 }}
                    value={form.session_time ? form.session_time.split(":")[0] : ""}
                    onChange={e => {
                      const h = e.target.value;
                      const m = form.session_time?.split(":")[1] || "00";
                      setForm(f => ({ ...f, session_time: composeTime(h, m) }));
                    }}
                  >
                    <option value="">시</option>
                    {getHourOptions().map(h => (
                      <option key={h} value={h}>{h}시</option>
                    ))}
                  </select>
                  <span style={{ color: textMuted, fontWeight: 700 }}>:</span>
                  <select
                    style={{ ...inputStyle, flex: 1 }}
                    value={form.session_time ? form.session_time.split(":")[1] : ""}
                    onChange={e => {
                      const m = e.target.value;
                      const h = form.session_time?.split(":")[0] || "";
                      if (h) setForm(f => ({ ...f, session_time: composeTime(h, m) }));
                    }}
                  >
                    <option value="">분</option>
                    {getTenMinuteOptions().map(val => (
                      <option key={val} value={val}>{val}분</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 12, color: textMuted, fontWeight: 600 }}>최대 정원</span>
              <select
                style={inputStyle}
                value={form.max_participants}
                onChange={e => setForm(f => ({ ...f, max_participants: Number(e.target.value) }))}
              >
                {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                  <option key={n} value={n}>{n}명</option>
                ))}
              </select>
            </div>
            <button onClick={handleCreateSession} disabled={loading || !form.theme.trim()} style={{ padding: "10px", borderRadius: 10, border: "none", background: "var(--color-accent-blue)", color: "var(--color-on-primary)", fontWeight: 750, cursor: "pointer", opacity: !form.theme.trim() ? 0.5 : 1, boxShadow: "none" }}>세션 등록</button>
          </div>

          {/* Status filter */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {([
              { id: "all",        label: "전체" },
              { id: "recruiting", label: "모집중" },
              { id: "closed",     label: "마감" },
              { id: "completed",  label: "완료" },
            ] as const).map(f => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                style={{
                  padding: "7px 16px", borderRadius: 99, border: `1px solid ${statusFilter === f.id ? labelBorder : "transparent"}`, fontWeight: 750, cursor: "pointer", fontSize: 13, transition: "all 0.2s",
                  background: statusFilter === f.id ? selectedBg : labelBg,
                  color: statusFilter === f.id ? textMain : textMuted,
                }}
              >
                {f.label}
                {f.id !== "all" && (
                  <span style={{ marginLeft: 6, fontSize: 11, opacity: 0.8 }}>
                    {sessions.filter(s => s.status === f.id).length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {sessions.filter(s => statusFilter === "all" || s.status === statusFilter).map(s => (
            <div key={s.id} className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between" style={{ background: card, border: `1px solid ${border}`, borderRadius: 16, padding: "18px 22px" }}>
              <div style={{ minWidth: 0, flex: "1 1 auto" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 700, color: textMain, minWidth: 0, overflowWrap: "anywhere" }}>{s.theme}</span>
                  <Badge status={s.status} cfg={statusCfg} />
                </div>
                <div style={{ fontSize: 13, color: textMuted }}>
                  정원 {s.max_participants}명 · 수락 {getSessionCounts(s.id).accepted_count}명 · 신청 {getSessionCounts(s.id).total_count}건{s.session_date && ` · ${s.session_date} ${s.session_time?.slice(0, 5) ?? ""}`}
                </div>
                <div style={{ fontSize: 12, color: textMuted, marginTop: 4 }}>
                  대기 {getSessionCounts(s.id).pending_count}건 · 취소 {getSessionCounts(s.id).cancelled_count}건 · 거절 {getSessionCounts(s.id).rejected_count}건
                </div>
                <div style={{ fontSize: 12, color: textMuted, marginTop: 4 }}>{formatStructuredLocation(s.location)}</div>
              </div>
              <div className="flex w-full flex-wrap gap-2 md:w-auto md:flex-nowrap md:justify-end" style={{ alignItems: "center" }}>
                <select
                  value={s.status}
                  onChange={e => handleChangeStatus(s, e.target.value as FoundersClubSession["status"])}
                  style={{ padding: "7px 10px", borderRadius: 8, border: `1px solid ${border}`, background: inputBg, color: textMain, fontWeight: 700, cursor: "pointer", fontSize: 13, minWidth: 96, flex: "1 1 120px", whiteSpace: "nowrap" }}
                >
                  <option value="recruiting">모집중</option>
                  <option value="closed">마감</option>
                  <option value="completed">완료</option>
                </select>
                <button onClick={() => { setSelectedSession(s); setSubTab("applications"); }} style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${labelBorder}`, background: selectedBg, color: textMain, fontWeight: 750, cursor: "pointer", fontSize: 13, whiteSpace: "nowrap", flexShrink: 0 }}>신청 보기</button>
                <button onClick={() => handleDeleteSession(s.id)} style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${deleteBorder}`, background: deleteBg, color: "var(--color-brand-red)", fontWeight: 700, cursor: "pointer", fontSize: 13, whiteSpace: "nowrap", flexShrink: 0 }}>삭제</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Applications tab */}
      {subTab === "applications" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {sessions.map(s => (
              <button key={s.id} onClick={() => setSelectedSession(s)} style={{ padding: "8px 16px", borderRadius: 10, border: `1px solid ${selectedSession?.id === s.id ? labelBorder : border}`, background: selectedSession?.id === s.id ? selectedBg : "transparent", color: selectedSession?.id === s.id ? textMain : textMuted, fontWeight: selectedSession?.id === s.id ? 750 : 600, cursor: "pointer", fontSize: 13 }}>
                {s.theme} · 신청 {getSessionCounts(s.id).total_count}
              </button>
            ))}
          </div>

          {!selectedSession ? (
            <div style={{ textAlign: "center", padding: "60px", color: textMuted }}>세션을 선택하세요.</div>
          ) : (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[
                { label: "전체", value: `${selectedCounts.total_count}건` },
                { label: "대기", value: `${selectedCounts.pending_count}건` },
                { label: "승인", value: `${selectedCounts.accepted_count}건` },
                { label: "거절", value: `${selectedCounts.rejected_count}건` },
                { label: "취소", value: `${selectedCounts.cancelled_count}건` },
              ].map(item => (
                <div key={item.label} style={{ padding: "10px 12px", borderRadius: 12, border: `1px solid ${border}`, background: card, color: textMain, fontSize: 13, fontWeight: 700 }}>
                  {item.label} {item.value}
                </div>
              ))}
            </div>
          )}

          {!selectedSession ? null : applications.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px", color: textMuted }}>신청이 없습니다.</div>
          ) : applications.map(a => (
            <div key={a.id} style={{ background: card, border: `1px solid ${border}`, borderRadius: 16, padding: "18px 22px" }}>
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div style={{ minWidth: 0, flex: "1 1 auto" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, color: textMain }}>{a.profile?.name || "프로필 정보 없음"}</span>
                  <span style={{ fontSize: 12, color: textMuted }}>{a.profile?.company}</span>
                  <Badge status={a.status} cfg={appStatusCfg} />
                  {!a.profile?.name && (
                    <span style={{ fontSize: 11, color: textMuted, fontWeight: 700 }}>정리 필요</span>
                  )}
                </div>
                {a.message && <div style={{ fontSize: 13, color: textMuted, marginTop: 4 }}>{a.message}</div>}
                <div style={{ fontSize: 12, color: textMuted, marginTop: 4 }}>{new Date(a.created_at).toLocaleString()}</div>
                </div>
                <div className="flex flex-wrap gap-2 md:min-w-[180px] md:justify-end">
                  {a.status === "pending" && (
                    <>
                    <button type="button" disabled={loading} onClick={() => handleUpdateApplication(a.id, "accepted")} style={{ minWidth: 82, height: 32, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "0 12px", borderRadius: 10, border: `1px solid ${labelBorder}`, background: selectedBg, color: textMain, fontSize: 13, fontWeight: 800, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.55 : 1 }}>
                      <Check size={14} />승인
                    </button>
                    <button type="button" disabled={loading} onClick={() => handleUpdateApplication(a.id, "rejected")} style={{ minWidth: 82, height: 32, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "0 12px", borderRadius: 10, border: `1px solid ${deleteBorder}`, background: deleteBg, color: "var(--color-brand-red)", fontSize: 13, fontWeight: 800, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.55 : 1 }}>
                      <X size={14} />거절
                    </button>
                    </>
                  )}
                  <button type="button" disabled={loading} onClick={() => handleDeleteApplication(a.id)} style={{ minWidth: 82, height: 32, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "0 12px", borderRadius: 10, border: `1px solid ${deleteBorder}`, background: deleteBg, color: "var(--color-brand-red)", fontSize: 13, fontWeight: 800, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.55 : 1 }}>
                    <Trash2 size={14} />삭제
                  </button>
                </div>
                </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminFoundersClubManagement;
