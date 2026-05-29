import type { EventCustomQuestion, EventFormConfig, Post } from "../lib/types";

export const EVENT_LOW_REMAINING_RATIO = 0.2;
export const EVENT_DEADLINE_SOON_DAYS = 3;

export const DEFAULT_EVENT_FORM_CONFIG: Required<EventFormConfig> = {
  intro: "행사 운영과 안내를 위해 아래 정보를 입력해주세요.",
  companyTechLabel: "기업명 / 기술분야",
  nameLabel: "성함",
  positionLabel: "직책",
  emailLabel: "이메일 주소 (참가 링크 전달용)",
  phoneLabel: "연락처",
  expectationLabel: "이번 세미나를 통해 얻고 싶은 정보나 기대하는 부분은 무엇인가요?",
  interestsLabel: "관심 있는 주제를 모두 선택해주세요.",
  interestOptions: [
    "말레이시아 현지 스타트업 생태계",
    "아세안 IT 산업 및 파트너십 기회",
    "해외 창업 과정 및 문화 차이",
    "투자·협력 기회 탐색",
  ],
  speakerQuestionLabel: "강연자에게 미리 전달하고 싶은 질문이 있으신가요?",
  privacyConsentLabel: "본 신청은 행사 운영 및 안내 목적에 한하여 활용되며, 행사 종료 후 파기됩니다. 이에 동의합니다.",
  completionTitle: "행사 참가가 확정되었습니다.",
  completionMessage: "행사 안내는 등록된 이메일로 공유드리겠습니다.",
  customQuestions: [],
};

export const normalizeEventCustomQuestions = (questions?: EventCustomQuestion[] | null): EventCustomQuestion[] =>
  (Array.isArray(questions) ? questions : [])
    .map((question, index): EventCustomQuestion => ({
      id: question.id || `question-${index + 1}`,
      label: question.label?.trim() || "새 질문",
      type: question.type === "long_text" ? "long_text" : "short_text",
      required: Boolean(question.required),
    }))
    .filter(question => question.label.trim().length > 0);

const normalizeCompletionTitle = (title: string) =>
  ["신청이 접수되었습니다.", "참가가 확정되었습니다.", "행사 참가 신청이 접수되었습니다."].includes(title.trim())
    ? DEFAULT_EVENT_FORM_CONFIG.completionTitle
    : title;

const normalizeCompletionMessage = (message: string) =>
  message.includes("등록된 연락처") || message.trim() === "관리자 승인 후 확정 안내를 등록된 이메일로 보내드리겠습니다."
    ? DEFAULT_EVENT_FORM_CONFIG.completionMessage
    : message;

export const mergeEventFormConfig = (config?: EventFormConfig | null): Required<EventFormConfig> => {
  const merged = {
    ...DEFAULT_EVENT_FORM_CONFIG,
    ...(config ?? {}),
    interestOptions:
      config?.interestOptions && config.interestOptions.length > 0
        ? config.interestOptions
        : DEFAULT_EVENT_FORM_CONFIG.interestOptions,
    customQuestions: normalizeEventCustomQuestions(config?.customQuestions),
  };

  return {
    ...merged,
    completionTitle: normalizeCompletionTitle(merged.completionTitle),
    completionMessage: normalizeCompletionMessage(merged.completionMessage),
  };
};

export const cleanEventFormConfig = (config?: EventFormConfig | null): EventFormConfig => {
  const merged = mergeEventFormConfig(config);

  return {
    intro: merged.intro.trim(),
    companyTechLabel: merged.companyTechLabel.trim(),
    nameLabel: merged.nameLabel.trim(),
    positionLabel: merged.positionLabel.trim(),
    emailLabel: merged.emailLabel.trim(),
    phoneLabel: merged.phoneLabel.trim(),
    expectationLabel: merged.expectationLabel.trim(),
    interestsLabel: merged.interestsLabel.trim(),
    interestOptions: merged.interestOptions.map(item => item.trim()).filter(Boolean),
    speakerQuestionLabel: merged.speakerQuestionLabel.trim(),
    privacyConsentLabel: merged.privacyConsentLabel.trim(),
    completionTitle: merged.completionTitle.trim(),
    completionMessage: merged.completionMessage.trim(),
    customQuestions: normalizeEventCustomQuestions(merged.customQuestions)
      .map(question => ({ ...question, label: question.label.trim() }))
      .filter(question => question.label.length > 0),
  };
};

