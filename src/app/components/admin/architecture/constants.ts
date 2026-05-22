import type { FilterId, IssueStatus, NodeStatus, QaSuiteId, Severity } from "./types";

export const WINDOW_OPTIONS = [
  { label: "5분", minutes: 5 },
  { label: "1시간", minutes: 60 },
  { label: "24시간", minutes: 60 * 24 },
  { label: "7일", minutes: 60 * 24 * 7 },
];
export const BLOG_AI_DEFAULT_PROFILE_PATH = "docs/ai/blog-style-profile.json";
export const BLOG_AI_DEFAULT_SAMPLE_COUNT = "27";

export const FILTERS: Array<{ id: FilterId; label: string }> = [
  { id: "overview", label: "핵심 경로" },
  { id: "errors", label: "에러 발생" },
  { id: "dead", label: "DEAD 코드" },
  { id: "auth", label: "Auth" },
  { id: "events", label: "Events" },
  { id: "consulting", label: "Consulting" },
  { id: "founders", label: "Founder's Club" },
  { id: "admin", label: "Admin" },
  { id: "pii", label: "PII" },
  { id: "all", label: "전체" },
];

export const QA_SUITES: Array<{ id: QaSuiteId; label: string; description: string }> = [
  { id: "smoke", label: "Smoke", description: "핵심 화면과 작성 폼 렌더링을 빠르게 확인" },
  { id: "admin-auth", label: "Admin Auth", description: "로그인, MFA, 로그아웃, 권한 가드 검증" },
  { id: "auth-negative", label: "Auth Negative", description: "잘못된 비밀번호/OTP와 비관리자 어드민 접근 차단 검증" },
  { id: "admin-post-cud", label: "Post CUD", description: "공지/뉴스/행사/미디어 게시물 CUD 검증" },
  { id: "admin-program-mgmt", label: "Program Mgmt", description: "컨설팅/Founders Club 관리 흐름 검증" },
  { id: "user-event-application", label: "User Event", description: "일반 유저 행사 신청과 재진입 상태 검증" },
  { id: "user-consulting-booking", label: "User Consulting", description: "일반 유저 컨설팅 예약과 슬롯 소진 검증" },
  { id: "user-founders-club", label: "User Founders", description: "일반 유저 Founders Club 신청과 공개 마감 표시 검증" },
  { id: "user-flows", label: "User Flows", description: "일반 유저 신청/예약 핵심 플로우 묶음 실행" },
  { id: "all", label: "All", description: "모든 On-Demand QA suite 실행" },
];

export const QA_SUITE_FILES: Record<QaSuiteId, { test: string[]; source: string[] }> = {
  smoke: {
    test: ["tests/qa/production-smoke.spec.ts"],
    source: [],
  },
  "admin-auth": {
    test: ["tests/qa/admin-auth.spec.ts", "tests/qa/utils/auth.ts"],
    source: [],
  },
  "auth-negative": {
    test: ["tests/qa/admin-auth-negative.spec.ts", "tests/qa/utils/auth.ts"],
    source: [],
  },
  "admin-post-cud": {
    test: ["tests/qa/admin-post-cud.spec.ts", "tests/qa/utils/auth.ts"],
    source: ["src/app/components/admin/AdminPage.tsx"],
  },
  "admin-program-mgmt": {
    test: ["tests/qa/admin-program-mgmt.spec.ts", "tests/qa/utils/auth.ts"],
    source: ["src/app/components/admin/AdminConsultingManagement.tsx"],
  },
  "user-event-application": {
    test: ["tests/qa/user-event-application.spec.ts", "tests/qa/utils/auth.ts"],
    source: [],
  },
  "user-consulting-booking": {
    test: ["tests/qa/user-consulting-booking.spec.ts", "tests/qa/utils/auth.ts"],
    source: ["src/app/components/admin/AdminConsultingManagement.tsx"],
  },
  "user-founders-club": {
    test: ["tests/qa/user-founders-club.spec.ts", "tests/qa/utils/auth.ts"],
    source: [],
  },
  "user-flows": {
    test: [
      "tests/qa/user-event-application.spec.ts",
      "tests/qa/user-consulting-booking.spec.ts",
      "tests/qa/user-founders-club.spec.ts",
      "tests/qa/utils/auth.ts",
    ],
    source: [],
  },
  all: {
    test: ["tests/qa/"],
    source: [],
  },
};

