import { useEffect, useMemo, useState } from "react";
import type React from "react";
import { Link, useNavigate, useParams } from "react-router";
import { Ban, CalendarDays, CheckCircle2, ImagePlus, MapPin, Plus, Save, Send, Users, X } from "lucide-react";
import { PageShell } from "../components/PageShell";
import { Button } from "../components/ui/button";
import { getMutedLabelStyle, getStatusPillStyle } from "../components/contentListStyles";
import { CONTACT_EMAIL } from "../constants/contact";
import { useTheme } from "../ThemeContext";
import { supabase } from "../../lib/supabaseClient";
import { useAdmin } from "../../hooks/useAdmin";
import type { EventApplication, EventCustomQuestion, EventFormConfig, Post, Profile } from "../../lib/types";
import { encodeFilename, isImage } from "../../utils/file";
import { sanitizeRichHtml } from "../../utils/htmlSecurity";
import { EVENT_APPLICATION_STATUS, EVENT_STATUS_CONFIG, mergeEventFormConfig } from "../../utils/eventApplication";

type FormState = {
  company_tech: string;
  applicant_name: string;
  position: string;
  email: string;
  phone: string;
  expectation: string;
  interests: string[];
  speaker_question: string;
  custom_answers: Record<string, string>;
  privacy_consent: boolean;
};

const EMPTY_FORM: FormState = {
  company_tech: "",
  applicant_name: "",
  position: "",
  email: "",
  phone: "",
  expectation: "",
  interests: [],
  speaker_question: "",
  custom_answers: {},
  privacy_consent: false,
};

const createCustomQuestion = (): EventCustomQuestion => ({
  id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  label: "새 질문",
  type: "short_text",
  required: false,
});

const requiredLabel = (label: string) => `${label} *`;

const getRepresentativeImage = (post: Post | null) =>
  post?.image_url?.split(",").map(url => url.trim()).filter(Boolean).find(isImage) ?? "";

const fieldStyle = (background: string, border: string, color: string): React.CSSProperties => ({
  width: "100%",
  padding: "12px 14px",
  borderRadius: 12,
  border: `1px solid ${border}`,
  background,
  color,
  outline: "none",
  fontSize: 14,
  boxSizing: "border-box",
});

