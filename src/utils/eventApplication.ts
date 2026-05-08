import type { EventCustomQuestion, EventFormConfig } from "../lib/types";

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
  completionTitle: "신청이 접수되었습니다.",
  completionMessage: "참가 링크는 사전접수 마감 후 공유드리겠습니다.",
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

export const mergeEventFormConfig = (config?: EventFormConfig | null): Required<EventFormConfig> => ({
  ...DEFAULT_EVENT_FORM_CONFIG,
  ...(config ?? {}),
  interestOptions:
    config?.interestOptions && config.interestOptions.length > 0
      ? config.interestOptions
      : DEFAULT_EVENT_FORM_CONFIG.interestOptions,
  customQuestions: normalizeEventCustomQuestions(config?.customQuestions),
});

export const EVENT_APPLICATION_STATUS = {
  pending: { label: "검토중", color: "#FBBC05" },
  accepted: { label: "승인", color: "#18A343" },
  rejected: { label: "거절", color: "#EA4335" },
  cancelled: { label: "취소", color: "#64748B" },
} as const;

export const EVENT_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  "접수예정": { label: "접수예정", color: "#4377F1", bg: "rgba(67,119,241,0.12)" },
  "접수중": { label: "접수중", color: "#0FA37F", bg: "rgba(15,163,127,0.12)" },
  "마감임박": { label: "마감임박", color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
  "마감": { label: "마감", color: "#9CA3AF", bg: "rgba(156,163,175,0.12)" },
};
