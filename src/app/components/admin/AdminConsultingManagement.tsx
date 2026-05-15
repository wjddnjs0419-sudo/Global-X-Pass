import { useState, useEffect, useRef } from "react";
import { Check, X } from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";
import { encodeFilename } from "../../../utils/file";
import { isDataImageUrl } from "../../../utils/postThumbnail";
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
import { getMutedLabelStyle, getStatusPillStyle } from "../contentListStyles";
import { AdvancedThumbnailEditor } from "./AdvancedThumbnailEditor";
import type { Consultant, ConsultingSlot } from "../../../lib/types";
import {
  type ConsultingCategory,
  CONSULTING_CATEGORIES_TABLE,
  DEFAULT_CONSULTING_CATEGORIES,
  getConsultingCategoryLabel,
  generateConsultingCategoryId,
} from "../../constants/consultingCategories";

type SubTab = "consultants" | "slots" | "reservations" | "categories";

type DecryptedProfile = {
  id: string;
  name: string | null;
  email: string | null;
  company: string | null;
};

type ConsultingReservationRow = {
  id: string;
  slot_id: string;
  user_id: string;
  description: string;
  status: "pending" | "confirmed" | "rejected" | "cancelled";
  admin_note: string | null;
  created_at: string;
  consulting_slots?: {
    slot_date?: string | null;
    slot_time?: string | null;
    location?: string | null;
    consultants?: {
      name?: string | null;
      category?: string | null;
    } | null;
  } | null;
  profile: DecryptedProfile | null;
};

type ConsultantForm = {
  name: string;
  category: string;
  bio: string;
  expertise: string;
  image_url: string;
};

const emptyConsultantForm: ConsultantForm = { name: "", category: "", bio: "", expertise: "", image_url: "" };

async function uploadConsultantProfileDataUrl(dataUrl: string) {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  const safeName = encodeFilename("consultant-profile.jpg");
  const fileName = `${Date.now()}---consultant-profile---${Math.random().toString(36).substr(2, 9)}---${safeName}`;
  const { error } = await supabase.storage.from("images").upload(fileName, blob, { contentType: "image/jpeg" });
  if (error) throw error;
  return supabase.storage.from("images").getPublicUrl(fileName).data.publicUrl;
}

async function persistConsultantImageUrl(imageUrl: string) {
  const trimmed = imageUrl.trim();
  if (!trimmed) return null;
  return isDataImageUrl(trimmed) ? uploadConsultantProfileDataUrl(trimmed) : trimmed;
}

