import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import type { Consultant, ConsultingSlot } from "../../lib/types";

interface Props {
  consultant: Consultant;
  isDark: boolean;
  onClose: () => void;
}

export function ConsultingBookingModal({ consultant, isDark, onClose }: Props) {
  const [slots, setSlots] = useState<ConsultingSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const border = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)";
  const textMain = isDark ? "rgba(255,255,255,0.92)" : "#0f172a";
  const textMuted = isDark ? "rgba(255,255,255,0.45)" : "rgba(15,23,42,0.45)";
  const inputBg = isDark ? "rgba(255,255,255,0.06)" : "#fff";
  const inputStyle = { padding: "11px 14px", borderRadius: 10, background: inputBg, border: `1px solid ${border}`, color: textMain, outline: "none", width: "100%", boxSizing: "border-box" as const, fontSize: 14 };

  useEffect(() => {
    supabase
      .from("consulting_slots")
      .select("*")
      .eq("consultant_id", consultant.id)
      .eq("status", "available")
      .gte("slot_date", new Date().toISOString().split("T")[0])
      .order("slot_date")
      .order("slot_time")
      .then(({ data }) => setSlots((data as ConsultingSlot[]) || []));
  }, [consultant.id]);

  const handleSubmit = async () => {
    if (!selectedSlot || !description.trim()) return alert("슬롯과 문의 내용을 모두 입력해주세요.");
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { alert("로그인이 필요합니다."); setLoading(false); return; }

    const { error } = await supabase.from("consulting_reservations").insert({ slot_id: selectedSlot, user_id: user.id, description: description.trim() });
    if (error) { alert("신청 실패: " + error.message); setLoading(false); return; }

    const { data: updatedSlots } = await supabase
      .from("consulting_slots")
      .update({ status: "booked" })
      .eq("id", selectedSlot)
      .eq("status", "available")
      .select("id");

    if (!updatedSlots || updatedSlots.length === 0) {
      alert("이미 다른 분이 예약한 슬롯입니다. 다른 시간을 선택해주세요.");
      setLoading(false);
      return;
    }

    setDone(true);
    setLoading(false);
  };

  // Group slots by date
  const slotsByDate = slots.reduce<Record<string, ConsultingSlot[]>>((acc, s) => {
    (acc[s.slot_date] = acc[s.slot_date] || []).push(s);
    return acc;
  }, {});

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, padding: 20 }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: isDark ? "#1e293b" : "#fff", borderRadius: 24, padding: "36px 32px", width: "100%", maxWidth: 500, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 60px rgba(0,0,0,0.25)" }}>
        {done ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <h3 style={{ color: textMain, fontWeight: 800, marginBottom: 12 }}>신청 완료!</h3>
            <p style={{ color: textMuted, lineHeight: 1.6 }}>신청이 접수되었습니다. 담당자 검토 후 이메일로 확정 안내를 드립니다.</p>
            <button onClick={onClose} style={{ marginTop: 24, padding: "12px 32px", borderRadius: 12, border: "none", background: "#4377F1", color: "#fff", fontWeight: 700, cursor: "pointer" }}>닫기</button>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
              <div>
                <h3 style={{ color: textMain, fontWeight: 800, margin: "0 0 4px", fontSize: 20 }}>{consultant.name}</h3>
                <p style={{ color: textMuted, margin: 0, fontSize: 13 }}>{consultant.expertise.join(" · ")}</p>
              </div>
              <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: textMuted, fontSize: 22, lineHeight: 1 }}>×</button>
            </div>

            <div style={{ marginBottom: 20 }}>
              <p style={{ color: textMain, fontWeight: 700, fontSize: 14, margin: "0 0 12px" }}>예약 가능한 시간 선택</p>
              {slots.length === 0 ? (
                <p style={{ color: textMuted, fontSize: 14, padding: "20px", textAlign: "center", background: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc", borderRadius: 12 }}>현재 예약 가능한 슬롯이 없습니다.</p>
              ) : (
                Object.entries(slotsByDate).map(([date, daySlots]) => (
                  <div key={date} style={{ marginBottom: 12 }}>
                    <p style={{ color: textMuted, fontSize: 12, fontWeight: 700, margin: "0 0 6px", letterSpacing: "0.05em" }}>
                      {new Date(date).toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" })}
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {daySlots.map(s => (
                        <button
                          key={s.id}
                          onClick={() => setSelectedSlot(s.id)}
                          style={{ padding: "8px 16px", borderRadius: 10, border: `1px solid ${selectedSlot === s.id ? "#4377F1" : border}`, background: selectedSlot === s.id ? "#4377F1" : "transparent", color: selectedSlot === s.id ? "#fff" : textMain, fontWeight: 600, cursor: "pointer", fontSize: 14, transition: "all 0.15s" }}
                        >
                          {s.slot_time.slice(0, 5)} ({s.duration_minutes}분)
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={{ marginBottom: 20 }}>
              <p style={{ color: textMain, fontWeight: 700, fontSize: 14, margin: "0 0 8px" }}>문의 내용 *</p>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="상담 받고 싶은 내용, 현재 상황 등을 자유롭게 작성해주세요."
                rows={4}
                style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading || !selectedSlot || !description.trim()}
              style={{ width: "100%", padding: "14px", borderRadius: 12, border: "none", background: "#4377F1", color: "#fff", fontWeight: 800, cursor: "pointer", fontSize: 15, opacity: !selectedSlot || !description.trim() ? 0.5 : 1 }}
            >
              {loading ? "신청 중..." : "컨설팅 신청하기"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
