import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import type { OfficeHourMonth } from "../../lib/types";
import { formatOfficeHourMonth } from "../constants/officeHours";
import { ProgramConfirmationCard } from "./ProgramConfirmationCard";
import { ModalShell, getModalFieldStyle } from "./ModalShell";

interface Props {
  month: OfficeHourMonth;
  userId: string;
  isDark: boolean;
  onClose: () => void;
  onApplied: () => void;
}

export function OfficeHourApplyModal({ month, userId, isDark, onClose, onApplied }: Props) {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const textMain = isDark ? "rgba(255,255,255,0.92)" : "#0f172a";
  const textMuted = isDark ? "rgba(255,255,255,0.45)" : "rgba(15,23,42,0.45)";

  const handleSubmit = async () => {
    if (!topic.trim()) return alert("상담 희망 분야/주제를 입력해주세요.");
    setLoading(true);

    const { error } = await supabase
      .from("office_hour_applications")
      .insert({ month_id: month.id, user_id: userId, topic: topic.trim(), status: "pending" });

    if (error) {
      if (error.code === "23505") {
        alert("이미 이 달에 오피스아워를 신청하셨습니다.");
      } else if (/admin/i.test(error.message)) {
        alert("관리자 계정은 오피스아워를 신청할 수 없습니다.");
      } else if (/full/i.test(error.message)) {
        alert("해당 월 모집 정원이 마감되었습니다. 다른 달을 선택해주세요.");
      } else if (/closed/i.test(error.message)) {
        alert("해당 월은 모집이 마감되었습니다.");
      } else {
        alert("신청 중 오류가 발생했습니다. 다시 시도해주세요.");
      }
      setLoading(false);
      return;
    }

    setDone(true);
    setLoading(false);
    onApplied();
  };

  return (
    <ModalShell onClose={onClose} showCloseButton={done}>
      {done ? (
        <ProgramConfirmationCard
          title="오피스아워 신청이 접수되었습니다."
          description="담당자가 전문가를 매칭한 뒤 일정과 장소를 안내드립니다. 진행 상황은 마이페이지에서 확인하세요."
          padding="20px 0"
          actions={[
            { label: "내 신청 내역 보기", to: "/mypage" },
            { label: "닫기", onClick: onClose },
          ]}
        />
      ) : (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
            <div>
              <h3 style={{ color: textMain, fontWeight: 800, margin: "0 0 4px", fontSize: 20 }}>{formatOfficeHourMonth(month.period_month)} 오피스아워</h3>
              <p style={{ color: textMuted, margin: 0, fontSize: 13 }}>신청하시면 담당자가 전문가를 매칭해 일정을 안내드립니다.</p>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: textMuted, fontSize: 22, lineHeight: 1 }}>×</button>
          </div>

          <div style={{ marginBottom: 20 }}>
            <p style={{ color: textMain, fontWeight: 700, fontSize: 14, margin: "0 0 8px" }}>상담 희망 분야/주제 *</p>
            <textarea
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="어떤 도움이 필요한지, 현재 상황과 상담받고 싶은 주제를 자유롭게 작성해주세요."
              rows={5}
              style={{ ...getModalFieldStyle(isDark), resize: "vertical", lineHeight: 1.6 }}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || !topic.trim()}
            style={{ width: "100%", padding: "14px", borderRadius: 12, border: "none", background: "var(--color-accent-blue)", color: "var(--color-on-primary)", fontWeight: 800, cursor: "pointer", fontSize: 15, opacity: !topic.trim() ? 0.5 : 1 }}
          >
            {loading ? "신청 중..." : "오피스아워 신청하기"}
          </button>
        </>
      )}
    </ModalShell>
  );
}
