import { useState, useEffect, useCallback } from "react";
import { Pencil, Trash2 } from "lucide-react";
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
  parseStructuredLocation,
  parseTimeParts,
} from "../../../utils/scheduleFields";
import { getFilterTabStyle, getStatusPillStyle } from "../contentListStyles";
import { formatOfficeHourMonth, OFFICE_HOUR_STATUS_LABEL, getOfficeHourStatusConfig } from "../../constants/officeHours";
import type { OfficeHourMonth } from "../../../lib/types";

type SubTab = "months" | "applications";

type AdminApplication = {
  id: string;
  month_id: string;
  user_id: string;
  topic: string;
  status: "pending" | "matched" | "completed" | "cancelled" | "rejected";
  matched_expert_name: string | null;
  matched_date: string | null;
  matched_time: string | null;
  matched_location: string | null;
  admin_note: string | null;
  created_at: string;
  office_hour_months?: { period_month?: string | null } | null;
  profile: { id: string; name: string | null; email: string | null; company: string | null } | null;
};

const card = "var(--color-surface-card)";
const border = "var(--color-border-soft)";
const textMain = "var(--color-text-primary)";
const textMuted = "var(--color-text-muted)";
const fieldStyle: React.CSSProperties = {
  padding: "9px 12px",
  borderRadius: 10,
  background: "var(--color-field-bg)",
  border: `1px solid ${border}`,
  color: textMain,
  outline: "none",
  fontSize: 14,
};

/** 신청을 월(period_month)별로 묶는다. 입력은 created_at 오름차순(신청 순)이라 그룹 내 순서가 곧 선착순. */
function groupApplicationsByMonth(apps: AdminApplication[]): { key: string; items: AdminApplication[] }[] {
  const map = new Map<string, AdminApplication[]>();
  for (const app of apps) {
    const key = app.office_hour_months?.period_month ?? "기타";
    const bucket = map.get(key);
    if (bucket) bucket.push(app);
    else map.set(key, [app]);
  }
  return [...map.keys()].sort().map(key => ({ key, items: map.get(key)! }));
}

