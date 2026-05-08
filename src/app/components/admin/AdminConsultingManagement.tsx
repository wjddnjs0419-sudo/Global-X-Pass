import { useState, useEffect, useRef } from "react";
import type { ChangeEvent, PointerEvent } from "react";
import { useTheme } from "../../ThemeContext";
import { Check, X } from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";
import { LAYERS } from "../../../lib/layers";
import { encodeFilename, getFileNameFromUrl } from "../../../utils/file";
import { getMutedLabelStyle, getStatusPillStyle } from "../contentListStyles";
import type { Consultant, ConsultingSlot, ConsultingReservation } from "../../../lib/types";
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

type PhotoDraft = {
  file: File;
  url: string;
};

type ImageSize = {
  width: number;
  height: number;
};

type PhotoPan = {
  x: number;
  y: number;
};

const PROFILE_IMAGE_SIZE = 400;
const CROP_STAGE_SIZE = 280;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function getCoverDrawRect(imageSize: ImageSize, outputSize: number, zoom: number, pan: PhotoPan) {
  const baseScale = Math.max(outputSize / imageSize.width, outputSize / imageSize.height);
  const finalScale = baseScale * zoom;
  const drawWidth = imageSize.width * finalScale;
  const drawHeight = imageSize.height * finalScale;
  const maxPanX = Math.max(0, (drawWidth - outputSize) / 2);
  const maxPanY = Math.max(0, (drawHeight - outputSize) / 2);
  const clampedPan = {
    x: clamp(pan.x, -maxPanX, maxPanX),
    y: clamp(pan.y, -maxPanY, maxPanY),
  };

  return {
    width: drawWidth,
    height: drawHeight,
    left: (outputSize - drawWidth) / 2 + clampedPan.x,
    top: (outputSize - drawHeight) / 2 + clampedPan.y,
    pan: clampedPan,
  };
}

function createProfileImageBlob(sourceUrl: string, zoom: number, pan: PhotoPan): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = PROFILE_IMAGE_SIZE;
      canvas.height = PROFILE_IMAGE_SIZE;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("이미지 편집 도구를 초기화할 수 없습니다."));
        return;
      }

      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(0, 0, PROFILE_IMAGE_SIZE, PROFILE_IMAGE_SIZE);

      const outputPan = {
        x: pan.x * (PROFILE_IMAGE_SIZE / CROP_STAGE_SIZE),
        y: pan.y * (PROFILE_IMAGE_SIZE / CROP_STAGE_SIZE),
      };
      const drawRect = getCoverDrawRect(
        { width: image.naturalWidth, height: image.naturalHeight },
        PROFILE_IMAGE_SIZE,
        zoom,
        outputPan
      );

      ctx.drawImage(image, drawRect.left, drawRect.top, drawRect.width, drawRect.height);
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("프로필 사진 생성에 실패했습니다."));
      }, "image/jpeg", 0.92);
    };
    image.onerror = () => reject(new Error("선택한 이미지를 불러올 수 없습니다."));
    image.src = sourceUrl;
  });
}

