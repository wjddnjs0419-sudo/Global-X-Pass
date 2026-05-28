import { useEffect, useMemo, useState } from "react";
import type React from "react";
import { useNavigate, useParams } from "react-router";
import { Ban, CalendarDays, MapPin, Send, Users } from "lucide-react";
import { PageShell } from "../components/PageShell";
import { ProgramConfirmationCard } from "../components/ProgramConfirmationCard";
import { Button } from "../components/ui/button";
import { getBackLinkStyle, getMutedLabelStyle, getStatusPillStyle } from "../components/contentListStyles";
import { CONTACT_EMAIL } from "../constants/contact";
import { useTheme } from "../ThemeContext";
import { supabase } from "../../lib/supabaseClient";
import { useAdmin } from "../../hooks/useAdmin";
import type { EventApplication, Post, Profile } from "../../lib/types";
import { sanitizeRichHtml } from "../../utils/htmlSecurity";
import { EVENT_STATUS_CONFIG, getEffectiveEventStatus, getEventRemaining, isEventApplicationOpen, mergeEventFormConfig } from "../../utils/eventApplication";
import {
  EVENT_COVER_THUMBNAIL_ASPECT,
  getThumbnailImageStyle,
  resolvePostThumbnail,
  toCssAspectRatio,
} from "../../utils/postThumbnail";
import { formatEventDate, formatEventLocation, formatLocalDateTime } from "../../utils/scheduleFields";

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