export const CLUSTER_PALETTE: Record<string, { solid: string; nodeFill: string; clusterFill: string; accentFill: string }> = {
  blue: {
    solid: "#4285F4",
    nodeFill: "rgba(66, 133, 244, 0.16)",
    clusterFill: "rgba(66, 133, 244, 0.10)",
    accentFill: "rgba(66, 133, 244, 0.92)",
  },
  green: {
    solid: "#34A853",
    nodeFill: "rgba(52, 168, 83, 0.16)",
    clusterFill: "rgba(52, 168, 83, 0.10)",
    accentFill: "rgba(52, 168, 83, 0.92)",
  },
  purple: {
    solid: "#A855F7",
    nodeFill: "rgba(168, 85, 247, 0.16)",
    clusterFill: "rgba(168, 85, 247, 0.10)",
    accentFill: "rgba(168, 85, 247, 0.92)",
  },
  red: {
    solid: "#EA4335",
    nodeFill: "rgba(234, 67, 53, 0.16)",
    clusterFill: "rgba(234, 67, 53, 0.10)",
    accentFill: "rgba(234, 67, 53, 0.92)",
  },
  yellow: {
    solid: "#FBBC05",
    nodeFill: "rgba(251, 188, 5, 0.18)",
    clusterFill: "rgba(251, 188, 5, 0.12)",
    accentFill: "rgba(251, 188, 5, 0.95)",
  },
};

export const SEVERITY_RANK: Record<Severity, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

export const SEVERITY_COLOR: Record<Severity, string> = {
  low: "var(--color-brand-green)",
  medium: "var(--color-brand-yellow)",
  high: "var(--color-brand-red)",
  critical: "var(--color-brand-red)",
};

export const ACTIVE_ISSUE_STATUSES = new Set<IssueStatus>(["open", "reopened"]);
export const WATCH_ISSUE_STATUSES = new Set<IssueStatus>(["monitoring", "ignored"]);
export const VISIBLE_ISSUE_STATUSES: IssueStatus[] = ["open", "reopened", "monitoring", "ignored"];
export const CURRENT_BUILD_ID = __GXP_BUILD_ID__;
export const INBOX_STORAGE_KEY = "gxp_architecture_inbox_v1";
export const INBOX_BELL_POSITION_STORAGE_KEY = "gxp_architecture_inbox_bell_position_v1";
export const MAP_SNAPSHOT_STORAGE_KEY = "gxp_architecture_map_snapshot_v1";
export const QA_WORKFLOW_URL = "https://github.com/wjddnjs0419-sudo/Global-X-Pass/actions/workflows/qa-dispatch.yml";
export const NAVER_BLOG_SYNC_WORKFLOW_URL = "https://github.com/wjddnjs0419-sudo/Global-X-Pass/actions/workflows/naver-blog-sync.yml";
export const FLOATING_BELL_SIZE = 52;
export const FLOATING_BELL_MARGIN = 30;
export const FLOATING_PANEL_WIDTH = 420;
export const FLOATING_PANEL_MAX_HEIGHT = 560;
export const FLOATING_PANEL_MIN_HEIGHT = 240;
export const FLOATING_PANEL_GAP = 12;
export const FLOATING_PANEL_EDGE_MARGIN = 16;
export const FLOATING_BELL_DRAG_THRESHOLD = 8;

export const STATUS_RANK: Record<NodeStatus, number> = {
  safe: 1,
  watch: 2,
  danger: 3,
};

export const STATUS_META: Record<NodeStatus, { label: string; color: string; bg: string }> = {
  safe: {
    label: "정상",
    color: "var(--color-brand-green)",
    bg: "color-mix(in srgb, var(--color-brand-green) 8%, transparent)",
  },
  watch: {
    label: "주의",
    color: "var(--color-brand-yellow)",
    bg: "color-mix(in srgb, var(--color-brand-yellow) 12%, transparent)",
  },
  danger: {
    label: "위험",
    color: "var(--color-brand-red)",
    bg: "color-mix(in srgb, var(--color-brand-red) 10%, transparent)",
  },
};
