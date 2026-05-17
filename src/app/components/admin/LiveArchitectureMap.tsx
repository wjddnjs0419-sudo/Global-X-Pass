import { useEffect, useMemo, useState, type CSSProperties } from "react";
import architectureMap from "@/generated/architectureMap.json";
import { Bell, ExternalLink, LocateFixed, PlayCircle, RefreshCw, Search, Trash2 } from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";
import { logActionFailure, logSupabaseFailure } from "../../../lib/uxTelemetry";
import { explainError } from "../../../lib/errorExplainer";
import { IncidentFeed, type IncidentFeedItem, type IncidentSeverity } from "./architecture/IncidentFeed";
import { computeArchitectureMapDiff, type ArchitectureMapDiff } from "./architecture/mapDiff";

declare global {
  interface Window {
    electronAPI?: {
      openTerminal: (command?: string) => Promise<void>;
      readMapData: () => Promise<{ ok: boolean; data?: ArchitectureMap; error?: string }>;
      refreshMap: () => Promise<{ ok: boolean; output?: string; code?: number }>;
      readQaRuns: () => Promise<QaRunsResult>;
      triggerQaRun: (suite: QaSuiteId) => Promise<QaTriggerResult>;
      runVisibleQa: (suite: QaSuiteId) => Promise<QaVisibleResult>;
      getGithubTokenStatus: () => Promise<{ ok: boolean; connected: boolean }>;
      saveGithubToken: (token: string) => Promise<{ ok: boolean; connected: boolean; error?: string; statusCode?: number | null }>;
      clearGithubToken: () => Promise<{ ok: boolean; connected: boolean }>;
    };
  }
}

type Severity = "low" | "medium" | "high" | "critical";

type MapNode = {
  id: string;
  cluster: string;
  label: string;
  sub: string;
  path: string;
  role: string;
  plain: string;
  notes: string[];
  tag: string[];
  critical?: boolean;
  dead?: boolean;
};

type MapEdge = {
  from: string;
  to: string;
  kind: "critical" | "normal" | "api" | "db" | "mount";
  label: string;
  tag: string[];
};

type ErrorLog = {
  id: string;
  source: string;
  severity: Severity;
  message: string;
  stack: string | null;
  path: string | null;
  context: Record<string, unknown> | null;
  fingerprint: string;
  build_id: string | null;
  source_location: string | null;
  created_at: string;
};

type IssueStatus = "open" | "monitoring" | "resolved" | "reopened" | "ignored";

type ErrorIssue = {
  fingerprint: string;
  source: string;
  severity: Severity;
  status: IssueStatus;
  message: string;
  stack: string | null;
  path: string | null;
  context: Record<string, unknown> | null;
  source_location: string | null;
  first_seen_at: string;
  last_seen_at: string;
  last_build_id: string | null;
  last_log_id: string | null;
  occurrence_count: number;
  monitoring_at: string | null;
  resolved_at: string | null;
  ignored_at: string | null;
  reopened_at: string | null;
  resolved_note: string | null;
  updated_at: string;
};

type MapCluster = {
  id: string;
  label: string;
  displayLabel?: string;
  description?: string;
  color: string;
  keywords?: string[];
};

type ArchitectureMap = {
  generatedAt: string;
  clusters: MapCluster[];
  nodes: MapNode[];
  edges: MapEdge[];
};

type QaRunConclusion = "success" | "failure" | "cancelled" | "skipped" | "timed_out" | "action_required" | null;
type QaSuiteId = "smoke" | "admin-auth" | "admin-post-cud" | "admin-program-mgmt" | "all";

type QaFailedStep = {
  job: string;
  step: string;
  conclusion: string;
};

type QaRun = {
  id: string;
  runNumber: number;
  runAttempt: number;
  name: string;
  displayTitle: string;
  event: string;
  status: string;
  conclusion: QaRunConclusion;
  branch: string;
  actor: string | null;
  createdAt: string;
  updatedAt: string;
  htmlUrl: string;
  suite: QaSuiteId | null;
  failedStep: QaFailedStep | null;
};

type QaRunsResult =
  | { ok: true; repo: string; workflow: string; runs: QaRun[]; fetchedAt: string }
  | { ok: false; error: string; statusCode?: number | null; needsToken?: boolean };

type QaTriggerResult =
  | { ok: true; workflow: string; branch: string; suite: QaSuiteId; triggeredAt: string }
  | { ok: false; error: string; statusCode?: number | null; needsToken?: boolean };

type QaVisibleResult =
  | { ok: true; suite: QaSuiteId; mode: "local-visible"; startedAt: string }
  | { ok: false; error: string; statusCode?: number | null };

type BlogImportRun = {
  id: string;
  trigger_source: string;
  status: string;
  discovered_count: number;
  inserted_count: number;
  updated_count: number;
  skipped_count: number;
  failed_count: number;
  error: string | null;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
  github_run_id?: string | null;
};

type BlogSyncRun = {
  id: string;
  status: string;
  trigger_source: string;
  dry_run: boolean;
  created_at: string;
};

type BlogSyncResult = {
  success?: boolean;
  run?: BlogSyncRun;
  dispatched?: boolean;
  dispatchError?: string | null;
  error?: string;
};

type FilterId = "overview" | "errors" | "dead" | "auth" | "events" | "consulting" | "founders" | "admin" | "pii" | "all";
type SidebarTab = "map" | "alerts" | "ops";
type NodeStatus = "safe" | "watch" | "danger";
type PositionedNode = MapNode & { x: number; y: number; w: number; h: number; color: string; status: NodeStatus };
type ClusterBounds = {
  id: string;
  label: string;
  description: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  nodeCount: number;
  status: NodeStatus;
};

const initialMapData = architectureMap as ArchitectureMap;

const WINDOW_OPTIONS = [
  { label: "5분", minutes: 5 },
  { label: "1시간", minutes: 60 },
  { label: "24시간", minutes: 60 * 24 },
  { label: "7일", minutes: 60 * 24 * 7 },
];

const FILTERS: Array<{ id: FilterId; label: string }> = [
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

const QA_SUITES: Array<{ id: QaSuiteId; label: string; description: string }> = [
  { id: "smoke", label: "Smoke", description: "핵심 화면과 작성 폼 렌더링을 빠르게 확인" },
  { id: "admin-auth", label: "Admin Auth", description: "로그인, MFA, 로그아웃, 권한 가드 검증" },
  { id: "admin-post-cud", label: "Post CUD", description: "공지/뉴스/행사/미디어 게시물 CUD 검증" },
  { id: "admin-program-mgmt", label: "Program Mgmt", description: "컨설팅/Founders Club 관리 흐름 검증" },
  { id: "all", label: "All", description: "모든 On-Demand QA suite 실행" },
];

const CLUSTER_PALETTE: Record<string, { solid: string; nodeFill: string; clusterFill: string; accentFill: string }> = {
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

const SEVERITY_RANK: Record<Severity, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

const SEVERITY_COLOR: Record<Severity, string> = {
  low: "var(--color-brand-green)",
  medium: "var(--color-brand-yellow)",
  high: "var(--color-brand-red)",
  critical: "var(--color-brand-red)",
};

const ACTIVE_ISSUE_STATUSES = new Set<IssueStatus>(["open", "reopened"]);
const WATCH_ISSUE_STATUSES = new Set<IssueStatus>(["monitoring", "ignored"]);
const VISIBLE_ISSUE_STATUSES: IssueStatus[] = ["open", "reopened", "monitoring", "ignored"];
const CURRENT_BUILD_ID = __GXP_BUILD_ID__;
const ALERT_STORAGE_KEYS = {
  qa: "gxp_architecture_alerts_qa_v2",
  blog: "gxp_architecture_alerts_blog_v1",
} as const;
const MAP_SNAPSHOT_STORAGE_KEY = "gxp_architecture_map_snapshot_v1";
const QA_WORKFLOW_URL = "https://github.com/wjddnjs0419-sudo/Global-X-Pass/actions/workflows/qa-dispatch.yml";
const NAVER_BLOG_SYNC_WORKFLOW_URL = "https://github.com/wjddnjs0419-sudo/Global-X-Pass/actions/workflows/naver-blog-sync.yml";

const STATUS_RANK: Record<NodeStatus, number> = {
  safe: 1,
  watch: 2,
  danger: 3,
};

const STATUS_META: Record<NodeStatus, { label: string; color: string; bg: string }> = {
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

function readStoredAlertState(storageKey: string) {
  if (typeof window === "undefined") return { readIds: new Set<string>(), hiddenIds: new Set<string>() };
  try {
    const raw = window.localStorage.getItem(storageKey);
    const parsed = raw ? JSON.parse(raw) as { readIds?: string[]; hiddenIds?: string[] } : {};
    return {
      readIds: new Set(parsed.readIds ?? []),
      hiddenIds: new Set(parsed.hiddenIds ?? []),
    };
  } catch {
    return { readIds: new Set<string>(), hiddenIds: new Set<string>() };
  }
}

function writeStoredAlertState(storageKey: string, readIds: Set<string>, hiddenIds: Set<string>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey, JSON.stringify({
    readIds: Array.from(readIds),
    hiddenIds: Array.from(hiddenIds),
  }));
}

function readStoredMapSnapshot(): ArchitectureMap | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(MAP_SNAPSHOT_STORAGE_KEY);
    return raw ? JSON.parse(raw) as ArchitectureMap : null;
  } catch {
    return null;
  }
}

function writeStoredMapSnapshot(data: ArchitectureMap) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(MAP_SNAPSHOT_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Snapshot persistence is only a local convenience for the private app.
  }
}

const getClusterPalette = (clusterColor: string) =>
  CLUSTER_PALETTE[clusterColor] ?? CLUSTER_PALETTE.blue;

const getClusterStroke = (clusterColor: string, status: NodeStatus) =>
  status === "safe" ? getClusterPalette(clusterColor).solid : STATUS_META[status].color;

const SEMANTIC_KEYWORDS: Array<[string, string[]]> = [
  ["신청", ["application", "apply", "reservation", "founders", "consulting", "event", "신청", "예약"]],
  ["프로필", ["profile", "mypage", "decrypt", "encrypt", "PII", "프로필", "사용자"]],
  ["공지사항", ["notice", "post", "공지", "게시물"]],
  ["권한", ["auth", "admin", "mfa", "role", "permission", "권한"]],
  ["행사", ["event", "events", "행사"]],
  ["컨설팅", ["consulting", "reservation", "컨설팅"]],
  ["파운더스", ["founders", "club", "founder", "파운더스"]],
  ["로그", ["error", "log", "telemetry", "ux", "로그"]],
];

const MAP_LAYOUT = {
  columnWidth: 190,
  columnGap: 56,
  rowGap: 18,
  nodeHeight: 74,
  clusterHeaderHeight: 74,
};
const STATIC_MAP_SCALE = 0.78;
const MAP_VIEWBOX_PADDING = 48;

const visibleForFilter = (node: MapNode, filter: FilterId, issueCount: number) => {
  if (filter === "all") return true;
  if (filter === "overview") return Boolean(node.critical) || issueCount > 0;
  if (filter === "errors") return issueCount > 0;
  if (filter === "dead") return Boolean(node.dead);
  return node.tag.includes(filter);
};

const highestStatus = (statuses: NodeStatus[]) => statuses.reduce<NodeStatus>((highest, status) => (
  STATUS_RANK[status] > STATUS_RANK[highest] ? status : highest
), "safe");

const getNodeStatus = (nodeId: string, issuesBySource: Map<string, ErrorIssue[]>, logsBySource: Map<string, ErrorLog[]>): NodeStatus => {
  const nodeIssues = issuesBySource.get(nodeId) ?? [];
  if (nodeIssues.some((issue) => ACTIVE_ISSUE_STATUSES.has(issue.status))) return "danger";
  if (nodeIssues.some((issue) => WATCH_ISSUE_STATUSES.has(issue.status))) return "watch";

  const recentWarnings = logsBySource.get(nodeId) ?? [];
  if (recentWarnings.some((log) => log.severity === "low" || log.severity === "medium")) return "watch";
  return "safe";
};

