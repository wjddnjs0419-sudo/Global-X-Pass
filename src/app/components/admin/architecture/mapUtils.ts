import { ACTIVE_ISSUE_STATUSES, CLUSTER_PALETTE, QA_SUITE_FILES, QA_SUITES, STATUS_META, STATUS_RANK, WATCH_ISSUE_STATUSES } from "./constants";
import type { ArchitectureMap, BlogAiDraft, BlogImportRun, CompanyNewsRun, CompanyNewsRunTracker, ErrorIssue, ErrorLog, FilterId, MapCluster, MapNode, NodeStatus, QaRun, QaRunTracker, QaSuiteId, Severity } from "./types";

export const getClusterPalette = (clusterColor: string) =>
  CLUSTER_PALETTE[clusterColor] ?? CLUSTER_PALETTE.blue;

export const getClusterStroke = (clusterColor: string, status: NodeStatus) =>
  status === "safe" ? getClusterPalette(clusterColor).solid : STATUS_META[status].color;

export const SEMANTIC_KEYWORDS: Array<[string, string[]]> = [
  ["신청", ["application", "apply", "reservation", "founders", "consulting", "event", "신청", "예약"]],
  ["프로필", ["profile", "mypage", "decrypt", "encrypt", "PII", "프로필", "사용자"]],
  ["공지사항", ["notice", "post", "공지", "게시물"]],
  ["권한", ["auth", "admin", "mfa", "role", "permission", "권한"]],
  ["행사", ["event", "events", "행사"]],
  ["컨설팅", ["consulting", "reservation", "컨설팅"]],
  ["파운더스", ["founders", "club", "founder", "파운더스"]],
  ["로그", ["error", "log", "telemetry", "ux", "로그"]],
];

export const MAP_LAYOUT = {
  columnWidth: 190,
  columnGap: 56,
  rowGap: 18,
  nodeHeight: 74,
  clusterHeaderHeight: 74,
};
export const STATIC_MAP_SCALE = 0.78;
export const MAP_VIEWBOX_PADDING = 48;

export const visibleForFilter = (node: MapNode, filter: FilterId, issueCount: number) => {
  if (filter === "all") return true;
  if (filter === "overview") return Boolean(node.critical) || issueCount > 0;
  if (filter === "errors") return issueCount > 0;
  if (filter === "dead") return Boolean(node.dead);
  return node.tag.includes(filter);
};

export const highestStatus = (statuses: NodeStatus[]) => statuses.reduce<NodeStatus>((highest, status) => (
  STATUS_RANK[status] > STATUS_RANK[highest] ? status : highest
), "safe");

export const getNodeStatus = (nodeId: string, issuesBySource: Map<string, ErrorIssue[]>, logsBySource: Map<string, ErrorLog[]>): NodeStatus => {
  const nodeIssues = issuesBySource.get(nodeId) ?? [];
  if (nodeIssues.some((issue) => ACTIVE_ISSUE_STATUSES.has(issue.status))) return "danger";
  if (nodeIssues.some((issue) => WATCH_ISSUE_STATUSES.has(issue.status))) return "watch";

  const recentWarnings = logsBySource.get(nodeId) ?? [];
  if (recentWarnings.some((log) => log.severity === "low" || log.severity === "medium")) return "watch";
  return "safe";
};

export const getSearchTokens = (node: MapNode, cluster?: MapCluster) => {
  const semantic = SEMANTIC_KEYWORDS
    .filter(([keyword, aliases]) => aliases.some((alias) => `${node.path} ${node.label} ${node.role} ${node.plain} ${node.tag.join(" ")}`.toLowerCase().includes(alias.toLowerCase())) || node.tag.includes(keyword))
    .flatMap(([keyword, aliases]) => [keyword, ...aliases]);
  return [
    node.id,
    node.label,
    node.sub,
    node.path,
    node.role,
    node.plain,
    ...node.tag,
    cluster?.label,
    cluster?.displayLabel,
    cluster?.description,
    ...(cluster?.keywords ?? []),
    ...semantic,
  ].filter(Boolean).join(" ").toLowerCase();
};

