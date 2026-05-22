import { useMemo, useState, type CSSProperties } from "react";
import { Bell, BookOpen, Check, Copy, Database, ExternalLink, FileOutput, FileText, FlaskConical, Github, Globe, PenLine, PlayCircle, RefreshCw, Sparkles, Workflow, Zap, type LucideIcon } from "lucide-react";
import { NAVER_BLOG_SYNC_WORKFLOW_URL, QA_SUITES, QA_WORKFLOW_URL } from "./constants";
import { buildBlogDraftCopyText, formatBlogTitles, formatTime, getQaOperationalRun, isBlogRunTerminal } from "./mapUtils";
import { compactButtonStyle, compactDangerButtonStyle, compactInputStyle, compactTextareaStyle, linkButtonStyle, opsCodeBlockStyle, opsResultRowStyle, opsSectionLabelStyle } from "./styles";
import type { BlogAiGenerateSuccess, BlogAiInputMode, BlogImportRun, BlogSyncResult, PipelineNodeStatus, PipelineNodeStatusMap, QaCredentialsInput, QaRun, QaRunTracker, QaSuiteId } from "./types";

// ─── Ops Pipeline ────────────────────────────────────────────────────────────

type OpsSubTab = "qa" | "blog" | "ai";
type PipelineNode = { id: string; Icon: LucideIcon; label: string; sub: string; x: number; y: number; color: string };
type PipelineEdge = { from: string; to: string };

const OPS_SUB_TABS: { id: OpsSubTab; label: string; color: string }[] = [
  { id: "qa",   label: "QA",      color: "#4ea1ff" },
  { id: "blog", label: "블로그",   color: "#a855f7" },
  { id: "ai",   label: "AI 초안", color: "#fbbc05" },
];

const PIPELINE_NODE_R = 38;
const PIPELINE_ICON_SIZE = 22;

const QA_PIPELINE_NODES: PipelineNode[] = [
  { id: "gh", Icon: Github,        label: "GitHub",     sub: "Push / 수동",  x: 80,  y: 90, color: "#4ea1ff" },
  { id: "ci", Icon: Workflow,      label: "Actions",    sub: "CI Runner",    x: 230, y: 90, color: "#34a853" },
  { id: "pw", Icon: FlaskConical,  label: "Playwright", sub: "Test Suite",   x: 380, y: 90, color: "#ea4335" },
  { id: "sb", Icon: Database,      label: "Supabase",   sub: "qa_runs",      x: 530, y: 90, color: "#3ecf8e" },
  { id: "ib", Icon: Bell,          label: "Inbox",      sub: "알림 수신",     x: 680, y: 90, color: "#a855f7" },
];
const QA_PIPELINE_EDGES: PipelineEdge[] = [
  { from: "gh", to: "ci" }, { from: "ci", to: "pw" }, { from: "pw", to: "sb" }, { from: "sb", to: "ib" },
];

const BLOG_PIPELINE_NODES: PipelineNode[] = [
  { id: "nb", Icon: Globe,      label: "Naver Blog",     sub: "원본",              x: 80,  y: 90, color: "#1ec800" },
  { id: "ef", Icon: Zap,        label: "Edge Fn",        sub: "sync-naver-blog",   x: 220, y: 90, color: "#3ecf8e" },
  { id: "db", Icon: Database,   label: "Run Row",        sub: "blog_import_runs",  x: 360, y: 90, color: "#3ecf8e" },
  { id: "ga", Icon: Github,     label: "Actions",        sub: "workflow_dispatch", x: 500, y: 90, color: "#4ea1ff" },
  { id: "wk", Icon: Workflow,   label: "Import Worker",  sub: "import script",     x: 640, y: 90, color: "#a855f7" },
  { id: "po", Icon: FileOutput, label: "Posts",          sub: "events-archive",    x: 780, y: 90, color: "#fbbc05" },
];
const BLOG_PIPELINE_EDGES: PipelineEdge[] = [
  { from: "nb", to: "ef" }, { from: "ef", to: "db" }, { from: "db", to: "ga" },
  { from: "ga", to: "wk" }, { from: "wk", to: "po" },
];

const AI_PIPELINE_NODES: PipelineNode[] = [
  { id: "inp", Icon: PenLine,    label: "입력",          sub: "URL / 본문",              x: 80,  y: 90, color: "#fbbc05" },
  { id: "ext", Icon: FileText,   label: "본문 추출",      sub: "articleExtractor",        x: 220, y: 90, color: "#f08030" },
  { id: "sp",  Icon: BookOpen,   label: "Style Profile", sub: "load / analyze",          x: 360, y: 90, color: "#a855f7" },
  { id: "gem", Icon: Sparkles,   label: "Gemini",        sub: "2.5 Flash",               x: 500, y: 90, color: "#4ea1ff" },
  { id: "val", Icon: Check,      label: "검증",           sub: "schema / length",         x: 640, y: 90, color: "#34a853" },
  { id: "out", Icon: FileOutput, label: "초안 출력",      sub: "제목 · 본문 · 태그",       x: 780, y: 90, color: "#34a853" },
];
const AI_PIPELINE_EDGES: PipelineEdge[] = [
  { from: "inp", to: "ext" }, { from: "ext", to: "sp" }, { from: "sp", to: "gem" },
  { from: "gem", to: "val" }, { from: "val", to: "out" },
];

const OPS_PIPELINE_DATA: Record<OpsSubTab, { nodes: PipelineNode[]; edges: PipelineEdge[]; viewBox: string }> = {
  qa:   { nodes: QA_PIPELINE_NODES,   edges: QA_PIPELINE_EDGES,   viewBox: "0 0 760 190" },
  blog: { nodes: BLOG_PIPELINE_NODES, edges: BLOG_PIPELINE_EDGES, viewBox: "0 0 860 190" },
  ai:   { nodes: AI_PIPELINE_NODES,   edges: AI_PIPELINE_EDGES,   viewBox: "0 0 860 190" },
};