const getSearchTokens = (node: MapNode, cluster?: MapCluster) => {
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

const getFallbackNodePosition = (nodeId: string, data: ArchitectureMap) => {
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

const formatTime = (value: string) => new Intl.DateTimeFormat("ko-KR", {
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
}).format(new Date(value));

const formatTriggerSource = (source: string) => {
  if (source === "manual") return "수동 실행";
  if (source === "cron") return "예약 실행";
  if (source === "worker") return "워커";
  if (source === "github_actions") return "GitHub Actions";
  return source;
};

const getBlogRunMeta = (run: BlogImportRun) => {
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

const getBlogRunSummary = (run: BlogImportRun) => {
  if (run.status === "queued") {
    return "대기열에 등록됐습니다. GitHub Actions가 곧 처리합니다.";
  }
  const successCount = run.inserted_count + run.updated_count;
  if (run.status === "running") {
    return `발견 ${run.discovered_count} · 성공 ${successCount} · 건너뜀 ${run.skipped_count} · 실패 ${run.failed_count}`;
  }
  return `발견 ${run.discovered_count} · 성공 ${successCount} · 건너뜀 ${run.skipped_count} · 실패 ${run.failed_count}`;
};

const getQaIncidentSeverity = (run: QaRun): IncidentSeverity => {
  if (run.status !== "completed") return "medium";
  if (run.conclusion === "success") return "low";
  if (run.conclusion === "cancelled" || run.conclusion === "skipped") return "medium";
  return "high";
};

const getBlogIncidentSeverity = (run: BlogImportRun): IncidentSeverity => {
  if (run.status === "failed" || run.failed_count > 0 || run.error) return "high";
  if (run.status === "queued" || run.status === "running") return "medium";
  return "low";
};

const summarizeStack = (stack: string | null) => {
  if (!stack) return "stack 없음";
  return stack.split("\n").slice(0, 3).join("\n");
};

const APP_SOURCE_LOCATION_PATTERN = /\/?(src\/[^?\s)]+?\.(?:tsx?|jsx?|mjs|js))(?:\?[^:\s)]*)?(?::(\d+))?(?::(\d+))?/;

function getContextString(context: Record<string, unknown> | null, key: string) {
  const value = context?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function extractCodeLocation(input: {
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

export function LiveArchitectureMap() {
  const [mapData, setMapData] = useState<ArchitectureMap>(initialMapData);
  const [mapDiff, setMapDiff] = useState<ArchitectureMapDiff | null>(null);
  const [mapRefreshStatus, setMapRefreshStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [logs, setLogs] = useState<ErrorLog[]>([]);
  const [issues, setIssues] = useState<ErrorIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterId>("overview");
  const [windowMinutes, setWindowMinutes] = useState(WINDOW_OPTIONS[1].minutes);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedFingerprint, setSelectedFingerprint] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("map");
  const [qaRuns, setQaRuns] = useState<QaRun[]>([]);
  const [qaLoading, setQaLoading] = useState(false);
  const [qaError, setQaError] = useState<string | null>(null);
  const [qaFetchedAt, setQaFetchedAt] = useState<string | null>(null);
  const [qaSelectedIds, setQaSelectedIds] = useState<Set<string>>(() => new Set());
  const [qaReadIds, setQaReadIds] = useState<Set<string>>(() => readStoredAlertState(ALERT_STORAGE_KEYS.qa).readIds);
  const [qaHiddenIds, setQaHiddenIds] = useState<Set<string>>(() => readStoredAlertState(ALERT_STORAGE_KEYS.qa).hiddenIds);
  const [selectedQaSuite, setSelectedQaSuite] = useState<QaSuiteId>("smoke");
  const [qaTriggerLoading, setQaTriggerLoading] = useState(false);
  const [qaTriggerMessage, setQaTriggerMessage] = useState<string | null>(null);
  const [qaTriggerError, setQaTriggerError] = useState<string | null>(null);
  const [visibleQaLoading, setVisibleQaLoading] = useState(false);
  const [visibleQaMessage, setVisibleQaMessage] = useState<string | null>(null);
  const [visibleQaError, setVisibleQaError] = useState<string | null>(null);
  const [githubTokenConnected, setGithubTokenConnected] = useState(false);
  const [githubTokenInput, setGithubTokenInput] = useState("");
  const [githubTokenSaving, setGithubTokenSaving] = useState(false);
  const [githubTokenError, setGithubTokenError] = useState<string | null>(null);
  const [blogRuns, setBlogRuns] = useState<BlogImportRun[]>([]);
  const [blogLoading, setBlogLoading] = useState(false);
  const [blogError, setBlogError] = useState<string | null>(null);
  const [blogFetchedAt, setBlogFetchedAt] = useState<string | null>(null);
  const [blogSelectedIds, setBlogSelectedIds] = useState<Set<string>>(() => new Set());
  const [blogReadIds, setBlogReadIds] = useState<Set<string>>(() => readStoredAlertState(ALERT_STORAGE_KEYS.blog).readIds);
  const [blogHiddenIds, setBlogHiddenIds] = useState<Set<string>>(() => readStoredAlertState(ALERT_STORAGE_KEYS.blog).hiddenIds);
  const [blogSyncLoading, setBlogSyncLoading] = useState(false);
  const [blogSyncResult, setBlogSyncResult] = useState<BlogSyncResult | null>(null);
  const [blogSyncError, setBlogSyncError] = useState<string | null>(null);

  const openTerminal = (command?: string) => {
    window.electronAPI?.openTerminal(command);
  };

  const loadQaRuns = async () => {
    if (!window.electronAPI?.readQaRuns) {
      setQaError("아키텍처 앱에서만 QA 알림을 불러올 수 있습니다.");
      return;
    }
    setQaLoading(true);
    setQaError(null);
    const result = await window.electronAPI.readQaRuns();
    if (result.ok === true) {
      setQaRuns(result.runs);
      setQaFetchedAt(result.fetchedAt);
    } else {
      const tokenHint = result.statusCode === 404
        ? " qa-dispatch.yml이 아직 GitHub main 브랜치에 없거나, GitHub token에 repo/actions 권한이 부족할 수 있습니다."
        : result.needsToken
        ? " 로컬 환경 변수 GXP_GITHUB_TOKEN 또는 GITHUB_TOKEN이 필요합니다."
        : "";
      setQaError(`${result.error}.${tokenHint}`);
    }
    setQaLoading(false);
  };

  const loadBlogRuns = async () => {
    setBlogLoading(true);
    setBlogError(null);

    const { data, error } = await supabase
      .from("blog_import_runs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      logSupabaseFailure("architecture-map", "load_blog_sync_alerts", error);
      setBlogError(error.message);
      setBlogLoading(false);
      return;
    }

    setBlogRuns((data ?? []) as BlogImportRun[]);
    setBlogFetchedAt(new Date().toISOString());
    setBlogLoading(false);
  };

  const persistQaInboxState = (nextReadIds: Set<string>, nextHiddenIds: Set<string>) => {
    setQaReadIds(nextReadIds);
    setQaHiddenIds(nextHiddenIds);
    writeStoredAlertState(ALERT_STORAGE_KEYS.qa, nextReadIds, nextHiddenIds);
  };

  const persistBlogInboxState = (nextReadIds: Set<string>, nextHiddenIds: Set<string>) => {
    setBlogReadIds(nextReadIds);
    setBlogHiddenIds(nextHiddenIds);
    writeStoredAlertState(ALERT_STORAGE_KEYS.blog, nextReadIds, nextHiddenIds);
  };

  const saveGithubToken = async () => {
    if (!window.electronAPI?.saveGithubToken) return;
    const token = githubTokenInput.trim();
    if (!token) {
      setGithubTokenError("토큰을 입력해 주세요.");
      return;
    }
    setGithubTokenSaving(true);
    setGithubTokenError(null);
    const result = await window.electronAPI.saveGithubToken(token);
    setGithubTokenSaving(false);
    if (!result.ok) {
      setGithubTokenConnected(false);
      setGithubTokenError(result.error ?? "GitHub 연결에 실패했습니다.");
      return;
    }
    setGithubTokenInput("");
    setGithubTokenConnected(true);
    void loadQaRuns();
  };

  const clearGithubToken = async () => {
    if (!window.electronAPI?.clearGithubToken) return;
    await window.electronAPI.clearGithubToken();
    setGithubTokenInput("");
    setGithubTokenError(null);
    setGithubTokenConnected(false);
    setQaRuns([]);
  };

  const triggerQaRun = async (suite: QaSuiteId) => {
    if (!window.electronAPI?.triggerQaRun) {
      setQaTriggerError("아키텍처 앱에서만 QA 실행을 요청할 수 있습니다.");
      return;
    }
    setQaTriggerLoading(true);
    setQaTriggerError(null);
    setQaTriggerMessage(null);

    const result = await window.electronAPI.triggerQaRun(suite);
    setQaTriggerLoading(false);

    if (result.ok !== true) {
      const tokenHint = result.statusCode === 404
        ? " qa-dispatch.yml이 아직 GitHub main 브랜치에 없거나, GitHub token에 repo/actions 권한이 부족할 수 있습니다."
        : result.needsToken
        ? " GitHub token 연결 또는 fallback env가 필요합니다."
        : "";
      setQaTriggerError(`${result.error}.${tokenHint}`);
      return;
    }

    const suiteLabel = QA_SUITES.find((item) => item.id === result.suite)?.label ?? result.suite;
    setQaTriggerMessage(`${suiteLabel} QA를 main 브랜치 기준으로 실행 요청했습니다. ${formatTime(result.triggeredAt)}에 dispatch 완료.`);
    await loadQaRuns();
  };

  const runVisibleQa = async (suite: QaSuiteId) => {
    if (!window.electronAPI?.runVisibleQa) {
      setVisibleQaError("아키텍처 앱에서만 로컬 Visible QA를 실행할 수 있습니다.");
      return;
    }

    setVisibleQaLoading(true);
    setVisibleQaError(null);
    setVisibleQaMessage(null);

    const result = await window.electronAPI.runVisibleQa(suite);
    setVisibleQaLoading(false);

    if (result.ok !== true) {
      setVisibleQaError(result.error);
      return;
    }

    const suiteLabel = QA_SUITES.find((item) => item.id === result.suite)?.label ?? result.suite;
    setVisibleQaMessage(`${suiteLabel} Visible QA 터미널을 열었습니다. 브라우저가 뜨면 진행 화면을 직접 확인할 수 있습니다.`);
  };

  const triggerBlogSync = async () => {
    setBlogSyncLoading(true);
    setBlogSyncError(null);
    setBlogSyncResult(null);

    const { data, error } = await supabase.functions.invoke("sync-naver-blog", {
      body: { triggerSource: "manual" },
    });

    if (error) {
      let message = error.message ?? "블로그 동기화 요청에 실패했습니다.";
      try {
        const body = await (error as { context?: Response }).context?.json?.() as { error?: string } | undefined;
        message = body?.error ?? message;
      } catch {
        // Edge Function error bodies are not guaranteed to be JSON.
      }
      logSupabaseFailure("architecture-map", "trigger_manual_blog_sync", new Error(message));
      setBlogSyncError(message);
      setBlogSyncLoading(false);
      return;
    }

    setBlogSyncResult((data ?? {}) as BlogSyncResult);
    await loadBlogRuns();
    setBlogSyncLoading(false);
  };

  useEffect(() => {
    if (!window.electronAPI?.readMapData) return;
    void window.electronAPI.readMapData().then((result) => {
      if (result.ok && result.data) {
        const previousSnapshot = readStoredMapSnapshot();
        setMapData(result.data);
        setMapDiff(computeArchitectureMapDiff(previousSnapshot, result.data));
        writeStoredMapSnapshot(result.data);
      }
    });
  }, []);

  useEffect(() => {
    void loadQaRuns();
  }, []);

  useEffect(() => {
    void loadBlogRuns();
  }, []);

  useEffect(() => {
    if (!window.electronAPI?.getGithubTokenStatus) return;
    void window.electronAPI.getGithubTokenStatus().then((result) => {
      if (result.ok) setGithubTokenConnected(result.connected);
    });
  }, []);

  const handleMapRefresh = async () => {
    if (!window.electronAPI?.refreshMap) return;
    const previousMap = mapData;
    setMapRefreshStatus("loading");
    const result = await window.electronAPI.refreshMap();
    if (!result.ok) {
      setMapRefreshStatus("error");
      setTimeout(() => setMapRefreshStatus("idle"), 3000);
      return;
    }
    const readResult = await window.electronAPI.readMapData();
    if (readResult.ok && readResult.data) {
      setMapData(readResult.data);
      setMapDiff(computeArchitectureMapDiff(previousMap, readResult.data));
      writeStoredMapSnapshot(readResult.data);
    }
    setMapRefreshStatus("ok");
    setTimeout(() => setMapRefreshStatus("idle"), 2000);
  };

  useEffect(() => {
    let cancelled = false;
    const since = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();

    async function fetchLogs() {
      setLoading(true);
      setLoadError(null);
      const [issuesInvoke, logsInvoke] = await Promise.all([
        supabase.functions.invoke("decrypt-error-logs", {
          body: { type: "issues", statuses: VISIBLE_ISSUE_STATUSES, limit: 300 },
        }),
        supabase.functions.invoke("decrypt-error-logs", {
          body: { type: "logs", since, limit: 500 },
        }),
      ]);

      if (cancelled) return;

      const firstError = issuesInvoke.error ?? logsInvoke.error;
      if (firstError) {
        let errMsg = "에러 로그 조회 실패";
        try {
          const err = firstError as { context?: Response; message?: string };
          const body = await err.context?.json?.() as { error?: string } | null;
          errMsg = body?.error ?? err.message ?? errMsg;
        } catch {
          errMsg = (firstError as { message?: string }).message ?? errMsg;
        }
        if (cancelled) return;
        logSupabaseFailure("architecture-map", "fetch_error_issues_for_live_architecture_map", new Error(errMsg));
        setLoadError(errMsg);
        setIssues([]);
        setLogs([]);
      } else {
        setIssues((issuesInvoke.data?.data ?? []) as ErrorIssue[]);
        setLogs((logsInvoke.data?.data ?? []) as ErrorLog[]);
      }
      setLoading(false);
    }

    void fetchLogs();

    const MAX_RETRIES = 5;
    const BASE_RETRY_MS = 2_000;

    let activeIssuesChannel: ReturnType<typeof supabase.channel> | null = null;
    let activeLogsChannel: ReturnType<typeof supabase.channel> | null = null;
    const retryTimers: ReturnType<typeof setTimeout>[] = [];

    function subscribeIssuesChannel(attempt: number) {
      if (cancelled) return;
      const ch = supabase
        .channel(`realtime-error-issues-${windowMinutes}-${attempt}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "error_issues" },
          (payload) => {
            const next = payload.new as ErrorIssue;
            setIssues((prev) => {
              const rest = prev.filter((issue) => issue.fingerprint !== next.fingerprint);
              if (!VISIBLE_ISSUE_STATUSES.includes(next.status)) return rest;
              return [next, ...rest].sort((a, b) => new Date(b.last_seen_at).getTime() - new Date(a.last_seen_at).getTime()).slice(0, 300);
            });
          },
        )
        .subscribe((status) => {
          if (status !== "CHANNEL_ERROR" && status !== "TIMED_OUT") return;
          if (cancelled) return;
          void supabase.removeChannel(ch);
          activeIssuesChannel = null;
          if (attempt < MAX_RETRIES) {
            const t = setTimeout(() => { subscribeIssuesChannel(attempt + 1); }, BASE_RETRY_MS * Math.pow(2, attempt));
            retryTimers.push(t);
          } else {
            logActionFailure("architecture-map", "subscribe_error_issues_realtime", `Realtime subscription ${status}`, {
              severity: "medium",
              context: { status, windowMinutes, attempt },
            });
          }
        });
      activeIssuesChannel = ch;
    }

    function subscribeLogsChannel(attempt: number) {
      if (cancelled) return;
      const ch = supabase
        .channel(`realtime-error-logs-history-${windowMinutes}-${attempt}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "error_logs" },
          (payload) => {
            const next = payload.new as ErrorLog;
            if (new Date(next.created_at).getTime() < new Date(since).getTime()) return;
            setLogs((prev) => [next, ...prev].slice(0, 500));
          },
        )
        .subscribe((status) => {
          if (status !== "CHANNEL_ERROR" && status !== "TIMED_OUT") return;
          if (cancelled) return;
          void supabase.removeChannel(ch);
          activeLogsChannel = null;
          if (attempt < MAX_RETRIES) {
            const t = setTimeout(() => { subscribeLogsChannel(attempt + 1); }, BASE_RETRY_MS * Math.pow(2, attempt));
            retryTimers.push(t);
          } else {
            logActionFailure("architecture-map", "subscribe_error_logs_realtime", `Realtime subscription ${status}`, {
              severity: "medium",
              context: { status, windowMinutes, attempt },
            });
          }
        });
      activeLogsChannel = ch;
    }

    subscribeIssuesChannel(0);
    subscribeLogsChannel(0);

    return () => {
      cancelled = true;
      retryTimers.forEach(clearTimeout);
      if (activeIssuesChannel) void supabase.removeChannel(activeIssuesChannel);
      if (activeLogsChannel) void supabase.removeChannel(activeLogsChannel);
    };
  }, [windowMinutes]);

  const issuesBySource = useMemo(() => {
    const grouped = new Map<string, ErrorIssue[]>();
    for (const issue of issues) {
      grouped.set(issue.source, [...(grouped.get(issue.source) ?? []), issue]);
    }
    return grouped;
  }, [issues]);

  const activeIssues = useMemo(() => issues.filter((issue) => ACTIVE_ISSUE_STATUSES.has(issue.status)), [issues]);

  const activeIssuesBySource = useMemo(() => {
    const grouped = new Map<string, ErrorIssue[]>();
    for (const issue of activeIssues) {
      grouped.set(issue.source, [...(grouped.get(issue.source) ?? []), issue]);
    }
    return grouped;
  }, [activeIssues]);

  const logsBySource = useMemo(() => {
    const grouped = new Map<string, ErrorLog[]>();
    for (const log of logs) {
      grouped.set(log.source, [...(grouped.get(log.source) ?? []), log]);
    }
    return grouped;
  }, [logs]);

  const logsByFingerprint = useMemo(() => {
    const grouped = new Map<string, ErrorLog[]>();
    for (const log of logs) {
      grouped.set(log.fingerprint, [...(grouped.get(log.fingerprint) ?? []), log]);
    }
    return grouped;
  }, [logs]);

  const nodesById = useMemo(() => new Map(mapData.nodes.map((node) => [node.id, node])), [mapData]);
  const clustersById = useMemo(() => new Map(mapData.clusters.map((cluster) => [cluster.id, cluster])), [mapData]);
  const selectedNode = selectedId ? nodesById.get(selectedId) ?? null : null;
  const selectedIssue = selectedFingerprint ? issues.find((issue) => issue.fingerprint === selectedFingerprint) ?? null : null;
  const activeId = hoveredId ?? selectedId;

  const positioned = useMemo(() => {
    const clusterOrder = mapData.clusters.map((cluster) => cluster.id);
    const visibleNodes = mapData.nodes.filter((node) => visibleForFilter(node, filter, activeIssuesBySource.get(node.id)?.length ?? 0));
    const byCluster = new Map<string, MapNode[]>();
    for (const node of visibleNodes) {
      byCluster.set(node.cluster, [...(byCluster.get(node.cluster) ?? []), node]);
    }

    const positions = new Map<string, PositionedNode>();
    const clusterBounds: ClusterBounds[] = [];
    let maxRows = 1;

    clusterOrder.forEach((clusterId, columnIndex) => {
      const clusterNodes = byCluster.get(clusterId) ?? [];
      maxRows = Math.max(maxRows, clusterNodes.length);
      const cluster = mapData.clusters.find((item) => item.id === clusterId);
      const clusterColor = cluster?.color ?? "blue";
      const clusterStatuses: NodeStatus[] = [];
      clusterNodes.forEach((node, rowIndex) => {
        const status = getNodeStatus(node.id, issuesBySource, logsBySource);
        clusterStatuses.push(status);
        positions.set(node.id, {
          ...node,
          x: columnIndex * (MAP_LAYOUT.columnWidth + MAP_LAYOUT.columnGap),
          y: MAP_LAYOUT.clusterHeaderHeight + rowIndex * (MAP_LAYOUT.nodeHeight + MAP_LAYOUT.rowGap),
          w: MAP_LAYOUT.columnWidth,
          h: MAP_LAYOUT.nodeHeight,
          color: clusterColor,
          status,
        });
      });
      const nodeRows = Math.max(clusterNodes.length, 1);
      clusterBounds.push({
        id: clusterId,
        label: cluster?.displayLabel ?? cluster?.label ?? clusterId,
        description: cluster?.description ?? "",
        x: columnIndex * (MAP_LAYOUT.columnWidth + MAP_LAYOUT.columnGap) - 18,
        y: -22,
        w: MAP_LAYOUT.columnWidth + 36,
        h: MAP_LAYOUT.clusterHeaderHeight + nodeRows * (MAP_LAYOUT.nodeHeight + MAP_LAYOUT.rowGap) + 28,
        color: clusterColor,
        nodeCount: clusterNodes.length,
        status: highestStatus(clusterStatuses),
      });
    });

    const width = clusterOrder.length * (MAP_LAYOUT.columnWidth + MAP_LAYOUT.columnGap) + 80;
    const height = MAP_LAYOUT.clusterHeaderHeight + maxRows * (MAP_LAYOUT.nodeHeight + MAP_LAYOUT.rowGap) + 120;
    return { positions, visibleNodes, clusterBounds, width, height };
  }, [activeIssuesBySource, filter, issuesBySource, logsBySource, mapData]);

  const visibleEdges = useMemo(
    () => mapData.edges.filter((edge) => positioned.positions.has(edge.from) && positioned.positions.has(edge.to)),
    [positioned.positions],
  );

  const connectedIds = useMemo(() => {
    if (!activeId) return new Set<string>();
    const ids = new Set([activeId]);
    for (const edge of mapData.edges) {
      if (edge.from === activeId) ids.add(edge.to);
      if (edge.to === activeId) ids.add(edge.from);
    }
    return ids;
  }, [activeId]);

  const searchResults = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return [];
    return mapData.nodes
      .filter((node) => getSearchTokens(node, clustersById.get(node.cluster)).includes(query))
      .slice(0, 8);
  }, [clustersById, searchTerm]);

  const selectedIssues = selectedId ? activeIssuesBySource.get(selectedId) ?? [] : [];
  const selectedIssueLogs = selectedIssue ? logsByFingerprint.get(selectedIssue.fingerprint) ?? [] : [];
  const errorNodes = Array.from(activeIssuesBySource.entries()).sort((a, b) => b[1].length - a[1].length);
  const watchNodes = mapData.nodes.filter((node) => getNodeStatus(node.id, issuesBySource, logsBySource) === "watch");
  const mapViewport = {
    width: positioned.width + MAP_VIEWBOX_PADDING * 2,
    height: positioned.height + MAP_VIEWBOX_PADDING * 2,
    displayWidth: Math.max(1320, (positioned.width + MAP_VIEWBOX_PADDING * 2) * STATIC_MAP_SCALE),
    displayHeight: Math.max(620, (positioned.height + MAP_VIEWBOX_PADDING * 2) * STATIC_MAP_SCALE),
  };
  const visibleQaRuns = useMemo(() => qaRuns.filter((run) => !qaHiddenIds.has(run.id)), [qaHiddenIds, qaRuns]);
  const visibleBlogRuns = useMemo(() => blogRuns.filter((run) => !blogHiddenIds.has(run.id)), [blogHiddenIds, blogRuns]);
  const unreadQaCount = visibleQaRuns.filter((run) => !qaReadIds.has(run.id)).length;
  const unreadBlogCount = visibleBlogRuns.filter((run) => !blogReadIds.has(run.id)).length;
  const unreadAlertsCount = unreadQaCount + unreadBlogCount;
  const incidentItems = useMemo<IncidentFeedItem[]>(() => {
    const issueItems = activeIssues.map((issue) => {
      const node = nodesById.get(issue.source);
      return {
        id: `issue-${issue.fingerprint}`,
        kind: "issue" as const,
        severity: issue.severity,
        title: node?.label ?? issue.source,
        subtitle: issue.message,
        meta: `${issue.status} · ${issue.occurrence_count}회 · ${formatTime(issue.last_seen_at)}`,
        createdAt: issue.last_seen_at,
        nodeId: issue.source,
      };
    });

    const qaItems = visibleQaRuns
      .filter((run) => run.status !== "completed" || run.conclusion !== "success")
      .map((run) => {
        const suiteLabel = run.suite ? QA_SUITES.find((suite) => suite.id === run.suite)?.label ?? run.suite : "Suite 미상";
        return {
          id: `qa-${run.id}`,
          kind: "qa" as const,
          severity: getQaIncidentSeverity(run),
          title: `${suiteLabel} QA`,
          subtitle: run.failedStep
            ? `${run.failedStep.job} / ${run.failedStep.step}`
            : `${run.status}${run.conclusion ? ` · ${run.conclusion}` : ""}`,
          meta: `#${run.runNumber} · ${formatTime(run.updatedAt)}`,
          createdAt: run.updatedAt,
          href: run.htmlUrl,
        };
      });

    const blogItems = visibleBlogRuns
      .filter((run) => run.status !== "success" || run.failed_count > 0 || Boolean(run.error))
      .map((run) => ({
        id: `blog-${run.id}`,
        kind: "blog" as const,
        severity: getBlogIncidentSeverity(run),
        title: `${formatTriggerSource(run.trigger_source)} 블로그 동기화`,
        subtitle: run.error ?? getBlogRunSummary(run),
        meta: `${run.status} · ${formatTime(run.created_at)}`,
        createdAt: run.finished_at ?? run.started_at ?? run.created_at,
        href: run.github_run_id
          ? `https://github.com/wjddnjs0419-sudo/Global-X-Pass/actions/runs/${run.github_run_id}`
          : NAVER_BLOG_SYNC_WORKFLOW_URL,
      }));

    return [...issueItems, ...qaItems, ...blogItems]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [activeIssues, nodesById, visibleBlogRuns, visibleQaRuns]);

  const openExternalHref = (href: string) => {
    window.open(href, "_blank", "noopener,noreferrer");
  };

  const focusNode = (nodeId: string) => {
    setSidebarTab("map");
    if (!positioned.positions.get(nodeId) && !getFallbackNodePosition(nodeId, mapData)) {
      setFilter("all");
      setSelectedId(nodeId);
      setSelectedFingerprint(null);
      setSearchOpen(false);
      return;
    }
    if (!positioned.positions.has(nodeId)) setFilter("all");
    setSelectedId(nodeId);
    setSelectedFingerprint(null);
    setSearchOpen(false);
  };

  const clearSelection = () => {
    setSidebarTab("map");
    setSelectedId(null);
    setSelectedFingerprint(null);
  };

  const toggleQaRunSelection = (runId: string) => {
    setQaSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(runId)) next.delete(runId);
      else next.add(runId);
      return next;
    });
  };

  const setAllQaSelected = (selected: boolean) => {
    setQaSelectedIds(selected ? new Set(visibleQaRuns.map((run) => run.id)) : new Set());
  };

  const markQaRunsRead = (ids: string[]) => {
    const nextReadIds = new Set(qaReadIds);
    ids.forEach((id) => nextReadIds.add(id));
    persistQaInboxState(nextReadIds, qaHiddenIds);
  };

  const hideQaRuns = (ids: string[]) => {
    const nextHiddenIds = new Set(qaHiddenIds);
    ids.forEach((id) => nextHiddenIds.add(id));
    persistQaInboxState(qaReadIds, nextHiddenIds);
    setQaSelectedIds(new Set());
  };

  const toggleBlogRunSelection = (runId: string) => {
    setBlogSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(runId)) next.delete(runId);
      else next.add(runId);
      return next;
    });
  };

  const setAllBlogSelected = (selected: boolean) => {
    setBlogSelectedIds(selected ? new Set(visibleBlogRuns.map((run) => run.id)) : new Set());
  };

  const markBlogRunsRead = (ids: string[]) => {
    const nextReadIds = new Set(blogReadIds);
    ids.forEach((id) => nextReadIds.add(id));
    persistBlogInboxState(nextReadIds, blogHiddenIds);
  };

  const hideBlogRuns = (ids: string[]) => {
    const nextHiddenIds = new Set(blogHiddenIds);
    ids.forEach((id) => nextHiddenIds.add(id));
    persistBlogInboxState(blogReadIds, nextHiddenIds);
    setBlogSelectedIds(new Set());
  };

  const updateIssueStatus = async (fingerprint: string, action: "monitoring" | "resolved" | "ignored") => {
    const rpcName = action === "monitoring"
      ? "mark_error_issue_monitoring"
      : action === "resolved"
      ? "resolve_error_issue"
      : "ignore_error_issue";

    setIssues((prev) => {
      if (action === "resolved") return prev.filter((issue) => issue.fingerprint !== fingerprint);
      return prev.map((issue) => (
        issue.fingerprint === fingerprint
          ? {
              ...issue,
              status: action,
              monitoring_at: action === "monitoring" ? new Date().toISOString() : issue.monitoring_at,
              ignored_at: action === "ignored" ? new Date().toISOString() : issue.ignored_at,
            }
          : issue
      ));
    });
    if (selectedFingerprint === fingerprint) setSelectedFingerprint(null);

    const { error } = await supabase.rpc(rpcName, { p_fingerprint: fingerprint, p_note: null });
    if (error) {
      logSupabaseFailure("architecture-map", `update_error_issue_${action}`, error, {
        context: { fingerprint, action },
      });
      setLoadError(error.message);
    }
  };

  useEffect(() => {
    if (!selectedId) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        clearSelection();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedId]);

  return (
    <section style={{ height: "100vh", minHeight: 0, display: "flex", flexDirection: "column", background: "#0f0f0f", overflow: "hidden" }}>
      <div style={{ flex: "0 0 auto", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", borderBottom: "1px solid #2a2a2a", background: "#161616", padding: "10px 14px" }}>
        <h3 style={{ margin: "0 8px 0 0", color: "#e8e8e8", fontSize: 13, fontWeight: 800, whiteSpace: "nowrap" }}>
          Global X Pass — Architecture Map
        </h3>
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            data-monitor-action={`live-map-filter-${item.id}`}
            onClick={() => {
              setFilter(item.id);
              setSidebarTab("map");
              clearSelection();
            }}
            style={{
              border: `1px solid ${filter === item.id ? "#4ea1ff" : "#2a2a2a"}`,
              background: filter === item.id ? "#1e2a3a" : "#1c1c1c",
              color: filter === item.id ? "#4ea1ff" : "#8a8a8a",
              borderRadius: 999,
              padding: "5px 11px",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {item.label}
          </button>
        ))}
        {[
          `${mapData.nodes.length} nodes`,
          `${mapData.edges.length} wires`,
          `${loading ? "…" : errorNodes.length} issues`,
          `${watchNodes.length} watch`,
        ].map((label) => (
          <span key={label} style={{ border: "1px solid #2a2a2a", background: "#111", color: "#8a8a8a", borderRadius: 999, padding: "5px 10px", fontSize: 11, fontWeight: 700 }}>
            {label}
          </span>
        ))}
        <button
          type="button"
          data-monitor-action="open-alerts"
          onClick={() => setSidebarTab("alerts")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            border: `1px solid ${sidebarTab === "alerts" ? "#4ea1ff" : "#2a2a2a"}`,
            background: sidebarTab === "alerts" ? "#1e2a3a" : "#1c1c1c",
            color: sidebarTab === "alerts" ? "#4ea1ff" : "#8a8a8a",
            borderRadius: 999,
            padding: "5px 11px",
            fontSize: 11,
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          <Bell size={12} aria-hidden />
          Alerts
          {unreadAlertsCount > 0 && (
            <span style={{ minWidth: 18, height: 18, borderRadius: 999, background: "#ea4335", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 900 }}>
              {unreadAlertsCount > 99 ? "99+" : unreadAlertsCount}
            </span>
          )}
        </button>
        <button
          type="button"
          data-monitor-action="open-ops-panel"
          onClick={() => setSidebarTab("ops")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            border: `1px solid ${sidebarTab === "ops" ? "#4ea1ff" : "#2a2a2a"}`,
            background: sidebarTab === "ops" ? "#1e2a3a" : "#1c1c1c",
            color: sidebarTab === "ops" ? "#4ea1ff" : "#8a8a8a",
            borderRadius: 999,
            padding: "5px 11px",
            fontSize: 11,
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          <PlayCircle size={12} aria-hidden />
          Ops
        </button>
        <div style={{ position: "relative", minWidth: 210, flex: "0 1 250px" }}>
          <Search size={13} aria-hidden style={{ position: "absolute", left: 10, top: 9, color: "#8a8a8a" }} />
          <input
            type="search"
            value={searchTerm}
            onFocus={() => setSearchOpen(true)}
            onChange={(event) => {
              setSearchTerm(event.target.value);
              setSearchOpen(true);
            }}
            placeholder="Search"
            style={{
              width: "100%",
              border: "1px solid #2a2a2a",
              background: "#1c1c1c",
              color: "#e8e8e8",
              borderRadius: 999,
              padding: "6px 10px 6px 30px",
              fontSize: 11,
              outline: "none",
            }}
          />
          {searchOpen && searchTerm.trim() && (
            <div style={{ position: "absolute", zIndex: 5, top: 36, left: 0, right: 0, border: "1px solid #2a2a2a", background: "#161616", borderRadius: 8, padding: 6, boxShadow: "0 18px 40px rgba(0,0,0,0.45)", maxHeight: 290, overflow: "auto" }}>
              {searchResults.length === 0 ? (
                <div style={{ color: "#8a8a8a", fontSize: 11, padding: "9px 10px" }}>검색 결과가 없습니다.</div>
              ) : searchResults.map((node) => {
                const cluster = clustersById.get(node.cluster);
                const status = getNodeStatus(node.id, issuesBySource, logsBySource);
                return (
                  <button
                    key={node.id}
                    type="button"
                    data-monitor-action="live-map-search-result"
                    onClick={() => focusNode(node.id)}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "10px minmax(0, 1fr)",
                      gap: 9,
                      width: "100%",
                      border: 0,
                      background: "transparent",
                      color: "#e8e8e8",
                      borderRadius: 6,
                      padding: "8px 9px",
                      textAlign: "left",
                      cursor: "pointer",
                    }}
                  >
                    <span style={{ width: 8, height: 8, borderRadius: "999px", background: STATUS_META[status].color, marginTop: 5 }} />
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: "block", fontSize: 11, fontWeight: 850, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{node.label}</span>
                      <span style={{ display: "block", color: "#8a8a8a", fontSize: 10, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cluster?.displayLabel ?? cluster?.label ?? node.cluster} · {node.path}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        {window.electronAPI?.refreshMap && (
          <button
            type="button"
            data-monitor-action="live-map-refresh-structure"
            onClick={() => { void handleMapRefresh(); }}
            disabled={mapRefreshStatus === "loading"}
            style={{
              border: `1px solid ${mapRefreshStatus === "error" ? "#ea4335" : mapRefreshStatus === "ok" ? "#34a853" : "#2a2a2a"}`,
              background: mapRefreshStatus === "error" ? "#2a1010" : mapRefreshStatus === "ok" ? "#0f2a15" : "#1c1c1c",
              color: mapRefreshStatus === "error" ? "#ea4335" : mapRefreshStatus === "ok" ? "#34a853" : "#8a8a8a",
              borderRadius: 999,
              padding: "5px 13px",
              fontSize: 11,
              fontWeight: 700,
              cursor: mapRefreshStatus === "loading" ? "wait" : "pointer",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {mapRefreshStatus === "loading" ? "업데이트 중…" : mapRefreshStatus === "ok" ? "✓ 완료" : mapRefreshStatus === "error" ? "✗ 실패" : "구조 새로고침"}
          </button>
        )}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginLeft: "auto" }}>
          {WINDOW_OPTIONS.map((option) => (
            <button
              key={option.minutes}
              type="button"
              data-monitor-action={`live-map-window-${option.minutes}`}
              onClick={() => setWindowMinutes(option.minutes)}
              style={{
                border: `1px solid ${windowMinutes === option.minutes ? "#f5b942" : "#2a2a2a"}`,
                background: windowMinutes === option.minutes ? "#2b240f" : "#1c1c1c",
                color: windowMinutes === option.minutes ? "#f5b942" : "#8a8a8a",
                borderRadius: 6,
                padding: "5px 10px",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", minHeight: 0, overflow: "hidden" }}>
        <div style={{ flex: 1, minWidth: 0, position: "relative", overflow: "auto", background: "#0f0f0f" }}>
          <svg
            width={mapViewport.displayWidth}
            height={mapViewport.displayHeight}
            viewBox={`${-MAP_VIEWBOX_PADDING} ${-MAP_VIEWBOX_PADDING} ${mapViewport.width} ${mapViewport.height}`}
            preserveAspectRatio="xMinYMin meet"
            onClick={(event) => {
              if (event.target === event.currentTarget) clearSelection();
            }}
            onMouseLeave={() => {
              setHoveredId(null);
            }}
            style={{ display: "block", cursor: "default" }}
          >
            <defs>
              <marker id="live-map-arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
                <path d="M0,0 L0,6 L9,3 z" fill="var(--color-text-muted)" />
              </marker>
            </defs>
            <g>
              {positioned.clusterBounds.map((cluster) => (
                <g key={cluster.id}>
                  <rect
                    x={cluster.x}
                    y={cluster.y}
                    width={cluster.w}
                    height={cluster.h}
                    rx="18"
                    fill={getClusterPalette(cluster.color).clusterFill}
                    stroke={getClusterStroke(cluster.color, cluster.status)}
                    strokeWidth={cluster.status === "safe" ? 0.8 : 1.6}
                    opacity={activeId ? 0.38 : 0.58}
                  />
                  <text x={cluster.x + 16} y={cluster.y + 28} fill="var(--color-text-primary)" fontSize={STATIC_MAP_SCALE < 0.62 ? 18 : 15} fontWeight="900">
                    {cluster.label}
                  </text>
                  {STATIC_MAP_SCALE > 0.62 && (
                    <>
                      <text x={cluster.x + 16} y={cluster.y + 48} fill="var(--color-text-secondary)" fontSize="10" fontWeight="700">
                        {STATUS_META[cluster.status].label} · {cluster.nodeCount}개 파일
                      </text>
                      <text x={cluster.x + 16} y={cluster.y + 64} fill="var(--color-text-muted)" fontSize="9">
                        {cluster.description.length > 28 ? `${cluster.description.slice(0, 27)}…` : cluster.description}
                      </text>
                    </>
                  )}
                </g>
              ))}

              {visibleEdges.map((edge) => {
                const from = positioned.positions.get(edge.from);
                const to = positioned.positions.get(edge.to);
                if (!from || !to) return null;
                const x1 = from.x + from.w;
                const y1 = from.y + from.h / 2;
                const x2 = to.x;
                const y2 = to.y + to.h / 2;
                const muted = activeId && !connectedIds.has(edge.from) && !connectedIds.has(edge.to);
                const edgeStatus = highestStatus([from.status, to.status]);
                const stroke = edge.kind === "critical" && edgeStatus === "safe" ? "var(--color-brand-red)" : STATUS_META[edgeStatus].color;
                return (
                  <path
                    key={`${edge.from}-${edge.to}-${edge.label}`}
                    d={`M ${x1} ${y1} C ${x1 + 42} ${y1}, ${x2 - 42} ${y2}, ${x2} ${y2}`}
                    fill="none"
                    stroke={stroke}
                    strokeWidth={edgeStatus === "danger" ? 2.4 : edgeStatus === "watch" ? 1.8 : edge.kind === "critical" ? 1.5 : 1}
                    opacity={muted ? 0.08 : edgeStatus === "safe" ? 0.22 : 0.5}
                    markerEnd="url(#live-map-arrow)"
                  />
                );
              })}

              {Array.from(positioned.positions.values()).map((node) => {
                const nodeIssues = activeIssuesBySource.get(node.id) ?? [];
                const highest = nodeIssues.reduce<Severity | null>((acc, issue) => {
                  if (!acc) return issue.severity;
                  return SEVERITY_RANK[issue.severity] > SEVERITY_RANK[acc] ? issue.severity : acc;
                }, null);
                const dimmed = activeId && !connectedIds.has(node.id);
                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x},${node.y})`}
                    onClick={(event) => {
                      event.stopPropagation();
                      setSidebarTab("map");
                      setSelectedId(node.id);
                      setSelectedFingerprint(null);
                    }}
                    onMouseEnter={() => setHoveredId(node.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    style={{ cursor: "pointer", opacity: dimmed ? 0.22 : 1 }}
                  >
                    <rect
                      width={node.w}
                      height={node.h}
                      rx="10"
                      fill={getClusterPalette(node.color).nodeFill}
                      stroke={highest ? SEVERITY_COLOR[highest] : getClusterStroke(node.color, node.status)}
                      strokeWidth={node.critical || node.status !== "safe" ? 2.4 : 1.2}
                    />
                    <rect x="0" y="0" width={node.w} height="8" rx="10" fill={getClusterPalette(node.color).accentFill} />
                    <circle cx="14" cy="14" r="4" fill={STATUS_META[node.status].color} />
                    {node.dead && (
                      <rect x="8" y="8" width="36" height="16" rx="8" fill="var(--color-brand-yellow)" opacity="0.16" />
                    )}
                    {STATIC_MAP_SCALE > 0.5 ? (
                      <>
                        <text x="14" y="31" fill="var(--color-text-primary)" fontSize="12" fontWeight="800">
                          {node.label.length > 24 ? `${node.label.slice(0, 23)}…` : node.label}
                        </text>
                        <text x="14" y="52" fill="var(--color-text-secondary)" fontSize="10">
                          {node.sub.length > 32 ? `${node.sub.slice(0, 31)}…` : node.sub}
                        </text>
                      </>
                    ) : (
                      <text x="14" y="42" fill="var(--color-text-primary)" fontSize="12" fontWeight="900">
                        {STATUS_META[node.status].label}
                      </text>
                    )}
                    {nodeIssues.length > 0 && (
                      <g transform={`translate(${node.w - 30}, -8)`}>
                        <circle r="13" cx="13" cy="13" fill={highest ? SEVERITY_COLOR[highest] : "var(--color-brand-red)"} />
                        <text x="13" y="17" fill="var(--color-on-primary)" fontSize="11" fontWeight="900" textAnchor="middle">
                          {nodeIssues.length > 99 ? "99+" : nodeIssues.length}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>
        </div>
        <aside style={{ width: 360, flex: "0 0 360px", background: "#161616", borderLeft: "1px solid #2a2a2a", overflow: "auto", padding: "14px 14px 18px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 14 }}>
            {[
              { id: "map" as SidebarTab, label: "Map", icon: LocateFixed },
              { id: "alerts" as SidebarTab, label: "Alerts", icon: Bell },
              { id: "ops" as SidebarTab, label: "Ops", icon: PlayCircle },
            ].map((item) => {
              const Icon = item.icon;
              const active = sidebarTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSidebarTab(item.id)}
                  style={{
                    border: `1px solid ${active ? "#4ea1ff" : "#2a2a2a"}`,
                    background: active ? "#1e2a3a" : "#1c1c1c",
                    color: active ? "#4ea1ff" : "#8a8a8a",
                    borderRadius: 7,
                    padding: "8px 10px",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 7,
                    fontSize: 11,
                    fontWeight: 900,
                    cursor: "pointer",
                  }}
                >
                  <Icon size={13} aria-hidden />
                  {item.label}
                  {item.id === "alerts" && unreadAlertsCount > 0 && (
                    <span style={{ minWidth: 17, height: 17, borderRadius: 999, background: "#ea4335", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 900 }}>
                      {unreadAlertsCount > 99 ? "99+" : unreadAlertsCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {loadError && (
            <div style={{ color: "#ff3860", borderLeft: "3px solid #ff3860", background: "#1a1010", padding: "8px 10px", fontSize: 11, lineHeight: 1.6, marginBottom: 14 }}>
              error_issues 조회 실패: {loadError}
            </div>
          )}
          {sidebarTab === "alerts" ? (
            <AlertsSidebar
              qaRuns={visibleQaRuns}
              qaLoading={qaLoading}
              qaError={qaError}
              qaFetchedAt={qaFetchedAt}
              qaSelectedIds={qaSelectedIds}
              qaReadIds={qaReadIds}
              tokenConnected={githubTokenConnected}
              tokenInput={githubTokenInput}
              tokenSaving={githubTokenSaving}
              tokenError={githubTokenError}
              blogRuns={visibleBlogRuns}
              blogLoading={blogLoading}
              blogError={blogError}
              blogFetchedAt={blogFetchedAt}
              blogSelectedIds={blogSelectedIds}
              blogReadIds={blogReadIds}
              onTokenInputChange={setGithubTokenInput}
              onSaveToken={() => { void saveGithubToken(); }}
              onClearToken={() => { void clearGithubToken(); }}
              onRefreshQa={() => { void loadQaRuns(); }}
              onRefreshBlog={() => { void loadBlogRuns(); }}
              onToggleQaSelection={toggleQaRunSelection}
              onSelectAllQa={setAllQaSelected}
              onMarkQaRead={(ids) => markQaRunsRead(ids)}
              onHideQa={(ids) => hideQaRuns(ids)}
              onToggleBlogSelection={toggleBlogRunSelection}
              onSelectAllBlog={setAllBlogSelected}
              onMarkBlogRead={(ids) => markBlogRunsRead(ids)}
              onHideBlog={(ids) => hideBlogRuns(ids)}
            />
          ) : sidebarTab === "ops" ? (
            <OperationsSidebar
              selectedQaSuite={selectedQaSuite}
              qaTriggerLoading={qaTriggerLoading}
              qaTriggerMessage={qaTriggerMessage}
              qaTriggerError={qaTriggerError}
              visibleQaLoading={visibleQaLoading}
              visibleQaMessage={visibleQaMessage}
              visibleQaError={visibleQaError}
              qaTokenConnected={githubTokenConnected}
              syncLoading={blogSyncLoading}
              syncResult={blogSyncResult}
              syncError={blogSyncError}
              onQaSuiteChange={setSelectedQaSuite}
              onTriggerQaRun={() => { void triggerQaRun(selectedQaSuite); }}
              onRunVisibleQa={() => { void runVisibleQa(selectedQaSuite); }}
              onTriggerBlogSync={() => { void triggerBlogSync(); }}
            />
          ) : selectedNode ? (
            <NodeSidebar
              node={selectedNode}
              status={getNodeStatus(selectedNode.id, issuesBySource, logsBySource)}
              issues={selectedIssues}
              selectedIssue={selectedIssue}
              selectedIssueLogs={selectedIssueLogs}
              edges={mapData.edges}
              onSelectIssue={setSelectedFingerprint}
              onUpdateIssueStatus={updateIssueStatus}
              onOpenTerminal={openTerminal}
            />
          ) : (
            <ArchitectureMapSidebar
              loading={loading}
              generatedAt={mapData.generatedAt}
              nodeCount={mapData.nodes.length}
              edgeCount={mapData.edges.length}
              mapDiff={mapDiff}
              incidents={incidentItems}
              activeIssues={activeIssues}
              activeIssuesBySource={activeIssuesBySource}
              watchNodes={watchNodes}
              nodesById={nodesById}
              onFocusNode={focusNode}
              onOpenHref={openExternalHref}
              onOpenTerminal={openTerminal}
            />
          )}
        </aside>
      </div>
    </section>
  );
}

function getQaRunMeta(run: QaRun) {
  if (run.status !== "completed") {
    return { label: "진행중", color: "#4ea1ff", bg: "#102033" };
  }
  if (run.conclusion === "success") {
    return { label: "성공", color: "#34a853", bg: "#0f2a15" };
  }
  if (run.conclusion === "cancelled" || run.conclusion === "skipped") {
    return { label: "중단", color: "#f5b942", bg: "#2b240f" };
  }
  return { label: "실패", color: "#ea4335", bg: "#2a1010" };
}

function AlertsSidebar({
  qaRuns,
  qaLoading,
  qaError,
  qaFetchedAt,
  qaSelectedIds,
  qaReadIds,
  tokenConnected,
  tokenInput,
  tokenSaving,
  tokenError,
  blogRuns,
  blogLoading,
  blogError,
  blogFetchedAt,
  blogSelectedIds,
  blogReadIds,
  onTokenInputChange,
  onSaveToken,
  onClearToken,
  onRefreshQa,
  onRefreshBlog,
  onToggleQaSelection,
  onSelectAllQa,
  onMarkQaRead,
  onHideQa,
  onToggleBlogSelection,
  onSelectAllBlog,
  onMarkBlogRead,
  onHideBlog,
}: {
  qaRuns: QaRun[];
  qaLoading: boolean;
  qaError: string | null;
  qaFetchedAt: string | null;
  qaSelectedIds: Set<string>;
  qaReadIds: Set<string>;
  tokenConnected: boolean;
  tokenInput: string;
  tokenSaving: boolean;
  tokenError: string | null;
  blogRuns: BlogImportRun[];
  blogLoading: boolean;
  blogError: string | null;
  blogFetchedAt: string | null;
  blogSelectedIds: Set<string>;
  blogReadIds: Set<string>;
  onTokenInputChange: (value: string) => void;
  onSaveToken: () => void;
  onClearToken: () => void;
  onRefreshQa: () => void;
  onRefreshBlog: () => void;
  onToggleQaSelection: (runId: string) => void;
  onSelectAllQa: (selected: boolean) => void;
  onMarkQaRead: (ids: string[]) => void;
  onHideQa: (ids: string[]) => void;
  onToggleBlogSelection: (runId: string) => void;
  onSelectAllBlog: (selected: boolean) => void;
  onMarkBlogRead: (ids: string[]) => void;
  onHideBlog: (ids: string[]) => void;
}) {
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 12 }}>
        <div>
          <h2 style={{ fontSize: 13, fontWeight: 900, margin: 0, color: "#e8e8e8" }}>Alerts</h2>
          <div style={{ color: "#8a8a8a", fontSize: 10, marginTop: 4 }}>실행 결과와 운영 소식을 메일함처럼 쌓아 봅니다.</div>
        </div>
      </div>

      <div style={{ border: `1px solid ${tokenConnected ? "#1f4a2a" : "#2a2a2a"}`, background: tokenConnected ? "#0f1f14" : "#111", borderRadius: 8, padding: 10, marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
          <span style={{ color: tokenConnected ? "#34a853" : "#8a8a8a", fontSize: 11, fontWeight: 900 }}>
            GitHub {tokenConnected ? "연결됨" : "연결 필요"}
          </span>
          {tokenConnected && (
            <button type="button" onClick={onClearToken} style={compactDangerButtonStyle}>
              연결 해제
            </button>
          )}
        </div>
        <div style={{ color: "#8a8a8a", fontSize: 10, lineHeight: 1.5, marginBottom: tokenConnected ? 0 : 8 }}>
          QA Alerts 조회와 QA 수동 실행은 이 GitHub token 또는 fallback env를 사용합니다. 블로그 Alerts는 `blog_import_runs`를 읽습니다.
        </div>
        {!tokenConnected && (
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: 6 }}>
            <input
              type="password"
              value={tokenInput}
              onChange={(event) => onTokenInputChange(event.currentTarget.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") onSaveToken();
              }}
              placeholder="GitHub token"
              style={{
                minWidth: 0,
                border: "1px solid #2a2a2a",
                background: "#1c1c1c",
                color: "#e8e8e8",
                borderRadius: 6,
                padding: "8px 9px",
                fontSize: 11,
                outline: "none",
              }}
            />
            <button type="button" onClick={onSaveToken} disabled={tokenSaving} style={compactButtonStyle}>
              {tokenSaving ? "확인중" : "연결"}
            </button>
          </div>
        )}
        {tokenError && (
          <div style={{ color: "#ffb4b4", fontSize: 10, lineHeight: 1.5, marginTop: 7 }}>
            {tokenError}
          </div>
        )}
      </div>

      <QaAlertsSection
        runs={qaRuns}
        loading={qaLoading}
        error={qaError}
        fetchedAt={qaFetchedAt}
        selectedIds={qaSelectedIds}
        readIds={qaReadIds}
        onRefresh={onRefreshQa}
        onToggleSelection={onToggleQaSelection}
        onSelectAll={onSelectAllQa}
        onMarkRead={onMarkQaRead}
        onHide={onHideQa}
      />

      <div style={{ height: 1, background: "#2a2a2a", margin: "14px 0" }} />

      <BlogAlertsSection
        runs={blogRuns}
        loading={blogLoading}
        error={blogError}
        fetchedAt={blogFetchedAt}
        selectedIds={blogSelectedIds}
        readIds={blogReadIds}
        onRefresh={onRefreshBlog}
        onToggleSelection={onToggleBlogSelection}
        onSelectAll={onSelectAllBlog}
        onMarkRead={onMarkBlogRead}
        onHide={onHideBlog}
      />
    </>
  );
}

function QaAlertsSection({
  runs,
  loading,
  error,
  fetchedAt,
  selectedIds,
  readIds,
  onRefresh,
  onToggleSelection,
  onSelectAll,
  onMarkRead,
  onHide,
}: {
  runs: QaRun[];
  loading: boolean;
  error: string | null;
  fetchedAt: string | null;
  selectedIds: Set<string>;
  readIds: Set<string>;
  onRefresh: () => void;
  onToggleSelection: (runId: string) => void;
  onSelectAll: (selected: boolean) => void;
  onMarkRead: (ids: string[]) => void;
  onHide: (ids: string[]) => void;
}) {
  const allSelected = runs.length > 0 && runs.every((run) => selectedIds.has(run.id));
  const selectedRunIds = Array.from(selectedIds).filter((id) => runs.some((run) => run.id === id));
  const unreadCount = runs.filter((run) => !readIds.has(run.id)).length;

  return (
    <section>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 12 }}>
        <div>
          <h3 style={{ fontSize: 13, fontWeight: 900, margin: 0, color: "#e8e8e8" }}>QA</h3>
          <div style={{ color: "#8a8a8a", fontSize: 10, marginTop: 4 }}>
            {loading ? "동기화 중" : fetchedAt ? `동기화 ${formatTime(fetchedAt)}` : "동기화 대기"}
          </div>
        </div>
        <button type="button" onClick={onRefresh} disabled={loading} style={iconButtonStyle} title="새로고침">
          <RefreshCw size={14} aria-hidden />
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
        <label style={{ ...compactButtonStyle, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
          <input
            type="checkbox"
            checked={allSelected}
            onChange={(event) => onSelectAll(event.currentTarget.checked)}
            style={{ width: 13, height: 13, margin: 0 }}
          />
          전체 선택
        </label>
        <button type="button" disabled={selectedRunIds.length === 0} onClick={() => onMarkRead(selectedRunIds)} style={compactButtonStyle}>
          읽음
        </button>
        <button type="button" disabled={selectedRunIds.length === 0} onClick={() => onHide(selectedRunIds)} style={compactDangerButtonStyle}>
          선택 삭제
        </button>
        <button type="button" disabled={runs.length === 0} onClick={() => onHide(runs.map((run) => run.id))} style={compactDangerButtonStyle}>
          전체 삭제
        </button>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        <span style={qaMetricStyle}>{runs.length} inbox</span>
        <span style={qaMetricStyle}>{unreadCount} unread</span>
      </div>

      {error && (
        <div style={{ color: "#ffb4b4", borderLeft: "3px solid #ea4335", background: "#1a1010", padding: "8px 10px", fontSize: 11, lineHeight: 1.6, marginBottom: 12 }}>
          {error}
        </div>
      )}

      {runs.length === 0 && !loading ? (
        <div style={{ color: "#8a8a8a", fontSize: 12, lineHeight: 1.7, padding: "18px 4px" }}>
          표시할 QA 알림이 없습니다.
        </div>
      ) : runs.map((run) => {
        const meta = getQaRunMeta(run);
        const unread = !readIds.has(run.id);
        const selected = selectedIds.has(run.id);
        const suiteLabel = run.suite ? QA_SUITES.find((suite) => suite.id === run.suite)?.label ?? run.suite : "Suite 미상";
        const failedText = run.failedStep
          ? `${run.failedStep.job} / ${run.failedStep.step}`
          : run.conclusion && run.conclusion !== "success"
          ? "실패 step 정보를 불러오지 못했습니다."
          : null;

        return (
          <article key={run.id} style={{ border: `1px solid ${selected ? "#4ea1ff" : "#2a2a2a"}`, background: unread ? "#171d21" : "#121212", borderRadius: 8, padding: 10, marginBottom: 8 }}>
            <div style={{ display: "grid", gridTemplateColumns: "18px minmax(0, 1fr) auto", gap: 8, alignItems: "start" }}>
              <input
                type="checkbox"
                checked={selected}
                onChange={() => onToggleSelection(run.id)}
                style={{ width: 14, height: 14, marginTop: 3 }}
                aria-label={`${run.displayTitle} 선택`}
              />
              <button
                type="button"
                onClick={() => onMarkRead([run.id])}
                style={{ border: 0, background: "transparent", color: "#e8e8e8", padding: 0, textAlign: "left", minWidth: 0, cursor: "pointer" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                  {unread && <span style={{ width: 7, height: 7, borderRadius: 999, background: "#4ea1ff", flex: "0 0 auto" }} />}
                  <span style={{ fontSize: 12, fontWeight: unread ? 900 : 750, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    #{run.runNumber} {run.displayTitle}
                  </span>
                </div>
                <div style={{ color: "#8a8a8a", fontSize: 10, marginTop: 4 }}>
                  {suiteLabel} · {formatTime(run.createdAt)} · {run.branch} · {run.event}
                </div>
              </button>
              <span style={{ border: `1px solid ${meta.color}`, background: meta.bg, color: meta.color, borderRadius: 999, padding: "3px 7px", fontSize: 10, fontWeight: 900 }}>
                {meta.label}
              </span>
            </div>
            {failedText && (
              <div style={{ color: "#ffb4b4", fontSize: 11, lineHeight: 1.5, marginTop: 8, paddingLeft: 26 }}>
                {failedText}
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginTop: 9, paddingLeft: 26 }}>
              <span style={{ color: "#8a8a8a", fontSize: 10 }}>attempt {run.runAttempt} · {run.actor ?? "unknown"}</span>
              <button
                type="button"
                onClick={() => window.open(run.htmlUrl, "_blank", "noopener,noreferrer")}
                style={linkButtonStyle}
              >
                <ExternalLink size={12} aria-hidden />
                GitHub
              </button>
            </div>
          </article>
        );
      })}

      {runs.length > 0 && (
        <button type="button" onClick={() => onHide(runs.map((run) => run.id))} style={{ ...compactDangerButtonStyle, width: "100%", justifyContent: "center", marginTop: 6 }}>
          <Trash2 size={13} aria-hidden />
          인박스 비우기
        </button>
      )}
    </section>
  );
}

function BlogAlertsSection({
  runs,
  loading,
  error,
  fetchedAt,
  selectedIds,
  readIds,
  onRefresh,
  onToggleSelection,
  onSelectAll,
  onMarkRead,
  onHide,
}: {
  runs: BlogImportRun[];
  loading: boolean;
  error: string | null;
  fetchedAt: string | null;
  selectedIds: Set<string>;
  readIds: Set<string>;
  onRefresh: () => void;
  onToggleSelection: (runId: string) => void;
  onSelectAll: (selected: boolean) => void;
  onMarkRead: (ids: string[]) => void;
  onHide: (ids: string[]) => void;
}) {
  const allSelected = runs.length > 0 && runs.every((run) => selectedIds.has(run.id));
  const selectedRunIds = Array.from(selectedIds).filter((id) => runs.some((run) => run.id === id));
  const unreadCount = runs.filter((run) => !readIds.has(run.id)).length;

  return (
    <section>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 12 }}>
        <div>
          <h3 style={{ fontSize: 13, fontWeight: 900, margin: 0, color: "#e8e8e8" }}>블로그 동기화</h3>
          <div style={{ color: "#8a8a8a", fontSize: 10, marginTop: 4 }}>
            {loading ? "동기화 중" : fetchedAt ? `동기화 ${formatTime(fetchedAt)}` : "동기화 대기"}
          </div>
        </div>
        <button type="button" onClick={onRefresh} disabled={loading} style={iconButtonStyle} title="새로고침">
          <RefreshCw size={14} aria-hidden />
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
        <label style={{ ...compactButtonStyle, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
          <input
            type="checkbox"
            checked={allSelected}
            onChange={(event) => onSelectAll(event.currentTarget.checked)}
            style={{ width: 13, height: 13, margin: 0 }}
          />
          전체 선택
        </label>
        <button type="button" disabled={selectedRunIds.length === 0} onClick={() => onMarkRead(selectedRunIds)} style={compactButtonStyle}>
          읽음
        </button>
        <button type="button" disabled={selectedRunIds.length === 0} onClick={() => onHide(selectedRunIds)} style={compactDangerButtonStyle}>
          선택 삭제
        </button>
        <button type="button" disabled={runs.length === 0} onClick={() => onHide(runs.map((run) => run.id))} style={compactDangerButtonStyle}>
          전체 삭제
        </button>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        <span style={qaMetricStyle}>{runs.length} inbox</span>
        <span style={qaMetricStyle}>{unreadCount} unread</span>
      </div>

      {error && (
        <div style={{ color: "#ffb4b4", borderLeft: "3px solid #ea4335", background: "#1a1010", padding: "8px 10px", fontSize: 11, lineHeight: 1.6, marginBottom: 12 }}>
          {error}
        </div>
      )}

      {runs.length === 0 && !loading ? (
        <div style={{ color: "#8a8a8a", fontSize: 12, lineHeight: 1.7, padding: "18px 4px" }}>
          표시할 블로그 동기화 알림이 없습니다.
        </div>
      ) : runs.map((run) => {
        const meta = getBlogRunMeta(run);
        const unread = !readIds.has(run.id);
        const selected = selectedIds.has(run.id);

        return (
          <article key={run.id} style={{ border: `1px solid ${selected ? "#4ea1ff" : "#2a2a2a"}`, background: unread ? "#171d21" : "#121212", borderRadius: 8, padding: 10, marginBottom: 8 }}>
            <div style={{ display: "grid", gridTemplateColumns: "18px minmax(0, 1fr) auto", gap: 8, alignItems: "start" }}>
              <input
                type="checkbox"
                checked={selected}
                onChange={() => onToggleSelection(run.id)}
                style={{ width: 14, height: 14, marginTop: 3 }}
                aria-label={`블로그 동기화 run ${run.id} 선택`}
              />
              <button
                type="button"
                onClick={() => onMarkRead([run.id])}
                style={{ border: 0, background: "transparent", color: "#e8e8e8", padding: 0, textAlign: "left", minWidth: 0, cursor: "pointer" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                  {unread && <span style={{ width: 7, height: 7, borderRadius: 999, background: "#a855f7", flex: "0 0 auto" }} />}
                  <span style={{ fontSize: 12, fontWeight: unread ? 900 : 750, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {formatTriggerSource(run.trigger_source)} 블로그 동기화
                  </span>
                </div>
                <div style={{ color: "#8a8a8a", fontSize: 10, marginTop: 4 }}>
                  {formatTime(run.created_at)} · run {run.id.slice(0, 8)} · {run.status}
                </div>
              </button>
              <span style={{ border: `1px solid ${meta.color}`, background: meta.bg, color: meta.color, borderRadius: 999, padding: "3px 7px", fontSize: 10, fontWeight: 900 }}>
                {meta.label}
              </span>
            </div>
            <div style={{ color: "#d6d6d6", fontSize: 11, lineHeight: 1.55, marginTop: 8, paddingLeft: 26 }}>
              {getBlogRunSummary(run)}
            </div>
            {run.error && (
              <div style={{ color: "#ffb4b4", fontSize: 11, lineHeight: 1.5, marginTop: 8, paddingLeft: 26 }}>
                {run.error}
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginTop: 9, paddingLeft: 26 }}>
              <span style={{ color: "#8a8a8a", fontSize: 10 }}>
                시작 {run.started_at ? formatTime(run.started_at) : "대기"} · 종료 {run.finished_at ? formatTime(run.finished_at) : "미완료"}
              </span>
              {run.github_run_id ? (
                <button
                  type="button"
                  onClick={() => window.open(`https://github.com/wjddnjs0419-sudo/Global-X-Pass/actions/runs/${run.github_run_id}`, "_blank", "noopener,noreferrer")}
                  style={linkButtonStyle}
                >
                  <ExternalLink size={12} aria-hidden />
                  GitHub
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => window.open(NAVER_BLOG_SYNC_WORKFLOW_URL, "_blank", "noopener,noreferrer")}
                  style={linkButtonStyle}
                >
                  <ExternalLink size={12} aria-hidden />
                  Workflow
                </button>
              )}
            </div>
          </article>
        );
      })}

      {runs.length > 0 && (
        <button type="button" onClick={() => onHide(runs.map((run) => run.id))} style={{ ...compactDangerButtonStyle, width: "100%", justifyContent: "center", marginTop: 6 }}>
          <Trash2 size={13} aria-hidden />
          인박스 비우기
        </button>
      )}
    </section>
  );
}

function OperationsSidebar({
  selectedQaSuite,
  qaTriggerLoading,
  qaTriggerMessage,
  qaTriggerError,
  visibleQaLoading,
  visibleQaMessage,
  visibleQaError,
  qaTokenConnected,
  syncLoading,
  syncResult,
  syncError,
  onQaSuiteChange,
  onTriggerQaRun,
  onRunVisibleQa,
  onTriggerBlogSync,
}: {
  selectedQaSuite: QaSuiteId;
  qaTriggerLoading: boolean;
  qaTriggerMessage: string | null;
  qaTriggerError: string | null;
  visibleQaLoading: boolean;
  visibleQaMessage: string | null;
  visibleQaError: string | null;
  qaTokenConnected: boolean;
  syncLoading: boolean;
  syncResult: BlogSyncResult | null;
  syncError: string | null;
  onQaSuiteChange: (suite: QaSuiteId) => void;
  onTriggerQaRun: () => void;
  onRunVisibleQa: () => void;
  onTriggerBlogSync: () => void;
}) {
  const run = syncResult?.run;
  const dispatched = syncResult?.dispatched === true;
  const dispatchFailed = syncResult && syncResult.dispatched === false;

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 12 }}>
        <div>
          <h2 style={{ fontSize: 13, fontWeight: 900, margin: 0, color: "#e8e8e8" }}>Ops</h2>
          <div style={{ color: "#8a8a8a", fontSize: 10, marginTop: 4 }}>수동 실행은 여기서, 처리 결과는 Alerts에서 계속 확인합니다.</div>
        </div>
      </div>

      <section style={{ border: "1px solid #2a2a2a", background: "#111", borderRadius: 10, padding: 12, marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: 999, background: "#4ea1ff" }} />
          <h3 style={{ color: "#e8e8e8", fontSize: 13, fontWeight: 900, margin: 0 }}>QA 수동 실행</h3>
        </div>
        <p style={{ color: "#bbbbbb", fontSize: 11, lineHeight: 1.65, margin: "0 0 8px" }}>
          필요한 QA suite만 `main` 브랜치 기준으로 직접 실행합니다. 실행 이력과 실패 step은 Alerts의 QA 섹션에 메일형으로 쌓입니다.
        </p>
        <div style={{ display: "grid", gap: 6, margin: "0 0 12px" }}>
          {QA_SUITES.map((suite) => {
            const selected = suite.id === selectedQaSuite;
            return (
              <button
                key={suite.id}
                type="button"
                onClick={() => onQaSuiteChange(suite.id)}
                style={{
                  border: `1px solid ${selected ? "#4ea1ff" : "#2a2a2a"}`,
                  background: selected ? "#102033" : "#161616",
                  color: selected ? "#d8ebff" : "#bbbbbb",
                  borderRadius: 8,
                  padding: "8px 9px",
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                <span style={{ display: "block", fontSize: 11, fontWeight: 900 }}>{suite.label}</span>
                <span style={{ display: "block", fontSize: 10, color: selected ? "#9fcfff" : "#8a8a8a", marginTop: 2 }}>
                  {suite.description}
                </span>
              </button>
            );
          })}
        </div>
        <div style={{ color: qaTokenConnected ? "#8a8a8a" : "#ffcf7d", fontSize: 10, lineHeight: 1.5, marginBottom: 12 }}>
          {qaTokenConnected
            ? "앱에 저장된 GitHub token으로 바로 실행할 수 있습니다."
            : "앱 저장 token이 없으면 fallback env(GXP_GITHUB_TOKEN / GITHUB_TOKEN / GH_TOKEN)에 의존합니다."}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8 }}>
          <button
            type="button"
            data-monitor-action="trigger-manual-qa-run"
            onClick={onTriggerQaRun}
            disabled={qaTriggerLoading}
            style={{
              ...compactButtonStyle,
              width: "100%",
              justifyContent: "center",
              border: "1px solid #4ea1ff",
              background: qaTriggerLoading ? "#1c1c1c" : "#102033",
              color: "#d8ebff",
              cursor: qaTriggerLoading ? "wait" : "pointer",
              padding: "9px 10px",
            }}
          >
            <PlayCircle size={14} aria-hidden />
            {qaTriggerLoading ? "GitHub 실행 요청 중..." : `${QA_SUITES.find((item) => item.id === selectedQaSuite)?.label ?? selectedQaSuite} GitHub 실행`}
          </button>
          <button
            type="button"
            data-monitor-action="run-visible-qa"
            onClick={onRunVisibleQa}
            disabled={visibleQaLoading}
            style={{
              ...compactButtonStyle,
              width: "100%",
              justifyContent: "center",
              border: "1px solid #34a853",
              background: visibleQaLoading ? "#1c1c1c" : "#0f2a15",
              color: "#d8ffe1",
              cursor: visibleQaLoading ? "wait" : "pointer",
              padding: "9px 10px",
            }}
          >
            <ExternalLink size={14} aria-hidden />
            {visibleQaLoading ? "Visible QA 준비 중..." : `${QA_SUITES.find((item) => item.id === selectedQaSuite)?.label ?? selectedQaSuite} 로컬 Visible 실행`}
          </button>
        </div>
        <div style={{ color: "#8a8a8a", fontSize: 10, lineHeight: 1.5, marginTop: 9 }}>
          로컬 Visible 실행은 iTerm/Terminal을 열고 Chromium을 실제 화면에 띄웁니다. `.env.qa` 또는 shell env에 `QA_ADMIN_EMAIL`, `QA_ADMIN_PASSWORD`, `QA_ADMIN_MFA_SECRET`가 필요합니다.
        </div>
        {qaTriggerError && (
          <div style={{ color: "#ffb4b4", borderLeft: "3px solid #ea4335", background: "#1a1010", padding: "8px 10px", fontSize: 11, lineHeight: 1.6, marginTop: 12 }}>
            요청 실패: {qaTriggerError}
          </div>
        )}
        {qaTriggerMessage && (
          <div style={{ color: "#d8ebff", borderLeft: "3px solid #4ea1ff", background: "#102033", padding: "8px 10px", fontSize: 11, lineHeight: 1.6, marginTop: 12 }}>
            {qaTriggerMessage}
          </div>
        )}
        {visibleQaError && (
          <div style={{ color: "#ffb4b4", borderLeft: "3px solid #ea4335", background: "#1a1010", padding: "8px 10px", fontSize: 11, lineHeight: 1.6, marginTop: 12 }}>
            Visible 실행 실패: {visibleQaError}
          </div>
        )}
        {visibleQaMessage && (
          <div style={{ color: "#d8ffe1", borderLeft: "3px solid #34a853", background: "#0f2a15", padding: "8px 10px", fontSize: 11, lineHeight: 1.6, marginTop: 12 }}>
            {visibleQaMessage}
          </div>
        )}
        <div style={{ marginTop: 10 }}>
          <button
            type="button"
            onClick={() => window.open(QA_WORKFLOW_URL, "_blank", "noopener,noreferrer")}
            style={linkButtonStyle}
          >
            <ExternalLink size={12} aria-hidden />
            GitHub workflow 보기
          </button>
        </div>
      </section>

      <section style={{ border: "1px solid #2a2a2a", background: "#111", borderRadius: 10, padding: 12, marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: 999, background: "#a855f7" }} />
          <h3 style={{ color: "#e8e8e8", fontSize: 13, fontWeight: 900, margin: 0 }}>블로그 동기화</h3>
        </div>
        <p style={{ color: "#bbbbbb", fontSize: 11, lineHeight: 1.65, margin: "0 0 12px" }}>
          관리자 화면의 `즉시 동기화`와 같은 경로로 `sync-naver-blog` Edge Function을 호출합니다.
          실행 기록은 `blog_import_runs`에 남고, 상세 상태와 집계는 Alerts의 블로그 동기화 섹션에서 계속 확인할 수 있습니다.
        </p>
        <button
          type="button"
          data-monitor-action="trigger-manual-blog-sync"
          onClick={onTriggerBlogSync}
          disabled={syncLoading}
          style={{
            ...compactButtonStyle,
            width: "100%",
            justifyContent: "center",
            border: "1px solid #a855f7",
            background: syncLoading ? "#1c1c1c" : "#20132a",
            color: "#f0d7ff",
            cursor: syncLoading ? "wait" : "pointer",
            padding: "9px 10px",
          }}
        >
          <PlayCircle size={14} aria-hidden />
          {syncLoading ? "동기화 요청 중..." : "블로그 동기화 실행"}
        </button>
      </section>

      {syncError && (
        <div style={{ color: "#ffb4b4", borderLeft: "3px solid #ea4335", background: "#1a1010", padding: "8px 10px", fontSize: 11, lineHeight: 1.6, marginBottom: 12 }}>
          요청 실패: {syncError}
        </div>
      )}

      {syncResult && (
        <section style={{ border: `1px solid ${dispatched ? "#1f4a2a" : "#3a2020"}`, background: dispatched ? "#0f1f14" : "#1a1010", borderRadius: 10, padding: 12 }}>
          <div style={{ color: dispatched ? "#34a853" : "#ffb4b4", fontSize: 12, fontWeight: 900, marginBottom: 8 }}>
            {dispatched ? "GitHub Actions 실행 요청 완료" : "run은 등록됐지만 Actions 트리거 실패"}
          </div>
          {run && (
            <div style={{ display: "grid", gap: 6, marginBottom: 10 }}>
              <div style={opsResultRowStyle}><span>Run ID</span><strong>{run.id}</strong></div>
              <div style={opsResultRowStyle}><span>Status</span><strong>{run.status}</strong></div>
              <div style={opsResultRowStyle}><span>Source</span><strong>{run.trigger_source}</strong></div>
              <div style={opsResultRowStyle}><span>Created</span><strong>{formatTime(run.created_at)}</strong></div>
            </div>
          )}
          {dispatchFailed && (
            <div style={{ color: "#ffb4b4", fontSize: 11, lineHeight: 1.55, marginBottom: 10 }}>
              {syncResult.dispatchError ?? "GitHub Actions dispatch 실패 사유를 받지 못했습니다."}
              {" "}예약된 03:00 KST 자동 처리 흐름은 그대로 유지됩니다.
            </div>
          )}
          <button
            type="button"
            onClick={() => window.open(NAVER_BLOG_SYNC_WORKFLOW_URL, "_blank", "noopener,noreferrer")}
            style={linkButtonStyle}
          >
            <ExternalLink size={12} aria-hidden />
            GitHub workflow 보기
          </button>
        </section>
      )}
    </>
  );
}

function MapDiffSummary({
  mapDiff,
  nodesById,
  onFocusNode,
}: {
  mapDiff: ArchitectureMapDiff | null;
  nodesById: Map<string, MapNode>;
  onFocusNode: (nodeId: string) => void;
}) {
  if (!mapDiff) {
    return (
      <section style={mapDiffPanelStyle}>
        <div style={sideLabelStyle}>Structure Diff</div>
        <div style={sideValueStyle}>아직 비교할 직전 스냅샷이 없습니다.</div>
      </section>
    );
  }

  const changedCount = mapDiff.addedNodeIds.length
    + mapDiff.removedNodeIds.length
    + mapDiff.addedEdgeKeys.length
    + mapDiff.removedEdgeKeys.length
    + mapDiff.deadAddedIds.length
    + mapDiff.deadRemovedIds.length;

  return (
    <section style={mapDiffPanelStyle}>
      <div style={sideLabelStyle}>Structure Diff</div>
      <div style={sideValueStyle}>
        {changedCount === 0
          ? "직전 스냅샷 대비 구조 변화가 없습니다."
          : `노드 +${mapDiff.addedNodeIds.length}/-${mapDiff.removedNodeIds.length} · 연결 +${mapDiff.addedEdgeKeys.length}/-${mapDiff.removedEdgeKeys.length} · DEAD +${mapDiff.deadAddedIds.length}/-${mapDiff.deadRemovedIds.length}`}
      </div>
      {mapDiff.clusterDiffs.slice(0, 4).map((cluster) => (
        <div key={cluster.id} style={sideItemStyle}>
          {cluster.label}: {cluster.before} → {cluster.after} ({cluster.delta > 0 ? "+" : ""}{cluster.delta})
        </div>
      ))}
      {mapDiff.addedNodeIds.slice(0, 4).map((nodeId) => (
        <button key={nodeId} type="button" onClick={() => onFocusNode(nodeId)} style={plainSidebarButtonStyle}>
          <div style={{ color: "var(--color-text-primary)", fontSize: 12, fontWeight: 800 }}>New node · {nodesById.get(nodeId)?.label ?? nodeId}</div>
          <div style={{ color: "var(--color-text-muted)", fontSize: 10, marginTop: 3 }}>{nodesById.get(nodeId)?.path ?? nodeId}</div>
        </button>
      ))}
    </section>
  );
}

function ArchitectureMapSidebar({
  loading,
  generatedAt,
  nodeCount,
  edgeCount,
  mapDiff,
  incidents,
  activeIssues,
  activeIssuesBySource,
  watchNodes,
  nodesById,
  onFocusNode,
  onOpenHref,
  onOpenTerminal,
}: {
  loading: boolean;
  generatedAt: string;
  nodeCount: number;
  edgeCount: number;
  mapDiff: ArchitectureMapDiff | null;
  incidents: IncidentFeedItem[];
  activeIssues: ErrorIssue[];
  activeIssuesBySource: Map<string, ErrorIssue[]>;
  watchNodes: MapNode[];
  nodesById: Map<string, MapNode>;
  onFocusNode: (nodeId: string) => void;
  onOpenHref: (href: string) => void;
  onOpenTerminal: (command?: string) => void;
}) {
  const topSources = Array.from(activeIssuesBySource.entries()).sort((a, b) => b[1].length - a[1].length).slice(0, 5);
  return (
    <>
      <IncidentFeed items={incidents} onFocusNode={onFocusNode} onOpenHref={onOpenHref} />

      <h2 style={{ fontSize: 13, fontWeight: 800, margin: "0 0 14px", color: "#e8e8e8" }}>Notable Findings</h2>
      <div style={findingStyle}><strong>Realtime status</strong>: {loading ? "이슈 상태를 불러오는 중입니다." : `${activeIssues.length}개 열린 이슈, ${watchNodes.length}개 주의 노드를 표시 중입니다.`}</div>
      <div style={findingStyle}><strong>Generated map</strong>: {nodeCount}개 노드와 {edgeCount}개 연결선을 `architectureMap.json`에서 읽어옵니다.</div>
      <div style={findingStyle}><strong>Private app</strong>: 운영 웹 라우트에서 분리된 로컬 전용 맵입니다. 코드 구조 자동 생성과 Supabase 이슈 조회만 유지합니다.</div>

      <MapDiffSummary mapDiff={mapDiff} nodesById={nodesById} onFocusNode={onFocusNode} />

      <div style={sideLabelStyle}>Generated</div>
      <div style={sideValueStyle}>{formatTime(generatedAt)}</div>

      <div style={sideLabelStyle}>Open Issues</div>
      {topSources.length === 0 ? (
        <div style={sideValueStyle}>현재 열린 이슈가 없습니다.</div>
      ) : topSources.map(([source, sourceIssues]) => (
        <button key={source} type="button" data-monitor-action="focus-top-error-node" onClick={() => onFocusNode(source)} style={plainSidebarButtonStyle}>
          <div style={{ color: "#e8e8e8", fontSize: 12, fontWeight: 800 }}>{nodesById.get(source)?.label ?? source}</div>
          <div style={{ color: "#8a8a8a", fontSize: 11, marginTop: 3 }}>
            {sourceIssues.length} issues · {formatTime(sourceIssues[0].last_seen_at)}
          </div>
        </button>
      ))}

      {watchNodes.length > 0 && (
        <>
          <div style={sideLabelStyle}>Watch Nodes</div>
          {watchNodes.slice(0, 5).map((node) => (
            <button key={node.id} type="button" data-monitor-action="focus-watch-node" onClick={() => onFocusNode(node.id)} style={plainSidebarButtonStyle}>
              <div style={{ color: "#e8e8e8", fontSize: 12, fontWeight: 800 }}>{node.label}</div>
              <div style={{ color: "#8a8a8a", fontSize: 10, marginTop: 3 }}>{node.path}</div>
            </button>
          ))}
        </>
      )}

      <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #1e1e1e" }}>
        <button
          type="button"
          data-monitor-action="open-terminal"
          onClick={() => onOpenTerminal(undefined)}
          style={fixButtonStyle("#555")}
        >
          Terminal 열기
        </button>
      </div>
    </>
  );
}

function buildFixCommand(tool: "claude" | "codex", issue: ErrorIssue, node: MapNode): string {
  const location = extractCodeLocation(issue);
  const loc = location?.label ?? issue.path ?? node.path ?? "";
  const safe = (s: string) => s.replace(/"/g, "'").replace(/\n/g, " ").slice(0, 200);
  const context = `${safe(issue.message)}${loc ? ` | ${loc}` : ""}`;
  return tool === "claude"
    ? `claude "다음 에러를 수정해주세요: ${context}"`
    : `codex "Fix: ${context}"`;
}

function NodeSidebar({
  node,
  status,
  issues,
  selectedIssue,
  selectedIssueLogs,
  edges,
  onSelectIssue,
  onUpdateIssueStatus,
  onOpenTerminal,
  titleId,
}: {
  node: MapNode;
  status: NodeStatus;
  issues: ErrorIssue[];
  selectedIssue: ErrorIssue | null;
  selectedIssueLogs: ErrorLog[];
  edges: MapEdge[];
  onSelectIssue: (fingerprint: string) => void;
  onUpdateIssueStatus: (fingerprint: string, action: "monitoring" | "resolved" | "ignored") => void;
  onOpenTerminal: (command?: string) => void;
  titleId?: string;
}) {
  const incoming = edges.filter((edge) => edge.to === node.id);
  const outgoing = edges.filter((edge) => edge.from === node.id);
  const focusedLocation = selectedIssue ? extractCodeLocation(selectedIssue) : null;
  const focusedBuildLabel = selectedIssue?.last_build_id === CURRENT_BUILD_ID
    ? "현재 빌드에서 재발"
    : selectedIssue?.last_build_id
    ? "이전 빌드에서 마지막 발생"
    : "빌드 정보 없음";

  return (
    <>
      <h4 id={titleId} style={{ color: "var(--color-text-primary)", margin: "0 0 8px", fontSize: 16 }}>{node.label}</h4>
      <div style={{ color: "var(--color-text-secondary)", fontSize: 11, marginBottom: 14 }}>{node.path}</div>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 7, border: `1px solid ${STATUS_META[status].color}`, background: STATUS_META[status].bg, color: "var(--color-text-primary)", borderRadius: "var(--radius-md, 8px)", padding: "7px 9px", fontSize: 11, fontWeight: 900, marginBottom: 12 }}>
        <LocateFixed size={13} aria-hidden /> {STATUS_META[status].label}
      </div>
      <p style={{ color: "var(--color-text-primary)", fontSize: 12, lineHeight: 1.7 }}>{node.role}</p>
      <p style={{ color: "var(--color-text-secondary)", fontSize: 12, lineHeight: 1.7 }}>{node.plain}</p>

      {selectedIssue && (
        <div style={{ border: "1px solid var(--color-glass-border-strong)", background: "var(--color-glass-bg)", borderRadius: "var(--radius-lg, 12px)", padding: 12, margin: "14px 0" }}>
          <div style={{ color: SEVERITY_COLOR[selectedIssue.severity], fontSize: 11, fontWeight: 900 }}>
            {selectedIssue.status.toUpperCase()} · {selectedIssue.severity.toUpperCase()} · {focusedBuildLabel}
          </div>
          <div style={{ color: "var(--color-text-primary)", fontSize: 12, lineHeight: 1.5, marginTop: 6 }}>{selectedIssue.message}</div>
          <div style={{ color: "var(--color-text-secondary)", fontSize: 11, lineHeight: 1.6, marginTop: 8 }}>
            위치: {focusedLocation?.label ?? "stack에서 앱 파일 위치를 찾지 못했습니다."}
          </div>
          <div style={{ color: "var(--color-text-secondary)", fontSize: 11, lineHeight: 1.6 }}>
            발생: {selectedIssue.occurrence_count}회 · 마지막 {formatTime(selectedIssue.last_seen_at)}
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
            <button type="button" data-monitor-action="issue-monitoring" onClick={() => onUpdateIssueStatus(selectedIssue.fingerprint, "monitoring")} style={issueActionButtonStyle}>모니터링</button>
            <button type="button" data-monitor-action="issue-resolve" onClick={() => onUpdateIssueStatus(selectedIssue.fingerprint, "resolved")} style={issueActionButtonStyle}>해결</button>
            <button type="button" data-monitor-action="issue-ignore" onClick={() => onUpdateIssueStatus(selectedIssue.fingerprint, "ignored")} style={issueActionButtonStyle}>무시</button>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8, paddingTop: 8, borderTop: "1px solid #1e1e1e" }}>
            <button
              type="button"
              data-monitor-action="fix-with-claude"
              onClick={() => onOpenTerminal(buildFixCommand("claude", selectedIssue, node))}
              style={fixButtonStyle("#4ea1ff")}
            >
              Fix with Claude
            </button>
            <button
              type="button"
              data-monitor-action="fix-with-codex"
              onClick={() => onOpenTerminal(buildFixCommand("codex", selectedIssue, node))}
              style={fixButtonStyle("#bf5af2")}
            >
              Fix with Codex
            </button>
            <button
              type="button"
              data-monitor-action="open-terminal"
              onClick={() => onOpenTerminal(undefined)}
              style={fixButtonStyle("#555")}
            >
              Terminal
            </button>
          </div>
        </div>
      )}

      <h5 style={sideTitleStyle}>Notes</h5>
      {node.notes.slice(0, 4).map((note) => (
        <div key={note} style={sideItemStyle}>{note}</div>
      ))}

      <h5 style={sideTitleStyle}>Edges</h5>
      <div style={sideItemStyle}>Incoming: {incoming.length}</div>
      <div style={sideItemStyle}>Outgoing: {outgoing.length}</div>

      <h5 style={sideTitleStyle}>열린 이슈</h5>
      {issues.length === 0 ? (
        <div style={sideItemStyle}>현재 이 노드에 열린 이슈가 없습니다.</div>
      ) : issues.slice(0, 10).map((issue) => {
        const explanation = explainError(issue, node);
        const location = extractCodeLocation(issue);
        const selected = selectedIssue?.fingerprint === issue.fingerprint;
        return (
          <button
            key={issue.fingerprint}
            type="button"
            data-monitor-action="select-error-issue"
            onClick={() => onSelectIssue(issue.fingerprint)}
            style={{
              display: "block",
              width: "100%",
              textAlign: "left",
              border: `1px solid ${selected ? SEVERITY_COLOR[issue.severity] : "var(--color-glass-border)"}`,
              background: selected ? "var(--color-glass-bg)" : "transparent",
              borderRadius: "var(--radius-md, 8px)",
              padding: "10px",
              margin: "8px 0",
              cursor: "pointer",
            }}
          >
            <div style={{ color: SEVERITY_COLOR[issue.severity], fontSize: 11, fontWeight: 900 }}>
              {issue.status.toUpperCase()} · {issue.severity.toUpperCase()} · {formatTime(issue.last_seen_at)}
            </div>
            <div style={{ color: "var(--color-text-primary)", fontSize: 12, lineHeight: 1.5, marginTop: 4 }}>{issue.message}</div>
            <div style={{ color: "var(--color-text-secondary)", fontSize: 11, marginTop: 4 }}>
              {location?.label ?? issue.path ?? "위치 정보 없음"} · {issue.occurrence_count}회
            </div>
            <div style={{ background: "var(--color-glass-bg)", border: "1px solid var(--color-glass-border)", borderRadius: "var(--radius-md, 8px)", padding: "9px 10px", marginTop: 8 }}>
            <div style={explainLabelStyle}>의미</div>
            <div style={explainTextStyle}>{explanation.meaning}</div>
            <div style={explainLabelStyle}>서비스 영향</div>
            <div style={explainTextStyle}>{explanation.impact}</div>
            <div style={explainLabelStyle}>가능한 원인</div>
            <div style={explainTextStyle}>{explanation.likely}</div>
              <div style={explainLabelStyle}>다음 확인</div>
              <div style={explainTextStyle}>{explanation.action}</div>
            </div>
          </button>
        );
      })}

      {selectedIssueLogs.length > 0 && (
        <>
          <h5 style={sideTitleStyle}>선택 이슈 최근 로그</h5>
          {selectedIssueLogs.slice(0, 5).map((log) => (
            <pre key={log.id} style={{ whiteSpace: "pre-wrap", color: "var(--color-text-secondary)", fontSize: 10, lineHeight: 1.45, margin: "8px 0 0" }}>
              {formatTime(log.created_at)} · {log.build_id ?? "build 없음"}{"\n"}{summarizeStack(log.stack)}
            </pre>
          ))}
        </>
      )}
    </>
  );
}