export const getFallbackNodePosition = (nodeId: string, data: ArchitectureMap) => {
  const node = data.nodes.find((item) => item.id === nodeId);
  if (!node) return null;
  const columnIndex = Math.max(0, data.clusters.findIndex((cluster) => cluster.id === node.cluster));
  const clusterNodes = data.nodes.filter((item) => item.cluster === node.cluster);
  const rowIndex = Math.max(0, clusterNodes.findIndex((item) => item.id === nodeId));
  return {
    x: columnIndex * (MAP_LAYOUT.columnWidth + MAP_LAYOUT.columnGap),
    y: MAP_LAYOUT.clusterHeaderHeight + rowIndex * (MAP_LAYOUT.nodeHeight + MAP_LAYOUT.rowGap),
    w: MAP_LAYOUT.columnWidth,
    h: MAP_LAYOUT.nodeHeight,
  };
};

export const formatTime = (value: string) => new Intl.DateTimeFormat("ko-KR", {
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
}).format(new Date(value));

export const QA_TRIGGER_MATCH_TOLERANCE_MS = 2 * 60 * 1000;

export function getQaOperationalRun(runs: QaRun[], selectedSuite: QaSuiteId, tracker: QaRunTracker | null) {
  if (tracker) {
    const requestedAt = new Date(tracker.requestedAt).getTime() - QA_TRIGGER_MATCH_TOLERANCE_MS;
    return runs.find((run) =>
      run.suite === tracker.suite && new Date(run.createdAt).getTime() >= requestedAt,
    ) ?? null;
  }

  return runs.find((run) => run.suite === selectedSuite) ?? null;
}

export function getCompanyNewsOperationalRun(runs: CompanyNewsRun[], tracker: CompanyNewsRunTracker | null) {
  if (!tracker) return runs[0] ?? null;

  const requestedAt = new Date(tracker.requestedAt).getTime() - QA_TRIGGER_MATCH_TOLERANCE_MS;
  return runs.find((run) => new Date(run.createdAt).getTime() >= requestedAt) ?? null;
}

export const formatTriggerSource = (source: string) => {
  if (source === "manual") return "수동 실행";
  if (source === "cron") return "예약 실행";
  if (source === "worker") return "워커";
  if (source === "github_actions") return "GitHub Actions";
  return source;
};

export const getBlogRunMeta = (run: BlogImportRun) => {
  if (run.status === "queued") {
    return { label: "대기중", color: "#f5b942", bg: "#2b240f" };
  }
  if (run.status === "running") {
    return { label: "진행중", color: "#4ea1ff", bg: "#102033" };
  }
  if (run.status === "success") {
    return { label: "성공", color: "#34a853", bg: "#0f2a15" };
  }
  if (run.status === "cancelled" || run.status === "skipped") {
    return { label: "중단", color: "#f5b942", bg: "#2b240f" };
  }
  if (run.failed_count > 0 || run.error) {
    return { label: "실패", color: "#ea4335", bg: "#2a1010" };
  }
  return { label: run.status, color: "#8a8a8a", bg: "#1c1c1c" };
};

export const getBlogRunSummary = (run: BlogImportRun) => {
  if (run.status === "queued") {
    return "대기열에 등록됐습니다. GitHub Actions가 곧 처리합니다.";
  }
  const successCount = run.inserted_count + run.updated_count;
  if (run.status === "running") {
    return `발견 ${run.discovered_count} · 성공 ${successCount} · 건너뜀 ${run.skipped_count} · 실패 ${run.failed_count}`;
  }
  return `발견 ${run.discovered_count} · 성공 ${successCount} · 건너뜀 ${run.skipped_count} · 실패 ${run.failed_count}`;
};

export const formatBlogTitles = (titles: string[]) => titles.map((title, index) => `${index + 1}. ${title}`).join("\n");

export const buildBlogDraftCopyText = (draft: BlogAiDraft) => [
  "[제목 후보]",
  formatBlogTitles(draft.titles),
  "",
  "[본문]",
  draft.content,
  "",
  "[해시태그]",
  draft.tags,
].join("\n");