const PIPELINE_STATUS_META: Record<PipelineNodeStatus, { label: string; color: string; fill: string; stroke: string; text: string; subText: string }> = {
  idle: {
    label: "idle",
    color: "#5a5a5a",
    fill: "#181818",
    stroke: "#303030",
    text: "#7a7a7a",
    subText: "#444",
  },
  active: {
    label: "active",
    color: "#fbbc05",
    fill: "rgba(251, 188, 5, 0.10)",
    stroke: "#fbbc05",
    text: "#f4f4f4",
    subText: "#b8b8b8",
  },
  success: {
    label: "success",
    color: "#34a853",
    fill: "rgba(52, 168, 83, 0.10)",
    stroke: "#34a853",
    text: "#d8ffe1",
    subText: "#7ac98f",
  },
  failed: {
    label: "failed",
    color: "#ea4335",
    fill: "rgba(234, 67, 53, 0.10)",
    stroke: "#ea4335",
    text: "#ffdddd",
    subText: "#ff9a9a",
  },
  muted: {
    label: "unobserved",
    color: "#333",
    fill: "#111",
    stroke: "#202020",
    text: "#4a4a4a",
    subText: "#333",
  },
};

function getPipelineEdgeStatus(fromStatus: PipelineNodeStatus, toStatus: PipelineNodeStatus): PipelineNodeStatus {
  if (fromStatus === "failed" || toStatus === "failed") return "failed";
  if (fromStatus === "active" || toStatus === "active") return "active";
  if (fromStatus === "success" && toStatus === "success") return "success";
  if (fromStatus === "muted" || toStatus === "muted") return "muted";
  return "idle";
}