const sideTitleStyle: CSSProperties = {
  color: "#e8e8e8",
  fontSize: 12,
  fontWeight: 900,
  margin: "18px 0 8px",
};

const sideItemStyle: CSSProperties = {
  color: "#bbbbbb",
  fontSize: 11,
  lineHeight: 1.6,
  marginBottom: 6,
};

const sideLabelStyle: CSSProperties = {
  color: "#8a8a8a",
  fontSize: 10,
  fontWeight: 800,
  margin: "14px 0 5px",
  textTransform: "uppercase",
};

const sideValueStyle: CSSProperties = {
  color: "#e8e8e8",
  fontSize: 12,
  lineHeight: 1.55,
};

const findingStyle: CSSProperties = {
  background: "#1a1010",
  borderLeft: "3px solid #ff3860",
  color: "#e8c8c8",
  borderRadius: "0 6px 6px 0",
  padding: "8px 10px",
  marginBottom: 8,
  fontSize: 11,
  lineHeight: 1.6,
};

const mapDiffPanelStyle: CSSProperties = {
  border: "1px solid var(--color-glass-border)",
  background: "var(--color-glass-bg)",
  borderRadius: "var(--radius-sm)",
  padding: "var(--space-sm)",
  margin: "0 0 var(--space-md)",
};

