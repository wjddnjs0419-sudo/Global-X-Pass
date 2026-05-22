import { useState, useEffect } from "react";
import { Ban, X } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { LAYERS } from "../../lib/layers";
import type { Consultant, ConsultingSlot } from "../../lib/types";
import { formatStructuredLocation } from "../../utils/scheduleFields";
import { ProgramConfirmationCard } from "./ProgramConfirmationCard";

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
  const [canceling, setCanceling] = useState(false);
  const [done, setDone] = useState(false);
  const [bookingCancelled, setBookingCancelled] = useState(false);
  const [bookedReservationId, setBookedReservationId] = useState<string | null>(null);

  const border = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)";
  const textMain = isDark ? "rgba(255,255,255,0.92)" : "#0f172a";
  const textMuted = isDark ? "rgba(255,255,255,0.45)" : "rgba(15,23,42,0.45)";
  const inputBg = isDark ? "rgba(255,255,255,0.06)" : "#fff";
  const inputStyle = { padding: "11px 14px", borderRadius: 10, background: inputBg, border: `1px solid ${border}`, color: textMain, outline: "none", width: "100%", boxSizing: "border-box" as const, fontSize: 14 };
  const modalCloseButtonStyle = {
    position: "absolute",
    top: "var(--space-md)",
    right: "var(--space-md)",
    width: "var(--size-event-application-action-sm, 36px)",
    height: "var(--size-event-application-action-sm, 36px)",
    borderRadius: "50%",
    border: "1px solid var(--color-border-soft)",
    background: "var(--color-field-bg)",
    color: "var(--color-text-muted)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    zIndex: 1,
  } as const;

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

    const { data: reservation, error } = await supabase
      .from("consulting_reservations")
      .insert({ slot_id: selectedSlot, user_id: user.id, description: description.trim(), status: "confirmed" })
      .select("id")
      .single();
    if (error) {
      if (error.code === "23505") {
        alert("이미 다른 분이 예약한 시간입니다. 다른 시간대를 선택해주세요.");
      } else {
        alert("예약 중 오류가 발생했습니다. 다시 시도해주세요.");
      }
      setLoading(false);
      return;
    }

    const { data: updatedSlots } = await supabase
      .from("consulting_slots")
      .update({ status: "booked" })
      .eq("id", selectedSlot)
      .eq("status", "available")
      .select("id");

    if (!updatedSlots || updatedSlots.length === 0) {
      if (reservation?.id) {
        await supabase.from("consulting_reservations").update({ status: "cancelled" }).eq("id", reservation.id);
      }
      alert("이미 다른 분이 예약한 슬롯입니다. 다른 시간을 선택해주세요.");
      setLoading(false);
      return;
    }

    setBookedReservationId(reservation.id);
    setBookingCancelled(false);
    setDone(true);
    setLoading(false);
  };

  const handleCancelReservation = async () => {
    if (!bookedReservationId) return;
    if (!window.confirm("컨설팅 예약을 취소하시겠습니까?")) return;

    setCanceling(true);
    const { error } = await supabase
      .from("consulting_reservations")
      .update({ status: "cancelled" })
      .eq("id", bookedReservationId);

    if (error) {
      alert("예약 취소 실패: " + error.message);
      setCanceling(false);
      return;
    }

    setBookedReservationId(null);
    setBookingCancelled(true);
    setCanceling(false);
  };

  // Group slots by date
  const slotsByDate = slots.reduce<Record<string, ConsultingSlot[]>>((acc, s) => {
    (acc[s.slot_date] = acc[s.slot_date] || []).push(s);
    return acc;
  }, {});

  return (
    <div style={{ position: "fixed", inset: 0, background: "var(--color-backdrop)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: LAYERS.modal, padding: 20 }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ position: "relative", background: "var(--color-bg-elevated)", borderRadius: 24, padding: "36px 32px", width: "100%", maxWidth: 500, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 60px rgba(0,0,0,0.25)" }}>
        {done && (
          <button type="button" aria-label="모달 닫기" onClick={onClose} style={modalCloseButtonStyle}>
            <X size="var(--size-event-application-icon-md, 18px)" />
          </button>
        )}
        {done ? (
          <ProgramConfirmationCard
            title={bookingCancelled ? "예약이 취소되었습니다." : "컨설팅 예약이 확정되었습니다."}
            description={bookingCancelled ? "다시 예약이 필요하면 새로운 슬롯을 선택해주세요." : "예약 안내는 등록된 이메일로 공유드리겠습니다."}
            padding="20px 0"
            actions={bookingCancelled
              ? [
                  { label: "내 신청 내역 보기", to: "/mypage" },
                  { label: "닫기", onClick: onClose },
                ]
              : [
                  {
                    label: "예약 취소",
                    loadingLabel: "취소 중...",
                    loading: canceling,
                    variant: "destructive",
                    icon: <Ban size="var(--size-event-application-icon-md)" />,
                    onClick: handleCancelReservation,
                  },
                  { label: "내 신청 내역 보기", to: "/mypage" },
                ]}
          />
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
                <p style={{ color: textMuted, fontSize: 14, padding: "20px", textAlign: "center", background: isDark ? "rgba(255,255,255,0.03)" : "var(--color-bg-surface)", borderRadius: 12 }}>현재 예약 가능한 슬롯이 없습니다.</p>
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
                          style={{ padding: "8px 16px", borderRadius: 10, border: `1px solid ${selectedSlot === s.id ? "var(--color-accent-blue)" : border}`, background: selectedSlot === s.id ? "var(--color-accent-blue)" : "transparent", color: selectedSlot === s.id ? "var(--color-on-primary)" : textMain, fontWeight: 600, cursor: "pointer", fontSize: 14, transition: "all 0.15s", textAlign: "left" }}
                        >
                          <span style={{ display: "block" }}>{s.slot_time.slice(0, 5)} ({s.duration_minutes}분)</span>
                          <span style={{ display: "block", fontSize: 11, opacity: 0.75, marginTop: 2 }}>{formatStructuredLocation(s.location)}</span>
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
              style={{ width: "100%", padding: "14px", borderRadius: 12, border: "none", background: "var(--color-accent-blue)", color: "var(--color-on-primary)", fontWeight: 800, cursor: "pointer", fontSize: 15, opacity: !selectedSlot || !description.trim() ? 0.5 : 1 }}
            >
              {loading ? "예약 중..." : "컨설팅 예약 확정하기"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
