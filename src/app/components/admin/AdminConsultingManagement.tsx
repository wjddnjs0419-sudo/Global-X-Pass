import { useState, useEffect } from "react";
import { useTheme } from "../../ThemeContext";
import { supabase } from "../../../lib/supabaseClient";
import type { Consultant, ConsultingSlot, ConsultingReservation } from "../../../lib/types";

type SubTab = "consultants" | "slots" | "reservations";

const CATEGORY_LABELS: Record<string, string> = { legal: "법률/특허/회계", global: "글로벌 진출", tech: "기술 자문" };

export function AdminConsultingManagement() {
  const { isDark } = useTheme();
  const [subTab, setSubTab] = useState<SubTab>("consultants");
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [slots, setSlots] = useState<ConsultingSlot[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [selectedConsultant, setSelectedConsultant] = useState<string>("");

  // Consultant form
  const [form, setForm] = useState({ name: "", category: "legal" as Consultant["category"], bio: "", expertise: "", image_url: "" });
  // Slot form
  const [slotForm, setSlotForm] = useState({ consultant_id: "", slot_date_y: "", slot_date_m: "", slot_date_d: "", slot_time: "", duration_minutes: 60 });
  const [loading, setLoading] = useState(false);

  const card = isDark ? "rgba(255,255,255,0.04)" : "#ffffff";
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const textMain = isDark ? "rgba(255,255,255,0.92)" : "rgba(10,16,32,0.88)";
  const textMuted = isDark ? "rgba(255,255,255,0.45)" : "rgba(10,16,32,0.45)";
  const inputBg = isDark ? "rgba(255,255,255,0.04)" : "#fff";
  const inputStyle = { padding: "10px 14px", borderRadius: 10, background: inputBg, border: `1px solid ${border}`, color: textMain, outline: "none", width: "100%", boxSizing: "border-box" as const, fontSize: 14 };

  useEffect(() => { fetchConsultants(); fetchReservations(); }, []);
  useEffect(() => { if (selectedConsultant) fetchSlots(selectedConsultant); }, [selectedConsultant]);

  const fetchConsultants = async () => {
    const { data } = await supabase.from("consultants").select("*").order("display_order");
    if (data) setConsultants(data as Consultant[]);
  };

  const fetchSlots = async (consultantId: string) => {
    const { data } = await supabase.from("consulting_slots").select("*").eq("consultant_id", consultantId).order("slot_date").order("slot_time");
    if (data) setSlots(data as ConsultingSlot[]);
  };

  const fetchReservations = async () => {
    const { data } = await supabase
      .from("consulting_reservations")
      .select("*, consulting_slots(slot_date, slot_time, consultants(name, category)), profiles(name, email)")
      .order("created_at", { ascending: false });
    if (data) setReservations(data);
  };

  const handleCreateConsultant = async () => {
    if (!form.name.trim()) return;
    setLoading(true);
    const expertise = form.expertise.split(",").map(s => s.trim()).filter(Boolean);
    const { error } = await supabase.from("consultants").insert({ ...form, expertise, bio: form.bio || null, image_url: form.image_url || null });
    if (error) alert("생성 실패: " + error.message);
    else { setForm({ name: "", category: "legal", bio: "", expertise: "", image_url: "" }); fetchConsultants(); }
    setLoading(false);
  };

  const handleDeleteConsultant = async (id: string) => {
    if (!window.confirm("전문가를 삭제하면 모든 슬롯과 예약이 함께 삭제됩니다.")) return;
    await supabase.from("consultants").delete().eq("id", id);
    fetchConsultants();
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    await supabase.from("consultants").update({ is_active: !current }).eq("id", id);
    fetchConsultants();
  };

  const handleCreateSlot = async () => {
    const { slot_date_y: y, slot_date_m: m, slot_date_d: d } = slotForm;
    const slot_date = y && m && d ? `${y}-${m}-${d}` : "";
    if (!slotForm.consultant_id || !slot_date || !slotForm.slot_time) return alert("전문가, 날짜, 시간을 모두 입력해주세요.");
    setLoading(true);
    const { error } = await supabase.from("consulting_slots").insert({ consultant_id: slotForm.consultant_id, slot_date, slot_time: slotForm.slot_time, duration_minutes: slotForm.duration_minutes });
    if (error) alert("슬롯 생성 실패: " + error.message);
    else { fetchSlots(slotForm.consultant_id); setSelectedConsultant(slotForm.consultant_id); }
    setLoading(false);
  };

  const handleDeleteSlot = async (id: string) => {
    await supabase.from("consulting_slots").delete().eq("id", id);
    if (selectedConsultant) fetchSlots(selectedConsultant);
  };

  const handleUpdateReservation = async (id: string, status: "confirmed" | "rejected", note: string) => {
    setLoading(true);
    const { error } = await supabase.from("consulting_reservations").update({ status, admin_note: note || null }).eq("id", id);
    if (error) alert("처리 실패: " + error.message);
    else {
      if (status === "rejected") {
        // Free up the slot
        const res = reservations.find(r => r.id === id);
        if (res?.slot_id) await supabase.from("consulting_slots").update({ status: "available" }).eq("id", res.slot_id);
      }
      fetchReservations();
    }
    setLoading(false);
  };

  const statusBadge = (s: string) => {
    const cfg = { pending: { label: "대기중", color: "#FBBC05" }, confirmed: { label: "확정", color: "#18A343" }, rejected: { label: "거절", color: "#EA4335" } }[s] ?? { label: s, color: "#888" };
    return <span style={{ fontSize: 12, fontWeight: 700, color: cfg.color, background: cfg.color + "22", padding: "3px 10px", borderRadius: 99 }}>{cfg.label}</span>;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <h3 style={{ fontSize: "22px", fontWeight: 800, color: textMain }}>컨설팅 관리</h3>

      <div style={{ display: "flex", gap: "8px" }}>
        {(["consultants", "slots", "reservations"] as SubTab[]).map(t => (
          <button key={t} onClick={() => setSubTab(t)} style={{ padding: "10px 20px", borderRadius: 12, background: subTab === t ? "#4377F1" : "transparent", color: subTab === t ? "#fff" : textMuted, fontWeight: 700, cursor: "pointer", border: subTab === t ? "none" : `1px solid ${border}` } as any}>
            {{ consultants: "전문가 관리", slots: "슬롯 관리", reservations: "예약 승인" }[t]}
          </button>
        ))}
      </div>

      {/* Consultants tab */}
      {subTab === "consultants" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 20, padding: 24, display: "flex", flexDirection: "column", gap: 10 }}>
            <p style={{ margin: 0, fontWeight: 700, color: textMain }}>전문가 등록</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <input style={inputStyle} placeholder="이름" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              <select style={inputStyle} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as Consultant["category"] }))}>
                <option value="legal">법률/특허/회계</option>
                <option value="global">글로벌 진출</option>
                <option value="tech">기술 자문</option>
              </select>
            </div>
            <input style={inputStyle} placeholder="전문 분야 (쉼표로 구분, 예: M&A, 특허출원)" value={form.expertise} onChange={e => setForm(f => ({ ...f, expertise: e.target.value }))} />
            <input style={inputStyle} placeholder="소개 (선택)" value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} />
            <input style={inputStyle} placeholder="프로필 사진 URL (선택)" value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} />
            <button onClick={handleCreateConsultant} disabled={loading || !form.name.trim()} style={{ padding: "10px", borderRadius: 10, border: "none", background: "#4377F1", color: "#fff", fontWeight: 700, cursor: "pointer", opacity: !form.name.trim() ? 0.5 : 1 }}>전문가 등록</button>
          </div>

          {consultants.map(c => (
            <div key={c.id} style={{ background: card, border: `1px solid ${border}`, borderRadius: 16, padding: "18px 22px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, color: textMain }}>{c.name}</span>
                  <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: 99, background: "#4377F122", color: "#4377F1", fontWeight: 600 }}>{CATEGORY_LABELS[c.category]}</span>
                  {!c.is_active && <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: 99, background: "#88888822", color: "#888", fontWeight: 600 }}>비활성</span>}
                </div>
                {c.expertise.length > 0 && <div style={{ fontSize: 12, color: textMuted }}>{c.expertise.join(" · ")}</div>}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => handleToggleActive(c.id, c.is_active)} style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${border}`, background: "none", color: textMuted, fontWeight: 700, cursor: "pointer", fontSize: 13 }}>
                  {c.is_active ? "비활성화" : "활성화"}
                </button>
                <button onClick={() => handleDeleteConsultant(c.id)} style={{ padding: "8px 14px", borderRadius: 8, border: "none", background: "rgba(239,68,68,0.1)", color: "#ef4444", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>삭제</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Slots tab */}
      {subTab === "slots" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 20, padding: 24, display: "flex", flexDirection: "column", gap: 10 }}>
            <p style={{ margin: 0, fontWeight: 700, color: textMain }}>슬롯 추가</p>
            <select style={inputStyle} value={slotForm.consultant_id} onChange={e => { setSlotForm(f => ({ ...f, consultant_id: e.target.value })); setSelectedConsultant(e.target.value); }}>
              <option value="">전문가 선택...</option>
              {consultants.map(c => <option key={c.id} value={c.id}>{c.name} — {CATEGORY_LABELS[c.category]}</option>)}
            </select>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: 12, color: textMuted, fontWeight: 600 }}>날짜</span>
                <div style={{ display: "flex", gap: 6 }}>
                  <select
                    style={{ ...inputStyle, flex: 2 }}
                    value={slotForm.slot_date_y}
                    onChange={e => setSlotForm(f => ({ ...f, slot_date_y: e.target.value }))}
                  >
                    <option value="">년</option>
                    {Array.from({ length: 4 }, (_, i) => String(new Date().getFullYear() + i)).map(y => (
                      <option key={y} value={y}>{y}년</option>
                    ))}
                  </select>
                  <select
                    style={{ ...inputStyle, flex: 1 }}
                    value={slotForm.slot_date_m}
                    onChange={e => {
                      const m = e.target.value;
                      const maxD = slotForm.slot_date_y && m ? new Date(Number(slotForm.slot_date_y), Number(m), 0).getDate() : 31;
                      const validD = slotForm.slot_date_d && Number(slotForm.slot_date_d) <= maxD ? slotForm.slot_date_d : "";
                      setSlotForm(f => ({ ...f, slot_date_m: m, slot_date_d: validD }));
                    }}
                  >
                    <option value="">월</option>
                    {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")).map(m => (
                      <option key={m} value={m}>{Number(m)}월</option>
                    ))}
                  </select>
                  <select
                    style={{ ...inputStyle, flex: 1 }}
                    value={slotForm.slot_date_d}
                    onChange={e => setSlotForm(f => ({ ...f, slot_date_d: e.target.value }))}
                  >
                    <option value="">일</option>
                    {(() => {
                      const days = slotForm.slot_date_y && slotForm.slot_date_m
                        ? new Date(Number(slotForm.slot_date_y), Number(slotForm.slot_date_m), 0).getDate()
                        : 31;
                      return Array.from({ length: days }, (_, i) => String(i + 1).padStart(2, "0")).map(d => (
                        <option key={d} value={d}>{Number(d)}일</option>
                      ));
                    })()}
                  </select>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: 12, color: textMuted, fontWeight: 600 }}>시간</span>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <select
                    style={{ ...inputStyle, flex: 1 }}
                    value={slotForm.slot_time ? slotForm.slot_time.split(":")[0] : ""}
                    onChange={e => {
                      const h = e.target.value;
                      const m = slotForm.slot_time?.split(":")[1] || "00";
                      setSlotForm(f => ({ ...f, slot_time: h ? `${h}:${m}` : "" }));
                    }}
                  >
                    <option value="">시</option>
                    {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0")).map(h => (
                      <option key={h} value={h}>{h}시</option>
                    ))}
                  </select>
                  <span style={{ color: textMuted, fontWeight: 700 }}>:</span>
                  <select
                    style={{ ...inputStyle, flex: 1 }}
                    value={slotForm.slot_time ? slotForm.slot_time.split(":")[1] : ""}
                    onChange={e => {
                      const m = e.target.value;
                      const h = slotForm.slot_time?.split(":")[0] || "";
                      if (h) setSlotForm(f => ({ ...f, slot_time: `${h}:${m}` }));
                    }}
                  >
                    <option value="">분</option>
                    {[0, 10, 20, 30, 40, 50].map(m => {
                      const val = String(m).padStart(2, "0");
                      return <option key={val} value={val}>{val}분</option>;
                    })}
                  </select>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 12, color: textMuted, fontWeight: 600 }}>소요 시간</span>
              <select
                style={inputStyle}
                value={slotForm.duration_minutes}
                onChange={e => setSlotForm(f => ({ ...f, duration_minutes: Number(e.target.value) }))}
              >
                <option value={30}>30분</option>
                <option value={45}>45분</option>
                <option value={60}>60분</option>
                <option value={90}>90분</option>
                <option value={120}>120분</option>
              </select>
            </div>
            <button onClick={handleCreateSlot} disabled={loading} style={{ padding: "10px", borderRadius: 10, border: "none", background: "#4377F1", color: "#fff", fontWeight: 700, cursor: "pointer" }}>슬롯 추가</button>
          </div>

          {slots.map(s => (
            <div key={s.id} style={{ background: card, border: `1px solid ${border}`, borderRadius: 14, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ fontWeight: 700, color: textMain }}>{s.slot_date} {s.slot_time.slice(0, 5)}</span>
                <span style={{ marginLeft: 10, fontSize: 12, color: textMuted }}>{s.duration_minutes}분</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: s.status === "available" ? "#18A343" : s.status === "booked" ? "#4377F1" : "#888" }}>
                  {{ available: "예약 가능", booked: "예약됨", cancelled: "취소됨" }[s.status]}
                </span>
                {s.status === "available" && (
                  <button onClick={() => handleDeleteSlot(s.id)} style={{ padding: "6px 12px", borderRadius: 8, border: "none", background: "rgba(239,68,68,0.1)", color: "#ef4444", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>삭제</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reservations tab */}
      {subTab === "reservations" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {reservations.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px", color: textMuted }}>접수된 예약이 없습니다.</div>
          ) : reservations.map(r => (
            <ReservationCard key={r.id} r={r} card={card} border={border} textMain={textMain} textMuted={textMuted} inputStyle={inputStyle} statusBadge={statusBadge} loading={loading} onUpdate={handleUpdateReservation} />
          ))}
        </div>
      )}
    </div>
  );
}

function ReservationCard({ r, card, border, textMain, textMuted, inputStyle, statusBadge, loading, onUpdate }: any) {
  const [note, setNote] = useState(r.admin_note || "");
  const slot = r.consulting_slots;
  const consultant = slot?.consultants;
  const profile = r.profiles;

  return (
    <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 16, padding: "20px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontWeight: 700, color: textMain }}>{profile?.name}</span>
            <span style={{ fontSize: 12, color: textMuted }}>{profile?.email}</span>
            {statusBadge(r.status)}
          </div>
          <div style={{ fontSize: 13, color: textMuted }}>
            {consultant?.name} · {slot?.slot_date} {slot?.slot_time?.slice(0, 5)}
          </div>
        </div>
        <div style={{ fontSize: 12, color: textMuted }}>{new Date(r.created_at).toLocaleDateString()}</div>
      </div>
      <div style={{ fontSize: 14, color: textMain, background: "rgba(0,0,0,0.03)", padding: "12px 16px", borderRadius: 10, lineHeight: 1.6 }}>{r.description}</div>
      {r.status === "pending" && (
        <div style={{ display: "flex", gap: 8 }}>
          <input style={{ ...inputStyle, flex: 1 }} placeholder="관리자 메모 (선택)" value={note} onChange={e => setNote(e.target.value)} />
          <button onClick={() => onUpdate(r.id, "confirmed", note)} disabled={loading} style={{ padding: "10px 18px", borderRadius: 10, border: "none", background: "#18A343", color: "#fff", fontWeight: 700, cursor: "pointer" }}>확정</button>
          <button onClick={() => onUpdate(r.id, "rejected", note)} disabled={loading} style={{ padding: "10px 18px", borderRadius: 10, border: "none", background: "rgba(239,68,68,0.1)", color: "#ef4444", fontWeight: 700, cursor: "pointer" }}>거절</button>
        </div>
      )}
      {r.admin_note && <div style={{ fontSize: 13, color: textMuted }}>메모: {r.admin_note}</div>}
    </div>
  );
}