export function AdminConsultingManagement() {
  const { isDark } = useTheme();
  const [subTab, setSubTab] = useState<SubTab>("consultants");
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [slots, setSlots] = useState<ConsultingSlot[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [selectedConsultant, setSelectedConsultant] = useState<string>("");

  // Consultant form
  const [consultingCategories, setConsultingCategories] = useState<ConsultingCategory[]>([]);
  const [categoryLabelDrafts, setCategoryLabelDrafts] = useState<Record<string, string>>({});
  const [newCategoryInput, setNewCategoryInput] = useState("");
  const [form, setForm] = useState({ name: "", category: "", bio: "", expertise: "", image_url: "" });
  const slotRequestRef = useRef(0);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; pan: PhotoPan } | null>(null);
  const [photoDraft, setPhotoDraft] = useState<PhotoDraft | null>(null);
  const [photoSize, setPhotoSize] = useState<ImageSize | null>(null);
  const [photoZoom, setPhotoZoom] = useState(1);
  const [photoPan, setPhotoPan] = useState<PhotoPan>({ x: 0, y: 0 });
  const [photoUploading, setPhotoUploading] = useState(false);
  // Slot form
  const [slotForm, setSlotForm] = useState({ consultant_id: "", slot_date_y: "", slot_date_m: "", slot_date_d: "", slot_time: "", duration_minutes: 60, location: "" });
  const [loading, setLoading] = useState(false);

  const card = isDark ? "rgba(255,255,255,0.04)" : "#ffffff";
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const textMain = isDark ? "rgba(255,255,255,0.92)" : "rgba(10,16,32,0.88)";
  const textMuted = isDark ? "rgba(255,255,255,0.45)" : "rgba(10,16,32,0.45)";
  const inputBg = isDark ? "rgba(255,255,255,0.04)" : "#fff";
  const inputStyle = { padding: "10px 14px", borderRadius: 10, background: inputBg, border: `1px solid ${border}`, color: textMain, outline: "none", width: "100%", boxSizing: "border-box" as const, fontSize: 14 };

  const skColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const panelBg = isDark ? "rgba(255,255,255,0.035)" : "rgba(15,23,42,0.035)";
  const labelBg = isDark ? "rgba(255,255,255,0.045)" : "rgba(15,23,42,0.035)";
  const labelBorder = isDark ? "rgba(255,255,255,0.10)" : "rgba(15,23,42,0.09)";
  const selectedBg = isDark ? "rgba(255,255,255,0.10)" : "rgba(15,23,42,0.07)";
  const deleteBg = isDark ? "rgba(234,67,53,0.08)" : "rgba(234,67,53,0.06)";
  const deleteBorder = isDark ? "rgba(234,67,53,0.28)" : "rgba(234,67,53,0.22)";

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
    const fetchCategories = async () => {
      const { data } = await supabase
        .from(CONSULTING_CATEGORIES_TABLE)
        .select("*")
        .order("display_order");
      const cats = (data as ConsultingCategory[] | null) ?? DEFAULT_CONSULTING_CATEGORIES;
      const resolved = cats.length > 0 ? cats : DEFAULT_CONSULTING_CATEGORIES;
      setConsultingCategories(resolved);
      setCategoryLabelDrafts(Object.fromEntries(resolved.map(c => [c.id, c.label])));
    };

    fetchCategories();

    const channel = supabase
      .channel("consulting_categories_admin")
      .on("postgres_changes", { event: "*", schema: "public", table: CONSULTING_CATEGORIES_TABLE }, fetchCategories)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    return () => {
      if (photoDraft?.url) URL.revokeObjectURL(photoDraft.url);
    };
  }, [photoDraft?.url]);

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
    const [{ data }, { data: profiles, error: profileError }] = await Promise.all([
      supabase
      .from("consulting_reservations")
        .select("*, consulting_slots(slot_date, slot_time, location, consultants(name, category))")
        .order("created_at", { ascending: false }),
      supabase.functions.invoke("decrypt-profiles"),
    ]);

    if (profileError) {
      console.error("예약자 프로필 복호화 오류:", profileError.message);
    }

    const profileById = new Map(
      ((profiles as DecryptedProfile[] | null) ?? []).map(profile => [profile.id, profile])
    );

    if (data) {
      setReservations(data.map(reservation => ({
        ...reservation,
        profile: profileById.get(reservation.user_id) ?? null,
      })));
    }
  };

  const handleCreateConsultant = async () => {
    if (!form.name.trim()) return;
    setLoading(true);
    const expertise = form.expertise.split(",").map(s => s.trim()).filter(Boolean);
    const { error } = await supabase.from("consultants").insert({ ...form, expertise, bio: form.bio || null, image_url: form.image_url || null });
    if (error) alert("생성 실패: " + error.message);
    else { setForm({ name: "", category: "", bio: "", expertise: "", image_url: "" }); fetchConsultants(); }
    setLoading(false);
  };

  const resetPhotoDraft = () => {
    if (photoDraft?.url) URL.revokeObjectURL(photoDraft.url);
    setPhotoDraft(null);
    setPhotoSize(null);
    setPhotoZoom(1);
    setPhotoPan({ x: 0, y: 0 });
    dragRef.current = null;
    if (photoInputRef.current) photoInputRef.current.value = "";
  };

  const handlePhotoSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("이미지 파일만 업로드 가능합니다.");
      e.target.value = "";
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("사진 파일은 10MB 이하만 업로드 가능합니다.");
      e.target.value = "";
      return;
    }

    if (photoDraft?.url) URL.revokeObjectURL(photoDraft.url);
    const url = URL.createObjectURL(file);
    setPhotoDraft({ file, url });
    setPhotoSize(null);
    setPhotoZoom(1);
    setPhotoPan({ x: 0, y: 0 });
    dragRef.current = null;

    const image = new Image();
    image.onload = () => setPhotoSize({ width: image.naturalWidth, height: image.naturalHeight });
    image.src = url;
  };

  const handlePhotoUpload = async () => {
    if (!photoDraft) return;
    setPhotoUploading(true);
    try {
      const blob = await createProfileImageBlob(photoDraft.url, photoZoom, photoPan);
      const safeName = encodeFilename(photoDraft.file.name.replace(/\.[^.]+$/, "") + ".jpg");
      const fileName = `${Date.now()}---consultant-profile---${Math.random().toString(36).substr(2, 9)}---${safeName}`;
      const { error } = await supabase.storage.from("images").upload(fileName, blob, { contentType: "image/jpeg" });
      if (error) throw error;

      const url = supabase.storage.from("images").getPublicUrl(fileName).data.publicUrl;
      setForm(f => ({ ...f, image_url: url }));
      resetPhotoDraft();
    } catch (err: any) {
      alert("프로필 사진 업로드에 실패했습니다.\n\n" + (err?.message || "알 수 없는 오류"));
    } finally {
      setPhotoUploading(false);
    }
  };

  const clampPhotoPan = (nextPan: PhotoPan, zoom = photoZoom) => {
    if (!photoSize) return nextPan;
    return getCoverDrawRect(photoSize, CROP_STAGE_SIZE, zoom, nextPan).pan;
  };

  const handleCropPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (!photoSize || photoUploading) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, pan: photoPan };
  };

  const handleCropPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    const nextPan = {
      x: dragRef.current.pan.x + e.clientX - dragRef.current.startX,
      y: dragRef.current.pan.y + e.clientY - dragRef.current.startY,
    };
    setPhotoPan(clampPhotoPan(nextPan));
  };

  const stopCropDrag = () => {
    dragRef.current = null;
  };

  const handlePhotoZoomChange = (nextZoom: number) => {
    setPhotoZoom(nextZoom);
    setPhotoPan(prev => clampPhotoPan(prev, nextZoom));
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
    const { error } = await supabase.from("consulting_slots").insert({
      consultant_id: slotForm.consultant_id,
      slot_date,
      slot_time: slotForm.slot_time,
      duration_minutes: slotForm.duration_minutes,
      location: slotForm.location.trim() || null,
    });
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
    const cfg = { pending: { label: "대기중", color: "#FBBC05" }, confirmed: { label: "승인", color: "#18A343" }, rejected: { label: "거절", color: "#EA4335" }, cancelled: { label: "취소", color: "#64748B" } }[s] ?? { label: s, color: "#888" };
    return <span style={getStatusPillStyle(cfg.color, isDark)}>{cfg.label}</span>;
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
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
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
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <span style={{ fontSize: 12, color: textMuted, fontWeight: 700 }}>프로필 사진</span>
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, border: `1px solid ${border}`, borderRadius: 14, background: panelBg }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", overflow: "hidden", background: selectedBg, border: `1px solid ${labelBorder}`, display: "flex", alignItems: "center", justifyContent: "center", color: textMain, fontWeight: 900, fontSize: 20, flexShrink: 0 }}>
                  {form.image_url ? (
                    <img src={form.image_url} alt="프로필 사진 미리보기" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  ) : (
                    form.name.trim()[0] || "?"
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: textMain, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {form.image_url ? getFileNameFromUrl(form.image_url, "프로필 사진 등록됨") : "등록된 프로필 사진 없음"}
                  </div>
                  <div style={{ fontSize: 12, color: textMuted, marginTop: 3 }}>JPG, JPEG, PNG, GIF 파일을 10MB 이하로 업로드할 수 있습니다.</div>
                </div>
                <input ref={photoInputRef} type="file" accept="image/*" onChange={handlePhotoSelect} style={{ display: "none" }} />
                <button type="button" onClick={() => photoInputRef.current?.click()} style={{ padding: "9px 14px", borderRadius: 10, border: `1px solid ${labelBorder}`, background: selectedBg, color: textMain, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap" }}>
                  사진 선택
                </button>
                {form.image_url && (
                  <button type="button" onClick={() => setForm(f => ({ ...f, image_url: "" }))} style={{ padding: "9px 12px", borderRadius: 10, border: `1px solid ${border}`, background: "transparent", color: textMuted, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap" }}>
                    제거
                  </button>
                )}
              </div>
            </div>
            <button onClick={handleCreateConsultant} disabled={loading || !form.name.trim()} style={{ padding: "10px", borderRadius: 10, border: "none", background: "#4377F1", color: "#fff", fontWeight: 750, cursor: "pointer", opacity: !form.name.trim() ? 0.5 : 1, boxShadow: "none" }}>전문가 등록</button>
          </div>

          {consultants.map(c => (
            <div key={c.id} style={{ background: card, border: `1px solid ${border}`, borderRadius: 16, padding: "18px 22px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, color: textMain }}>{c.name}</span>
                  <span style={getMutedLabelStyle(isDark)}>{getConsultingCategoryLabel(c.category, consultingCategories)}</span>
                  {!c.is_active && <span style={getStatusPillStyle("#64748B", isDark)}>비활성</span>}
                </div>
                {c.expertise.length > 0 && <div style={{ fontSize: 12, color: textMuted }}>{c.expertise.join(" · ")}</div>}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => handleToggleActive(c.id, c.is_active)} style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${border}`, background: "none", color: textMuted, fontWeight: 700, cursor: "pointer", fontSize: 13 }}>
                  {c.is_active ? "비활성화" : "활성화"}
                </button>
                <button onClick={() => handleDeleteConsultant(c.id)} style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${deleteBorder}`, background: deleteBg, color: "#EA4335", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>삭제</button>
              </div>
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
            <input
              style={inputStyle}
              placeholder="장소 (예: NCF 회의실, Zoom, 별도 안내)"
              value={slotForm.location}
              onChange={e => setSlotForm(f => ({ ...f, location: e.target.value }))}
            />
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
            <button onClick={handleCreateSlot} disabled={loading} style={{ padding: "10px", borderRadius: 10, border: "none", background: "#4377F1", color: "#fff", fontWeight: 750, cursor: "pointer", boxShadow: "none" }}>슬롯 추가</button>
          </div>

          {slots.map(s => (
            <div key={s.id} style={{ background: card, border: `1px solid ${border}`, borderRadius: 14, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ fontWeight: 700, color: textMain }}>{s.slot_date} {s.slot_time.slice(0, 5)}</span>
                <span style={{ marginLeft: 10, fontSize: 12, color: textMuted }}>{s.duration_minutes}분</span>
                <div style={{ fontSize: 12, color: textMuted, marginTop: 4 }}>{s.location || "장소 미정"}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 750, color: textMuted, background: labelBg, border: `1px solid ${labelBorder}`, borderRadius: 8, padding: "4px 8px" }}>
                  {{ available: "예약 가능", booked: "예약됨", cancelled: "취소됨" }[s.status]}
                </span>
                {s.status === "available" && (
                  <button onClick={() => handleDeleteSlot(s.id)} style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${deleteBorder}`, background: deleteBg, color: "#EA4335", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>삭제</button>
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
                    .update({ label })
                    .eq("id", cat.id);
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
                style={{ padding: "10px 16px", borderRadius: 10, border: `1px solid ${deleteBorder}`, background: deleteBg, color: "#EA4335", fontWeight: 800, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}
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
              onKeyDown={async e => {
                if (e.key === "Enter") {
                  e.preventDefault();
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
                }
              }}
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
              style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: "#4377F1", color: "#fff", fontWeight: 800, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}
            >
              추가
            </button>
          </div>
        </div>
      )}
    </div>

    {photoDraft && (
      <div style={{ position: "fixed", inset: 0, zIndex: LAYERS.adminModal, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{ width: "min(720px, 100%)", maxHeight: "calc(100vh - 40px)", overflowY: "auto", background: isDark ? "#111827" : "#fff", border: `1px solid ${border}`, borderRadius: 16, boxShadow: "0 18px 44px rgba(15,23,42,0.20)", padding: "28px 30px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 18 }}>
            <h3 style={{ margin: 0, color: textMain, fontSize: 20, fontWeight: 900 }}>사진 올리기</h3>
            <button type="button" onClick={resetPhotoDraft} disabled={photoUploading} style={{ width: 32, height: 32, borderRadius: "50%", border: "none", background: "transparent", color: textMuted, cursor: "pointer", fontSize: 24, lineHeight: 1 }}>
              ×
            </button>
          </div>

          <ol style={{ margin: "0 0 18px", paddingLeft: 18, color: textMain, fontSize: 13, lineHeight: 1.65 }}>
            <li>파일 선택 후 원본 사진을 확인해 주세요.</li>
            <li>사진을 직접 드래그하고 확대해 원형 가이드 안에 얼굴이나 로고가 딱 맞게 들어오도록 맞춰주세요.</li>
            <li>등록을 누르면 정사각형 이미지로 저장되고, 공개 카드에서는 원형으로 표시됩니다.</li>
          </ol>

          <div style={{ background: panelBg, border: `1px solid ${labelBorder}`, borderRadius: 12, padding: 18, display: "grid", gridTemplateColumns: "190px 1fr", gap: 20, alignItems: "start", marginBottom: 18 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              <strong style={{ color: textMain, fontSize: 13 }}>원본사진</strong>
              <div style={{ width: 190, height: 190, background: isDark ? "rgba(255,255,255,0.06)" : "#fff", border: `1px solid ${border}`, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <img src={photoDraft.url} alt="원본 사진" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", display: "block" }} />
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              <strong style={{ color: textMain, fontSize: 13 }}>선택 영역</strong>
              <div
                onPointerDown={handleCropPointerDown}
                onPointerMove={handleCropPointerMove}
                onPointerUp={stopCropDrag}
                onPointerCancel={stopCropDrag}
                style={{
                  width: CROP_STAGE_SIZE,
                  height: CROP_STAGE_SIZE,
                  overflow: "hidden",
                  background: "#f8fafc",
                  border: `1px solid ${border}`,
                  borderRadius: 12,
                  position: "relative",
                  touchAction: "none",
                  cursor: photoUploading ? "not-allowed" : "grab",
                  userSelect: "none",
                }}
              >
                {photoSize ? (() => {
                  const drawRect = getCoverDrawRect(photoSize, CROP_STAGE_SIZE, photoZoom, photoPan);

                  return (
                    <img
                      src={photoDraft.url}
                      alt="프로필 사진 편집"
                      draggable={false}
                      style={{ position: "absolute", left: drawRect.left, top: drawRect.top, width: drawRect.width, height: drawRect.height, display: "block", pointerEvents: "none" }}
                    />
                  );
                })() : (
                  <img src={photoDraft.url} alt="프로필 사진 편집" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                )}
                <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "linear-gradient(90deg, transparent calc(33.333% - 0.5px), rgba(255,255,255,0.65) calc(33.333% - 0.5px), rgba(255,255,255,0.65) calc(33.333% + 0.5px), transparent calc(33.333% + 0.5px), transparent calc(66.666% - 0.5px), rgba(255,255,255,0.65) calc(66.666% - 0.5px), rgba(255,255,255,0.65) calc(66.666% + 0.5px), transparent calc(66.666% + 0.5px)), linear-gradient(0deg, transparent calc(33.333% - 0.5px), rgba(255,255,255,0.65) calc(33.333% - 0.5px), rgba(255,255,255,0.65) calc(33.333% + 0.5px), transparent calc(33.333% + 0.5px), transparent calc(66.666% - 0.5px), rgba(255,255,255,0.65) calc(66.666% - 0.5px), rgba(255,255,255,0.65) calc(66.666% + 0.5px), transparent calc(66.666% + 0.5px))" }} />
                <div style={{ position: "absolute", inset: 0, pointerEvents: "none", borderRadius: "50%", border: "2px solid rgba(255,255,255,0.95)", boxShadow: "0 0 0 999px rgba(15,23,42,0.34)" }} />
              </div>
              <span style={{ color: textMuted, fontSize: 12 }}>사진을 드래그해서 원형 안에 맞춰주세요.</span>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "center", marginBottom: 16 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: textMuted, fontWeight: 700 }}>
              확대
              <input type="range" min="1" max="3" step="0.05" value={photoZoom} onChange={e => handlePhotoZoomChange(Number(e.target.value))} />
            </label>
            <button type="button" onClick={() => { setPhotoZoom(1); setPhotoPan({ x: 0, y: 0 }); }} disabled={photoUploading} style={{ padding: "9px 12px", borderRadius: 9, border: `1px solid ${border}`, background: "transparent", color: textMuted, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap" }}>
              초기화
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", border: `1px solid ${border}`, borderRadius: 10, background: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc", marginBottom: 10 }}>
            <button type="button" onClick={() => photoInputRef.current?.click()} disabled={photoUploading} style={{ padding: "7px 12px", borderRadius: 8, border: `1px solid ${border}`, background: inputBg, color: textMain, fontWeight: 700, cursor: "pointer" }}>
              파일 선택
            </button>
            <span style={{ color: textMuted, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{photoDraft.file.name}</span>
          </div>

          <div style={{ color: textMuted, fontSize: 12, lineHeight: 1.6, marginBottom: 22 }}>
            · 사진 파일은 10MB 미만의 JPG, JPEG, PNG, GIF 파일만 업로드 가능합니다.<br />
            · 저장 이미지는 400x400 픽셀로 생성되며, 공개 페이지에서는 원형으로 노출됩니다.
          </div>

          <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
            <button type="button" onClick={resetPhotoDraft} disabled={photoUploading} style={{ minWidth: 110, padding: "12px 18px", borderRadius: 8, border: `1px solid ${border}`, background: "transparent", color: textMain, fontWeight: 800, cursor: "pointer" }}>
              취소
            </button>
            <button type="button" onClick={handlePhotoUpload} disabled={photoUploading} style={{ minWidth: 110, padding: "12px 18px", borderRadius: 8, border: "none", background: "#4377F1", color: "#fff", fontWeight: 800, cursor: "pointer", opacity: photoUploading ? 0.65 : 1, boxShadow: "none" }}>
              {photoUploading ? "업로드 중..." : "등록"}
            </button>
          </div>
        </div>
      </div>
    )}
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
            {consultant?.name} · {slot?.slot_date} {slot?.slot_time?.slice(0, 5)} · {slot?.location || "장소 미정"}
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
            <button type="button" disabled={loading} onClick={() => onUpdate(r.id, "rejected", note)} style={{ minWidth: 82, height: 32, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "0 12px", borderRadius: 10, border: `1px solid ${deleteBorder}`, background: deleteBg, color: "#EA4335", fontSize: 13, fontWeight: 800, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.55 : 1 }}>
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
