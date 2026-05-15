import { useEffect, useMemo, useState } from "react";
import type React from "react";
import { Link, useNavigate, useParams } from "react-router";
import { Ban, CalendarDays, CheckCircle2, MapPin, Plus, Save, Send, Users, X } from "lucide-react";
import { PageShell } from "../components/PageShell";
import { Button } from "../components/ui/button";
import { getBackLinkStyle, getMutedLabelStyle, getStatusPillStyle } from "../components/contentListStyles";
import { AdvancedThumbnailEditor } from "../components/admin/AdvancedThumbnailEditor";
import { CONTACT_EMAIL } from "../constants/contact";
import { useTheme } from "../ThemeContext";
import { supabase } from "../../lib/supabaseClient";
import { useAdmin } from "../../hooks/useAdmin";
import type { EventApplication, EventCustomQuestion, EventFormConfig, Post, Profile } from "../../lib/types";
import { isImage } from "../../utils/file";
import { sanitizeRichHtml } from "../../utils/htmlSecurity";
import { EVENT_APPLICATION_STATUS, EVENT_STATUS_CONFIG, getEffectiveEventStatus, getEventRemaining, isEventApplicationOpen, mergeEventFormConfig } from "../../utils/eventApplication";
import { getThumbnailCandidates, uploadThumbnailIfDataUrl } from "../../utils/postThumbnail";
import { composeLocalDateTimeIso, composeStructuredLocation, formatLocalDateTime, formatStructuredLocation, getDaysInMonth, getMinuteOptions, pad2, parseDateTimeParts, parseStructuredLocation } from "../../utils/scheduleFields";

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

const EVENT_DATE_PATTERN = /(\d{4})[.\-/]\s*(\d{1,2})[.\-/]\s*(\d{1,2})(?:\s*\([^)]+\))?(?:\s+(\d{1,2}):(\d{2}))?/;
const KOREAN_WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

const getRepresentativeImage = (post: Post | null) =>
  post?.image_url?.split(",").map(url => url.trim()).filter(Boolean).find(isImage) ?? "";

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

