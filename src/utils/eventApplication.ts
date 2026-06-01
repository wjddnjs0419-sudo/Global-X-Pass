import { EVENT_QUESTION_TYPES } from "../lib/types";
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

const isChoiceType = (type: EventCustomQuestion["type"]) =>
  type === "single_choice" || type === "multi_choice";

const normalizeQuestionType = (type: unknown): EventCustomQuestion["type"] =>
  (EVENT_QUESTION_TYPES as readonly string[]).includes(type as string)
    ? (type as EventCustomQuestion["type"])
    : "short_text";

export const normalizeEventCustomQuestions = (questions?: EventCustomQuestion[] | null): EventCustomQuestion[] =>
  (Array.isArray(questions) ? questions : [])
    .filter(question => (question.label?.trim() ?? "").length > 0)
    .map((question, index): EventCustomQuestion => {
      const type = normalizeQuestionType(question.type);
      const base: EventCustomQuestion = {
        id: question.id || `question-${index + 1}`,
        label: question.label.trim(),
        type,
        required: Boolean(question.required),
      };
      const category = question.category?.trim();
      if (category) base.category = category;
      if (isChoiceType(type)) {
        base.options = Array.from(
          new Set(
            (Array.isArray(question.options) ? question.options : [])
              .map(option => option.trim())
              .filter(Boolean),
          ),
        );
      }
      return base;
    });

const normalizeCompletionTitle = (title: string) =>
  ["신청이 접수되었습니다.", "참가가 확정되었습니다.", "행사 참가 신청이 접수되었습니다."].includes(title.trim())
    ? DEFAULT_EVENT_FORM_CONFIG.completionTitle
    : title;

const normalizeCompletionMessage = (message: string) =>
  message.includes("등록된 연락처") || message.trim() === "관리자 승인 후 확정 안내를 등록된 이메일로 보내드리겠습니다."
    ? DEFAULT_EVENT_FORM_CONFIG.completionMessage
    : message;

const seedLegacyQuestions = (config: Required<EventFormConfig>): EventCustomQuestion[] => [
  { id: "legacy_expectation", label: config.expectationLabel, category: "참여 목적", type: "long_text", required: true },
  { id: "legacy_interests", label: config.interestsLabel, category: "관심 분야", type: "multi_choice", options: config.interestOptions, required: true },
  { id: "legacy_speaker", label: config.speakerQuestionLabel, category: "사전 질문", type: "long_text", required: false },
];

export const mergeEventFormConfig = (config?: EventFormConfig | null): Required<EventFormConfig> => {
  const base = {
    ...DEFAULT_EVENT_FORM_CONFIG,
    ...(config ?? {}),
    interestOptions:
      config?.interestOptions && config.interestOptions.length > 0
        ? config.interestOptions
        : DEFAULT_EVENT_FORM_CONFIG.interestOptions,
  };

  const normalized = normalizeEventCustomQuestions(config?.customQuestions);
  const hasLegacyId = normalized.some(question => question.id.startsWith("legacy_"));
  const customQuestions = hasLegacyId
    ? normalized
    : [...normalizeEventCustomQuestions(seedLegacyQuestions(base)), ...normalized];

  const merged = { ...base, customQuestions };

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

type AnswerMap = Record<string, string | string[]>;

const isAnswered = (value: string | string[] | undefined): boolean =>
  Array.isArray(value) ? value.length > 0 : Boolean(value?.trim());

const isUnanswerableChoice = (question: EventCustomQuestion): boolean =>
  isChoiceType(question.type) && (question.options?.length ?? 0) === 0;

export const findMissingRequiredAnswer = (
  questions: EventCustomQuestion[],
  answers: AnswerMap,
): EventCustomQuestion | null =>
  questions.find(
    question =>
      question.required && !isUnanswerableChoice(question) && !isAnswered(answers[question.id]),
  ) ?? null;

export const serializeEventAnswers = (
  questions: EventCustomQuestion[],
  answers: AnswerMap,
): Record<string, string | string[]> =>
  questions.reduce<Record<string, string | string[]>>((acc, question) => {
    const value = answers[question.id];
    if (!isAnswered(value)) return acc;
    acc[question.id] = Array.isArray(value) ? value : value.trim();
    return acc;
  }, {});

export const mapLegacyAnswerColumns = (answers: AnswerMap): {
  expectation: string;
  interests: string[];
  speaker_question: string | null;
} => {
  const expectation = answers.legacy_expectation;
  const interests = answers.legacy_interests;
  const speaker = answers.legacy_speaker;
  return {
    expectation: typeof expectation === "string" ? expectation.trim() : "",
    interests: Array.isArray(interests) ? interests : [],
    speaker_question: typeof speaker === "string" && speaker.trim() ? speaker.trim() : null,
  };
};