export const getQaIncidentSeverity = (run: QaRun): Severity => {
  if (run.status !== "completed") return "medium";
  if (run.conclusion === "success") return "low";
  if (run.conclusion === "cancelled" || run.conclusion === "skipped") return "medium";
  return "high";
};

export const getBlogIncidentSeverity = (run: BlogImportRun): Severity => {
  if (run.status === "failed" || run.failed_count > 0 || run.error) return "high";
  if (run.status === "queued" || run.status === "running") return "medium";
  return "low";
};

export function isBlogRunTerminal(run: BlogImportRun | null) {
  return Boolean(run && ["completed", "success", "failed", "error", "cancelled", "finished", "skipped"].includes(run.status));
}

export const generateAgentPrompt = (run: QaRun): string => {
  const suiteLabel = run.suite
    ? (QA_SUITES.find((s) => s.id === run.suite)?.label ?? run.suite)
    : "Suite 미상";
  const files = run.suite ? QA_SUITE_FILES[run.suite] : null;
  const testLines = files?.test.map((f) => `- \`${f}\``).join("\n") ?? "- (suite 정보 없음)";
  const sourceLines =
    files && files.source.length > 0
      ? files.source.map((f) => `- \`${f}\``).join("\n")
      : "- (참조 소스 없음)";
  const failedLines = run.failedStep
    ? `- 실패 Job: \`${run.failedStep.job}\`\n- 실패 Step: \`${run.failedStep.step}\``
    : `- 결론: \`${run.conclusion ?? "알 수 없음"}\` (step 상세 정보 없음)`;
  const failedPhrase = run.failedStep
    ? `"${run.failedStep.step}" 단계에서`
    : `\`${run.conclusion}\` 결론으로`;

  return `# QA 실패 작업 지시서 — #${run.runNumber} ${suiteLabel}

## 실패 정보
- Suite: \`${run.suite ?? "알 수 없음"}\`
${failedLines}
- 발생: ${formatTime(run.createdAt)} · attempt ${run.runAttempt}
- Branch: \`${run.branch}\`
- 실행자: ${run.actor ?? "unknown"}
- GitHub: ${run.htmlUrl}

## 관련 파일
### 테스트
${testLines}

### 소스 (참조)
${sourceLines}

## 작업 지시
QA suite \`${run.suite ?? "unknown"}\` run #${run.runNumber}이 ${failedPhrase} 실패했습니다.

1. 위 GitHub Actions 링크에서 실패 로그를 확인하고 원인을 파악하세요.
2. 실패 원인이 테스트 코드 불안정(flaky)이면 테스트를, 앱 버그이면 소스 코드를 수정하세요.
3. 수정 후 \`npm run validate\`를 실행하고 결과를 보고하세요.
4. QA 자격증명이 필요하면 \`docs/AGENT_RULES.md\`의 QA Failure Response Protocol을 참고하세요.`;
};

export const summarizeStack = (stack: string | null) => {
  if (!stack) return "stack 없음";
  return stack.split("\n").slice(0, 3).join("\n");
};

export const APP_SOURCE_LOCATION_PATTERN = /\/?(src\/[^?\s)]+?\.(?:tsx?|jsx?|mjs|js))(?:\?[^:\s)]*)?(?::(\d+))?(?::(\d+))?/;

export function getContextString(context: Record<string, unknown> | null, key: string) {
  const value = context?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function extractCodeLocation(input: {
  source_location?: string | null;
  stack?: string | null;
  context?: Record<string, unknown> | null;
}) {
  const explicit = input.source_location ?? getContextString(input.context ?? null, "source_location");
  const raw = explicit || input.stack?.match(APP_SOURCE_LOCATION_PATTERN)?.[0] || null;
  if (!raw) return null;
  const match = raw.match(APP_SOURCE_LOCATION_PATTERN);
  if (!match) return { label: raw, file: raw, line: null as string | null, col: null as string | null };
  const [, file, line, col] = match;
  return {
    label: [file, line, col].filter(Boolean).join(":"),
    file,
    line: line ?? null,
    col: col ?? null,
  };
}