function OpsPipelineDiagram({ tab, nodeStatuses }: { tab: OpsSubTab; nodeStatuses: PipelineNodeStatusMap }) {
  const { nodes, edges, viewBox } = OPS_PIPELINE_DATA[tab];
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  return (
    <svg viewBox={viewBox} role="img" aria-label="Ops pipeline runtime status" style={{ width: "100%", height: "auto", display: "block" }}>
      <defs>
        <style>{`
          @keyframes gxp-dash-flow { from { stroke-dashoffset: 10; } to { stroke-dashoffset: 0; } }
          @keyframes gxp-spin      { to   { transform: rotate(360deg); } }
          @keyframes gxp-pulse     { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
        `}</style>
        <marker id="gxp-arr" markerWidth="6" markerHeight="5" refX="5.5" refY="2.5" orient="auto">
          <polygon points="0 0, 6 2.5, 0 5" fill="#3a3a3a" />
        </marker>
      </defs>

      {/* Edges */}
      {edges.map((edge, i) => {
        const f = nodeMap.get(edge.from);
        const t = nodeMap.get(edge.to);
        if (!f || !t) return null;
        const dx = t.x - f.x;
        const dy = t.y - f.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const sx = f.x + (dx / dist) * PIPELINE_NODE_R;
        const sy = f.y + (dy / dist) * PIPELINE_NODE_R;
        const ex = t.x - (dx / dist) * (PIPELINE_NODE_R + 7);
        const ey = t.y - (dy / dist) * (PIPELINE_NODE_R + 7);
        const isBranch = Math.abs(dy) > 30;
        const midX = (sx + ex) / 2;
        const pathD = isBranch ? `M ${sx},${sy} Q ${midX},${sy} ${ex},${ey}` : `M ${sx},${sy} L ${ex},${ey}`;
        const edgeStatus = getPipelineEdgeStatus(nodeStatuses[edge.from] ?? "idle", nodeStatuses[edge.to] ?? "idle");
        const edgeMeta = PIPELINE_STATUS_META[edgeStatus];
        return (
          <path key={i} d={pathD} fill="none"
            stroke={edgeStatus === "idle" ? "#2a2a2a" : edgeMeta.stroke}
            strokeOpacity={edgeStatus === "muted" ? 0.45 : edgeStatus === "success" ? 0.65 : 1}
            strokeWidth={edgeStatus === "active" ? 2.5 : 2}
            strokeDasharray="8 5"
            markerEnd="url(#gxp-arr)"
            style={edgeStatus === "active" ? { animation: "gxp-dash-flow 0.5s linear infinite" } : undefined}
          />
        );
      })}

      {/* Nodes */}
      {nodes.map((node) => {
        const status = nodeStatuses[node.id] ?? "idle";
        const meta = PIPELINE_STATUS_META[status];
        const isActive = status === "active";
        const Icon = node.Icon;
        const iconColor = isActive ? meta.color : meta.color;
        const labelY = node.y + PIPELINE_NODE_R + 16;
        const subY = node.y + PIPELINE_NODE_R + 30;
        return (
          <g key={node.id}>
            {/* Spinning ring (active) */}
            {isActive && (
              <circle cx={node.x} cy={node.y} r={PIPELINE_NODE_R + 12}
                fill="none" stroke={meta.stroke} strokeWidth={2} strokeDasharray="22 44" strokeOpacity={0.7}
                style={{ transformBox: "fill-box" as CSSProperties["transformBox"], transformOrigin: "center", animation: "gxp-spin 1.1s linear infinite" }}
              />
            )}
            {/* Soft outer ring */}
            <circle cx={node.x} cy={node.y} r={PIPELINE_NODE_R + 4}
              fill="none" stroke={meta.stroke} strokeWidth={1.5}
              strokeOpacity={isActive ? 0.25 : status === "muted" ? 0.55 : 1}
              style={isActive ? { animation: "gxp-pulse 1.3s ease-in-out infinite" } : undefined}
            />
            {/* Main circle */}
            <circle cx={node.x} cy={node.y} r={PIPELINE_NODE_R}
              fill={meta.fill}
              stroke={meta.stroke} strokeWidth={isActive ? 2.5 : status === "idle" ? 1.5 : 2}
            />
            {/* Tool icon via foreignObject */}
            <foreignObject
              x={node.x - PIPELINE_ICON_SIZE / 2}
              y={node.y - PIPELINE_ICON_SIZE / 2}
              width={PIPELINE_ICON_SIZE}
              height={PIPELINE_ICON_SIZE}
              style={{ overflow: "visible", pointerEvents: "none" }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: PIPELINE_ICON_SIZE, height: PIPELINE_ICON_SIZE }}>
                <Icon size={PIPELINE_ICON_SIZE} color={iconColor} strokeWidth={1.8} />
              </div>
            </foreignObject>
            {/* Label */}
            <text x={node.x} y={labelY} textAnchor="middle"
              fill={isActive ? "#e8e8e8" : meta.text} fontSize={11} fontWeight={700}>
              {node.label}
            </text>
            {/* Sub-label */}
            <text x={node.x} y={subY} textAnchor="middle"
              fill={isActive ? "#999" : meta.subText} fontSize={9}>
              {node.sub}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function isQaRunSuccessful(run: QaRun | null) {
  return run?.status === "completed" && run.conclusion === "success";
}

function isQaRunFailed(run: QaRun | null) {
  return run?.status === "completed" && run.conclusion !== "success";
}

function buildQaPipelineStatuses({
  selectedSuite,
  runs,
  tracker,
  qaTriggerLoading,
  qaTriggerError,
  visibleQaLoading,
}: {
  selectedSuite: QaSuiteId;
  runs: QaRun[];
  tracker: QaRunTracker | null;
  qaTriggerLoading: boolean;
  qaTriggerError: string | null;
  visibleQaLoading: boolean;
}): PipelineNodeStatusMap {
  const run = getQaOperationalRun(runs, selectedSuite, tracker);
  const statuses: PipelineNodeStatusMap = { gh: "idle", ci: "muted", pw: "muted", sb: "muted", ib: "muted" };

  if (qaTriggerError) {
    return { ...statuses, gh: "failed" };
  }
  if (qaTriggerLoading) {
    return { ...statuses, gh: "active" };
  }
  if (visibleQaLoading) {
    return { ...statuses, gh: "muted", ci: "muted", pw: "active" };
  }
  if (tracker && !run) {
    return { ...statuses, gh: "success", ci: "active" };
  }
  if (!run) return statuses;

  if (run.status === "queued") {
    return { ...statuses, gh: "success", ci: "active" };
  }
  if (run.status === "in_progress") {
    return { ...statuses, gh: "success", ci: "success", pw: "active" };
  }
  if (isQaRunSuccessful(run)) {
    return { gh: "success", ci: "success", pw: "success", sb: "success", ib: "success" };
  }
  if (isQaRunFailed(run)) {
    return { gh: "success", ci: "success", pw: "failed", sb: "failed", ib: "failed" };
  }

  return { ...statuses, gh: "success", ci: "active" };
}

function isBlogRunFailed(run: BlogImportRun | null) {
  return Boolean(run && (["failed", "error", "cancelled"].includes(run.status) || run.failed_count > 0));
}

function buildBlogPipelineStatuses({
  syncLoading,
  syncError,
  syncResult,
  observedRun,
}: {
  syncLoading: boolean;
  syncError: string | null;
  syncResult: BlogSyncResult | null;
  observedRun: BlogImportRun | null;
}): PipelineNodeStatusMap {
  const statuses: PipelineNodeStatusMap = { nb: "idle", ef: "idle", db: "muted", ga: "muted", wk: "muted", po: "muted" };

  if (syncLoading) {
    return { ...statuses, nb: "success", ef: "active" };
  }
  if (syncError) {
    return { ...statuses, nb: "success", ef: "failed" };
  }
  if (!syncResult) return statuses;

  const hasRun = Boolean(syncResult.run);
  const dispatchFailed = syncResult.dispatched === false;
  const runFailed = isBlogRunFailed(observedRun);
  const resultStatus = syncResult.run?.status;
  const resultRunDone = Boolean(resultStatus && ["completed", "success", "finished"].includes(resultStatus));
  const runDone = (isBlogRunTerminal(observedRun) && !runFailed) || (resultRunDone && !runFailed);
  const workerActive = Boolean(syncResult.dispatched && !runDone && !runFailed);

  return {
    nb: "success",
    ef: "success",
    db: hasRun ? "success" : "muted",
    ga: dispatchFailed ? "failed" : syncResult.dispatched ? "success" : "muted",
    wk: runFailed ? "failed" : runDone ? "success" : workerActive ? "active" : "muted",
    po: runFailed ? "failed" : runDone ? "success" : "muted",
  };
}

function buildAiPipelineStatuses({
  inputMode,
  analyzeLoading,
  analyzeError,
  analyzeMessage,
  generateLoading,
  generateError,
  draftResult,
  revisionLoading,
  revisionError,
}: {
  inputMode: BlogAiInputMode;
  analyzeLoading: boolean;
  analyzeError: string | null;
  analyzeMessage: string | null;
  generateLoading: boolean;
  generateError: string | null;
  draftResult: BlogAiGenerateSuccess | null;
  revisionLoading: boolean;
  revisionError: string | null;
}): PipelineNodeStatusMap {
  const statuses: PipelineNodeStatusMap = { inp: "idle", ext: "muted", sp: "idle", gem: "muted", val: "muted", out: "muted" };

  if (analyzeLoading) {
    return { ...statuses, inp: "muted", ext: "muted", sp: "active", gem: "active" };
  }
  if (analyzeError) {
    return { ...statuses, sp: "failed", gem: "failed" };
  }
  if (generateLoading || revisionLoading) {
    return {
      inp: "success",
      ext: inputMode === "url" ? "active" : "success",
      sp: "success",
      gem: "active",
      val: "muted",
      out: "muted",
    };
  }
  if (generateError || revisionError) {
    return { inp: "success", ext: inputMode === "url" ? "success" : "muted", sp: "success", gem: "failed", val: "failed", out: "muted" };
  }
  if (draftResult) {
    return { inp: "success", ext: draftResult.inputMode === "url" ? "success" : "muted", sp: "success", gem: "success", val: "success", out: "success" };
  }
  if (analyzeMessage) {
    return { ...statuses, sp: "success", gem: "success", val: "success" };
  }

  return statuses;
}

// ─── OperationsSidebar ────────────────────────────────────────────────────────

export function OperationsSidebar({
  selectedQaSuite,
  qaTriggerLoading,
  qaTriggerMessage,
  qaTriggerError,
  visibleQaLoading,
  visibleQaMessage,
  visibleQaError,
  qaRuns,
  qaRunTracker,
  qaTokenConnected,
  qaCredentialsConnected,
  qaCredentialsInput,
  qaCredentialsSaving,
  qaCredentialsError,
  syncLoading,
  syncResult,
  syncObservedRun,
  syncError,
  blogAiInputMode,
  blogAiArticleUrl,
  blogAiArticleText,
  blogAiProfilePath,
  blogAiSampleCount,
  blogAiAnalyzeLoading,
  blogAiAnalyzeMessage,
  blogAiAnalyzeError,
  blogAiGenerateLoading,
  blogAiGenerateError,
  blogAiDraftResult,
  blogAiRevisionInstruction,
  blogAiRevisionLoading,
  blogAiRevisionError,
  onQaSuiteChange,
  onQaCredentialsInputChange,
  onBlogAiInputModeChange,
  onBlogAiArticleUrlChange,
  onBlogAiArticleTextChange,
  onBlogAiProfilePathChange,
  onBlogAiSampleCountChange,
  onBlogAiRevisionInstructionChange,
  onSaveQaCredentials,
  onClearQaCredentials,
  onTriggerQaRun,
  onRunVisibleQa,
  onTriggerBlogSync,
  onAnalyzeBlogStyle,
  onGenerateBlogDraft,
  onReviseBlogDraft,
}: {
  selectedQaSuite: QaSuiteId;
  qaTriggerLoading: boolean;
  qaTriggerMessage: string | null;
  qaTriggerError: string | null;
  visibleQaLoading: boolean;
  visibleQaMessage: string | null;
  visibleQaError: string | null;
  qaRuns: QaRun[];
  qaRunTracker: QaRunTracker | null;
  qaTokenConnected: boolean;
  qaCredentialsConnected: boolean;
  qaCredentialsInput: QaCredentialsInput;
  qaCredentialsSaving: boolean;
  qaCredentialsError: string | null;
  syncLoading: boolean;
  syncResult: BlogSyncResult | null;
  syncObservedRun: BlogImportRun | null;
  syncError: string | null;
  blogAiInputMode: BlogAiInputMode;
  blogAiArticleUrl: string;
  blogAiArticleText: string;
  blogAiProfilePath: string;
  blogAiSampleCount: string;
  blogAiAnalyzeLoading: boolean;
  blogAiAnalyzeMessage: string | null;
  blogAiAnalyzeError: string | null;
  blogAiGenerateLoading: boolean;
  blogAiGenerateError: string | null;
  blogAiDraftResult: BlogAiGenerateSuccess | null;
  blogAiRevisionInstruction: string;
  blogAiRevisionLoading: boolean;
  blogAiRevisionError: string | null;
  onQaSuiteChange: (suite: QaSuiteId) => void;
  onQaCredentialsInputChange: (patch: Partial<QaCredentialsInput>) => void;
  onBlogAiInputModeChange: (mode: BlogAiInputMode) => void;
  onBlogAiArticleUrlChange: (value: string) => void;
  onBlogAiArticleTextChange: (value: string) => void;
  onBlogAiProfilePathChange: (value: string) => void;
  onBlogAiSampleCountChange: (value: string) => void;
  onBlogAiRevisionInstructionChange: (value: string) => void;
  onSaveQaCredentials: () => void;
  onClearQaCredentials: () => void;
  onTriggerQaRun: () => void;
  onRunVisibleQa: () => void;
  onTriggerBlogSync: () => void;
  onAnalyzeBlogStyle: () => void;
  onGenerateBlogDraft: () => void;
  onReviseBlogDraft: () => void;
}) {
  const [opsSubTab, setOpsSubTab] = useState<OpsSubTab>("qa");
  const [qaExpanded, setQaExpanded] = useState(false);
  const [copiedBlogField, setCopiedBlogField] = useState<string | null>(null);

  const qaOperationalRun = useMemo(
    () => getQaOperationalRun(qaRuns, selectedQaSuite, qaRunTracker),
    [qaRuns, selectedQaSuite, qaRunTracker],
  );

  const isRunning =
    opsSubTab === "qa"   ? qaTriggerLoading || visibleQaLoading :
    opsSubTab === "blog" ? syncLoading :
    blogAiGenerateLoading || blogAiRevisionLoading || blogAiAnalyzeLoading;

  const nodeStatuses = useMemo<PipelineNodeStatusMap>(() => {
    if (opsSubTab === "qa") {
      return buildQaPipelineStatuses({
        selectedSuite: selectedQaSuite,
        runs: qaRuns,
        tracker: qaRunTracker,
        qaTriggerLoading,
        qaTriggerError,
        visibleQaLoading,
      });
    }
    if (opsSubTab === "blog") {
      return buildBlogPipelineStatuses({
        syncLoading,
        syncError,
        syncResult,
        observedRun: syncObservedRun,
      });
    }
    return buildAiPipelineStatuses({
      inputMode: blogAiInputMode,
      analyzeLoading: blogAiAnalyzeLoading,
      analyzeError: blogAiAnalyzeError,
      analyzeMessage: blogAiAnalyzeMessage,
      generateLoading: blogAiGenerateLoading,
      generateError: blogAiGenerateError,
      draftResult: blogAiDraftResult,
      revisionLoading: blogAiRevisionLoading,
      revisionError: blogAiRevisionError,
    });
  }, [
    opsSubTab,
    selectedQaSuite,
    qaRuns,
    qaRunTracker,
    qaTriggerLoading,
    qaTriggerError,
    visibleQaLoading,
    syncLoading,
    syncError,
    syncResult,
    syncObservedRun,
    blogAiInputMode,
    blogAiAnalyzeLoading,
    blogAiAnalyzeError,
    blogAiAnalyzeMessage,
    blogAiGenerateLoading,
    blogAiGenerateError,
    blogAiDraftResult,
    blogAiRevisionLoading,
    blogAiRevisionError,
  ]);

  const runtimeMeta = useMemo(() => {
    if (opsSubTab === "qa") {
      if (qaRunTracker && !qaOperationalRun) {
        return {
          title: `${QA_SUITES.find((suite) => suite.id === qaRunTracker.suite)?.label ?? qaRunTracker.suite} dispatch 대기`,
          detail: `요청 ${formatTime(qaRunTracker.requestedAt)} · GitHub run 생성 대기`,
        };
      }
      if (qaOperationalRun) {
        return {
          title: `${QA_SUITES.find((suite) => suite.id === (qaOperationalRun.suite ?? selectedQaSuite))?.label ?? qaOperationalRun.suite ?? selectedQaSuite} #${qaOperationalRun.runNumber}`,
          detail: `${qaOperationalRun.status}${qaOperationalRun.conclusion ? ` / ${qaOperationalRun.conclusion}` : ""} · 업데이트 ${formatTime(qaOperationalRun.updatedAt)}`,
        };
      }
      return {
        title: `${QA_SUITES.find((suite) => suite.id === selectedQaSuite)?.label ?? selectedQaSuite} 최근 run 없음`,
        detail: "선택한 suite 기준으로 실행 상태를 기다리는 중",
      };
    }
    if (opsSubTab === "blog") {
      if (syncObservedRun) {
        return {
          title: `Blog run ${syncObservedRun.id.slice(0, 8)}`,
          detail: `${syncObservedRun.status} · inserted ${syncObservedRun.inserted_count} · updated ${syncObservedRun.updated_count} · failed ${syncObservedRun.failed_count}`,
        };
      }
      if (syncResult?.run) {
        return {
          title: `Blog run ${syncResult.run.id.slice(0, 8)}`,
          detail: `${syncResult.run.status} · dispatch ${syncResult.dispatched ? "ok" : syncResult.dispatched === false ? "failed" : "unknown"}`,
        };
      }
      return { title: "블로그 동기화 idle", detail: "수동 실행 시 run row와 workflow dispatch를 추적" };
    }
    if (blogAiDraftResult) {
      return {
        title: "AI 초안 생성 완료",
        detail: `${blogAiDraftResult.inputMode === "url" ? "URL" : "본문"} · ${blogAiDraftResult.articleTextLength}자 · 샘플 ${blogAiDraftResult.draft.sampleCount}개`,
      };
    }
    if (blogAiAnalyzeLoading) return { title: "스타일 프로파일 재분석 중", detail: `샘플 ${blogAiSampleCount}개 · ${blogAiProfilePath}` };
    if (blogAiGenerateLoading) return { title: "AI 초안 생성 중", detail: `${blogAiInputMode === "url" ? "URL 추출 포함" : "붙여넣은 본문"} · ${blogAiProfilePath}` };
    if (blogAiRevisionLoading) return { title: "수정 요청 반영 중", detail: blogAiRevisionInstruction.trim() || "수정 지시 처리 중" };
    return { title: "AI 초안 idle", detail: "입력, 프로파일, Gemini 호출 상태를 추적" };
  }, [
    opsSubTab,
    qaRunTracker,
    qaOperationalRun,
    selectedQaSuite,
    syncObservedRun,
    syncResult,
    blogAiDraftResult,
    blogAiAnalyzeLoading,
    blogAiSampleCount,
    blogAiProfilePath,
    blogAiGenerateLoading,
    blogAiInputMode,
    blogAiRevisionLoading,
    blogAiRevisionInstruction,
  ]);

  const copyBlogText = (field: string, text: string) => {
    if (!navigator.clipboard?.writeText) return;
    void navigator.clipboard.writeText(text).then(() => {
      setCopiedBlogField(field);
      setTimeout(() => setCopiedBlogField((c) => (c === field ? null : c)), 2000);
    }).catch(() => undefined);
  };

  const ctaStyle = (color: string, bg: string, loading: boolean): CSSProperties => ({
    border: `1px solid ${color}`,
    background: loading ? "#1a1a1a" : bg,
    color: loading ? "#5a5a5a" : color === "#4ea1ff" ? "#d8ebff" : color === "#34a853" ? "#d8ffe1" : color === "#a855f7" ? "#f0d7ff" : "#ffe8a3",
    borderRadius: 8, padding: "9px 12px", fontSize: 11, fontWeight: 800,
    display: "flex", alignItems: "center", gap: 6,
    cursor: loading ? "wait" : "pointer", width: "100%", justifyContent: "center",
  });

  const msgStyle = (type: "error" | "info" | "success"): CSSProperties => ({
    color: type === "error" ? "#ffb4b4" : type === "success" ? "#d8ffe1" : "#d8ebff",
    borderLeft: `3px solid ${type === "error" ? "#ea4335" : type === "success" ? "#34a853" : "#4ea1ff"}`,
    background: type === "error" ? "#130d0d" : type === "success" ? "#0a2013" : "#0d1e30",
    padding: "7px 10px", fontSize: 10, lineHeight: 1.6, borderRadius: "0 6px 6px 0",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Sub-tabs */}
      <div style={{ display: "flex", gap: 6 }}>
        {OPS_SUB_TABS.map((tab) => {
          const active = tab.id === opsSubTab;
          return (
            <button key={tab.id} type="button" onClick={() => setOpsSubTab(tab.id)} style={{
              border: `1px solid ${active ? tab.color : "#252525"}`,
              background: active ? `${tab.color}18` : "#181818",
              color: active ? tab.color : "#5a5a5a",
              borderRadius: 999, padding: "6px 18px", fontSize: 12, fontWeight: 800,
              cursor: "pointer", transition: "border-color 0.15s, color 0.15s",
            }}>
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Pipeline + Controls */}
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        {/* Left: pipeline diagram */}
        <div style={{ flex: 1, minWidth: 0, background: "#0c0c0c", border: "1px solid #1e1e1e", borderRadius: 14, padding: "18px 14px 12px" }}>
          <OpsPipelineDiagram tab={opsSubTab} nodeStatuses={nodeStatuses} />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, flexWrap: "wrap", marginTop: 8 }}>
            {(["active", "success", "failed", "muted"] as PipelineNodeStatus[]).map((status) => (
              <span key={status} style={{ display: "inline-flex", alignItems: "center", gap: 5, color: PIPELINE_STATUS_META[status].text, fontSize: 9, fontWeight: 800 }}>
                <span style={{ width: 7, height: 7, borderRadius: 999, background: PIPELINE_STATUS_META[status].stroke }} />
                {PIPELINE_STATUS_META[status].label}
              </span>
            ))}
          </div>
        </div>

        {/* Right: control panel */}
        <div style={{ width: 230, flexShrink: 0, display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ background: "#111", border: "1px solid #222", borderRadius: 10, padding: "9px 12px" }}>
            <div style={{ color: "#d8d8d8", fontSize: 11, fontWeight: 900, lineHeight: 1.35 }}>{runtimeMeta.title}</div>
            <div style={{ color: "#666", fontSize: 9, lineHeight: 1.45, marginTop: 3 }}>{runtimeMeta.detail}</div>
          </div>

          {/* Status chip */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#111", border: "1px solid #222", borderRadius: 10, padding: "9px 12px" }}>
            <span style={{
              width: 8, height: 8, borderRadius: 999, flexShrink: 0,
              background: isRunning ? "#34a853" : "#2e2e2e",
              boxShadow: isRunning ? "0 0 6px #34a853" : "none",
              ...(isRunning ? { animation: "gxp-pulse 1s ease-in-out infinite" } as CSSProperties : {}),
            }} />
            <span style={{ color: isRunning ? "#c8ffd4" : "#4a4a4a", fontSize: 11, fontWeight: 900 }}>
              {isRunning ? "실행 중" : "idle"}
            </span>
          </div>

          {/* ── QA ── */}
          {opsSubTab === "qa" && (
            <>
              <button type="button" data-monitor-action="trigger-manual-qa-run" onClick={onTriggerQaRun} disabled={qaTriggerLoading} style={ctaStyle("#4ea1ff", "#0d1e30", qaTriggerLoading)}>
                <PlayCircle size={13} aria-hidden />{qaTriggerLoading ? "GitHub 실행 중..." : "GitHub 실행"}
              </button>
              <button type="button" data-monitor-action="run-visible-qa" onClick={onRunVisibleQa} disabled={visibleQaLoading} style={ctaStyle("#34a853", "#0a2013", visibleQaLoading)}>
                <ExternalLink size={13} aria-hidden />{visibleQaLoading ? "로컬 실행 중..." : "로컬 화면 실행"}
              </button>

              {/* Collapsible advanced */}
              <button type="button" onClick={() => setQaExpanded((x) => !x)} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                background: "transparent", border: "1px solid #252525", color: "#5a5a5a",
                borderRadius: 8, padding: "7px 11px", fontSize: 10, fontWeight: 800, cursor: "pointer", width: "100%",
              }}>
                <span>상세 설정</span>
                <span style={{ display: "inline-block", transition: "transform 0.2s", transform: qaExpanded ? "rotate(180deg)" : "none" }}>▼</span>
              </button>

              {qaExpanded && (
                <div style={{ display: "flex", flexDirection: "column", gap: 9, background: "#0e0e0e", border: "1px solid #222", borderRadius: 10, padding: 12 }}>
                  <div style={{ color: "#555", fontSize: 9, fontWeight: 900, letterSpacing: "0.06em" }}>SUITE</div>
                  <div style={{ display: "grid", gap: 4 }}>
                    {QA_SUITES.map((suite) => {
                      const sel = suite.id === selectedQaSuite;
                      return (
                        <button key={suite.id} type="button" onClick={() => onQaSuiteChange(suite.id)} style={{
                          border: `1px solid ${sel ? "#4ea1ff" : "#252525"}`, background: sel ? "#0d1e30" : "#151515",
                          color: sel ? "#d8ebff" : "#7a7a7a", borderRadius: 6, padding: "6px 9px",
                          textAlign: "left", cursor: "pointer", fontSize: 10, fontWeight: sel ? 900 : 700,
                        }}>
                          <span style={{ display: "block" }}>{suite.label}</span>
                          <span style={{ display: "block", fontSize: 9, color: sel ? "#6aa8e0" : "#4a4a4a", marginTop: 1 }}>{suite.description}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ borderTop: "1px solid #1e1e1e", paddingTop: 9 }}>
                    <div style={{ color: "#555", fontSize: 9, fontWeight: 900, letterSpacing: "0.06em", marginBottom: 6 }}>VISIBLE QA 계정</div>
                    <div style={{ color: qaTokenConnected ? "#555" : "#c49a00", fontSize: 9, lineHeight: 1.5, marginBottom: 7 }}>
                      {qaTokenConnected ? "저장된 GitHub token 사용 가능" : "GitHub token 없음 — fallback env 사용"}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 7 }}>
                      <span style={{ color: qaCredentialsConnected ? "#34a853" : "#5a5a5a", fontSize: 10, fontWeight: 900 }}>
                        {qaCredentialsConnected ? "저장됨" : "미저장"}
                      </span>
                      {qaCredentialsConnected && (
                        <button type="button" onClick={onClearQaCredentials} style={compactDangerButtonStyle}>삭제</button>
                      )}
                    </div>
                    {!qaCredentialsConnected && (
                      <div style={{ display: "grid", gap: 5 }}>
                        <input type="email" value={qaCredentialsInput.email} onChange={(e) => onQaCredentialsInputChange({ email: e.currentTarget.value })} placeholder="admin email" style={compactInputStyle} />
                        <input type="password" value={qaCredentialsInput.password} onChange={(e) => onQaCredentialsInputChange({ password: e.currentTarget.value })} placeholder="password" style={compactInputStyle} />
                        <input type="password" value={qaCredentialsInput.mfaSecret} onChange={(e) => onQaCredentialsInputChange({ mfaSecret: e.currentTarget.value })} placeholder="MFA secret" style={compactInputStyle} />
                        <button type="button" onClick={onSaveQaCredentials} disabled={qaCredentialsSaving} style={{ ...compactButtonStyle, justifyContent: "center", width: "100%" }}>
                          {qaCredentialsSaving ? "저장중..." : "계정 저장"}
                        </button>
                      </div>
                    )}
                    {qaCredentialsError && <div style={{ color: "#ffb4b4", fontSize: 9, lineHeight: 1.5, marginTop: 6 }}>{qaCredentialsError}</div>}
                  </div>
                  <button type="button" onClick={() => window.open(QA_WORKFLOW_URL, "_blank", "noopener,noreferrer")} style={linkButtonStyle}>
                    <ExternalLink size={11} aria-hidden />GitHub workflow ↗
                  </button>
                </div>
              )}

              {qaTriggerError && <div style={msgStyle("error")}>요청 실패: {qaTriggerError}</div>}
              {qaTriggerMessage && <div style={msgStyle("info")}>{qaTriggerMessage}</div>}
              {visibleQaError && <div style={msgStyle("error")}>Visible 실패: {visibleQaError}</div>}
              {visibleQaMessage && <div style={msgStyle("success")}>{visibleQaMessage}</div>}
            </>
          )}

          {/* ── Blog ── */}
          {opsSubTab === "blog" && (
            <>
              <button type="button" data-monitor-action="trigger-manual-blog-sync" onClick={onTriggerBlogSync} disabled={syncLoading} style={ctaStyle("#a855f7", "#1a0d24", syncLoading)}>
                <PlayCircle size={13} aria-hidden />{syncLoading ? "동기화 중..." : "블로그 동기화 실행"}
              </button>
              {syncError && <div style={msgStyle("error")}>요청 실패: {syncError}</div>}
              {syncResult && (
                <div style={{ background: syncResult.dispatched ? "#0a1a0e" : "#130d0d", border: `1px solid ${syncResult.dispatched ? "#1a4426" : "#3a2020"}`, borderRadius: 10, padding: 10 }}>
                  <div style={{ color: syncResult.dispatched ? "#34a853" : "#ffb4b4", fontSize: 10, fontWeight: 900, marginBottom: 8 }}>
                    {syncResult.dispatched ? "Actions 실행 요청 완료" : "Actions 트리거 실패"}
                  </div>
                  {syncResult.run && (
                    <div style={{ display: "grid", gap: 5, marginBottom: 8 }}>
                      <div style={opsResultRowStyle}><span>Run ID</span><strong>{syncResult.run.id}</strong></div>
                      <div style={opsResultRowStyle}><span>Status</span><strong>{syncResult.run.status}</strong></div>
                    </div>
                  )}
                  {syncResult.dispatched === false && syncResult.dispatchError && (
                    <div style={{ color: "#ffb4b4", fontSize: 9, lineHeight: 1.5, marginBottom: 8 }}>{syncResult.dispatchError}</div>
                  )}
                  <button type="button" onClick={() => window.open(NAVER_BLOG_SYNC_WORKFLOW_URL, "_blank", "noopener,noreferrer")} style={linkButtonStyle}>
                    <ExternalLink size={11} aria-hidden />GitHub workflow ↗
                  </button>
                </div>
              )}
            </>
          )}

          {/* ── AI ── */}
          {opsSubTab === "ai" && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 68px", gap: 6 }}>
                <input type="text" value={blogAiProfilePath} onChange={(e) => onBlogAiProfilePathChange(e.currentTarget.value)} placeholder="profile.json 경로" style={compactInputStyle} />
                <input type="number" min={1} max={30} value={blogAiSampleCount} onChange={(e) => onBlogAiSampleCountChange(e.currentTarget.value)} placeholder="27" style={compactInputStyle} />
              </div>
              <button type="button" data-monitor-action="analyze-blog-style" onClick={onAnalyzeBlogStyle} disabled={blogAiAnalyzeLoading} style={ctaStyle("#fbbc05", "#201a08", blogAiAnalyzeLoading)}>
                <RefreshCw size={13} aria-hidden />{blogAiAnalyzeLoading ? "재분석 중..." : "스타일 재분석"}
              </button>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
                {(["url", "text"] as BlogAiInputMode[]).map((mode) => {
                  const sel = mode === blogAiInputMode;
                  return (
                    <button key={mode} type="button" onClick={() => onBlogAiInputModeChange(mode)} style={{
                      border: `1px solid ${sel ? "#fbbc05" : "#252525"}`, background: sel ? "#201a08" : "#141414",
                      color: sel ? "#ffe8a3" : "#6a6a6a", borderRadius: 6, padding: "6px 8px", fontSize: 10, fontWeight: 900, cursor: "pointer",
                    }}>
                      {mode === "url" ? "기사 URL" : "본문 붙여넣기"}
                    </button>
                  );
                })}
              </div>
              {blogAiInputMode === "url" ? (
                <input type="url" value={blogAiArticleUrl} onChange={(e) => onBlogAiArticleUrlChange(e.currentTarget.value)} placeholder="https://n.news.naver.com/..." style={{ ...compactInputStyle, width: "100%" }} />
              ) : (
                <textarea value={blogAiArticleText} onChange={(e) => onBlogAiArticleTextChange(e.currentTarget.value)} placeholder="기사 본문을 붙여넣으세요." style={{ ...compactTextareaStyle, minHeight: 80 }} />
              )}
              <button type="button" data-monitor-action="generate-blog-draft" onClick={onGenerateBlogDraft} disabled={blogAiGenerateLoading} style={ctaStyle("#fbbc05", "#201a08", blogAiGenerateLoading)}>
                <PlayCircle size={13} aria-hidden />{blogAiGenerateLoading ? "초안 생성 중..." : "AI 초안 생성"}
              </button>
              {blogAiAnalyzeError && <div style={msgStyle("error")}>분석 실패: {blogAiAnalyzeError}</div>}
              {blogAiAnalyzeMessage && <div style={{ ...msgStyle("info"), borderLeftColor: "#fbbc05", background: "#201a08", color: "#ffe8a3" }}>{blogAiAnalyzeMessage}</div>}
              {blogAiGenerateError && <div style={msgStyle("error")}>생성 실패: {blogAiGenerateError}</div>}
            </>
          )}
        </div>
      </div>

      {/* AI Draft result — full width below */}
      {opsSubTab === "ai" && blogAiDraftResult && (
        <section style={{ background: "#0c0c0c", border: "1px solid #1e1e1e", borderRadius: 14, padding: 18, display: "grid", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <div style={{ color: "#e0e0e0", fontSize: 12, fontWeight: 900 }}>생성 완료</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <button type="button" onClick={() => copyBlogText("all", buildBlogDraftCopyText(blogAiDraftResult.draft))} style={linkButtonStyle}>
                {copiedBlogField === "all" ? <Check size={11} aria-hidden /> : <Copy size={11} aria-hidden />}
                {copiedBlogField === "all" ? "복사됨" : "전체 복사"}
              </button>
              <button type="button" onClick={() => copyBlogText("titles", formatBlogTitles(blogAiDraftResult.draft.titles))} style={linkButtonStyle}>
                {copiedBlogField === "titles" ? <Check size={11} aria-hidden /> : <Copy size={11} aria-hidden />}제목
              </button>
              <button type="button" onClick={() => copyBlogText("content", blogAiDraftResult.draft.content)} style={linkButtonStyle}>
                {copiedBlogField === "content" ? <Check size={11} aria-hidden /> : <Copy size={11} aria-hidden />}본문
              </button>
              <button type="button" onClick={() => copyBlogText("tags", blogAiDraftResult.draft.tags)} style={linkButtonStyle}>
                {copiedBlogField === "tags" ? <Check size={11} aria-hidden /> : <Copy size={11} aria-hidden />}태그
              </button>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, fontSize: 10, color: "#6a6a6a" }}>
            <div>Profile: <strong style={{ color: "#aaa" }}>{blogAiDraftResult.profilePath}</strong></div>
            <div>샘플: <strong style={{ color: "#aaa" }}>{blogAiDraftResult.draft.sampleCount}개</strong></div>
            <div>입력: <strong style={{ color: "#aaa" }}>{blogAiDraftResult.inputMode === "url" ? "기사 URL" : "본문"}</strong></div>
            <div>길이: <strong style={{ color: "#aaa" }}>{blogAiDraftResult.articleTextLength}자</strong></div>
          </div>
          <div style={opsCodeBlockStyle}>
            <div style={opsSectionLabelStyle}>제목 후보</div>
            <div style={{ whiteSpace: "pre-wrap" }}>{formatBlogTitles(blogAiDraftResult.draft.titles)}</div>
          </div>
          <div style={opsCodeBlockStyle}>
            <div style={opsSectionLabelStyle}>본문</div>
            <div style={{ whiteSpace: "pre-wrap" }}>{blogAiDraftResult.draft.content}</div>
          </div>
          <div style={opsCodeBlockStyle}>
            <div style={opsSectionLabelStyle}>해시태그</div>
            <div style={{ whiteSpace: "pre-wrap" }}>{blogAiDraftResult.draft.tags}</div>
          </div>
          <div style={{ border: "1px solid #222", borderRadius: 10, padding: 12, background: "#111" }}>
            <div style={{ color: "#e0e0e0", fontSize: 11, fontWeight: 900, marginBottom: 6 }}>수정 요청</div>
            <div style={{ color: "#5a5a5a", fontSize: 9, lineHeight: 1.5, marginBottom: 8 }}>
              예: `첫 문단을 더 짧게` · `제목을 더 공식적으로` · `해시태그를 투자자 관점으로`
            </div>
            <textarea value={blogAiRevisionInstruction} onChange={(e) => onBlogAiRevisionInstructionChange(e.currentTarget.value)} placeholder="수정 요청을 입력해 주세요." style={compactTextareaStyle} />
            <button type="button" data-monitor-action="revise-blog-draft" onClick={onReviseBlogDraft} disabled={blogAiRevisionLoading}
              style={{ ...ctaStyle("#fbbc05", "#201a08", blogAiRevisionLoading), marginTop: 8 }}>
              <RefreshCw size={13} aria-hidden />{blogAiRevisionLoading ? "수정 반영 중..." : "수정 요청 반영"}
            </button>
            {blogAiRevisionError && <div style={{ color: "#ffb4b4", fontSize: 9, lineHeight: 1.5, marginTop: 8 }}>{blogAiRevisionError}</div>}
          </div>
        </section>
      )}
    </div>
  );
}
