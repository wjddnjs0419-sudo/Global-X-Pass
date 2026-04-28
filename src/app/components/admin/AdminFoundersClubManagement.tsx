import { useState, useEffect } from "react";
import { useTheme } from "../../ThemeContext";
import { supabase } from "../../../lib/supabaseClient";
import type { FoundersClubSession } from "../../../lib/types";

type SubTab = "sessions" | "applications";

export function AdminFoundersClubManagement() {
  const { isDark } = useTheme();
  const [subTab, setSubTab] = useState<SubTab>("sessions");
  const [sessions, setSessions] = useState<FoundersClubSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<FoundersClubSession | null>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [form, setForm] = useState({ theme: "", description: "", max_participants: 6, session_date: "", session_time: "" });
  const [statusFilter, setStatusFilter] = useState<"all" | "recruiting" | "closed" | "completed">("all");
  const [loading, setLoading] = useState(false);

  const card = isDark ? "rgba(255,255,255,0.04)" : "#ffffff";
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const textMain = isDark ? "rgba(255,255,255,0.92)" : "rgba(10,16,32,0.88)";
  const textMuted = isDark ? "rgba(255,255,255,0.45)" : "rgba(10,16,32,0.45)";
  const inputBg = isDark ? "rgba(255,255,255,0.04)" : "#fff";
  const inputStyle = { padding: "10px 14px", borderRadius: 10, background: inputBg, border: `1px solid ${border}`, color: textMain, outline: "none", width: "100%", boxSizing: "border-box" as const, fontSize: 14 };

  useEffect(() => { fetchSessions(); }, []);
  useEffect(() => { if (selectedSession) fetchApplications(selectedSession.id); }, [selectedSession]);

  const fetchSessions = async () => {
    const { data } = await supabase.from("founders_club_sessions").select("*").order("created_at", { ascending: false });
    if (data) setSessions(data as FoundersClubSession[]);
  };

  const fetchApplications = async (sessionId: string) => {
    const { data } = await supabase
      .from("founders_club_applications")
      .select("*, profiles(name, email, company)")
      .eq("session_id", sessionId)
      .order("created_at");
    if (data) setApplications(data);
  };

  const handleCreateSession = async () => {
    if (!form.theme.trim()) return;
    setLoading(true);
    const { error } = await supabase.from("founders_club_sessions").insert({
      theme: form.theme.trim(),
      description: form.description.trim() || null,
      max_participants: form.max_participants,
      session_date: form.session_date || null,
      session_time: form.session_time || null,
    });
    if (error) alert("생성 실패: " + error.message);
    else { setForm({ theme: "", description: "", max_participants: 6, session_date: "", session_time: "" }); fetchSessions(); }
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
    if (error) alert("처리 실패: " + error.message);
    else if (selectedSession) { fetchApplications(selectedSession.id); fetchSessions(); }
    setLoading(false);
  };

  const statusCfg: Record<string, { label: string; color: string }> = {
    recruiting: { label: "모집중", color: "#18A343" },
    closed:     { label: "마감",   color: "#EA4335" },
    completed:  { label: "완료",   color: "#888" },
  };

  const appStatusCfg: Record<string, { label: string; color: string }> = {
    pending:  { label: "대기",   color: "#FBBC05" },
    accepted: { label: "수락",   color: "#18A343" },
    rejected: { label: "거절",   color: "#EA4335" },
  };

  const Badge = ({ status, cfg }: { status: string; cfg: Record<string, { label: string; color: string }> }) => {
    const c = cfg[status] ?? { label: status, color: "#888" };
    return <span style={{ fontSize: 12, fontWeight: 700, color: c.color, background: c.color + "22", padding: "3px 10px", borderRadius: 99 }}>{c.label}</span>;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <h3 style={{ fontSize: "22px", fontWeight: 800, color: textMain }}>Founder's Club 관리</h3>

      <div style={{ display: "flex", gap: "8px" }}>
        {(["sessions", "applications"] as SubTab[]).map(t => (
          <button key={t} onClick={() => setSubTab(t)} style={{ padding: "10px 20px", borderRadius: 12, border: subTab === t ? "none" : `1px solid ${border}`, background: subTab === t ? "#4377F1" : "transparent", color: subTab === t ? "#fff" : textMuted, fontWeight: 700, cursor: "pointer" } as any}>
            {{ sessions: "세션 관리", applications: "신청 관리" }[t]}
          </button>
        ))}
      </div>

      {/* Sessions tab */}
      {subTab === "sessions" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 20, padding: 24, display: "flex", flexDirection: "column", gap: 10 }}>
            <p style={{ margin: 0, fontWeight: 700, color: textMain }}>새 세션 등록</p>
            <input style={inputStyle} placeholder="테마 (예: SaaS MRR Growth, Vietnam Marketing)" value={form.theme} onChange={e => setForm(f => ({ ...f, theme: e.target.value }))} />
            <input style={inputStyle} placeholder="설명 (선택)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 1fr", gap: 10 }}>
              <input style={inputStyle} type="number" min={5} max={7} placeholder="정원" value={form.max_participants} onChange={e => setForm(f => ({ ...f, max_participants: Number(e.target.value) }))} />
              <input style={inputStyle} type="date" value={form.session_date} onChange={e => setForm(f => ({ ...f, session_date: e.target.value }))} />
              <input style={inputStyle} type="time" value={form.session_time} onChange={e => setForm(f => ({ ...f, session_time: e.target.value }))} />
            </div>
            <button onClick={handleCreateSession} disabled={loading || !form.theme.trim()} style={{ padding: "10px", borderRadius: 10, border: "none", background: "#4377F1", color: "#fff", fontWeight: 700, cursor: "pointer", opacity: !form.theme.trim() ? 0.5 : 1 }}>세션 등록</button>
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
                  padding: "7px 16px", borderRadius: 99, border: "none", fontWeight: 700, cursor: "pointer", fontSize: 13, transition: "all 0.2s",
                  background: statusFilter === f.id
                    ? ({ all: "#4377F1", recruiting: "#18A343", closed: "#EA4335", completed: "#888" }[f.id])
                    : (isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9"),
                  color: statusFilter === f.id ? "#fff" : textMuted,
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
            <div key={s.id} style={{ background: card, border: `1px solid ${border}`, borderRadius: 16, padding: "18px 22px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, color: textMain }}>{s.theme}</span>
                  <Badge status={s.status} cfg={statusCfg} />
                </div>
                <div style={{ fontSize: 13, color: textMuted }}>
                  정원 {s.max_participants}명 {s.session_date && `· ${s.session_date} ${s.session_time?.slice(0, 5) ?? ""}`}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <select
                  value={s.status}
                  onChange={e => handleChangeStatus(s, e.target.value as FoundersClubSession["status"])}
                  style={{ padding: "7px 10px", borderRadius: 8, border: `1px solid ${border}`, background: inputBg, color: textMain, fontWeight: 700, cursor: "pointer", fontSize: 13 }}
                >
                  <option value="recruiting">모집중</option>
                  <option value="closed">마감</option>
                  <option value="completed">완료</option>
                </select>
                <button onClick={() => { setSelectedSession(s); setSubTab("applications"); }} style={{ padding: "8px 14px", borderRadius: 8, border: "none", background: "#4377F122", color: "#4377F1", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>신청 보기</button>
                <button onClick={() => handleDeleteSession(s.id)} style={{ padding: "8px 14px", borderRadius: 8, border: "none", background: "rgba(239,68,68,0.1)", color: "#ef4444", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>삭제</button>
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
              <button key={s.id} onClick={() => setSelectedSession(s)} style={{ padding: "8px 16px", borderRadius: 10, border: selectedSession?.id === s.id ? "none" : `1px solid ${border}`, background: selectedSession?.id === s.id ? "#4377F1" : "transparent", color: selectedSession?.id === s.id ? "#fff" : textMuted, fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
                {s.theme}
              </button>
            ))}
          </div>

          {!selectedSession ? (
            <div style={{ textAlign: "center", padding: "60px", color: textMuted }}>세션을 선택하세요.</div>
          ) : applications.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px", color: textMuted }}>신청이 없습니다.</div>
          ) : applications.map(a => (
            <div key={a.id} style={{ background: card, border: `1px solid ${border}`, borderRadius: 16, padding: "18px 22px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, color: textMain }}>{a.profiles?.name}</span>
                  <span style={{ fontSize: 12, color: textMuted }}>{a.profiles?.company}</span>
                  <Badge status={a.status} cfg={appStatusCfg} />
                </div>
                {a.message && <div style={{ fontSize: 13, color: textMuted, marginTop: 4 }}>{a.message}</div>}
                <div style={{ fontSize: 12, color: textMuted, marginTop: 4 }}>{new Date(a.created_at).toLocaleString()}</div>
              </div>
              {a.status === "pending" && (
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => handleUpdateApplication(a.id, "accepted")} disabled={loading} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#18A343", color: "#fff", fontWeight: 700, cursor: "pointer" }}>수락</button>
                  <button onClick={() => handleUpdateApplication(a.id, "rejected")} disabled={loading} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "rgba(239,68,68,0.1)", color: "#ef4444", fontWeight: 700, cursor: "pointer" }}>거절</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
