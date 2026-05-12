import { useEffect, useMemo, useState } from "react";
import type React from "react";
import { Link, useNavigate, useParams } from "react-router";
import { Ban, CalendarDays, CheckCircle2, MapPin, Plus, Save, Send, Users, X } from "lucide-react";
import { PageShell } from "../components/PageShell";
import { Button } from "../components/ui/button";
import { getMutedLabelStyle, getStatusPillStyle } from "../components/contentListStyles";
import { AdvancedThumbnailEditor } from "../components/admin/AdvancedThumbnailEditor";
import { CONTACT_EMAIL } from "../constants/contact";
import { useTheme } from "../ThemeContext";
import { supabase } from "../../lib/supabaseClient";
import { useAdmin } from "../../hooks/useAdmin";
import type { EventApplication, EventCustomQuestion, EventFormConfig, Post, Profile } from "../../lib/types";
import { isImage } from "../../utils/file";
import { sanitizeRichHtml } from "../../utils/htmlSecurity";
import { EVENT_APPLICATION_STATUS, EVENT_STATUS_CONFIG, mergeEventFormConfig } from "../../utils/eventApplication";
import { getThumbnailCandidates, uploadThumbnailIfDataUrl } from "../../utils/postThumbnail";

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
const EVENT_META_LABEL_PATTERN = /^[-\s]*(일시|날짜|장소|위치|정원|인원|상태|모집|잔여)\s*[:：]/;
const EVENT_DATE_PATTERN = /(\d{4})[.\-/]\s*(\d{1,2})[.\-/]\s*(\d{1,2})(?:\s*\([^)]+\))?(?:\s+(\d{1,2}):(\d{2}))?/;
const KOREAN_WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

const getRepresentativeImage = (post: Post | null) =>
  post?.image_url?.split(",").map(url => url.trim()).filter(Boolean).find(isImage) ?? "";

const pad2 = (value: string | number) => String(value).padStart(2, "0");

const parseEventDateParts = (value: string) => {
  const match = value.match(EVENT_DATE_PATTERN);
  if (!match) {
    return { y: "", m: "", d: "", h: "", minute: "00" };
  }
  return {
    y: match[1],
    m: pad2(match[2]),
    d: pad2(match[3]),
    h: match[4] ? pad2(match[4]) : "",
    minute: match[5] ? pad2(match[5]) : "00",
  };
};

const getDaysInMonth = (year: string, month: string) => {
  const y = Number(year);
  const m = Number(month);
  if (!y || !m) return 31;
  return new Date(y, m, 0).getDate();
};

const composeEventDateText = (draft: {
  event_date_y: string;
  event_date_m: string;
  event_date_d: string;
  event_time_h: string;
  event_time_m: string;
}) => {
  const { event_date_y, event_date_m, event_date_d, event_time_h, event_time_m } = draft;
  if (!event_date_y || !event_date_m || !event_date_d) return "";

  const date = new Date(Number(event_date_y), Number(event_date_m) - 1, Number(event_date_d));
  if (Number.isNaN(date.getTime())) return "";

  const dateText = `${event_date_y}.${event_date_m}.${event_date_d} (${KOREAN_WEEKDAYS[date.getDay()]})`;
  return event_time_h ? `${dateText} ${event_time_h}:${event_time_m || "00"}` : dateText;
};

const parseLocationParts = (value: string) => {
  const [name, ...addressParts] = value.split("|");
  return {
    name: name.trim(),
    address: addressParts.join("|").trim(),
  };
};

const composeLocationText = (name: string, address: string) =>
  [name.trim(), address.trim()].filter(Boolean).join(" | ");

const getDisplayLocation = (value: string) => {
  const { name, address } = parseLocationParts(value);
  return [name, address].filter(Boolean).join(", ");
};

const isEventMetaText = (text: string) => EVENT_META_LABEL_PATTERN.test(text.trim());