const eventDescriptionHtmlToPlainText = (html: string) => {
  if (!html) return "";

  if (typeof DOMParser === "undefined") return html.replace(/<[^>]*>/g, "").trim();

  const doc = new DOMParser().parseFromString(html, "text/html");
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
  padding: "var(--space-event-application-field-block) var(--space-event-application-field-inline)",
  borderRadius: "var(--radius-event-application-field)",
  border: `1px solid ${border}`,
  background,
  color,
  outline: "none",
  fontSize: "var(--text-event-application-body)",
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
    application_deadline_y: "",
    application_deadline_m: "",
    application_deadline_d: "",
    application_deadline_h: "",
    application_deadline_minute: "00",
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
    padding: "var(--space-event-application-group)",
    borderRadius: "var(--radius-event-application-group)",
    border: "1px solid var(--color-border-soft)",
    background: "var(--color-surface-subtle)",
    display: "flex",
    flexDirection: "column",
    gap: "var(--space-sm)",
  };
  const adminGroupTitleStyle: React.CSSProperties = {
    color: "var(--color-text-primary)",
    fontSize: "var(--text-event-application-admin-title)",
    fontWeight: "var(--weight-black)",
  };
  const compactRowStyle: React.CSSProperties = {
    minHeight: "var(--size-event-application-row-min)",
    padding: "var(--space-event-application-compact-block) var(--space-event-application-compact-inline)",
    borderRadius: "var(--radius-event-application-row)",
    border: "1px solid var(--color-border-soft)",
    background: "var(--color-field-bg)",
    display: "flex",
    alignItems: "center",
    gap: "var(--space-event-application-compact-inline)",
  };
  const roundAddButtonStyle: React.CSSProperties = {
    width: "var(--size-event-application-action-md)",
    height: "var(--size-event-application-action-md)",
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
    width: "var(--size-event-application-action-sm)",
    height: "var(--size-event-application-action-sm)",
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
  const compactInputStyle: React.CSSProperties = {
    ...input,
    padding: "var(--space-event-application-compact-block) var(--space-event-application-compact-inline)",
    borderRadius: "var(--radius-event-application-compact-field)",
    flex: 1,
  };
  const fieldLabelStyle: React.CSSProperties = {
    color: "var(--color-text-muted)",
    fontSize: "var(--text-event-application-label)",
    fontWeight: "var(--weight-extrabold)",
  };
  const panelStyle: React.CSSProperties = {
    background: "var(--color-surface-card)",
    border: "1px solid var(--color-border-soft)",
    borderRadius: "var(--radius-event-application-panel)",
    padding: "var(--space-event-application-panel)",
    display: "flex",
    flexDirection: "column",
    gap: "var(--space-sm)",
  };
  const formCardStyle: React.CSSProperties = {
    padding: "var(--space-event-application-group)",
    background: "var(--color-surface-subtle)",
    border: "1px solid var(--color-border-soft)",
    borderRadius: "var(--radius-event-application-group)",
    display: "grid",
    gap: "var(--space-sm)",
  };
  const textareaStyle = (minHeight: string): React.CSSProperties => ({
    ...input,
    minHeight,
    resize: "vertical",
  });

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
  const eventTimeMinutes = useMemo(() => Array.from({ length: 6 }, (_, index) => pad2(index * 10)), []);
  const deadlineMinutes = useMemo(() => getMinuteOptions(), []);
  const deadlineYears = useMemo(() => {
    const years = Array.from({ length: 5 }, (_, index) => String(new Date().getFullYear() + index));
    if (adminDraft.application_deadline_y && !years.includes(adminDraft.application_deadline_y)) years.unshift(adminDraft.application_deadline_y);
    return years;
  }, [adminDraft.application_deadline_y]);
  const deadlineDays = useMemo(() => {
    const count = getDaysInMonth(adminDraft.application_deadline_y, adminDraft.application_deadline_m);
    return Array.from({ length: count }, (_, index) => pad2(index + 1));
  }, [adminDraft.application_deadline_m, adminDraft.application_deadline_y]);
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
  const renderedEventContent = post?.content || "";
  const bannerImageCandidates = useMemo(() => getThumbnailCandidates(post?.content || "", adminDraft.image_url), [adminDraft.image_url, post?.content]);
  const displayLocation = useMemo(() => formatStructuredLocation(post?.location, ""), [post?.location]);
  const capacity = post?.capacity ?? null;
  const remaining = post ? getEventRemaining(post, acceptedCount) : null;
  const effectiveEventStatus = post ? getEffectiveEventStatus(post, acceptedCount) : post?.event_status ?? "";
  const statusCfg = EVENT_STATUS_CONFIG[effectiveEventStatus ?? ""] ?? null;
  const isApplicationOpen = post ? isEventApplicationOpen(post, acceptedCount) : false;
  const canCancelApplication = application?.status === "pending" || application?.status === "accepted";

  const syncAdminDraft = (nextPost: Post) => {
    const nextConfig = mergeEventFormConfig(nextPost.event_form_config);
    const dateParts = parseEventDateParts(nextPost.event_date || "");
    const deadlineParts = parseDateTimeParts(nextPost.application_deadline);
    const locationParts = parseStructuredLocation(nextPost.location);
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
      application_deadline_y: deadlineParts.year,
      application_deadline_m: deadlineParts.month,
      application_deadline_d: deadlineParts.day,
      application_deadline_h: deadlineParts.hour,
      application_deadline_minute: deadlineParts.minute,
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
          supabase.from("event_applications").select("*").eq("post_id", id).eq("user_id", uid).in("status", ["pending", "accepted"]).maybeSingle(),
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
    if (!post) return;
    if (!isApplicationOpen) return alert(effectiveEventStatus === "접수예정" ? "아직 접수 시작 전입니다." : "마감된 행사입니다.");
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
      const nextApplicationDeadline = composeLocalDateTimeIso(
        adminDraft.application_deadline_y,
        adminDraft.application_deadline_m,
        adminDraft.application_deadline_d,
        adminDraft.application_deadline_h,
        adminDraft.application_deadline_minute,
      );
      const nextLocation = composeStructuredLocation(adminDraft.locationName, adminDraft.locationAddress);
      const { data: countsData } = await supabase.rpc("get_event_application_counts");
      const latestAcceptedCount = ((countsData as { post_id: string; accepted_count: number }[] | null) ?? [])
        .find(row => row.post_id === post.id)?.accepted_count ?? acceptedCount;
      const nextRemaining = nextCapacity == null ? null : Math.max(nextCapacity - latestAcceptedCount, 0);
      const nextEventStatus = getEffectiveEventStatus({
        event_status: adminDraft.event_status,
        capacity: nextCapacity,
        slots_remaining: nextRemaining,
        application_deadline: nextApplicationDeadline,
      }, latestAcceptedCount);
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
          application_deadline: nextApplicationDeadline,
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

  if (loading) return <PageShell title="행사 신청"><p style={{ textAlign: "center", padding: "var(--space-event-application-loading)" }}>불러오는 중입니다.</p></PageShell>;
  if (!post) return <PageShell title="행사 신청"><p style={{ textAlign: "center", padding: "var(--space-event-application-loading)" }}>행사를 찾을 수 없습니다.</p></PageShell>;

  return (
    <PageShell title="행사 신청" subtitle={post.title} accentColor="var(--color-accent-green)">
      <div style={{ maxWidth: "var(--container-event-application-max)", margin: "0 auto", paddingBottom: "var(--space-event-application-page-bottom)" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-event-application-page-gap)" }}>
          <button type="button" onClick={() => navigate("/events")} style={getBackLinkStyle()}>
            ← 목록으로 돌아가기
          </button>
          <section>
            <div style={{ background: "var(--color-surface-card)", border: "1px solid var(--color-border-soft)", borderRadius: "var(--radius-event-application-card)", overflow: "hidden" }}>
              <div style={{ height: "var(--size-event-application-cover-height)", background: "var(--color-bg-elevated)" }}>
                {representativeImage ? (
                  <img src={representativeImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                ) : (
                  <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)" }}>
                    대표이미지 없음
                  </div>
                )}
              </div>
              <div style={{ padding: "var(--space-event-application-card)", display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
                <div style={{ display: "flex", gap: "var(--space-xs)", flexWrap: "wrap" }}>
                  {statusCfg && <span style={getStatusPillStyle(statusCfg.color, isDark)}>{statusCfg.label}</span>}
                  {capacity != null && <span style={getMutedLabelStyle(isDark)}>{acceptedCount}/{capacity}명 수락</span>}
                </div>
                <h2 style={{ margin: 0, color: "var(--color-text-primary)", fontSize: "var(--text-event-application-title)", fontWeight: "var(--weight-black)", lineHeight: "var(--leading-event-application-title)" }}>{post.title}</h2>
                <div style={{ display: "grid", gap: "var(--space-event-application-compact-inline)", color: "var(--color-text-muted)", fontSize: "var(--text-event-application-body)" }}>
                  {post.event_date && <span style={{ display: "flex", gap: "var(--space-xs)", alignItems: "center" }}><CalendarDays size="var(--size-event-application-icon-md)" />{post.event_date}</span>}
                  {post.application_deadline && <span style={{ display: "flex", gap: "var(--space-xs)", alignItems: "center" }}><Ban size="var(--size-event-application-icon-md)" />신청 마감 {formatLocalDateTime(post.application_deadline)}</span>}
                  {displayLocation && <span style={{ display: "flex", gap: "var(--space-xs)", alignItems: "center" }}><MapPin size="var(--size-event-application-icon-md)" />{displayLocation}</span>}
                  {remaining != null && <span style={{ display: "flex", gap: "var(--space-xs)", alignItems: "center" }}><Users size="var(--size-event-application-icon-md)" />잔여 {remaining}석</span>}
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
            <section style={panelStyle}>
              <strong style={{ color: "var(--color-text-primary)" }}>관리자 편집</strong>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
                <div style={adminGroupStyle}>
                  <strong style={adminGroupTitleStyle}>행사 기본 정보</strong>
                  <input style={input} value={adminDraft.title} onChange={e => setAdminDraft(p => ({ ...p, title: e.target.value }))} placeholder="행사 제목" />
                  <div className="grid grid-cols-1 sm:grid-cols-2" style={{ alignItems: "start", gap: "var(--space-event-application-grid-gap)" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-xs)" }}>
                      <span style={fieldLabelStyle}>일시</span>
                      <div className="grid grid-cols-3" style={{ gap: "var(--space-event-application-grid-gap-tight)" }}>
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
                      <div className="grid grid-cols-2" style={{ gap: "var(--space-event-application-grid-gap-tight)" }}>
                        <select style={input} value={adminDraft.event_time_h} onChange={e => setAdminDraft(p => ({ ...p, event_time_h: e.target.value }))}>
                          <option value="">시</option>
                          {timeHours.map(hour => <option key={hour} value={hour}>{hour}시</option>)}
                        </select>
                        <select style={input} value={adminDraft.event_time_m} onChange={e => setAdminDraft(p => ({ ...p, event_time_m: e.target.value }))}>
                          {eventTimeMinutes.map(minute => <option key={minute} value={minute}>{minute}분</option>)}
                        </select>
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-xs)" }}>
                      <span style={fieldLabelStyle}>장소</span>
                      <input style={input} value={adminDraft.locationName} onChange={e => setAdminDraft(p => ({ ...p, locationName: e.target.value }))} placeholder="장소 이름" />
                      <input style={input} value={adminDraft.locationAddress} onChange={e => setAdminDraft(p => ({ ...p, locationAddress: e.target.value }))} placeholder="주소" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: "var(--space-event-application-grid-gap)" }}>
                    <select style={input} value={adminDraft.event_status} onChange={e => setAdminDraft(p => ({ ...p, event_status: e.target.value }))}>
                      <option value="접수예정">접수예정</option>
                      <option value="접수중">접수중</option>
                      <option value="마감임박">마감임박</option>
                      <option value="마감">마감</option>
                    </select>
                    <input style={input} type="number" min={0} value={adminDraft.capacity} onChange={e => setAdminDraft(p => ({ ...p, capacity: e.target.value }))} placeholder="정원" />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-xs)" }}>
                    <span style={fieldLabelStyle}>신청 마감일시 (선택)</span>
                    <div className="grid grid-cols-2 sm:grid-cols-5" style={{ gap: "var(--space-event-application-grid-gap-tight)" }}>
                      <select style={input} value={adminDraft.application_deadline_y} onChange={e => setAdminDraft(p => ({ ...p, application_deadline_y: e.target.value, application_deadline_d: Number(p.application_deadline_d) > getDaysInMonth(e.target.value, p.application_deadline_m) ? "" : p.application_deadline_d }))}>
                        <option value="">연도</option>
                        {deadlineYears.map(year => <option key={year} value={year}>{year}</option>)}
                      </select>
                      <select style={input} value={adminDraft.application_deadline_m} onChange={e => setAdminDraft(p => ({ ...p, application_deadline_m: e.target.value, application_deadline_d: Number(p.application_deadline_d) > getDaysInMonth(p.application_deadline_y, e.target.value) ? "" : p.application_deadline_d }))}>
                        <option value="">월</option>
                        {dateMonths.map(month => <option key={month} value={month}>{month}</option>)}
                      </select>
                      <select style={input} value={adminDraft.application_deadline_d} onChange={e => setAdminDraft(p => ({ ...p, application_deadline_d: e.target.value }))}>
                        <option value="">일</option>
                        {deadlineDays.map(day => <option key={day} value={day}>{day}</option>)}
                      </select>
                      <select style={input} value={adminDraft.application_deadline_h} onChange={e => setAdminDraft(p => ({ ...p, application_deadline_h: e.target.value }))}>
                        <option value="">시</option>
                        {timeHours.map(hour => <option key={hour} value={hour}>{hour}시</option>)}
                      </select>
                      <select style={input} value={adminDraft.application_deadline_minute} onChange={e => setAdminDraft(p => ({ ...p, application_deadline_minute: e.target.value }))}>
                        {deadlineMinutes.map(minute => <option key={minute} value={minute}>{minute}분</option>)}
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAdminDraft(p => ({ ...p, application_deadline_y: "", application_deadline_m: "", application_deadline_d: "", application_deadline_h: "", application_deadline_minute: "00" }))}
                      style={{ alignSelf: "flex-start", border: "none", background: "transparent", color: "var(--color-text-muted)", fontSize: "var(--text-event-application-label)", fontWeight: "var(--weight-extrabold)", cursor: "pointer", padding: 0 }}
                    >
                      마감일시 비우기
                    </button>
                  </div>
                  <textarea style={textareaStyle("var(--size-event-application-textarea-md)")} value={adminDraft.content} onChange={e => setAdminDraft(p => ({ ...p, content: e.target.value }))} placeholder="행사 설명" />
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
                  <textarea style={textareaStyle("var(--size-event-application-textarea-sm)")} value={adminDraft.intro} onChange={e => setAdminDraft(p => ({ ...p, intro: e.target.value }))} placeholder="폼 안내 문구" />
                </div>
                <div style={adminGroupStyle}>
                  <strong style={adminGroupTitleStyle}>1. 참가자 기본 정보</strong>
                  <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: "var(--space-event-application-grid-gap)" }}>
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
                  <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-xs)" }}>
                    {interestOptionItems.map((option, index) => {
                      const isEditingOption = editingInterestIndex === index;
                      return (
                        <div key={index} style={compactRowStyle}>
                          {isEditingOption ? (
                            <input
                              style={compactInputStyle}
                              value={option}
                              onChange={e => updateInterestOption(index, e.target.value)}
                              placeholder="선택지 이름"
                            />
                          ) : (
                            <span style={{ flex: 1, color: option ? "var(--color-text-primary)" : "var(--color-text-muted)", fontSize: "var(--text-event-application-body)", fontWeight: "var(--weight-bold)" }}>
                              {option || "빈 선택지"}
                            </span>
                          )}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingInterestIndex(isEditingOption ? null : index)}
                            style={{ minWidth: "var(--size-event-application-edit-button-min)", background: "var(--color-field-bg)" }}
                          >
                            {isEditingOption ? "완료" : "수정"}
                          </Button>
                          <button type="button" aria-label="관심 분야 선택지 삭제" onClick={() => removeInterestOption(index)} style={roundDeleteButtonStyle}>
                            <X size="var(--size-event-application-icon-sm)" />
                          </button>
                        </div>
                      );
                    })}
                    <div style={compactRowStyle}>
                      <input
                        style={compactInputStyle}
                        value={newInterestOption}
                        onChange={e => setNewInterestOption(e.target.value)}
                        placeholder="새 관심 분야 선택지"
                      />
                      <button type="button" aria-label="관심 분야 선택지 추가" onClick={addInterestOption} style={roundAddButtonStyle}>
                        <Plus size="var(--size-event-application-icon-md)" />
                      </button>
                    </div>
                  </div>
                </div>
                <div style={adminGroupStyle}>
                  <strong style={adminGroupTitleStyle}>3. 사전 질문</strong>
                  <input style={input} value={adminDraft.speakerQuestionLabel} onChange={e => setAdminDraft(p => ({ ...p, speakerQuestionLabel: e.target.value }))} placeholder="사전 질문 문구" />
                </div>
                <div style={adminGroupStyle}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-event-application-compact-inline)" }}>
                    <strong style={adminGroupTitleStyle}>4. 추가 질문</strong>
                    {adminDraft.customQuestions.length === 0 && (
                      <div style={{ ...compactRowStyle, justifyContent: "center" }}>
                        <button type="button" aria-label="첫 번째 추가 질문 추가" onClick={() => insertCustomQuestion(0)} style={roundAddButtonStyle}>
                          <Plus size="var(--size-event-application-icon-md)" />
                        </button>
                      </div>
                    )}
                    {adminDraft.customQuestions.length > 0 && (
                      <div style={{ display: "flex", justifyContent: "center" }}>
                        <button type="button" aria-label="첫 번째 추가 질문 추가" onClick={() => insertCustomQuestion(0)} style={roundAddButtonStyle}>
                        <Plus size="var(--size-event-application-icon-md)" />
                      </button>
                      </div>
                    )}
                    {adminDraft.customQuestions.map((question, index) => (
                      <div key={question.id} style={{ display: "flex", flexDirection: "column", gap: "var(--space-event-application-compact-inline)" }}>
                        <div style={{ position: "relative", padding: "var(--space-event-application-question-card-block) var(--space-event-application-question-action) var(--space-event-application-question-card-block) var(--space-event-application-question-card-block)", borderRadius: "var(--radius-event-application-row)", border: "1px solid var(--color-border-soft)", background: "var(--color-surface-subtle)", display: "grid", gap: "var(--space-event-application-compact-inline)" }}>
                          <button type="button" aria-label="폼 질문 삭제" onClick={() => removeCustomQuestion(question.id)} style={{ position: "absolute", top: "var(--space-event-application-question-action-offset)", right: "var(--space-event-application-question-action-offset)", width: "var(--size-event-application-action-sm)", height: "var(--size-event-application-action-sm)", borderRadius: "50%", border: "none", background: "var(--color-danger-soft-bg)", color: "var(--color-brand-red)", display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                            <X size="var(--size-event-application-icon-sm)" />
                          </button>
                          <input style={input} value={question.label} onChange={e => updateCustomQuestion(question.id, { label: e.target.value })} placeholder="질문 문구" />
                          <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: "var(--space-event-application-grid-gap)" }}>
                            <select style={input} value={question.type} onChange={e => updateCustomQuestion(question.id, { type: e.target.value as EventCustomQuestion["type"] })}>
                              <option value="short_text">짧은 답변</option>
                              <option value="long_text">긴 답변</option>
                            </select>
                            <label style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)", color: "var(--color-text-primary)", fontSize: "var(--text-event-application-label)", fontWeight: "var(--weight-bold)" }}>
                              <input type="checkbox" checked={question.required} onChange={e => updateCustomQuestion(question.id, { required: e.target.checked })} />
                              필수 질문
                            </label>
                          </div>
                        </div>
                        <div style={{ display: "flex", justifyContent: "center" }}>
                          <button type="button" aria-label={`${index + 2}번째 추가 질문 추가`} onClick={() => insertCustomQuestion(index + 1)} style={roundAddButtonStyle}>
                            <Plus size="var(--size-event-application-icon-md)" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={adminGroupStyle}>
                  <strong style={adminGroupTitleStyle}>5. 개인정보 동의 및 완료 안내</strong>
                  <textarea style={textareaStyle("var(--size-event-application-textarea-xs)")} value={adminDraft.privacyConsentLabel} onChange={e => setAdminDraft(p => ({ ...p, privacyConsentLabel: e.target.value }))} placeholder="개인정보 동의 문구" />
                  <input style={input} value={adminDraft.completionTitle} onChange={e => setAdminDraft(p => ({ ...p, completionTitle: e.target.value }))} placeholder="완료 제목" />
                  <textarea style={textareaStyle("var(--size-event-application-textarea-xs)")} value={adminDraft.completionMessage} onChange={e => setAdminDraft(p => ({ ...p, completionMessage: e.target.value }))} placeholder="완료 안내" />
                </div>
                  <div style={{ display: "flex", gap: "var(--space-event-application-compact-inline)", flexWrap: "wrap" }}>
                    <Button type="button" onClick={handleAdminSave} disabled={submitting}>
                      <Save size="var(--size-event-application-icon-md)" />
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
            <section style={{ position: "relative", background: "var(--color-surface-card)", border: "1px solid var(--color-border-soft)", borderRadius: "var(--radius-event-application-card)", padding: "var(--space-event-application-form-card)" }}>
              {isAdmin && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAdminEditing(true)}
                  style={{ position: "absolute", top: "var(--space-event-application-admin-offset)", right: "var(--space-event-application-admin-offset)", background: "var(--color-field-bg)" }}
                >
                  편집
                </Button>
              )}
              {saved || application ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "var(--space-event-application-centered-gap)", padding: "var(--space-event-application-centered-y) 0" }}>
                  <CheckCircle2 size="var(--size-event-application-action-lg)" color="var(--color-accent-green)" />
                  <h3 style={{ margin: 0, color: "var(--color-text-primary)", fontSize: "var(--text-event-application-heading)", fontWeight: "var(--weight-black)" }}>
                    {application?.status === "cancelled" ? "신청이 취소되었습니다." : activeConfig.completionTitle}
                  </h3>
                  <p style={{ margin: 0, color: "var(--color-text-muted)", lineHeight: "var(--leading-event-application-message)" }}>
                    {application?.status === "cancelled" ? "재참가가 필요하면 운영자에게 문의해주세요." : activeConfig.completionMessage}
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-event-application-compact-inline)", width: "100%", maxWidth: "320px" }}>
                    {application?.status === "cancelled" && (
                      <div style={{ display: "flex", gap: "var(--space-xs)", flexWrap: "wrap", justifyContent: "center" }}>
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
                      <Button type="button" variant="destructive" onClick={handleCancelApplication} disabled={submitting} style={{ width: "100%" }}>
                        <Ban size="var(--size-event-application-icon-md)" />
                        {submitting ? "취소 중..." : "신청 취소"}
                      </Button>
                    )}
                    <Button asChild variant="outline" style={{ width: "100%" }}>
                      <Link to="/mypage">내 신청 내역 보기</Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-event-application-section-gap)" }}>
                  <div style={{ paddingRight: isAdmin ? "var(--space-event-application-admin-inline-reserve)" : 0 }}>
                    <h3 style={{ margin: "0 0 var(--space-xs)", color: "var(--color-text-primary)", fontSize: "var(--text-event-application-heading)", fontWeight: "var(--weight-black)" }}>참가 신청</h3>
                    <p style={{ margin: 0, color: "var(--color-text-muted)", lineHeight: "var(--leading-event-application-body)" }}>{activeConfig.intro}</p>
                  </div>

                  <div style={formCardStyle}>
                    <strong style={{ color: "var(--color-text-primary)" }}>1. 참가자 기본 정보</strong>
                    <input style={input} value={form.company_tech} onChange={e => updateField("company_tech", e.target.value)} placeholder={requiredLabel(activeConfig.companyTechLabel)} />
                    <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: "var(--space-event-application-grid-gap)" }}>
                      <input style={input} value={form.applicant_name} onChange={e => updateField("applicant_name", e.target.value)} placeholder={requiredLabel(activeConfig.nameLabel)} />
                      <input style={input} value={form.position} onChange={e => updateField("position", e.target.value)} placeholder={requiredLabel(activeConfig.positionLabel)} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: "var(--space-event-application-grid-gap)" }}>
                      <input style={input} value={form.email} onChange={e => updateField("email", e.target.value)} placeholder={requiredLabel(activeConfig.emailLabel)} />
                      <input style={input} value={form.phone} onChange={e => updateField("phone", e.target.value)} placeholder={activeConfig.phoneLabel} />
                    </div>
                  </div>

                  <div style={formCardStyle}>
                    <strong style={{ color: "var(--color-text-primary)" }}>2. 관심 분야 & 참여 목적</strong>
                    <textarea style={textareaStyle("var(--size-event-application-textarea-xl)")} value={form.expectation} onChange={e => updateField("expectation", e.target.value)} placeholder={requiredLabel(activeConfig.expectationLabel)} />
                    <p style={{ margin: 0, color: "var(--color-text-muted)", fontSize: "var(--text-event-application-label)", fontWeight: "var(--weight-bold)" }}>{requiredLabel(activeConfig.interestsLabel)}</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-xs)" }}>
                      {activeConfig.interestOptions.map(option => (
                        <label key={option} style={{ display: "flex", gap: "var(--space-event-application-compact-inline)", alignItems: "center", color: "var(--color-text-primary)", fontSize: "var(--text-event-application-body)" }}>
                          <input type="checkbox" checked={form.interests.includes(option)} onChange={() => toggleInterest(option)} />
                          {option}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div style={formCardStyle}>
                    <strong style={{ color: "var(--color-text-primary)" }}>3. 사전 질문</strong>
                    <textarea style={textareaStyle("var(--size-event-application-textarea-lg)")} value={form.speaker_question} onChange={e => updateField("speaker_question", e.target.value)} placeholder={activeConfig.speakerQuestionLabel} />
                  </div>

                  {activeConfig.customQuestions.map((question, index) => (
                    <div key={question.id} style={formCardStyle}>
                      <strong style={{ color: "var(--color-text-primary)" }}>{index + 4}. {question.label}{question.required ? " *" : ""}</strong>
                      {question.type === "long_text" ? (
                        <textarea style={textareaStyle("var(--size-event-application-textarea-lg)")} value={form.custom_answers[question.id] ?? ""} onChange={e => updateCustomAnswer(question.id, e.target.value)} placeholder={question.label} />
                      ) : (
                        <input style={input} value={form.custom_answers[question.id] ?? ""} onChange={e => updateCustomAnswer(question.id, e.target.value)} placeholder={question.label} />
                      )}
                    </div>
                  ))}

                  <div style={{ ...formCardStyle, display: "block" }}>
                    <label style={{ display: "flex", gap: "var(--space-event-application-compact-inline)", alignItems: "flex-start", color: "var(--color-text-primary)", fontSize: "var(--text-event-application-body)", lineHeight: "var(--leading-normal)" }}>
                      <input type="checkbox" checked={form.privacy_consent} onChange={e => updateField("privacy_consent", e.target.checked)} style={{ marginTop: "var(--space-2xs)" }} />
                      {requiredLabel(activeConfig.privacyConsentLabel)}
                    </label>
                  </div>

                  <Button type="button" size="lg" onClick={handleSubmit} disabled={submitting || !isApplicationOpen} className="w-full bg-[var(--color-accent-green)] hover:brightness-110">
                    <Send size="var(--size-event-application-icon-md)" />
                    {!isApplicationOpen ? (effectiveEventStatus === "접수예정" ? "접수 예정" : "신청 마감") : submitting ? "제출 중..." : "신청 제출"}
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