export function AdminOfficeHourManagement() {
  const { isDark } = useTheme();
  const [subTab, setSubTab] = useState<SubTab>("months");
  const [months, setMonths] = useState<OfficeHourMonth[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [applications, setApplications] = useState<AdminApplication[]>([]);
  const [loadingMonths, setLoadingMonths] = useState(false);
  const [monthsError, setMonthsError] = useState<string | null>(null);
  const [loadingApps, setLoadingApps] = useState(false);
  const [appsError, setAppsError] = useState<string | null>(null);

  const loadMonths = useCallback(async () => {
    setLoadingMonths(true);
    setMonthsError(null);
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
    } catch (e) {
      console.error("office hour months load error:", e);
      setMonthsError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoadingMonths(false);
    }
  }, []);

  const loadApplications = useCallback(async () => {
    setLoadingApps(true);
    setAppsError(null);
    try {
      const { data, error } = await supabase.functions.invoke("office-hour-admin-applications");
      if (error) throw error;
      setApplications((data?.applications as AdminApplication[]) || []);
    } catch (e) {
      setAppsError(e instanceof Error ? e.message : String(e));
      setApplications([]);
    } finally {
      setLoadingApps(false);
    }
  }, []);

  useEffect(() => { loadMonths(); }, [loadMonths]);
  useEffect(() => { if (subTab === "applications") loadApplications(); }, [subTab, loadApplications]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <h2 style={{ color: textMain, fontSize: 22, fontWeight: 800, margin: 0 }}>오피스아워 관리</h2>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {([["months", "월별 정원"], ["applications", "신청 관리"]] as [SubTab, string][]).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setSubTab(id)}
            style={getFilterTabStyle(isDark, subTab === id)}
          >
            {label}
          </button>
        ))}
      </div>

      {subTab === "months" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {monthsError && (
            <div style={{ background: "var(--color-danger-soft-bg)", border: "1px solid var(--color-danger-soft-border)", borderRadius: 12, padding: "14px 18px", color: "var(--color-brand-red)", fontSize: 14, fontWeight: 600 }}>
              월 정보 로드 오류: {monthsError}
            </div>
          )}
          {loadingMonths ? (
            <div style={{ color: textMuted, padding: 40, textAlign: "center" }}>불러오는 중...</div>
          ) : months.length === 0 ? (
            <div style={{ color: textMuted, padding: 40, textAlign: "center" }}>모집 월이 없습니다.</div>
          ) : (
            months.map(m => (
              <MonthCapacityRow key={m.id} month={m} used={counts[m.id] ?? 0} onSaved={loadMonths} />
            ))
          )}
        </div>
      )}

      {subTab === "applications" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {appsError && (
            <div style={{ background: "var(--color-danger-soft-bg)", border: "1px solid var(--color-danger-soft-border)", borderRadius: 12, padding: "14px 18px", color: "var(--color-brand-red)", fontSize: 14, fontWeight: 600 }}>
              신청 목록 로드 오류: {appsError}
            </div>
          )}
          {loadingApps ? (
            <div style={{ color: textMuted, padding: 40, textAlign: "center" }}>불러오는 중...</div>
          ) : applications.length === 0 ? (
            <div style={{ color: textMuted, padding: 40, textAlign: "center" }}>접수된 신청이 없습니다.</div>
          ) : (
            groupApplicationsByMonth(applications).map(group => (
              <div key={group.key} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                  <span style={{ fontWeight: 800, color: textMain, fontSize: 15 }}>
                    {group.key === "기타" ? "월 미지정" : formatOfficeHourMonth(group.key)}
                  </span>
                  <span style={{ color: textMuted, fontSize: 13 }}>· 신청 {group.items.length}명 (신청 순)</span>
                </div>
                {group.items.map((app, i) => (
                  <ApplicationMatchCard key={app.id} app={app} seq={i + 1} isDark={isDark} onSaved={loadApplications} />
                ))}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function MonthCapacityRow({ month, used, onSaved }: { month: OfficeHourMonth; used: number; onSaved: () => void }) {
  const [capacity, setCapacity] = useState(String(month.capacity));
  const [isOpen, setIsOpen] = useState(month.is_open);
  const [saving, setSaving] = useState(false);

  const dirty = Number(capacity) !== month.capacity || isOpen !== month.is_open;

  const save = async () => {
    const cap = Number(capacity);
    if (!Number.isFinite(cap) || cap < 0) return alert("정원은 0 이상의 숫자여야 합니다.");
    setSaving(true);
    const { error } = await supabase
      .from("office_hour_months")
      .update({ capacity: cap, is_open: isOpen })
      .eq("id", month.id);
    setSaving(false);
    if (error) return alert("저장 실패: " + error.message);
    onSaved();
  };

  return (
    <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 16, padding: "16px 20px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
      <div style={{ fontWeight: 800, color: textMain, fontSize: 16, minWidth: 110 }}>{formatOfficeHourMonth(month.period_month)}</div>
      <div style={{ color: textMuted, fontSize: 13 }}>신청 {used}명</div>
      <label style={{ display: "flex", alignItems: "center", gap: 6, color: textMuted, fontSize: 13 }}>
        정원
        <input type="number" min={0} value={capacity} onChange={e => setCapacity(e.target.value)} style={{ ...fieldStyle, width: 80 }} />
      </label>
      <label style={{ display: "flex", alignItems: "center", gap: 6, color: textMuted, fontSize: 13, cursor: "pointer" }}>
        <input type="checkbox" checked={isOpen} onChange={e => setIsOpen(e.target.checked)} />
        모집 중
      </label>
      <button
        onClick={save}
        disabled={saving || !dirty}
        style={{ marginLeft: "auto", padding: "9px 18px", borderRadius: 10, border: "none", background: dirty ? "var(--color-accent-blue)" : "var(--color-skeleton-bg)", color: dirty ? "var(--color-on-primary)" : textMuted, fontWeight: 700, cursor: dirty ? "pointer" : "default", fontSize: 14 }}
      >
        {saving ? "저장 중..." : "저장"}
      </button>
    </div>
  );
}

function ApplicationMatchCard({ app, seq, isDark, onSaved }: { app: AdminApplication; seq: number; isDark: boolean; onSaved: () => void }) {
  const initialDate = (app.matched_date ?? "").split("-");
  const initialTime = parseTimeParts(app.matched_time);
  const initialLoc = parseStructuredLocation(app.matched_location);

  const [expert, setExpert] = useState(app.matched_expert_name ?? "");
  const [year, setYear] = useState(initialDate[0] ?? "");
  const [monthPart, setMonthPart] = useState(initialDate[1] ?? "");
  const [day, setDay] = useState(initialDate[2] ?? "");
  const [hour, setHour] = useState(initialTime.hour ?? "");
  const [minute, setMinute] = useState(initialTime.minute ?? "00");
  const [locName, setLocName] = useState(initialLoc.name);
  const [locAddress, setLocAddress] = useState(initialLoc.address);
  const [status, setStatus] = useState(app.status);
  const [note, setNote] = useState(app.admin_note ?? "");
  const [saving, setSaving] = useState(false);
  // 매칭 대기(pending)는 곧바로 편집, 매칭/완료/반려는 결과 요약을 먼저 보여준다.
  const [editing, setEditing] = useState(app.status === "pending");

  const periodMonth = app.office_hour_months?.period_month;
  const cfg = getOfficeHourStatusConfig(app.status);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("office_hour_applications")
      .update({
        status,
        matched_expert_name: expert.trim() || null,
        matched_date: composeIsoDate(year, monthPart, day) || null,
        matched_time: composeTime(hour, minute) || null,
        matched_location: composeStructuredLocation(locName, locAddress) || null,
        admin_note: note.trim() || null,
      })
      .eq("id", app.id);
    setSaving(false);
    if (error) return alert("저장 실패: " + error.message);
    if (status !== "pending") setEditing(false);
    onSaved();
  };

  const reject = async () => {
    if (!confirm("이 신청을 반려하시겠습니까? 반려하면 해당 월 정원이 한 자리 복구됩니다.")) return;
    setSaving(true);
    const { error } = await supabase
      .from("office_hour_applications")
      .update({ status: "rejected" })
      .eq("id", app.id);
    setSaving(false);
    if (error) return alert("반려 실패: " + error.message);
    setStatus("rejected");
    setEditing(false);
    onSaved();
  };

  const remove = async () => {
    if (!confirm("반려된 이 신청을 삭제하시겠습니까? 삭제하면 되돌릴 수 없습니다.")) return;
    setSaving(true);
    const { error } = await supabase
      .from("office_hour_applications")
      .delete()
      .eq("id", app.id);
    setSaving(false);
    if (error) return alert("삭제 실패: " + error.message);
    onSaved();
  };

  const seqBadge: React.CSSProperties = {
    background: "var(--color-bg-surface)", color: textMuted, fontSize: 12, fontWeight: 800,
    padding: "2px 8px", borderRadius: 8, whiteSpace: "nowrap",
  };
  const iconBtn: React.CSSProperties = {
    width: 32, height: 32, display: "inline-flex", alignItems: "center", justifyContent: "center",
    borderRadius: 10, border: `1px solid ${border}`, background: "transparent", color: textMuted, cursor: "pointer",
  };
  const iconBtnDanger: React.CSSProperties = {
    width: 32, height: 32, display: "inline-flex", alignItems: "center", justifyContent: "center",
    borderRadius: 10, border: "1px solid var(--color-danger-soft-border)", background: "var(--color-danger-soft-bg)", color: "var(--color-brand-red)", cursor: "pointer",
  };

  const scheduleText = app.matched_date
    ? `${app.matched_date}${app.matched_time ? ` ${app.matched_time.slice(0, 5)}` : ""}`
    : "미정";
  const locationText = app.matched_location ? formatStructuredLocation(app.matched_location) : "미정";

  const summaryRow = (label: string, value: string) => (
    <div style={{ display: "flex", gap: 10, fontSize: 14 }}>
      <span style={{ color: textMuted, fontWeight: 700, minWidth: 76 }}>{label}</span>
      <span style={{ color: textMain }}>{value}</span>
    </div>
  );

  return (
    <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 16, padding: "20px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={seqBadge}>#{seq}</span>
            <span style={{ fontWeight: 800, color: textMain, fontSize: 16 }}>
              {periodMonth ? formatOfficeHourMonth(periodMonth) : "오피스아워"} · {app.profile?.name ?? "(이름 없음)"}
            </span>
          </div>
          <div style={{ color: textMuted, fontSize: 13, marginTop: 3 }}>
            {app.profile?.email ?? "-"}{app.profile?.company ? ` · ${app.profile.company}` : ""}
          </div>
          <div style={{ color: textMuted, fontSize: 12, marginTop: 2 }}>
            신청일 {new Date(app.created_at).toLocaleDateString("ko-KR")}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ ...getStatusPillStyle(cfg.color, isDark), whiteSpace: "nowrap" }}>{cfg.label}</span>
          {!editing && (
            <button type="button" onClick={() => setEditing(true)} style={iconBtn} aria-label="매칭 수정" title="매칭 수정">
              <Pencil size={15} />
            </button>
          )}
          {app.status === "rejected" && (
            <button type="button" onClick={remove} disabled={saving} style={iconBtnDanger} aria-label="신청 삭제" title="신청 삭제">
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>

      <div style={{ background: "var(--color-bg-surface)", borderRadius: 10, padding: "12px 14px" }}>
        <div style={{ color: textMuted, fontSize: 12, fontWeight: 700, marginBottom: 4 }}>상담 희망 분야/주제</div>
        <div style={{ color: textMain, fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{app.topic}</div>
      </div>

      {editing ? (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <span style={{ color: textMuted, fontSize: 12, fontWeight: 700 }}>매칭 전문가</span>
              <input value={expert} onChange={e => setExpert(e.target.value)} placeholder="전문가 이름" style={fieldStyle} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <span style={{ color: textMuted, fontSize: 12, fontWeight: 700 }}>일정</span>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <select value={year} onChange={e => setYear(e.target.value)} style={fieldStyle}>
                  <option value="">년</option>
                  {getYearOptions().map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <select value={monthPart} onChange={e => setMonthPart(e.target.value)} style={fieldStyle}>
                  <option value="">월</option>
                  {getMonthOptions().map(mm => <option key={mm} value={mm}>{mm}</option>)}
                </select>
                <select value={day} onChange={e => setDay(e.target.value)} style={fieldStyle}>
                  <option value="">일</option>
                  {getDayOptions(year, monthPart).map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <select value={hour} onChange={e => setHour(e.target.value)} style={fieldStyle}>
                  <option value="">시</option>
                  {getHourOptions().map(h => <option key={h} value={h}>{h}</option>)}
                </select>
                <select value={minute} onChange={e => setMinute(e.target.value)} style={fieldStyle}>
                  {getTenMinuteOptions().map(mi => <option key={mi} value={mi}>{mi}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <span style={{ color: textMuted, fontSize: 12, fontWeight: 700 }}>장소</span>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <input value={locName} onChange={e => setLocName(e.target.value)} placeholder="장소명 (예: Google Meet)" style={{ ...fieldStyle, flex: 1, minWidth: 140 }} />
                <input value={locAddress} onChange={e => setLocAddress(e.target.value)} placeholder="주소/링크 (선택)" style={{ ...fieldStyle, flex: 1, minWidth: 140 }} />
              </div>
              <span style={{ color: textMuted, fontSize: 11 }}>미리보기: {formatStructuredLocation(composeStructuredLocation(locName, locAddress))}</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <span style={{ color: textMuted, fontSize: 12, fontWeight: 700 }}>상태</span>
              <select value={status} onChange={e => setStatus(e.target.value as AdminApplication["status"])} style={fieldStyle}>
                <option value="pending">{OFFICE_HOUR_STATUS_LABEL.pending}</option>
                <option value="matched">{OFFICE_HOUR_STATUS_LABEL.matched}</option>
                <option value="completed">{OFFICE_HOUR_STATUS_LABEL.completed}</option>
                <option value="rejected">{OFFICE_HOUR_STATUS_LABEL.rejected}</option>
                {app.status === "cancelled" && <option value="cancelled">{OFFICE_HOUR_STATUS_LABEL.cancelled}</option>}
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <span style={{ color: textMuted, fontSize: 12, fontWeight: 700 }}>관리자 메모 (내부용)</span>
              <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} style={{ ...fieldStyle, resize: "vertical", lineHeight: 1.5 }} />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={reject}
              disabled={saving || app.status === "rejected"}
              style={{ padding: "10px 18px", borderRadius: 10, border: "1px solid var(--color-danger-soft-border)", background: "var(--color-danger-soft-bg)", color: "var(--color-brand-red)", fontWeight: 700, cursor: saving || app.status === "rejected" ? "default" : "pointer", fontSize: 14, opacity: app.status === "rejected" ? 0.5 : 1 }}
            >
              매칭 반려
            </button>
            <div style={{ display: "flex", gap: 8 }}>
              {app.status !== "pending" && (
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  disabled={saving}
                  style={{ padding: "10px 18px", borderRadius: 10, border: `1px solid ${border}`, background: "transparent", color: textMuted, fontWeight: 700, cursor: "pointer", fontSize: 14 }}
                >
                  취소
                </button>
              )}
              <button
                type="button"
                onClick={save}
                disabled={saving}
                style={{ padding: "10px 22px", borderRadius: 10, border: "none", background: "var(--color-accent-blue)", color: "var(--color-on-primary)", fontWeight: 700, cursor: "pointer", fontSize: 14 }}
              >
                {saving ? "저장 중..." : "매칭 저장"}
              </button>
            </div>
          </div>
        </>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {summaryRow("매칭 전문가", app.matched_expert_name?.trim() || "미정")}
          {summaryRow("일정", scheduleText)}
          {summaryRow("장소", locationText)}
          {app.admin_note?.trim() && summaryRow("메모", app.admin_note.trim())}
        </div>
      )}
    </div>
  );
}

export default AdminOfficeHourManagement;
