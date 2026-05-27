import { useState, useEffect, useCallback } from "react";
import { useTheme } from "../ThemeContext";
import { supabase } from "../../lib/supabaseClient";
import { Skeleton } from "./ui/skeleton";
import type { OfficeHourMonth } from "../../lib/types";
import { formatOfficeHourMonth } from "../constants/officeHours";
import { OfficeHourApplyModal } from "./OfficeHourApplyModal";
import { useAuthGate } from "../../hooks/useAuthGate";

interface Props {
  userId: string | null;
  isAdmin?: boolean;
}

/** 오피스아워 — 전문가를 노출하지 않고 6~12월 월별로 모집, 관리자가 매칭한다. */
export function OfficeHourPanel({ userId, isAdmin = false }: Props) {
  const { isDark } = useTheme();
  const { requireAuth } = useAuthGate();
  const [months, setMonths] = useState<OfficeHourMonth[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [myActiveMonthIds, setMyActiveMonthIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applyMonth, setApplyMonth] = useState<OfficeHourMonth | null>(null);

  const load = useCallback(async () => {
    // gated: 월 목록·잔여석은 비로그인도 열람 가능. 내 신청내역만 로그인 시 조회.
    setLoading(true);
    setError(null);
    try {
      const [monthsRes, countsRes] = await Promise.all([
        supabase.from("office_hour_months").select("*").order("display_order"),
        supabase.rpc("office_hour_month_counts"),
      ]);

      if (monthsRes.error) throw monthsRes.error;

      setMonths((monthsRes.data as OfficeHourMonth[]) || []);

      const countMap: Record<string, number> = {};
      ((countsRes.data as { month_id: string; active_count: number }[] | null) || []).forEach(r => {
        countMap[r.month_id] = Number(r.active_count);
      });
      setCounts(countMap);

      if (userId) {
        const mineRes = await supabase
          .from("office_hour_applications")
          .select("month_id, status")
          .eq("user_id", userId);
        const mine = new Set<string>();
        ((mineRes.data as { month_id: string; status: string }[] | null) || []).forEach(r => {
          if (r.status !== "cancelled" && r.status !== "rejected") mine.add(r.month_id);
        });
        setMyActiveMonthIds(mine);
      } else {
        setMyActiveMonthIds(new Set());
      }
    } catch (e) {
      console.error("office hour load error:", e);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  return (
    <>
      <div style={{ background: "var(--color-surface-card)", border: "1px solid var(--color-border-soft)", borderRadius: 16, padding: "18px 22px", marginBottom: 32 }}>
        <p style={{ margin: 0, color: "var(--color-text-muted)", fontSize: 14, lineHeight: 1.7 }}>
          오피스아워는 <strong style={{ color: "var(--color-text-primary)" }}>월별로 모집</strong>하는 매칭형 상담입니다.
          원하는 달을 신청하시면 담당자가 적합한 전문가와 일정·장소를 매칭해 안내드립니다.
        </p>
      </div>

      {error && (
        <div style={{ background: "var(--color-danger-soft-bg)", border: "1px solid var(--color-danger-soft-border)", borderRadius: 12, padding: "14px 18px", marginBottom: 24, color: "var(--color-brand-red)", fontSize: 14, fontWeight: 600 }}>
          데이터 로드 오류: {error}
        </div>
      )}

      {isAdmin && (
        <div style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border-soft)", borderRadius: 12, padding: "14px 18px", marginBottom: 24, color: "var(--color-text-muted)", fontSize: 14, fontWeight: 600 }}>
          관리자 계정은 오피스아워를 신청할 수 없습니다. 신청 매칭은 관리자 페이지에서 진행하세요.
        </div>
      )}

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} style={{ background: "var(--color-surface-card)", border: "1px solid var(--color-border-soft)", borderRadius: 20, padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          ))}
        </div>
      ) : months.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px", color: "var(--color-text-muted)" }}>모집 중인 오피스아워가 없습니다.</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
          {months.map(m => {
            const used = counts[m.id] ?? 0;
            const remaining = Math.max(m.capacity - used, 0);
            const isFull = remaining <= 0;
            const applied = myActiveMonthIds.has(m.id);
            const disabled = isAdmin || applied || !m.is_open || isFull;

            const buttonLabel = isAdmin
              ? "관리자 신청 불가"
              : applied
              ? "신청 완료"
              : !m.is_open
              ? "모집 마감"
              : isFull
              ? "정원 마감"
              : "신청하기";

            const statusText = !m.is_open
              ? "모집 마감"
              : applied
              ? "신청 완료"
              : `잔여 ${remaining} / ${m.capacity}석`;

            return (
              <div
                key={m.id}
                style={{ background: "var(--color-surface-card)", border: "1px solid var(--color-border-soft)", borderRadius: 20, padding: 24, display: "flex", flexDirection: "column", gap: 14, boxShadow: "var(--shadow-card-rest)" }}
              >
                <div style={{ fontWeight: 800, color: "var(--color-text-primary)", fontSize: 19 }}>
                  {formatOfficeHourMonth(m.period_month)}
                </div>
                <div style={{ color: applied ? "var(--color-accent-blue)" : "var(--color-text-muted)", fontSize: 14, fontWeight: 700 }}>
                  {statusText}
                </div>
                <button
                  onClick={() => requireAuth(() => setApplyMonth(m))}
                  disabled={disabled}
                  style={{ marginTop: "auto", padding: "12px 14px", borderRadius: 12, border: "none", background: disabled ? "var(--color-skeleton-bg)" : "var(--color-accent-blue)", color: disabled ? "var(--color-text-muted)" : "var(--color-on-primary)", fontWeight: 700, cursor: disabled ? "default" : "pointer", fontSize: 15, transition: "filter 0.2s" }}
                  onMouseEnter={e => { if (!disabled) e.currentTarget.style.filter = "brightness(1.1)"; }}
                  onMouseLeave={e => (e.currentTarget.style.filter = "none")}
                >
                  {buttonLabel}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {applyMonth && userId && (
        <OfficeHourApplyModal
          month={applyMonth}
          userId={userId}
          isDark={isDark}
          onClose={() => setApplyMonth(null)}
          onApplied={() => { setApplyMonth(null); load(); }}
        />
      )}
    </>
  );
}