const stripEventMetaParagraphs = (html: string) => {
  if (!html) return "";

  if (typeof DOMParser === "undefined") return html;

  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.body.querySelectorAll("p, li, div").forEach(element => {
    const text = element.textContent?.replace(/\s+/g, " ").trim() ?? "";
    if (isEventMetaText(text)) element.remove();
  });
  return doc.body.innerHTML.trim();
};

const eventDescriptionHtmlToPlainText = (html: string) => {
  const normalized = stripEventMetaParagraphs(html);
  if (!normalized) return "";

  if (typeof DOMParser === "undefined") return normalized.replace(/<[^>]*>/g, "").trim();

  const doc = new DOMParser().parseFromString(normalized, "text/html");
  const blockTexts = Array.from(doc.body.querySelectorAll("p, li, div, h1, h2, h3, h4, h5, h6"))
    .map(element => element.textContent?.replace(/\s+/g, " ").trim() ?? "")
    .filter(Boolean);
  if (blockTexts.length > 0) return blockTexts.join("\n");
  return doc.body.textContent?.replace(/\s+/g, " ").trim() ?? "";
};

const escapeHtml = (text: string) => text
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#39;");

const eventDescriptionTextToHtml = (text: string) =>
  text
    .split(/\n{2,}|\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => `<p>${escapeHtml(line)}</p>`)
    .join("");

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
  const [adminEditing, setAdminEditing] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [acceptedCount, setAcceptedCount] = useState(0);
  const [editingInterestIndex, setEditingInterestIndex] = useState<number | null>(null);
  const [newInterestOption, setNewInterestOption] = useState("");
  const [adminDraft, setAdminDraft] = useState({
    title: "",
    event_date: "",
    event_date_y: "",
    event_date_m: "",
    event_date_d: "",
    event_time_h: "",
    event_time_m: "00",
    location: "",
    locationName: "",
    locationAddress: "",
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

  const input = fieldStyle("var(--color-field-bg)", "var(--color-border-soft)", "var(--color-text-primary)");
  const adminGroupStyle: React.CSSProperties = {
    padding: 18,
    borderRadius: 18,
    border: "1px solid var(--color-border-soft)",
    background: "var(--color-surface-subtle)",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  };
  const adminGroupTitleStyle: React.CSSProperties = {
    color: "var(--color-text-primary)",
    fontSize: 15,
    fontWeight: 900,
  };
  const compactRowStyle: React.CSSProperties = {
    minHeight: 46,
    padding: "8px 10px",
    borderRadius: 14,
    border: "1px solid var(--color-border-soft)",
    background: "var(--color-field-bg)",
    display: "flex",
    alignItems: "center",
    gap: 10,
  };
  const roundAddButtonStyle: React.CSSProperties = {
    width: 30,
    height: 30,
    borderRadius: "50%",
    border: "1px solid var(--color-border-soft)",
    background: "var(--color-field-bg)",
    color: "var(--color-accent-blue)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flex: "0 0 auto",
  };
  const roundDeleteButtonStyle: React.CSSProperties = {
    width: 26,
    height: 26,
    borderRadius: "50%",
    border: "none",
    background: "var(--color-danger-soft-bg)",
    color: "var(--color-brand-red)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flex: "0 0 auto",
  };
  const contactButtonStyle: React.CSSProperties = {
    background: "var(--color-accent-blue-soft-bg)",
    border: "1px solid var(--color-accent-blue-soft-border)",
    color: "var(--color-accent-blue)",
    boxShadow: "var(--shadow-card-rest)",
  };

  const config = useMemo(() => mergeEventFormConfig(post?.event_form_config), [post?.event_form_config]);
  const dateYears = useMemo(() => {
    const start = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, index) => String(start + index));
    if (adminDraft.event_date_y && !years.includes(adminDraft.event_date_y)) years.unshift(adminDraft.event_date_y);
    return years;
  }, [adminDraft.event_date_y]);
  const dateMonths = useMemo(() => Array.from({ length: 12 }, (_, index) => pad2(index + 1)), []);
  const dateDays = useMemo(() => {
    const count = getDaysInMonth(adminDraft.event_date_y, adminDraft.event_date_m);
    return Array.from({ length: count }, (_, index) => pad2(index + 1));
  }, [adminDraft.event_date_m, adminDraft.event_date_y]);
  const timeHours = useMemo(() => Array.from({ length: 24 }, (_, index) => pad2(index)), []);
  const timeMinutes = useMemo(() => Array.from({ length: 6 }, (_, index) => pad2(index * 10)), []);
  const interestOptionItems = useMemo(() => {
    const rows = adminDraft.interestOptions.split("\n").map(item => item.trim());
    return rows.length === 1 && rows[0] === "" ? [] : rows;
  }, [adminDraft.interestOptions]);
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
  const renderedEventContent = useMemo(() => stripEventMetaParagraphs(post?.content || ""), [post?.content]);
  const bannerImageCandidates = useMemo(() => getThumbnailCandidates(post?.content || "", adminDraft.image_url), [adminDraft.image_url, post?.content]);
  const displayLocation = useMemo(() => getDisplayLocation(post?.location || ""), [post?.location]);
  const capacity = post?.capacity ?? null;
  const remaining = capacity == null ? null : Math.max(capacity - acceptedCount, 0);
  const statusCfg = EVENT_STATUS_CONFIG[post?.event_status ?? ""] ?? null;
  const isClosed = post?.event_status === "마감" || remaining === 0;
  const canCancelApplication = application?.status === "pending" || application?.status === "accepted";

  const syncAdminDraft = (nextPost: Post) => {
    const nextConfig = mergeEventFormConfig(nextPost.event_form_config);
    const dateParts = parseEventDateParts(nextPost.event_date || "");
    const locationParts = parseLocationParts(nextPost.location || "");
    setAdminDraft({
      title: nextPost.title || "",
      event_date: nextPost.event_date || "",
      event_date_y: dateParts.y,
      event_date_m: dateParts.m,
      event_date_d: dateParts.d,
      event_time_h: dateParts.h,
      event_time_m: dateParts.minute,
      location: nextPost.location || "",
      locationName: locationParts.name,
      locationAddress: locationParts.address,
      event_status: nextPost.event_status || "접수예정",
      capacity: nextPost.capacity != null ? String(nextPost.capacity) : "",
      content: eventDescriptionHtmlToPlainText(nextPost.content || ""),
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

  const replaceInterestOptions = (items: string[]) => {
    setAdminDraft(prev => ({ ...prev, interestOptions: items.join("\n") }));
  };

  const updateInterestOption = (index: number, value: string) => {
    replaceInterestOptions(interestOptionItems.map((item, itemIndex) => itemIndex === index ? value : item));
  };

  const removeInterestOption = (index: number) => {
    replaceInterestOptions(interestOptionItems.filter((_, itemIndex) => itemIndex !== index));
    setEditingInterestIndex(current => current === index ? null : current);
  };

  const addInterestOption = () => {
    const nextOption = newInterestOption.trim();
    if (!nextOption) return;
    replaceInterestOptions([...interestOptionItems, nextOption]);
    setNewInterestOption("");
    setEditingInterestIndex(interestOptionItems.length);
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

  const handleAdminSave = async () => {
    if (!post) return;
    setSubmitting(true);
    try {
      const nextCapacity = adminDraft.capacity ? Number(adminDraft.capacity) : null;
      const nextEventDate = composeEventDateText(adminDraft);
      const nextLocation = composeLocationText(adminDraft.locationName, adminDraft.locationAddress);
      const { data: countsData } = await supabase.rpc("get_event_application_counts");
      const latestAcceptedCount = ((countsData as { post_id: string; accepted_count: number }[] | null) ?? [])
        .find(row => row.post_id === post.id)?.accepted_count ?? acceptedCount;
      const nextRemaining = nextCapacity == null ? null : Math.max(nextCapacity - latestAcceptedCount, 0);
      const nextEventStatus = nextCapacity != null && nextRemaining === 0 ? "마감" : adminDraft.event_status;
      const existingUrls = post.image_url?.split(",").map(url => url.trim()).filter(Boolean) ?? [];
      const nonCoverUrls = existingUrls.filter(url => url !== getRepresentativeImage(post));
      const resolvedCoverUrl = await uploadThumbnailIfDataUrl(adminDraft.image_url.trim() || null);
      const imageUrls = resolvedCoverUrl ? [resolvedCoverUrl, ...nonCoverUrls] : nonCoverUrls;
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
          event_date: nextEventDate || null,
          location: nextLocation || null,
          event_status: nextEventStatus,
          capacity: nextCapacity,
          slots_remaining: nextRemaining,
          content: eventDescriptionTextToHtml(adminDraft.content),
          image_url: imageUrls.length > 0 ? imageUrls.join(",") : null,
          event_form_config: formConfig,
          updated_at: new Date().toISOString(),
        })
        .eq("id", post.id)
        .select()
        .single();
      if (error) throw error;
      setPost(data as Post);
      setAcceptedCount(latestAcceptedCount);
      syncAdminDraft(data as Post);
      setAdminEditing(false);
    } catch (error) {
      alert("저장 실패: " + (error instanceof Error ? error.message : "알 수 없는 오류"));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <PageShell title="행사 신청"><p style={{ textAlign: "center", padding: 60 }}>불러오는 중입니다.</p></PageShell>;
  if (!post) return <PageShell title="행사 신청"><p style={{ textAlign: "center", padding: 60 }}>행사를 찾을 수 없습니다.</p></PageShell>;

  return (
    <PageShell title="행사 신청" subtitle={post.title} accentColor="var(--color-accent-green)">
      <div className="max-w-[1120px] mx-auto pb-[100px]">
        <div className="flex flex-col gap-6">
          <section>
            <div style={{ background: "var(--color-surface-card)", border: "1px solid var(--color-border-soft)", borderRadius: 24, overflow: "hidden" }}>
              <div style={{ height: "var(--size-event-application-cover-height)", background: "var(--color-bg-elevated)" }}>
                {representativeImage ? (
                  <img src={representativeImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                ) : (
                  <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)" }}>
                    대표이미지 없음
                  </div>
                )}
              </div>
              <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {statusCfg && <span style={getStatusPillStyle(statusCfg.color, isDark)}>{statusCfg.label}</span>}
                  {capacity != null && <span style={getMutedLabelStyle(isDark)}>{acceptedCount}/{capacity}명 수락</span>}
                </div>
                <h2 style={{ margin: 0, color: "var(--color-text-primary)", fontSize: 24, fontWeight: 900, lineHeight: 1.35 }}>{post.title}</h2>
                <div style={{ display: "grid", gap: 10, color: "var(--color-text-muted)", fontSize: 14 }}>
                  {post.event_date && <span style={{ display: "flex", gap: 8, alignItems: "center" }}><CalendarDays size={16} />{post.event_date}</span>}
                  {displayLocation && <span style={{ display: "flex", gap: 8, alignItems: "center" }}><MapPin size={16} />{displayLocation}</span>}
                  {remaining != null && <span style={{ display: "flex", gap: 8, alignItems: "center" }}><Users size={16} />잔여 {remaining}석</span>}
                </div>
                <div className={isDark ? "quill-dark" : "quill-light"} style={{ marginBottom: 0 }}>
                  <div
                    className="ql-editor p-0 m-0"
                    style={{ color: "var(--color-text-primary)", minHeight: 0 }}
                    dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(renderedEventContent) }}
                  />
                </div>
              </div>
            </div>
          </section>

          {adminEditing ? (
            <section style={{ background: "var(--color-surface-card)", border: "1px solid var(--color-border-soft)", borderRadius: 20, padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
              <strong style={{ color: "var(--color-text-primary)" }}>관리자 편집</strong>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={adminGroupStyle}>
                  <strong style={adminGroupTitleStyle}>행사 기본 정보</strong>
                  <input style={input} value={adminDraft.title} onChange={e => setAdminDraft(p => ({ ...p, title: e.target.value }))} placeholder="행사 제목" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" style={{ alignItems: "start" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <span style={{ color: "var(--color-text-muted)", fontSize: 13, fontWeight: 800 }}>일시</span>
                      <div className="grid grid-cols-3 gap-2">
                        <select style={input} value={adminDraft.event_date_y} onChange={e => setAdminDraft(p => ({ ...p, event_date_y: e.target.value, event_date_d: Number(p.event_date_d) > getDaysInMonth(e.target.value, p.event_date_m) ? "" : p.event_date_d }))}>
                          <option value="">연도</option>
                          {dateYears.map(year => <option key={year} value={year}>{year}</option>)}
                        </select>
                        <select style={input} value={adminDraft.event_date_m} onChange={e => setAdminDraft(p => ({ ...p, event_date_m: e.target.value, event_date_d: Number(p.event_date_d) > getDaysInMonth(p.event_date_y, e.target.value) ? "" : p.event_date_d }))}>
                          <option value="">월</option>
                          {dateMonths.map(month => <option key={month} value={month}>{month}</option>)}
                        </select>
                        <select style={input} value={adminDraft.event_date_d} onChange={e => setAdminDraft(p => ({ ...p, event_date_d: e.target.value }))}>
                          <option value="">일</option>
                          {dateDays.map(day => <option key={day} value={day}>{day}</option>)}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <select style={input} value={adminDraft.event_time_h} onChange={e => setAdminDraft(p => ({ ...p, event_time_h: e.target.value }))}>
                          <option value="">시</option>
                          {timeHours.map(hour => <option key={hour} value={hour}>{hour}시</option>)}
                        </select>
                        <select style={input} value={adminDraft.event_time_m} onChange={e => setAdminDraft(p => ({ ...p, event_time_m: e.target.value }))}>
                          {timeMinutes.map(minute => <option key={minute} value={minute}>{minute}분</option>)}
                        </select>
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <span style={{ color: "var(--color-text-muted)", fontSize: 13, fontWeight: 800 }}>장소</span>
                      <input style={input} value={adminDraft.locationName} onChange={e => setAdminDraft(p => ({ ...p, locationName: e.target.value }))} placeholder="장소 이름" />
                      <input style={input} value={adminDraft.locationAddress} onChange={e => setAdminDraft(p => ({ ...p, locationAddress: e.target.value }))} placeholder="주소" />
                    </div>
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
                  <textarea style={{ ...input, minHeight: 96, resize: "vertical" }} value={adminDraft.content} onChange={e => setAdminDraft(p => ({ ...p, content: e.target.value }))} placeholder="행사 설명" />
                  <AdvancedThumbnailEditor
                    aspect="7/1"
                    candidates={bannerImageCandidates}
                    value={adminDraft.image_url || null}
                    onChange={url => setAdminDraft(prev => ({ ...prev, image_url: url ?? "" }))}
                    title="상단 대표 이미지"
                    statusLabel="수동 지정됨"
                    emptyStatusLabel="이미지 없음"
                    appliedLabel="현재 상단 대표 이미지"
                    emptyText="행사 상단에 표시할 이미지를 업로드해주세요."
                    singleImageMode
                  />
                </div>
                <div style={adminGroupStyle}>
                  <strong style={adminGroupTitleStyle}>신청서 안내</strong>
                  <textarea style={{ ...input, minHeight: 80, resize: "vertical" }} value={adminDraft.intro} onChange={e => setAdminDraft(p => ({ ...p, intro: e.target.value }))} placeholder="폼 안내 문구" />
                </div>
                <div style={adminGroupStyle}>
                  <strong style={adminGroupTitleStyle}>1. 참가자 기본 정보</strong>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input style={input} value={adminDraft.companyTechLabel} onChange={e => setAdminDraft(p => ({ ...p, companyTechLabel: e.target.value }))} placeholder="기업명/기술분야 질문" />
                    <input style={input} value={adminDraft.nameLabel} onChange={e => setAdminDraft(p => ({ ...p, nameLabel: e.target.value }))} placeholder="성함 질문" />
                    <input style={input} value={adminDraft.positionLabel} onChange={e => setAdminDraft(p => ({ ...p, positionLabel: e.target.value }))} placeholder="직책 질문" />
                    <input style={input} value={adminDraft.emailLabel} onChange={e => setAdminDraft(p => ({ ...p, emailLabel: e.target.value }))} placeholder="이메일 질문" />
                    <input style={input} value={adminDraft.phoneLabel} onChange={e => setAdminDraft(p => ({ ...p, phoneLabel: e.target.value }))} placeholder="연락처 질문" />
                  </div>
                </div>
                <div style={adminGroupStyle}>
                  <strong style={adminGroupTitleStyle}>2. 관심 분야 & 참여 목적</strong>
                  <input style={input} value={adminDraft.expectationLabel} onChange={e => setAdminDraft(p => ({ ...p, expectationLabel: e.target.value }))} placeholder="참여 목적 질문" />
                  <input style={input} value={adminDraft.interestsLabel} onChange={e => setAdminDraft(p => ({ ...p, interestsLabel: e.target.value }))} placeholder="관심 분야 질문" />
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {interestOptionItems.map((option, index) => {
                      const isEditingOption = editingInterestIndex === index;
                      return (
                        <div key={index} style={compactRowStyle}>
                          {isEditingOption ? (
                            <input
                              style={{ ...input, padding: "8px 10px", borderRadius: 10, flex: 1 }}
                              value={option}
                              onChange={e => updateInterestOption(index, e.target.value)}
                              placeholder="선택지 이름"
                            />
                          ) : (
                            <span style={{ flex: 1, color: option ? "var(--color-text-primary)" : "var(--color-text-muted)", fontSize: 14, fontWeight: 700 }}>
                              {option || "빈 선택지"}
                            </span>
                          )}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingInterestIndex(isEditingOption ? null : index)}
                            style={{ minWidth: 58, background: "var(--color-field-bg)" }}
                          >
                            {isEditingOption ? "완료" : "수정"}
                          </Button>
                          <button type="button" aria-label="관심 분야 선택지 삭제" onClick={() => removeInterestOption(index)} style={roundDeleteButtonStyle}>
                            <X size={14} />
                          </button>
                        </div>
                      );
                    })}
                    <div style={compactRowStyle}>
                      <input
                        style={{ ...input, padding: "8px 10px", borderRadius: 10, flex: 1 }}
                        value={newInterestOption}
                        onChange={e => setNewInterestOption(e.target.value)}
                        placeholder="새 관심 분야 선택지"
                      />
                      <button type="button" aria-label="관심 분야 선택지 추가" onClick={addInterestOption} style={roundAddButtonStyle}>
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                </div>
                <div style={adminGroupStyle}>
                  <strong style={adminGroupTitleStyle}>3. 사전 질문</strong>
                  <input style={input} value={adminDraft.speakerQuestionLabel} onChange={e => setAdminDraft(p => ({ ...p, speakerQuestionLabel: e.target.value }))} placeholder="사전 질문 문구" />
                </div>
                <div style={adminGroupStyle}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <strong style={adminGroupTitleStyle}>4. 추가 질문</strong>
                    {adminDraft.customQuestions.length === 0 && (
                      <div style={{ ...compactRowStyle, justifyContent: "center" }}>
                        <button type="button" aria-label="첫 번째 추가 질문 추가" onClick={() => insertCustomQuestion(0)} style={roundAddButtonStyle}>
                          <Plus size={16} />
                        </button>
                      </div>
                    )}
                    {adminDraft.customQuestions.length > 0 && (
                      <div style={{ display: "flex", justifyContent: "center" }}>
                        <button type="button" aria-label="첫 번째 추가 질문 추가" onClick={() => insertCustomQuestion(0)} style={roundAddButtonStyle}>
                        <Plus size={16} />
                      </button>
                      </div>
                    )}
                    {adminDraft.customQuestions.map((question, index) => (
                      <div key={question.id} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <div style={{ position: "relative", padding: "14px 42px 14px 14px", borderRadius: 14, border: "1px solid var(--color-border-soft)", background: "var(--color-surface-subtle)", display: "grid", gap: 10 }}>
                          <button type="button" aria-label="폼 질문 삭제" onClick={() => removeCustomQuestion(question.id)} style={{ position: "absolute", top: 9, right: 9, width: 24, height: 24, borderRadius: "50%", border: "none", background: "var(--color-danger-soft-bg)", color: "var(--color-brand-red)", display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                            <X size={14} />
                          </button>
                          <input style={input} value={question.label} onChange={e => updateCustomQuestion(question.id, { label: e.target.value })} placeholder="질문 문구" />
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <select style={input} value={question.type} onChange={e => updateCustomQuestion(question.id, { type: e.target.value as EventCustomQuestion["type"] })}>
                              <option value="short_text">짧은 답변</option>
                              <option value="long_text">긴 답변</option>
                            </select>
                            <label style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--color-text-primary)", fontSize: 13, fontWeight: 700 }}>
                              <input type="checkbox" checked={question.required} onChange={e => updateCustomQuestion(question.id, { required: e.target.checked })} />
                              필수 질문
                            </label>
                          </div>
                        </div>
                        <div style={{ display: "flex", justifyContent: "center" }}>
                          <button type="button" aria-label={`${index + 2}번째 추가 질문 추가`} onClick={() => insertCustomQuestion(index + 1)} style={roundAddButtonStyle}>
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={adminGroupStyle}>
                  <strong style={adminGroupTitleStyle}>5. 개인정보 동의 및 완료 안내</strong>
                  <textarea style={{ ...input, minHeight: 72, resize: "vertical" }} value={adminDraft.privacyConsentLabel} onChange={e => setAdminDraft(p => ({ ...p, privacyConsentLabel: e.target.value }))} placeholder="개인정보 동의 문구" />
                  <input style={input} value={adminDraft.completionTitle} onChange={e => setAdminDraft(p => ({ ...p, completionTitle: e.target.value }))} placeholder="완료 제목" />
                  <textarea style={{ ...input, minHeight: 72, resize: "vertical" }} value={adminDraft.completionMessage} onChange={e => setAdminDraft(p => ({ ...p, completionMessage: e.target.value }))} placeholder="완료 안내" />
                </div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <Button type="button" onClick={handleAdminSave} disabled={submitting}>
                      <Save size={16} />
                      {submitting ? "저장 중..." : "저장"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={submitting}
                      onClick={() => {
                        syncAdminDraft(post);
                        setAdminEditing(false);
                      }}
                    >
                      취소
                    </Button>
                  </div>
                </div>
            </section>
          ) : (
            <section style={{ position: "relative", background: "var(--color-surface-card)", border: "1px solid var(--color-border-soft)", borderRadius: 24, padding: 26 }}>
              {isAdmin && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAdminEditing(true)}
                  style={{ position: "absolute", top: 18, right: 18, background: "var(--color-field-bg)" }}
                >
                  편집
                </Button>
              )}
              {saved || application ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 14, padding: "40px 0" }}>
                  <CheckCircle2 size={48} color="var(--color-accent-green)" />
                  <h3 style={{ margin: 0, color: "var(--color-text-primary)", fontSize: 22, fontWeight: 900 }}>
                    {application?.status === "cancelled" ? "신청이 취소되었습니다." : activeConfig.completionTitle}
                  </h3>
                  <p style={{ margin: 0, color: "var(--color-text-muted)", lineHeight: 1.7 }}>
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
                  <div style={{ paddingRight: isAdmin ? 82 : 0 }}>
                    <h3 style={{ margin: "0 0 8px", color: "var(--color-text-primary)", fontSize: 22, fontWeight: 900 }}>참가 신청</h3>
                    <p style={{ margin: 0, color: "var(--color-text-muted)", lineHeight: 1.65 }}>{activeConfig.intro}</p>
                  </div>

                  <div style={{ padding: 18, background: "var(--color-surface-subtle)", border: "1px solid var(--color-border-soft)", borderRadius: 18, display: "grid", gap: 12 }}>
                    <strong style={{ color: "var(--color-text-primary)" }}>1. 참가자 기본 정보</strong>
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

                  <div style={{ padding: 18, background: "var(--color-surface-subtle)", border: "1px solid var(--color-border-soft)", borderRadius: 18, display: "grid", gap: 12 }}>
                    <strong style={{ color: "var(--color-text-primary)" }}>2. 관심 분야 & 참여 목적</strong>
                    <textarea style={{ ...input, minHeight: 110, resize: "vertical" }} value={form.expectation} onChange={e => updateField("expectation", e.target.value)} placeholder={requiredLabel(activeConfig.expectationLabel)} />
                    <p style={{ margin: 0, color: "var(--color-text-muted)", fontSize: 13, fontWeight: 700 }}>{requiredLabel(activeConfig.interestsLabel)}</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {activeConfig.interestOptions.map(option => (
                        <label key={option} style={{ display: "flex", gap: 10, alignItems: "center", color: "var(--color-text-primary)", fontSize: 14 }}>
                          <input type="checkbox" checked={form.interests.includes(option)} onChange={() => toggleInterest(option)} />
                          {option}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div style={{ padding: 18, background: "var(--color-surface-subtle)", border: "1px solid var(--color-border-soft)", borderRadius: 18, display: "grid", gap: 12 }}>
                    <strong style={{ color: "var(--color-text-primary)" }}>3. 사전 질문</strong>
                    <textarea style={{ ...input, minHeight: 100, resize: "vertical" }} value={form.speaker_question} onChange={e => updateField("speaker_question", e.target.value)} placeholder={activeConfig.speakerQuestionLabel} />
                  </div>

                  {activeConfig.customQuestions.map((question, index) => (
                    <div key={question.id} style={{ padding: 18, background: "var(--color-surface-subtle)", border: "1px solid var(--color-border-soft)", borderRadius: 18, display: "grid", gap: 12 }}>
                      <strong style={{ color: "var(--color-text-primary)" }}>{index + 4}. {question.label}{question.required ? " *" : ""}</strong>
                      {question.type === "long_text" ? (
                        <textarea style={{ ...input, minHeight: 100, resize: "vertical" }} value={form.custom_answers[question.id] ?? ""} onChange={e => updateCustomAnswer(question.id, e.target.value)} placeholder={question.label} />
                      ) : (
                        <input style={input} value={form.custom_answers[question.id] ?? ""} onChange={e => updateCustomAnswer(question.id, e.target.value)} placeholder={question.label} />
                      )}
                    </div>
                  ))}

                  <div style={{ padding: 18, background: "var(--color-surface-subtle)", border: "1px solid var(--color-border-soft)", borderRadius: 18 }}>
                    <label style={{ display: "flex", gap: 10, alignItems: "flex-start", color: "var(--color-text-primary)", fontSize: 14, lineHeight: 1.6 }}>
                      <input type="checkbox" checked={form.privacy_consent} onChange={e => updateField("privacy_consent", e.target.checked)} style={{ marginTop: 4 }} />
                      {requiredLabel(activeConfig.privacyConsentLabel)}
                    </label>
                  </div>

                  <Button type="button" size="lg" onClick={handleSubmit} disabled={submitting || isClosed} className="w-full bg-[var(--color-accent-green)] hover:brightness-110">
                    <Send size={16} />
                    {isClosed ? "신청 마감" : submitting ? "제출 중..." : "신청 제출"}
                  </Button>
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </PageShell>
  );
}