export const EVENT_APPLICATION_STATUS = {
  pending: { label: "승인 대기", color: "var(--color-brand-yellow)" },
  accepted: { label: "확정", color: "var(--color-accent-green)" },
  rejected: { label: "거절", color: "var(--color-brand-red)" },
  cancelled_by_user: { label: "취소(본인)", color: "var(--color-neutral)" },
  cancelled_by_admin: { label: "취소(관리자)", color: "var(--color-neutral)" },
} as const;

export const EVENT_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  "접수예정": { label: "접수예정", color: "var(--color-accent-blue)", bg: "var(--color-accent-blue-soft-bg)" },
  "접수중": { label: "접수중", color: "var(--color-success)", bg: "var(--color-success-soft-bg)" },
  "마감임박": { label: "마감임박", color: "var(--color-warning)", bg: "var(--color-warning-soft-bg)" },
  "마감": { label: "마감", color: "var(--color-disabled-bg)", bg: "var(--color-neutral-soft-bg)" },
};

export const getEventRemaining = (post: Pick<Post, "capacity" | "slots_remaining">, acceptedCount?: number | null) => {
  if (post.capacity != null && acceptedCount != null) return Math.max(post.capacity - acceptedCount, 0);
  return post.slots_remaining ?? null;
};

const getDeadlineTime = (deadline?: string | null) => {
  if (!deadline) return null;
  const time = new Date(deadline).getTime();
  return Number.isNaN(time) ? null : time;
};

export const isEventDeadlinePassed = (deadline?: string | null, now = new Date()) => {
  const deadlineTime = getDeadlineTime(deadline);
  return deadlineTime != null && deadlineTime <= now.getTime();
};

export const isEventDeadlineSoon = (deadline?: string | null, now = new Date()) => {
  const deadlineTime = getDeadlineTime(deadline);
  if (deadlineTime == null || deadlineTime <= now.getTime()) return false;

  const soonTime = now.getTime() + EVENT_DEADLINE_SOON_DAYS * 24 * 60 * 60 * 1000;
  return deadlineTime <= soonTime;
};

export const getEffectiveEventStatus = (
  post: Pick<Post, "event_status" | "capacity" | "slots_remaining" | "application_deadline">,
  acceptedCount?: number | null,
  now = new Date(),
) => {
  const currentStatus = post.event_status || "접수예정";
  const remaining = getEventRemaining(post, acceptedCount);

  if (isEventDeadlinePassed(post.application_deadline, now)) return "마감";
  if (remaining != null && remaining <= 0) return "마감";
  if (currentStatus === "접수예정" || currentStatus === "마감") return currentStatus;
  if (isEventDeadlineSoon(post.application_deadline, now)) return "마감임박";

  if (
    post.capacity != null &&
    post.capacity > 0 &&
    remaining != null &&
    remaining / post.capacity <= EVENT_LOW_REMAINING_RATIO
  ) {
    return "마감임박";
  }

  if (currentStatus === "접수중" || currentStatus === "마감임박") return "접수중";
  return currentStatus;
};

export const isEventApplicationOpen = (
  post: Pick<Post, "event_status" | "capacity" | "slots_remaining" | "application_deadline">,
  acceptedCount?: number | null,
) => {
  const status = getEffectiveEventStatus(post, acceptedCount);
  return status === "접수중" || status === "마감임박";
};