const requiredLabel = (label: string) => `${label} *`;

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
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [acceptedCount, setAcceptedCount] = useState(0);

  const input = fieldStyle("var(--color-field-bg)", "var(--color-border-soft)", "var(--color-text-primary)");
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
  const representativeThumbnail = useMemo(() => resolvePostThumbnail(post ?? {}), [post]);
  const representativeImage = representativeThumbnail.url;
  const renderedEventContent = post?.content || "";
  const displayDate = useMemo(() => formatEventDate(post, "일시 미정"), [post]);
  const displayLocation = useMemo(() => formatEventLocation(post, "장소 미정"), [post]);
  const capacity = post?.capacity ?? null;
  const remaining = post ? getEventRemaining(post, acceptedCount) : null;
  const effectiveEventStatus = post ? getEffectiveEventStatus(post, acceptedCount) : post?.event_status ?? "";
  const statusCfg = EVENT_STATUS_CONFIG[effectiveEventStatus ?? ""] ?? null;
  const isApplicationOpen = post ? isEventApplicationOpen(post, acceptedCount) : false;
  const canCancelApplication = application?.status === "pending" || application?.status === "accepted";

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

  const handleSubmit = async () => {
    if (!post) return;
    if (!isApplicationOpen) return alert(effectiveEventStatus === "접수예정" ? "아직 접수 시작 전입니다." : "마감된 행사입니다.");
    if (!form.company_tech.trim() || !form.applicant_name.trim() || !form.position.trim() || !form.email.trim() || !form.expectation.trim()) {
      alert("필수 항목을 모두 입력해주세요.");
      return;
    }
    if (form.interests.length === 0) return alert("관심 주제를 하나 이상 선택해주세요.");
    const missingQuestion = config.customQuestions.find(question => question.required && !form.custom_answers[question.id]?.trim());
    if (missingQuestion) return alert(`필수 질문에 답변해주세요: ${missingQuestion.label}`);
    if (!form.privacy_consent) return alert("개인정보 수집 및 이용에 동의해주세요.");

    const answers = config.customQuestions.reduce<Record<string, string>>((acc, question) => {
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
        status: "accepted",
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
    setAcceptedCount(prev => prev + 1);
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
              <div
                style={{
                  position: "relative",
                  aspectRatio: toCssAspectRatio(EVENT_COVER_THUMBNAIL_ASPECT),
                  overflow: "hidden",
                  flexShrink: 0,
                  background: "var(--color-bg-elevated)",
                }}
              >
                {representativeImage ? (
                  <img src={representativeImage} alt="" style={getThumbnailImageStyle(representativeThumbnail.coverCrop ?? representativeThumbnail.crop)} />
                ) : (
                  <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)" }}>
                    대표이미지 없음
                  </div>
                )}
              </div>
              <div style={{ padding: "var(--space-event-application-card)", display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
                <div style={{ display: "flex", gap: "var(--space-xs)", flexWrap: "wrap" }}>
                  {statusCfg && <span style={getStatusPillStyle(statusCfg.color, isDark)}>{statusCfg.label}</span>}
                  {capacity != null && <span style={getMutedLabelStyle(isDark)}>{acceptedCount}/{capacity}명 확정</span>}
                </div>
                <h2 style={{ margin: 0, color: "var(--color-text-primary)", fontSize: "var(--text-event-application-title)", fontWeight: "var(--weight-black)", lineHeight: "var(--leading-event-application-title)" }}>{post.title}</h2>
                <div style={{ display: "grid", gap: "var(--space-event-application-compact-inline)", color: "var(--color-text-muted)", fontSize: "var(--text-event-application-body)" }}>
                  <span style={{ display: "flex", gap: "var(--space-xs)", alignItems: "center" }}><CalendarDays size={16} />{displayDate}</span>
                  {post.application_deadline && <span style={{ display: "flex", gap: "var(--space-xs)", alignItems: "center" }}><Ban size={16} />신청 마감 {formatLocalDateTime(post.application_deadline)}</span>}
                  <span style={{ display: "flex", gap: "var(--space-xs)", alignItems: "center" }}><MapPin size={16} />{displayLocation}</span>
                  {remaining != null && <span style={{ display: "flex", gap: "var(--space-xs)", alignItems: "center" }}><Users size={16} />잔여 {remaining}석</span>}
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

          <section style={{ position: "relative", background: "var(--color-surface-card)", border: "1px solid var(--color-border-soft)", borderRadius: "var(--radius-event-application-card)", padding: "var(--space-event-application-form-card)" }}>
              {isAdmin && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/admin?editPostId=${post.id}`)}
                  style={{ position: "absolute", top: "var(--space-event-application-admin-offset)", right: "var(--space-event-application-admin-offset)", background: "var(--color-field-bg)" }}
                >
                  게시물 편집
                </Button>
              )}
              {saved || application ? (
                <ProgramConfirmationCard
                  title={application?.status === "cancelled" ? "신청이 취소되었습니다." : config.completionTitle}
                  description={application?.status === "cancelled" ? "재참가가 필요하면 운영자에게 문의해주세요." : config.completionMessage}
                  actions={[
                    ...(application?.status === "cancelled"
                      ? [
                          { label: CONTACT_EMAIL, href: `mailto:${CONTACT_EMAIL}` },
                          { label: "문의 안내 보기", to: "/faq" },
                        ]
                      : []),
                    ...(canCancelApplication
                      ? [
                          {
                            label: "신청 취소",
                            loadingLabel: "취소 중...",
                            loading: submitting,
                            variant: "destructive" as const,
                            icon: <Ban size={16} />,
                            onClick: handleCancelApplication,
                          },
                        ]
                      : []),
                    { label: "내 신청 내역 보기", to: "/mypage" },
                  ]}
                />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-event-application-section-gap)" }}>
                  <div style={{ paddingRight: isAdmin ? "var(--space-event-application-admin-inline-reserve)" : 0 }}>
                    <h3 style={{ margin: "0 0 var(--space-xs)", color: "var(--color-text-primary)", fontSize: "var(--text-event-application-heading)", fontWeight: "var(--weight-black)" }}>참가 신청</h3>
                    <p style={{ margin: 0, color: "var(--color-text-muted)", lineHeight: "var(--leading-event-application-body)" }}>{config.intro}</p>
                  </div>

                  <div style={formCardStyle}>
                    <strong style={{ color: "var(--color-text-primary)" }}>1. 참가자 기본 정보</strong>
                    <input style={input} value={form.company_tech} onChange={e => updateField("company_tech", e.target.value)} placeholder={requiredLabel(config.companyTechLabel)} />
                    <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: "var(--space-event-application-grid-gap)" }}>
                      <input style={input} value={form.applicant_name} onChange={e => updateField("applicant_name", e.target.value)} placeholder={requiredLabel(config.nameLabel)} />
                      <input style={input} value={form.position} onChange={e => updateField("position", e.target.value)} placeholder={requiredLabel(config.positionLabel)} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: "var(--space-event-application-grid-gap)" }}>
                      <input style={input} value={form.email} onChange={e => updateField("email", e.target.value)} placeholder={requiredLabel(config.emailLabel)} />
                      <input style={input} value={form.phone} onChange={e => updateField("phone", e.target.value)} placeholder={config.phoneLabel} />
                    </div>
                  </div>

                  <div style={formCardStyle}>
                    <strong style={{ color: "var(--color-text-primary)" }}>2. 관심 분야 & 참여 목적</strong>
                    <textarea style={textareaStyle("var(--size-event-application-textarea-xl)")} value={form.expectation} onChange={e => updateField("expectation", e.target.value)} placeholder={requiredLabel(config.expectationLabel)} />
                    <p style={{ margin: 0, color: "var(--color-text-muted)", fontSize: "var(--text-event-application-label)", fontWeight: "var(--weight-bold)" }}>{requiredLabel(config.interestsLabel)}</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-xs)" }}>
                      {config.interestOptions.map(option => (
                        <label key={option} style={{ display: "flex", gap: "var(--space-event-application-compact-inline)", alignItems: "center", color: "var(--color-text-primary)", fontSize: "var(--text-event-application-body)" }}>
                          <input type="checkbox" checked={form.interests.includes(option)} onChange={() => toggleInterest(option)} />
                          {option}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div style={formCardStyle}>
                    <strong style={{ color: "var(--color-text-primary)" }}>3. 사전 질문</strong>
                    <textarea style={textareaStyle("var(--size-event-application-textarea-lg)")} value={form.speaker_question} onChange={e => updateField("speaker_question", e.target.value)} placeholder={config.speakerQuestionLabel} />
                  </div>

                  {config.customQuestions.map((question, index) => (
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
                      {requiredLabel(config.privacyConsentLabel)}
                    </label>
                  </div>

                  <Button type="button" size="lg" onClick={handleSubmit} disabled={submitting || !isApplicationOpen} className="w-full bg-[var(--color-accent-green)] hover:brightness-110">
                    <Send size={16} />
                    {!isApplicationOpen ? (effectiveEventStatus === "접수예정" ? "접수 예정" : "신청 마감") : submitting ? "제출 중..." : "신청 제출"}
                  </Button>
                </div>
              )}
          </section>
        </div>
      </div>
    </PageShell>
  );
}