export function EventApplicationPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { isAdmin } = useAdmin();

  const [post, setPost] = useState<Post | null>(null);
  const [application, setApplication] = useState<EventApplication | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [acceptedCount, setAcceptedCount] = useState(0);
  const [adminEditing, setAdminEditing] = useState(false);
  const [adminDraft, setAdminDraft] = useState({
    title: "",
    event_date: "",
    location: "",
    event_status: "접수예정",
    capacity: "",
    content: "",
    image_url: "",
    intro: "",
    companyTechLabel: "",
    nameLabel: "",
    positionLabel: "",
    emailLabel: "",
    phoneLabel: "",
    expectationLabel: "",
    interestsLabel: "",
    interestOptions: "",
    speakerQuestionLabel: "",
    privacyConsentLabel: "",
    completionTitle: "",
    completionMessage: "",
    customQuestions: [] as EventCustomQuestion[],
  });

  const card = isDark ? "rgba(255,255,255,0.04)" : "#ffffff";
  const panel = isDark ? "rgba(255,255,255,0.025)" : "rgba(15,23,42,0.025)";
  const border = isDark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.08)";
  const textMain = isDark ? "rgba(255,255,255,0.92)" : "#0f172a";
  const textMuted = isDark ? "rgba(255,255,255,0.52)" : "rgba(15,23,42,0.52)";
  const inputBg = isDark ? "rgba(255,255,255,0.05)" : "#fff";
  const input = fieldStyle(inputBg, border, textMain);
  const contactButtonStyle: React.CSSProperties = {
    background: isDark ? "rgba(67,119,241,0.14)" : "#ffffff",
    border: `1px solid ${isDark ? "rgba(67,119,241,0.45)" : "rgba(67,119,241,0.28)"}`,
    color: "#4377F1",
    boxShadow: isDark ? "none" : "0 4px 12px rgba(67,119,241,0.12)",
  };

  const config = useMemo(() => mergeEventFormConfig(post?.event_form_config), [post?.event_form_config]);
  const draftConfig = useMemo(() => mergeEventFormConfig({
    intro: adminDraft.intro,
    companyTechLabel: adminDraft.companyTechLabel,
    nameLabel: adminDraft.nameLabel,
    positionLabel: adminDraft.positionLabel,
    emailLabel: adminDraft.emailLabel,
    phoneLabel: adminDraft.phoneLabel,
    expectationLabel: adminDraft.expectationLabel,
    interestsLabel: adminDraft.interestsLabel,
    interestOptions: adminDraft.interestOptions.split("\n").map(item => item.trim()).filter(Boolean),
    speakerQuestionLabel: adminDraft.speakerQuestionLabel,
    privacyConsentLabel: adminDraft.privacyConsentLabel,
    completionTitle: adminDraft.completionTitle,
    completionMessage: adminDraft.completionMessage,
    customQuestions: adminDraft.customQuestions,
  }), [adminDraft]);
  const activeConfig = adminEditing ? draftConfig : config;
  const representativeImage = adminEditing ? adminDraft.image_url : getRepresentativeImage(post);
  const capacity = post?.capacity ?? null;
  const remaining = capacity == null ? null : Math.max(capacity - acceptedCount, 0);
  const statusCfg = EVENT_STATUS_CONFIG[post?.event_status ?? ""] ?? null;
  const isClosed = post?.event_status === "마감" || remaining === 0;
  const canCancelApplication = application?.status === "pending" || application?.status === "accepted";

  const syncAdminDraft = (nextPost: Post) => {
    const nextConfig = mergeEventFormConfig(nextPost.event_form_config);
    setAdminDraft({
      title: nextPost.title || "",
      event_date: nextPost.event_date || "",
      location: nextPost.location || "",
      event_status: nextPost.event_status || "접수예정",
      capacity: nextPost.capacity != null ? String(nextPost.capacity) : "",
      content: nextPost.content || "",
      image_url: getRepresentativeImage(nextPost),
      intro: nextConfig.intro,
      companyTechLabel: nextConfig.companyTechLabel,
      nameLabel: nextConfig.nameLabel,
      positionLabel: nextConfig.positionLabel,
      emailLabel: nextConfig.emailLabel,
      phoneLabel: nextConfig.phoneLabel,
      expectationLabel: nextConfig.expectationLabel,
      interestsLabel: nextConfig.interestsLabel,
      interestOptions: nextConfig.interestOptions.join("\n"),
      speakerQuestionLabel: nextConfig.speakerQuestionLabel,
      privacyConsentLabel: nextConfig.privacyConsentLabel,
      completionTitle: nextConfig.completionTitle,
      completionMessage: nextConfig.completionMessage,
      customQuestions: nextConfig.customQuestions,
    });
  };

  useEffect(() => {
    const init = async () => {
      if (!id) return;
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      const uid = user?.id ?? null;
      setUserId(uid);

      const [{ data: postData }, { data: counts }] = await Promise.all([
        supabase.from("posts").select("*").eq("id", id).eq("category", "events").single(),
        supabase.rpc("get_event_application_counts"),
      ]);

      if (postData) {
        setPost(postData as Post);
        syncAdminDraft(postData as Post);
      }

      const countRow = ((counts as { post_id: string; accepted_count: number }[] | null) ?? []).find(row => row.post_id === id);
      setAcceptedCount(countRow?.accepted_count ?? 0);

      if (uid) {
        const [{ data: appData }, { data: profileData }] = await Promise.all([
          supabase.from("event_applications").select("*").eq("post_id", id).eq("user_id", uid).maybeSingle(),
          supabase.functions.invoke("decrypt-own-profile"),
        ]);
        if (appData) setApplication(appData as EventApplication);
        if (profileData && !appData) {
          const profile = profileData as Profile;
          setForm(prev => ({
            ...prev,
            company_tech: profile.company || "",
            applicant_name: profile.name || "",
            email: profile.email || user?.email || "",
            phone: profile.phone || "",
          }));
        }
      }

      setLoading(false);
    };
    init();
  }, [id]);

  const updateField = (key: keyof FormState, value: string | boolean | string[]) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const toggleInterest = (option: string) => {
    setForm(prev => ({
      ...prev,
      interests: prev.interests.includes(option)
        ? prev.interests.filter(item => item !== option)
        : [...prev.interests, option],
    }));
  };

  const updateCustomAnswer = (questionId: string, value: string) =>
    setForm(prev => ({ ...prev, custom_answers: { ...prev.custom_answers, [questionId]: value } }));

  const insertCustomQuestion = (index: number) => {
    setAdminDraft(prev => {
      const next = [...prev.customQuestions];
      next.splice(index, 0, createCustomQuestion());
      return { ...prev, customQuestions: next };
    });
  };

  const updateCustomQuestion = (id: string, patch: Partial<EventCustomQuestion>) => {
    setAdminDraft(prev => ({
      ...prev,
      customQuestions: prev.customQuestions.map(question => question.id === id ? { ...question, ...patch } : question),
    }));
  };

  const removeCustomQuestion = (id: string) => {
    setAdminDraft(prev => ({
      ...prev,
      customQuestions: prev.customQuestions.filter(question => question.id !== id),
    }));
    setForm(prev => {
      const nextAnswers = { ...prev.custom_answers };
      delete nextAnswers[id];
      return { ...prev, custom_answers: nextAnswers };
    });
  };

  const handleSubmit = async () => {
    if (!post || !userId) {
      alert("로그인이 필요합니다.");
      navigate("/login");
      return;
    }
    if (isClosed) return alert("마감된 행사입니다.");
    if (!form.company_tech.trim() || !form.applicant_name.trim() || !form.position.trim() || !form.email.trim() || !form.expectation.trim()) {
      alert("필수 항목을 모두 입력해주세요.");
      return;
    }
    if (form.interests.length === 0) return alert("관심 주제를 하나 이상 선택해주세요.");
    const missingQuestion = activeConfig.customQuestions.find(question => question.required && !form.custom_answers[question.id]?.trim());
    if (missingQuestion) return alert(`필수 질문에 답변해주세요: ${missingQuestion.label}`);
    if (!form.privacy_consent) return alert("개인정보 수집 및 이용에 동의해주세요.");

    const answers = activeConfig.customQuestions.reduce<Record<string, string>>((acc, question) => {
      const answer = form.custom_answers[question.id]?.trim();
      if (answer) acc[question.id] = answer;
      return acc;
    }, {});

    setSubmitting(true);
    const { data, error } = await supabase
      .from("event_applications")
      .insert({
        post_id: post.id,
        user_id: userId,
        company_tech: form.company_tech.trim(),
        applicant_name: form.applicant_name.trim(),
        position: form.position.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        expectation: form.expectation.trim(),
        interests: form.interests,
        speaker_question: form.speaker_question.trim() || null,
        answers,
        privacy_consent: form.privacy_consent,
      })
      .select()
      .single();
    setSubmitting(false);

    if (error) {
      alert(error.code === "23505" ? "이미 신청한 행사입니다." : "신청 실패: " + error.message);
      return;
    }
    setApplication(data as EventApplication);
    setSaved(true);
  };

  const handleCancelApplication = async () => {
    if (!application) return;
    if (!window.confirm("행사 신청을 취소하시겠습니까?")) return;

    setSubmitting(true);
    const { data, error } = await supabase
      .from("event_applications")
      .update({ status: "cancelled" })
      .eq("id", application.id)
      .select()
      .single();

    const { data: counts } = await supabase.rpc("get_event_application_counts");
    const countRow = ((counts as { post_id: string; accepted_count: number }[] | null) ?? []).find(row => row.post_id === id);

    setSubmitting(false);
    if (error) {
      alert("취소 실패: " + error.message);
      return;
    }
    setApplication(data as EventApplication);
    setAcceptedCount(countRow?.accepted_count ?? 0);
    setSaved(false);
  };

  const handleAdminImageUpload = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return alert("이미지 파일만 업로드 가능합니다.");
    if (file.size > 10 * 1024 * 1024) return alert("이미지는 10MB 이하만 업로드 가능합니다.");
    const safeName = encodeFilename(file.name);
    const fileName = `${Date.now()}---event-cover---${Math.random().toString(36).substr(2, 9)}---${safeName}`;
    const { error } = await supabase.storage.from("images").upload(fileName, file);
    if (error) return alert("이미지 업로드 실패: " + error.message);
    const url = supabase.storage.from("images").getPublicUrl(fileName).data.publicUrl;
    setAdminDraft(prev => ({ ...prev, image_url: url }));
  };

  const handleAdminSave = async () => {
    if (!post) return;
    setSubmitting(true);
    const nextCapacity = adminDraft.capacity ? Number(adminDraft.capacity) : null;
    const { data: countsData } = await supabase.rpc("get_event_application_counts");
    const latestAcceptedCount = ((countsData as { post_id: string; accepted_count: number }[] | null) ?? [])
      .find(row => row.post_id === post.id)?.accepted_count ?? acceptedCount;
    const nextRemaining = nextCapacity == null ? null : Math.max(nextCapacity - latestAcceptedCount, 0);
    const nextEventStatus = nextCapacity != null && nextRemaining === 0 ? "마감" : adminDraft.event_status;
    const existingUrls = post.image_url?.split(",").map(url => url.trim()).filter(Boolean) ?? [];
    const nonCoverUrls = existingUrls.filter(url => url !== getRepresentativeImage(post));
    const imageUrls = adminDraft.image_url.trim() ? [adminDraft.image_url.trim(), ...nonCoverUrls] : nonCoverUrls;
    const formConfig: EventFormConfig = {
      intro: adminDraft.intro.trim(),
      companyTechLabel: adminDraft.companyTechLabel.trim(),
      nameLabel: adminDraft.nameLabel.trim(),
      positionLabel: adminDraft.positionLabel.trim(),
      emailLabel: adminDraft.emailLabel.trim(),
      phoneLabel: adminDraft.phoneLabel.trim(),
      expectationLabel: adminDraft.expectationLabel.trim(),
      interestsLabel: adminDraft.interestsLabel.trim(),
      interestOptions: adminDraft.interestOptions.split("\n").map(item => item.trim()).filter(Boolean),
      speakerQuestionLabel: adminDraft.speakerQuestionLabel.trim(),
      privacyConsentLabel: adminDraft.privacyConsentLabel.trim(),
      completionTitle: adminDraft.completionTitle.trim(),
      completionMessage: adminDraft.completionMessage.trim(),
      customQuestions: adminDraft.customQuestions
        .map(question => ({ ...question, label: question.label.trim() }))
        .filter(question => question.label.length > 0),
    };
    const { data, error } = await supabase
      .from("posts")
      .update({
        title: adminDraft.title.trim(),
        event_date: adminDraft.event_date.trim() || null,
        location: adminDraft.location.trim() || null,
        event_status: nextEventStatus,
        capacity: nextCapacity,
        slots_remaining: nextRemaining,
        content: adminDraft.content,
        image_url: imageUrls.length > 0 ? imageUrls.join(",") : null,
        event_form_config: formConfig,
        updated_at: new Date().toISOString(),
      })
      .eq("id", post.id)
      .select()
      .single();
    setSubmitting(false);
    if (error) return alert("저장 실패: " + error.message);
    setPost(data as Post);
    setAcceptedCount(latestAcceptedCount);
    syncAdminDraft(data as Post);
    setAdminEditing(false);
  };

  if (loading) return <PageShell title="행사 신청"><p style={{ textAlign: "center", padding: 60 }}>불러오는 중입니다.</p></PageShell>;
  if (!post) return <PageShell title="행사 신청"><p style={{ textAlign: "center", padding: 60 }}>행사를 찾을 수 없습니다.</p></PageShell>;

  return (
    <PageShell title="행사 신청" subtitle={post.title} accentColor="#18A343">
      <div className="max-w-[1120px] mx-auto pb-[100px]">
        <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-6">
          <section style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 24, overflow: "hidden" }}>
              <div style={{ aspectRatio: "16 / 9", background: isDark ? "#111827" : "#eef2f7" }}>
                {representativeImage ? (
                  <img src={representativeImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                ) : (
                  <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: textMuted }}>
                    대표이미지 없음
                  </div>
                )}
              </div>
              <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {statusCfg && <span style={getStatusPillStyle(statusCfg.color, isDark)}>{statusCfg.label}</span>}
                  {capacity != null && <span style={getMutedLabelStyle(isDark)}>{acceptedCount}/{capacity}명 수락</span>}
                </div>
                <h2 style={{ margin: 0, color: textMain, fontSize: 24, fontWeight: 900, lineHeight: 1.35 }}>{post.title}</h2>
                <div style={{ display: "grid", gap: 10, color: textMuted, fontSize: 14 }}>
                  {post.event_date && <span style={{ display: "flex", gap: 8, alignItems: "center" }}><CalendarDays size={16} />{post.event_date}</span>}
                  {post.location && <span style={{ display: "flex", gap: 8, alignItems: "center" }}><MapPin size={16} />{post.location}</span>}
                  {remaining != null && <span style={{ display: "flex", gap: 8, alignItems: "center" }}><Users size={16} />잔여 {remaining}석</span>}
                </div>
                <div className={isDark ? "quill-dark" : "quill-light"}>
                  <div className="ql-editor p-0" style={{ color: textMain }} dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(post.content || "") }} />
                </div>
              </div>
            </div>

            {isAdmin && (
              <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 20, padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                  <strong style={{ color: textMain }}>관리자 편집</strong>
                  <Button
                    type="button"
                    onClick={() => setAdminEditing(prev => !prev)}
                    style={{ background: adminEditing ? (isDark ? "rgba(255,255,255,0.1)" : "#f1f5f9") : "#4377F1", color: adminEditing ? textMain : "#fff", border: adminEditing ? `1px solid ${border}` : "none" }}
                  >
                    {adminEditing ? "접기" : "신청 페이지 수정"}
                  </Button>
                </div>
                {adminEditing && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <input style={input} value={adminDraft.title} onChange={e => setAdminDraft(p => ({ ...p, title: e.target.value }))} placeholder="행사 제목" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input style={input} value={adminDraft.event_date} onChange={e => setAdminDraft(p => ({ ...p, event_date: e.target.value }))} placeholder="일시" />
                      <input style={input} value={adminDraft.location} onChange={e => setAdminDraft(p => ({ ...p, location: e.target.value }))} placeholder="장소" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <select style={input} value={adminDraft.event_status} onChange={e => setAdminDraft(p => ({ ...p, event_status: e.target.value }))}>
                        <option value="접수예정">접수예정</option>
                        <option value="접수중">접수중</option>
                        <option value="마감임박">마감임박</option>
                        <option value="마감">마감</option>
                      </select>
                      <input style={input} type="number" min={0} value={adminDraft.capacity} onChange={e => setAdminDraft(p => ({ ...p, capacity: e.target.value }))} placeholder="정원" />
                    </div>
                    <textarea style={{ ...input, minHeight: 120, resize: "vertical" }} value={adminDraft.content} onChange={e => setAdminDraft(p => ({ ...p, content: e.target.value }))} placeholder="행사설명 HTML" />
                    <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                      <input style={{ ...input, flex: 1, minWidth: 220 }} value={adminDraft.image_url} onChange={e => setAdminDraft(p => ({ ...p, image_url: e.target.value }))} placeholder="대표이미지 URL" />
                      <label className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-md text-sm font-bold cursor-pointer text-white bg-[#4285F4]">
                        <ImagePlus size={16} />
                        이미지
                        <input type="file" accept="image/*" className="hidden" onChange={e => handleAdminImageUpload(e.target.files?.[0])} />
                      </label>
                    </div>
                    <textarea style={{ ...input, minHeight: 80, resize: "vertical" }} value={adminDraft.intro} onChange={e => setAdminDraft(p => ({ ...p, intro: e.target.value }))} placeholder="폼 안내 문구" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input style={input} value={adminDraft.companyTechLabel} onChange={e => setAdminDraft(p => ({ ...p, companyTechLabel: e.target.value }))} placeholder="기업명/기술분야 질문" />
                      <input style={input} value={adminDraft.nameLabel} onChange={e => setAdminDraft(p => ({ ...p, nameLabel: e.target.value }))} placeholder="성함 질문" />
                      <input style={input} value={adminDraft.positionLabel} onChange={e => setAdminDraft(p => ({ ...p, positionLabel: e.target.value }))} placeholder="직책 질문" />
                      <input style={input} value={adminDraft.emailLabel} onChange={e => setAdminDraft(p => ({ ...p, emailLabel: e.target.value }))} placeholder="이메일 질문" />
                      <input style={input} value={adminDraft.phoneLabel} onChange={e => setAdminDraft(p => ({ ...p, phoneLabel: e.target.value }))} placeholder="연락처 질문" />
                    </div>
                    <input style={input} value={adminDraft.expectationLabel} onChange={e => setAdminDraft(p => ({ ...p, expectationLabel: e.target.value }))} placeholder="참여 목적 질문" />
                    <input style={input} value={adminDraft.interestsLabel} onChange={e => setAdminDraft(p => ({ ...p, interestsLabel: e.target.value }))} placeholder="관심 분야 질문" />
                    <textarea style={{ ...input, minHeight: 96, resize: "vertical" }} value={adminDraft.interestOptions} onChange={e => setAdminDraft(p => ({ ...p, interestOptions: e.target.value }))} placeholder="관심 분야 선택지, 한 줄에 하나씩" />
                    <input style={input} value={adminDraft.speakerQuestionLabel} onChange={e => setAdminDraft(p => ({ ...p, speakerQuestionLabel: e.target.value }))} placeholder="사전 질문 문구" />
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <strong style={{ color: textMain, fontSize: 14 }}>추가 질문</strong>
                      <div style={{ display: "flex", justifyContent: "center" }}>
                        <button type="button" aria-label="첫 번째 추가 질문 추가" onClick={() => insertCustomQuestion(0)} style={{ width: 30, height: 30, borderRadius: "50%", border: `1px solid ${border}`, background: isDark ? "rgba(255,255,255,0.08)" : "#f8fafc", color: "#4377F1", display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                          <Plus size={16} />
                        </button>
                      </div>
                      {adminDraft.customQuestions.map((question, index) => (
                        <div key={question.id} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          <div style={{ position: "relative", padding: "14px 42px 14px 14px", borderRadius: 14, border: `1px solid ${border}`, background: panel, display: "grid", gap: 10 }}>
                            <button type="button" aria-label="폼 질문 삭제" onClick={() => removeCustomQuestion(question.id)} style={{ position: "absolute", top: 9, right: 9, width: 24, height: 24, borderRadius: "50%", border: "none", background: isDark ? "rgba(234,67,53,0.16)" : "rgba(234,67,53,0.1)", color: "#EA4335", display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                              <X size={14} />
                            </button>
                            <input style={input} value={question.label} onChange={e => updateCustomQuestion(question.id, { label: e.target.value })} placeholder="질문 문구" />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <select style={input} value={question.type} onChange={e => updateCustomQuestion(question.id, { type: e.target.value as EventCustomQuestion["type"] })}>
                                <option value="short_text">짧은 답변</option>
                                <option value="long_text">긴 답변</option>
                              </select>
                              <label style={{ display: "flex", alignItems: "center", gap: 8, color: textMain, fontSize: 13, fontWeight: 700 }}>
                                <input type="checkbox" checked={question.required} onChange={e => updateCustomQuestion(question.id, { required: e.target.checked })} />
                                필수 질문
                              </label>
                            </div>
                          </div>
                          <div style={{ display: "flex", justifyContent: "center" }}>
                            <button type="button" aria-label={`${index + 2}번째 추가 질문 추가`} onClick={() => insertCustomQuestion(index + 1)} style={{ width: 30, height: 30, borderRadius: "50%", border: `1px solid ${border}`, background: isDark ? "rgba(255,255,255,0.08)" : "#f8fafc", color: "#4377F1", display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                              <Plus size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <textarea style={{ ...input, minHeight: 72, resize: "vertical" }} value={adminDraft.privacyConsentLabel} onChange={e => setAdminDraft(p => ({ ...p, privacyConsentLabel: e.target.value }))} placeholder="개인정보 동의 문구" />
                    <input style={input} value={adminDraft.completionTitle} onChange={e => setAdminDraft(p => ({ ...p, completionTitle: e.target.value }))} placeholder="완료 제목" />
                    <textarea style={{ ...input, minHeight: 72, resize: "vertical" }} value={adminDraft.completionMessage} onChange={e => setAdminDraft(p => ({ ...p, completionMessage: e.target.value }))} placeholder="완료 안내" />
                    <Button type="button" onClick={handleAdminSave} disabled={submitting}>
                      <Save size={16} />
                      {submitting ? "저장 중..." : "저장"}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </section>

          <section style={{ background: card, border: `1px solid ${border}`, borderRadius: 24, padding: 26 }}>
            {saved || application ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 14, padding: "40px 0" }}>
                <CheckCircle2 size={48} color="#18A343" />
                <h3 style={{ margin: 0, color: textMain, fontSize: 22, fontWeight: 900 }}>
                  {application?.status === "cancelled" ? "신청이 취소되었습니다." : activeConfig.completionTitle}
                </h3>
                <p style={{ margin: 0, color: textMuted, lineHeight: 1.7 }}>
                  {application?.status === "cancelled" ? "재참가가 필요하면 운영자에게 문의해주세요." : activeConfig.completionMessage}
                </p>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                  {application?.status === "cancelled" && (
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
                      <Button asChild variant="outline" size="sm" style={contactButtonStyle}>
                        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
                      </Button>
                      <Button asChild variant="outline" size="sm" style={contactButtonStyle}>
                        <Link to="/faq">문의 안내 보기</Link>
                      </Button>
                    </div>
                  )}
                  {application && (
                    <span style={getStatusPillStyle(EVENT_APPLICATION_STATUS[application.status].color, isDark)}>
                      {EVENT_APPLICATION_STATUS[application.status].label}
                    </span>
                  )}
                  {canCancelApplication && (
                    <Button type="button" variant="destructive" onClick={handleCancelApplication} disabled={submitting}>
                      <Ban size={16} />
                      {submitting ? "취소 중..." : "신청 취소"}
                    </Button>
                  )}
                  <Button asChild variant="outline">
                    <Link to="/mypage">내 신청 내역 보기</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
                <div>
                  <h3 style={{ margin: "0 0 8px", color: textMain, fontSize: 22, fontWeight: 900 }}>참가 신청</h3>
                  <p style={{ margin: 0, color: textMuted, lineHeight: 1.65 }}>{activeConfig.intro}</p>
                </div>

                <div style={{ padding: 18, background: panel, border: `1px solid ${border}`, borderRadius: 18, display: "grid", gap: 12 }}>
                  <strong style={{ color: textMain }}>1. 참가자 기본 정보</strong>
                  <input style={input} value={form.company_tech} onChange={e => updateField("company_tech", e.target.value)} placeholder={requiredLabel(activeConfig.companyTechLabel)} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input style={input} value={form.applicant_name} onChange={e => updateField("applicant_name", e.target.value)} placeholder={requiredLabel(activeConfig.nameLabel)} />
                    <input style={input} value={form.position} onChange={e => updateField("position", e.target.value)} placeholder={requiredLabel(activeConfig.positionLabel)} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input style={input} value={form.email} onChange={e => updateField("email", e.target.value)} placeholder={requiredLabel(activeConfig.emailLabel)} />
                    <input style={input} value={form.phone} onChange={e => updateField("phone", e.target.value)} placeholder={activeConfig.phoneLabel} />
                  </div>
                </div>

                <div style={{ padding: 18, background: panel, border: `1px solid ${border}`, borderRadius: 18, display: "grid", gap: 12 }}>
                  <strong style={{ color: textMain }}>2. 관심 분야 & 참여 목적</strong>
                  <textarea style={{ ...input, minHeight: 110, resize: "vertical" }} value={form.expectation} onChange={e => updateField("expectation", e.target.value)} placeholder={requiredLabel(activeConfig.expectationLabel)} />
                  <p style={{ margin: 0, color: textMuted, fontSize: 13, fontWeight: 700 }}>{requiredLabel(activeConfig.interestsLabel)}</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {activeConfig.interestOptions.map(option => (
                      <label key={option} style={{ display: "flex", gap: 10, alignItems: "center", color: textMain, fontSize: 14 }}>
                        <input type="checkbox" checked={form.interests.includes(option)} onChange={() => toggleInterest(option)} />
                        {option}
                      </label>
                    ))}
                  </div>
                </div>

                <div style={{ padding: 18, background: panel, border: `1px solid ${border}`, borderRadius: 18, display: "grid", gap: 12 }}>
                  <strong style={{ color: textMain }}>3. 사전 질문</strong>
                  <textarea style={{ ...input, minHeight: 100, resize: "vertical" }} value={form.speaker_question} onChange={e => updateField("speaker_question", e.target.value)} placeholder={activeConfig.speakerQuestionLabel} />
                </div>

                {activeConfig.customQuestions.map((question, index) => (
                  <div key={question.id} style={{ padding: 18, background: panel, border: `1px solid ${border}`, borderRadius: 18, display: "grid", gap: 12 }}>
                    <strong style={{ color: textMain }}>{index + 4}. {question.label}{question.required ? " *" : ""}</strong>
                    {question.type === "long_text" ? (
                      <textarea style={{ ...input, minHeight: 100, resize: "vertical" }} value={form.custom_answers[question.id] ?? ""} onChange={e => updateCustomAnswer(question.id, e.target.value)} placeholder={question.label} />
                    ) : (
                      <input style={input} value={form.custom_answers[question.id] ?? ""} onChange={e => updateCustomAnswer(question.id, e.target.value)} placeholder={question.label} />
                    )}
                  </div>
                ))}

                <div style={{ padding: 18, background: panel, border: `1px solid ${border}`, borderRadius: 18 }}>
                  <label style={{ display: "flex", gap: 10, alignItems: "flex-start", color: textMain, fontSize: 14, lineHeight: 1.6 }}>
                    <input type="checkbox" checked={form.privacy_consent} onChange={e => updateField("privacy_consent", e.target.checked)} style={{ marginTop: 4 }} />
                    {requiredLabel(activeConfig.privacyConsentLabel)}
                  </label>
                </div>

                <Button type="button" size="lg" onClick={handleSubmit} disabled={submitting || isClosed} className="w-full bg-[#18A343] hover:brightness-110">
                  <Send size={16} />
                  {isClosed ? "신청 마감" : submitting ? "제출 중..." : "신청 제출"}
                </Button>
              </div>
            )}
          </section>
        </div>
      </div>
    </PageShell>
  );
}