export function AdminConsultingManagement() {
  const [subTab, setSubTab] = useState<SubTab>("consultants");
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [slots, setSlots] = useState<ConsultingSlot[]>([]);
  const [reservations, setReservations] = useState<ConsultingReservationRow[]>([]);
  const [selectedConsultant, setSelectedConsultant] = useState<string>("");

  // Consultant form
  const [consultingCategories, setConsultingCategories] = useState<ConsultingCategory[]>([]);
  const [categoryLabelDrafts, setCategoryLabelDrafts] = useState<Record<string, string>>({});
  const [newCategoryInput, setNewCategoryInput] = useState("");
  const [form, setForm] = useState<ConsultantForm>(emptyConsultantForm);
  const [editingConsultantId, setEditingConsultantId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ConsultantForm>(emptyConsultantForm);
  const slotRequestRef = useRef(0);
  const categoriesSeededRef = useRef(false);
  // Slot form
  const [slotForm, setSlotForm] = useState({
    consultant_id: "",
    slot_date_y: "",
    slot_date_m: "",
    slot_date_d: "",
    slot_time: "",
    duration_minutes: 60,
    locationName: "",
    locationAddress: "",
  });
  const [loading, setLoading] = useState(false);

  const card = "var(--color-surface-card)";
  const border = "var(--color-border-soft)";
  const textMain = "var(--color-text-primary)";
  const textMuted = "var(--color-text-muted)";
  const inputBg = "var(--color-field-bg)";
  const inputStyle = { padding: "10px 14px", borderRadius: 10, background: inputBg, border: `1px solid ${border}`, color: textMain, outline: "none", width: "100%", boxSizing: "border-box" as const, fontSize: 14 };

  const skColor = "var(--color-skeleton-bg)";
  const labelBg = "var(--color-surface-subtle)";
  const labelBorder = "var(--color-border-subtle)";
  const selectedBg = "var(--color-surface-selected)";
  const deleteBg = "var(--color-danger-soft-bg)";
  const deleteBorder = "var(--color-danger-soft-border)";
  const primaryBg = "var(--color-brand-blue)";

  const Sk = ({ h = 78, r = 16 }: { h?: number; r?: number }) => (
    <div style={{ height: h, borderRadius: r, background: skColor, animation: "pulse 1.5s ease-in-out infinite" }} />
  );

  useEffect(() => { 
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchConsultants(), fetchReservations()]);
      setLoading(false);
    };
    init();
  }, []);
  
  useEffect(() => { 
    if (selectedConsultant) {
      setLoading(true);
      fetchSlots(selectedConsultant).finally(() => setLoading(false));
    }
  }, [selectedConsultant]);

  useEffect(() => {
    const applyCategories = (resolved: ConsultingCategory[]) => {
      setConsultingCategories(resolved);
      setCategoryLabelDrafts(Object.fromEntries(resolved.map(c => [c.id, c.label])));
    };

    const fetchCategories = async (fromRealtime = false) => {
      const { data } = await supabase
        .from(CONSULTING_CATEGORIES_TABLE)
        .select("*")
        .order("display_order");
      const rows = data as ConsultingCategory[] | null;

      if (rows && rows.length > 0) {
        applyCategories(rows);
      } else if (!fromRealtime && !categoriesSeededRef.current) {
        // 최초 마운트 + DB 미초기화 → 기본값을 DB에 씨딩하여 수정·삭제 가능하게 함
        categoriesSeededRef.current = true;
        const { error } = await supabase
          .from(CONSULTING_CATEGORIES_TABLE)
          .insert(DEFAULT_CONSULTING_CATEGORIES);
        if (!error) applyCategories(DEFAULT_CONSULTING_CATEGORIES);
      } else {
        // Realtime 호출 시 DB가 비었으면 전부 삭제된 상태로 표시 (재씨딩 금지)
        applyCategories([]);
      }
    };

    fetchCategories(false);

    const channel = supabase
      .channel("consulting_categories_admin")
      .on("postgres_changes", { event: "*", schema: "public", table: CONSULTING_CATEGORIES_TABLE },
        () => fetchCategories(true))
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchConsultants = async () => {
    const { data } = await supabase.from("consultants").select("*").order("display_order");
    if (data) setConsultants(data as Consultant[]);
  };

  const fetchSlots = async (consultantId: string) => {
    const requestId = ++slotRequestRef.current;
    const { data } = await supabase
      .from("consulting_slots")
      .select("*")
      .eq("consultant_id", consultantId)
      .order("slot_date")
      .order("slot_time");
    if (requestId === slotRequestRef.current && data) setSlots(data as ConsultingSlot[]);
  };

  const fetchReservations = async () => {
    const { data, error } = await supabase.functions.invoke("consulting-admin-reservations");
    if (error) {
      console.error("컨설팅 예약 조회 오류:", error.message);
      return;
    }

    setReservations((data?.reservations ?? []) as ConsultingReservationRow[]);
    if ((data?.deleted ?? 0) > 0) {
      if (selectedConsultant) fetchSlots(selectedConsultant);
    }
  };

  const handleCreateConsultant = async () => {
    if (!form.name.trim()) return;
    setLoading(true);
    const expertise = form.expertise.split(",").map(s => s.trim()).filter(Boolean);
    try {
      const imageUrl = await persistConsultantImageUrl(form.image_url);
      const { error } = await supabase.from("consultants").insert({ ...form, expertise, bio: form.bio || null, image_url: imageUrl });
      if (error) alert("생성 실패: " + error.message);
      else { setForm(emptyConsultantForm); fetchConsultants(); }
    } catch (err: any) {
      alert("프로필 사진 업로드 실패: " + (err?.message || "알 수 없는 오류"));
    } finally {
      setLoading(false);
    }
  };

  const startEditConsultant = (consultant: Consultant) => {
    setEditingConsultantId(consultant.id);
    setEditForm({
      name: consultant.name,
      category: consultant.category,
      bio: consultant.bio ?? "",
      expertise: consultant.expertise.join(", "),
      image_url: consultant.image_url ?? "",
    });
  };

  const cancelEditConsultant = () => {
    setEditingConsultantId(null);
    setEditForm(emptyConsultantForm);
  };

  const handleUpdateConsultant = async (id: string) => {
    if (!editForm.name.trim()) return;
    setLoading(true);
    const expertise = editForm.expertise.split(",").map(s => s.trim()).filter(Boolean);
    try {
      const imageUrl = await persistConsultantImageUrl(editForm.image_url);
      const { error } = await supabase
        .from("consultants")
        .update({
          name: editForm.name.trim(),
          category: editForm.category,
          bio: editForm.bio.trim() || null,
          expertise,
          image_url: imageUrl,
        })
        .eq("id", id);
      if (error) alert("수정 실패: " + error.message);
      else {
        cancelEditConsultant();
        fetchConsultants();
      }
    } catch (err: any) {
      alert("프로필 사진 업로드 실패: " + (err?.message || "알 수 없는 오류"));
    } finally {
      setLoading(false);
    }
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
    const slot_date = composeIsoDate(y, m, d);
    const location = composeStructuredLocation(slotForm.locationName, slotForm.locationAddress);
    if (!slotForm.consultant_id || !slot_date || !slotForm.slot_time) return alert("전문가, 날짜, 시간을 모두 입력해주세요.");
    const duplicateSlotExists = slots.some(slot =>
      slot.consultant_id === slotForm.consultant_id
      && slot.slot_date === slot_date
      && slot.slot_time === slotForm.slot_time
    );
    if (duplicateSlotExists) {
      return alert("같은 전문가의 동일한 날짜·시간 슬롯이 이미 존재합니다.");
    }
    setLoading(true);
    const { error } = await supabase.from("consulting_slots").insert({
      consultant_id: slotForm.consultant_id,
      slot_date,
      slot_time: slotForm.slot_time,
      duration_minutes: slotForm.duration_minutes,
      location: location || null,
    });
    if (error) alert("슬롯 생성 실패: " + error.message);
    else {
      setSelectedConsultant(slotForm.consultant_id);
      await fetchSlots(slotForm.consultant_id);
    }
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
    const cfg = { pending: { label: "대기중", color: "var(--color-brand-yellow)" }, confirmed: { label: "승인", color: "var(--color-brand-green)" }, rejected: { label: "거절", color: "var(--color-brand-red)" }, cancelled: { label: "취소", color: "#64748B" } }[s] ?? { label: s, color: "#888" };
    return <span style={getStatusPillStyle(cfg.color)}>{cfg.label}</span>;
  };

  if (loading && consultants.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <h3 style={{ fontSize: "22px", fontWeight: 800, color: textMain }}>컨설팅 관리</h3>
        <div style={{ display: "flex", gap: "8px" }}>
          {[0, 1, 2].map(i => <div key={i} style={{ width: 100, height: 40, borderRadius: 12, background: skColor, animation: "pulse 1.5s ease-in-out infinite" }} />)}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[0, 1, 2, 3, 4].map(i => <Sk key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <>
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <h3 style={{ fontSize: "22px", fontWeight: 800, color: textMain }}>컨설팅 관리</h3>

      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {(["consultants", "slots", "reservations", "categories"] as SubTab[]).map(t => (
          <button key={t} onClick={() => setSubTab(t)} style={{ padding: "10px 20px", borderRadius: 12, background: subTab === t ? selectedBg : "transparent", color: subTab === t ? textMain : textMuted, fontWeight: 750, cursor: "pointer", border: `1px solid ${subTab === t ? labelBorder : border}` } as any}>
            {{ consultants: "전문가 관리", slots: "슬롯 관리", reservations: "예약 승인", categories: "카테고리" }[t]}
          </button>
        ))}
      </div>

      {/* Consultants tab */}
      {subTab === "consultants" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 16, padding: 22, display: "flex", flexDirection: "column", gap: 10 }}>
            <p style={{ margin: 0, fontWeight: 700, color: textMain }}>전문가 등록</p>
            <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 10 }}>
              <input style={inputStyle} placeholder="이름" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              <select style={inputStyle} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                <option value="">카테고리 선택...</option>
                {consultingCategories.map(c => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
            <input style={inputStyle} placeholder="전문 분야 (쉼표로 구분, 예: M&A, 특허출원)" value={form.expertise} onChange={e => setForm(f => ({ ...f, expertise: e.target.value }))} />
            <input style={inputStyle} placeholder="소개 (선택)" value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} />
            <AdvancedThumbnailEditor
              aspect="1/1"
              candidates={[]}
              value={form.image_url || null}
              onChange={value => setForm(f => ({ ...f, image_url: value || "" }))}
              title="전문가 사진"
              statusLabel="사진 지정됨"
              emptyStatusLabel="사진 미지정"
              appliedLabel="현재 적용된 전문가 사진"
              emptyText="전문가 사진을 업로드하면 여기에 표시됩니다."
              singleImageMode
            />
            <button onClick={handleCreateConsultant} disabled={loading || !form.name.trim()} style={{ padding: "10px", borderRadius: 10, border: "none", background: primaryBg, color: "var(--color-on-primary)", fontWeight: 750, cursor: "pointer", opacity: !form.name.trim() ? 0.5 : 1, boxShadow: "none" }}>전문가 등록</button>
          </div>

          {consultants.map(c => (
            <div key={c.id} style={{ background: card, border: `1px solid ${border}`, borderRadius: 16, padding: "18px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                  {c.image_url && (
                    <img src={c.image_url} alt="" style={{ width: 44, height: 44, objectFit: "cover", borderRadius: "50%", border: `1px solid ${border}`, flexShrink: 0 }} />
                  )}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4, flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 700, color: textMain }}>{c.name}</span>
                      <span style={getMutedLabelStyle()}>{getConsultingCategoryLabel(c.category, consultingCategories)}</span>
                      {!c.is_active && <span style={getStatusPillStyle("var(--color-neutral)")}>비활성</span>}
                    </div>
                    {c.expertise.length > 0 && <div style={{ fontSize: 12, color: textMuted }}>{c.expertise.join(" · ")}</div>}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                  <button type="button" onClick={() => startEditConsultant(c)} style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${labelBorder}`, background: selectedBg, color: textMain, fontWeight: 700, cursor: "pointer", fontSize: 13 }}>
                    수정
                  </button>
                  <button type="button" onClick={() => handleToggleActive(c.id, c.is_active)} style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${border}`, background: "none", color: textMuted, fontWeight: 700, cursor: "pointer", fontSize: 13 }}>
                    {c.is_active ? "비활성화" : "활성화"}
                  </button>
                  <button type="button" onClick={() => handleDeleteConsultant(c.id)} style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${deleteBorder}`, background: deleteBg, color: "var(--color-brand-red)", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>삭제</button>
                </div>
              </div>

              {editingConsultantId === c.id && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 14, borderTop: `1px solid ${border}` }}>
                  <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 10 }}>
                    <input style={inputStyle} placeholder="이름" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
                    <select style={inputStyle} value={editForm.category} onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))}>
                      <option value="">카테고리 선택...</option>
                      {consultingCategories.map(category => (
                        <option key={category.id} value={category.id}>{category.label}</option>
                      ))}
                    </select>
                  </div>
                  <input style={inputStyle} placeholder="전문 분야 (쉼표로 구분, 예: M&A, 특허출원)" value={editForm.expertise} onChange={e => setEditForm(f => ({ ...f, expertise: e.target.value }))} />
                  <input style={inputStyle} placeholder="소개 (선택)" value={editForm.bio} onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))} />
                  <AdvancedThumbnailEditor
                    aspect="1/1"
                    candidates={[]}
                    value={editForm.image_url || null}
                    onChange={value => setEditForm(f => ({ ...f, image_url: value || "" }))}
                    title="전문가 사진"
                    statusLabel="사진 지정됨"
                    emptyStatusLabel="사진 미지정"
                    appliedLabel="현재 적용된 전문가 사진"
                    emptyText="전문가 사진을 업로드하면 여기에 표시됩니다."
                    singleImageMode
                  />
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, flexWrap: "wrap" }}>
                    <button type="button" onClick={cancelEditConsultant} disabled={loading} style={{ padding: "9px 14px", borderRadius: 8, border: `1px solid ${border}`, background: "transparent", color: textMain, fontWeight: 800, cursor: loading ? "not-allowed" : "pointer", fontSize: 13 }}>
                      취소
                    </button>
                    <button type="button" onClick={() => handleUpdateConsultant(c.id)} disabled={loading || !editForm.name.trim()} style={{ padding: "9px 16px", borderRadius: 8, border: "none", background: primaryBg, color: "var(--color-on-primary)", fontWeight: 800, cursor: loading || !editForm.name.trim() ? "not-allowed" : "pointer", fontSize: 13, opacity: !editForm.name.trim() ? 0.5 : 1, boxShadow: "none" }}>
                      저장
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Slots tab */}
      {subTab === "slots" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 16, padding: 22, display: "flex", flexDirection: "column", gap: 10 }}>
            <p style={{ margin: 0, fontWeight: 700, color: textMain }}>슬롯 추가</p>
            <select style={inputStyle} value={slotForm.consultant_id} onChange={e => { setSlotForm(f => ({ ...f, consultant_id: e.target.value })); setSelectedConsultant(e.target.value); }}>
              <option value="">전문가 선택...</option>
              {consultants.map(c => <option key={c.id} value={c.id}>{c.name} — {getConsultingCategoryLabel(c.category, consultingCategories)}</option>)}
            </select>
            <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 10 }}>
              <input
                style={inputStyle}
                placeholder="장소 이름 (예: NCF 회의실)"
                value={slotForm.locationName}
                onChange={e => setSlotForm(f => ({ ...f, locationName: e.target.value }))}
              />
              <input
                style={inputStyle}
                placeholder="주소 또는 링크 (예: 낙성대역 14길 8)"
                value={slotForm.locationAddress}
                onChange={e => setSlotForm(f => ({ ...f, locationAddress: e.target.value }))}
              />
            </div>
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
                    {getYearOptions().map(y => (
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
                    {getMonthOptions().map(m => (
                      <option key={m} value={m}>{Number(m)}월</option>
                    ))}
                  </select>
                  <select
                    style={{ ...inputStyle, flex: 1 }}
                    value={slotForm.slot_date_d}
                    onChange={e => setSlotForm(f => ({ ...f, slot_date_d: e.target.value }))}
                  >
                    <option value="">일</option>
                    {getDayOptions(slotForm.slot_date_y, slotForm.slot_date_m).map(d => (
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
                    value={slotForm.slot_time ? slotForm.slot_time.split(":")[0] : ""}
                    onChange={e => {
                      const h = e.target.value;
                      const m = slotForm.slot_time?.split(":")[1] || "00";
                      setSlotForm(f => ({ ...f, slot_time: composeTime(h, m) }));
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
                    value={slotForm.slot_time ? slotForm.slot_time.split(":")[1] : ""}
                    onChange={e => {
                      const m = e.target.value;
                      const h = slotForm.slot_time?.split(":")[0] || "";
                      if (h) setSlotForm(f => ({ ...f, slot_time: composeTime(h, m) }));
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
            <button onClick={handleCreateSlot} disabled={loading} style={{ padding: "10px", borderRadius: 10, border: "none", background: primaryBg, color: "var(--color-on-primary)", fontWeight: 750, cursor: "pointer", boxShadow: "none" }}>슬롯 추가</button>
          </div>

          {!selectedConsultant ? (
            <div style={{ background: card, border: `1px dashed ${labelBorder}`, borderRadius: 14, padding: "28px 20px", textAlign: "center", color: textMuted }}>
              전문가를 선택하면 슬롯 목록이 표시됩니다.
            </div>
          ) : slots.length === 0 ? (
            <div style={{ background: card, border: `1px dashed ${labelBorder}`, borderRadius: 14, padding: "28px 20px", textAlign: "center", color: textMuted }}>
              등록된 슬롯이 없습니다.
            </div>
          ) : slots.map(s => (
            <div key={s.id} style={{ background: card, border: `1px solid ${border}`, borderRadius: 14, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ fontWeight: 700, color: textMain }}>{s.slot_date} {s.slot_time.slice(0, 5)}</span>
                <span style={{ marginLeft: 10, fontSize: 12, color: textMuted }}>{s.duration_minutes}분</span>
                <div style={{ fontSize: 12, color: textMuted, marginTop: 4 }}>{formatStructuredLocation(s.location)}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 750, color: textMuted, background: labelBg, border: `1px solid ${labelBorder}`, borderRadius: 8, padding: "4px 8px" }}>
                  {{ available: "예약 가능", booked: "예약됨", cancelled: "취소됨" }[s.status]}
                </span>
                {s.status === "available" && (
                  <button onClick={() => handleDeleteSlot(s.id)} style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${deleteBorder}`, background: deleteBg, color: "var(--color-brand-red)", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>삭제</button>
                )}
              </div>
            </div>
          ))
          }
        </div>
      )}

      {/* Reservations tab */}
      {subTab === "reservations" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {reservations.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px", color: textMuted }}>접수된 예약이 없습니다.</div>
          ) : reservations.map(r => (
            <ReservationCard key={r.id} r={r} card={card} border={border} textMain={textMain} textMuted={textMuted} inputStyle={inputStyle} statusBadge={statusBadge} loading={loading} onUpdate={handleUpdateReservation} labelBg={labelBg} labelBorder={labelBorder} selectedBg={selectedBg} deleteBg={deleteBg} deleteBorder={deleteBorder} />
          ))}
        </div>
      )}

      {/* Categories tab */}
      {subTab === "categories" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <p style={{ margin: 0, fontSize: 13, color: textMuted, lineHeight: 1.6 }}>
            카테고리를 추가·수정·삭제할 수 있습니다. 변경 사항은 모든 브라우저에 즉시 반영됩니다. 삭제한 카테고리에 등록된 전문가는 컨설팅 페이지에 표시되지 않습니다.
          </p>

          {/* Existing categories */}
          {consultingCategories.map(cat => (
            <div key={cat.id} style={{ background: card, border: `1px solid ${border}`, borderRadius: 14, padding: "16px 20px", display: "flex", alignItems: "center", gap: 10 }}>
              <input
                value={categoryLabelDrafts[cat.id] ?? cat.label}
                onChange={e => setCategoryLabelDrafts(prev => ({ ...prev, [cat.id]: e.target.value }))}
                style={{ ...inputStyle, flex: 1 }}
              />
              <button
                type="button"
                disabled={loading}
                onClick={async () => {
                  const label = categoryLabelDrafts[cat.id]?.trim();
                  if (!label) { alert("카테고리 이름을 입력해주세요."); return; }
                  const { error } = await supabase
                    .from(CONSULTING_CATEGORIES_TABLE)
                    .upsert({ id: cat.id, label, display_order: cat.display_order });
                  if (error) alert("카테고리 수정 실패: " + error.message);
                }}
                style={{ padding: "10px 16px", borderRadius: 10, border: `1px solid ${labelBorder}`, background: selectedBg, color: textMain, fontWeight: 800, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}
              >
                저장
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={async () => {
                  if (!window.confirm(`"${cat.label}" 카테고리를 삭제하시겠습니까?\n이 카테고리에 등록된 전문가는 컨설팅 페이지에 표시되지 않습니다.`)) return;
                  const { error } = await supabase.from(CONSULTING_CATEGORIES_TABLE).delete().eq("id", cat.id);
                  if (error) alert("카테고리 삭제 실패: " + error.message);
                }}
                style={{ padding: "10px 16px", borderRadius: 10, border: `1px solid ${deleteBorder}`, background: deleteBg, color: "var(--color-brand-red)", fontWeight: 800, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}
              >
                삭제
              </button>
            </div>
          ))}

          {/* Add new category */}
          <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 14, padding: "16px 20px", display: "flex", gap: 10 }}>
            <input
              value={newCategoryInput}
              onChange={e => setNewCategoryInput(e.target.value)}
              placeholder="새 카테고리 이름 입력"
              style={{ ...inputStyle, flex: 1 }}
            />
            <button
              type="button"
              disabled={loading}
              onClick={async () => {
                const label = newCategoryInput.trim();
                if (!label) return;
                const maxOrder = consultingCategories.reduce((m, c) => Math.max(m, c.display_order), -1);
                const { error } = await supabase.from(CONSULTING_CATEGORIES_TABLE).insert({
                  id: generateConsultingCategoryId(),
                  label,
                  display_order: maxOrder + 1,
                });
                if (error) alert("카테고리 추가 실패: " + error.message);
                else setNewCategoryInput("");
              }}
              style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: primaryBg, color: "var(--color-on-primary)", fontWeight: 800, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}
            >
              추가
            </button>
          </div>
        </div>
      )}
    </div>

    </>
  );
}