const plainSidebarButtonStyle: CSSProperties = {
  width: "100%",
  border: 0,
  borderTop: "1px solid #2a2a2a",
  background: "transparent",
  padding: "10px 0",
  textAlign: "left",
  cursor: "pointer",
};

const iconButtonStyle: CSSProperties = {
  width: 30,
  height: 30,
  border: "1px solid #2a2a2a",
  background: "#1c1c1c",
  color: "#8a8a8a",
  borderRadius: 7,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};

const compactButtonStyle: CSSProperties = {
  border: "1px solid #2a2a2a",
  background: "#1c1c1c",
  color: "#e8e8e8",
  borderRadius: 6,
  padding: "6px 8px",
  fontSize: 10,
  fontWeight: 850,
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  cursor: "pointer",
};

const compactDangerButtonStyle: CSSProperties = {
  ...compactButtonStyle,
  color: "#ffb4b4",
  border: "1px solid #3a2020",
  background: "#1a1010",
};

const linkButtonStyle: CSSProperties = {
  border: "1px solid #2a2a2a",
  background: "transparent",
  color: "#4ea1ff",
  borderRadius: 6,
  padding: "5px 7px",
  fontSize: 10,
  fontWeight: 850,
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  cursor: "pointer",
};

const qaMetricStyle: CSSProperties = {
  border: "1px solid #2a2a2a",
  background: "#111",
  color: "#8a8a8a",
  borderRadius: 999,
  padding: "4px 8px",
  fontSize: 10,
  fontWeight: 850,
};

const opsResultRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "72px minmax(0, 1fr)",
  gap: 8,
  color: "#bbbbbb",
  fontSize: 11,
  lineHeight: 1.45,
};

const issueActionButtonStyle: CSSProperties = {
  border: "1px solid #2a2a2a",
  background: "#1c1c1c",
  color: "#e8e8e8",
  borderRadius: 6,
  padding: "7px 10px",
  fontSize: 11,
  fontWeight: 800,
  cursor: "pointer",
};

function fixButtonStyle(accentColor: string): CSSProperties {
  return {
    border: `1px solid ${accentColor}`,
    background: "transparent",
    color: accentColor,
    borderRadius: 6,
    padding: "6px 10px",
    fontSize: 11,
    fontWeight: 800,
    cursor: "pointer",
  };
}

const explainLabelStyle: CSSProperties = {
  color: "#e8e8e8",
  fontSize: 10,
  fontWeight: 900,
  marginTop: 7,
  marginBottom: 2,
};

const explainTextStyle: CSSProperties = {
  color: "#bbbbbb",
  fontSize: 11,
  lineHeight: 1.55,
};
