export type Severity = "low" | "medium" | "high" | "critical";

export type MapNode = {
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

export type MapEdge = {
  from: string;
  to: string;
  kind: "critical" | "normal" | "api" | "db" | "mount";
  label: string;
  tag: string[];
};

export type ErrorLog = {
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

export type IssueStatus = "open" | "monitoring" | "resolved" | "reopened" | "ignored";

export type ErrorIssue = {
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

export type MapCluster = {
  id: string;
  label: string;
  displayLabel?: string;
  description?: string;
  color: string;
  keywords?: string[];
};

export type ArchitectureMap = {
  generatedAt: string;
  clusters: MapCluster[];
  nodes: MapNode[];
  edges: MapEdge[];
};

export type QaRunConclusion = "success" | "failure" | "cancelled" | "skipped" | "timed_out" | "action_required" | null;
export type QaSuiteId =
  | "smoke"
  | "admin-auth"
  | "auth-negative"
  | "admin-post-cud"
  | "admin-program-mgmt"
  | "user-event-application"
  | "user-consulting-booking"
  | "user-founders-club"
  | "user-flows"
  | "all";

export type QaFailedStep = {
  job: string;
  step: string;
  conclusion: string;
};

export type QaRun = {
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

export type QaRunsResult =
  | { ok: true; repo: string; workflow: string; runs: QaRun[]; fetchedAt: string }
  | { ok: false; error: string; statusCode?: number | null; needsToken?: boolean };

export type QaTriggerResult =
  | { ok: true; workflow: string; branch: string; suite: QaSuiteId; triggeredAt: string }
  | { ok: false; error: string; statusCode?: number | null; needsToken?: boolean };

export type QaVisibleResult =
  | { ok: true; suite: QaSuiteId; mode: "local-visible"; startedAt: string }
  | { ok: false; error: string; statusCode?: number | null };

export type QaRunTracker = {
  suite: QaSuiteId;
  requestedAt: string;
};

export type QaCredentialsInput = {
  email: string;
  password: string;
  mfaSecret: string;
};

export type BlogAiInputMode = "url" | "text";

export type BlogAiDraft = {
  titles: string[];
  content: string;
  tags: string;
  sampleCount: number;
  profileSource: string;
};

export type BlogAiAnalyzeResult =
  | { ok: true; sampleCount: number; profilePath: string; guidePath: string }
  | { ok: false; error: string };

export type BlogAiGenerateSuccess = {
  ok: true;
  profilePath: string;
  inputMode: BlogAiInputMode;
  articleUrl: string | null;
  articleText: string;
  articleTextLength: number;
  draft: BlogAiDraft;
};

export type BlogAiGenerateResult =
  | BlogAiGenerateSuccess
  | { ok: false; error: string };

export type BlogAiReviseResult =
  | {
      ok: true;
      profilePath: string;
      articleText: string;
      articleTextLength: number;
      draft: BlogAiDraft;
    }
  | { ok: false; error: string };

export type BlogImportRun = {
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

export type BlogSyncRun = {
  id: string;
  status: string;
  trigger_source: string;
  dry_run: boolean;
  created_at: string;
};

export type BlogSyncResult = {
  success?: boolean;
  run?: BlogSyncRun;
  dispatched?: boolean;
  dispatchError?: string | null;
  error?: string;
};

export type CompanyNewsCrawlOptions = {
  batchSize: number;
  resultsPerCompany: number;
  delayMs: number;
  maxStoredArticles: number;
  minRelevanceScore: number;
};

export type CompanyNewsTriggerResult = {
  success?: boolean;
  dispatched?: boolean;
  dispatchError?: string | null;
  inputs?: Record<string, string>;
  error?: string;
};

export type CompanyNewsRun = {
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
  failedStep: QaFailedStep | null;
};

export type CompanyNewsRunsResult =
  | { ok: true; repo: string; workflow: string; runs: CompanyNewsRun[]; fetchedAt: string }
  | { ok: false; error: string; statusCode?: number | null; needsToken?: boolean };

export type CompanyNewsRunTracker = {
  requestedAt: string;
};

export type PipelineNodeStatus = "idle" | "active" | "success" | "failed" | "muted";
export type PipelineNodeStatusMap = Partial<Record<string, PipelineNodeStatus>>;

export type FilterId = "overview" | "errors" | "dead" | "auth" | "events" | "consulting" | "founders" | "admin" | "pii" | "all";
export type SidebarTab = "map" | "ops";
export type NodeStatus = "safe" | "watch" | "danger";
export type PositionedNode = MapNode & { x: number; y: number; w: number; h: number; color: string; status: NodeStatus };
export type ClusterBounds = {
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

export type ArchitectureInboxKind = "issue" | "qa" | "blog";

export type ArchitectureInboxItem = {
  id: string;
  kind: ArchitectureInboxKind;
  severity: Severity;
  title: string;
  subtitle: string;
  meta: string;
  createdAt: string;
  nodeId?: string;
  href?: string;
  issueFingerprint?: string;
  issue?: ErrorIssue;
  qaRun?: QaRun;
  blogRun?: BlogImportRun;
  locationLabel?: string;
};

export type FloatingAnchorPosition = {
  x: number;
  y: number;
};