function ReservationCard({ r, card, border, textMain, textMuted, inputStyle, statusBadge, loading, onUpdate, labelBg, labelBorder, selectedBg, deleteBg, deleteBorder }: any) {
  const [note, setNote] = useState(r.admin_note || "");
  const slot = r.consulting_slots;
  const consultant = slot?.consultants;
  const profile = r.profile;

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
            {consultant?.name} · {slot?.slot_date} {slot?.slot_time?.slice(0, 5)} · {formatStructuredLocation(slot?.location)}
        </div>
      </div>
        <div style={{ fontSize: 12, color: textMuted }}>{new Date(r.created_at).toLocaleDateString()}</div>
      </div>
      <div style={{ fontSize: 14, color: textMain, background: labelBg, border: `1px solid ${labelBorder}`, padding: "12px 16px", borderRadius: 10, lineHeight: 1.6 }}>{r.description}</div>
      {r.status === "pending" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input style={inputStyle} placeholder="관리자 메모 (선택)" value={note} onChange={e => setNote(e.target.value)} />
          <div className="flex flex-wrap gap-2 md:justify-end">
            <button type="button" disabled={loading} onClick={() => onUpdate(r.id, "confirmed", note)} style={{ minWidth: 82, height: 32, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "0 12px", borderRadius: 10, border: `1px solid ${labelBorder}`, background: selectedBg, color: textMain, fontSize: 13, fontWeight: 800, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.55 : 1 }}>
              <Check size={14} />승인
            </button>
            <button type="button" disabled={loading} onClick={() => onUpdate(r.id, "rejected", note)} style={{ minWidth: 82, height: 32, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "0 12px", borderRadius: 10, border: `1px solid ${deleteBorder}`, background: deleteBg, color: "var(--color-brand-red)", fontSize: 13, fontWeight: 800, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.55 : 1 }}>
              <X size={14} />거절
            </button>
          </div>
        </div>
      )}
      {r.admin_note && <div style={{ fontSize: 13, color: textMuted }}>메모: {r.admin_note}</div>}
    </div>
  );
}

export default AdminConsultingManagement;
