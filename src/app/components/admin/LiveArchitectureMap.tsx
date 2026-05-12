import { useEffect, useMemo, useState, type CSSProperties } from "react";
import architectureMap from "@/generated/architectureMap.json";
import { LocateFixed, Search } from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";
import { logActionFailure, logSupabaseFailure } from "../../../lib/uxTelemetry";
import { explainError } from "../../../lib/errorExplainer";

declare global {
  interface Window {
    electronAPI?: {
      openTerminal: (command?: string) => Promise<void>;
      readMapData: () => Promise<{ ok: boolean; data?: ArchitectureMap; error?: string }>;
      refreshMap: () => Promise<{ ok: boolean; output?: string; code?: number }>;
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

type FilterId = "overview" | "errors" | "dead" | "auth" | "events" | "consulting" | "founders" | "admin" | "pii" | "all";
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

  const openTerminal = (command?: string) => {
    window.electronAPI?.openTerminal(command);
  };

  useEffect(() => {
    if (!window.electronAPI?.readMapData) return;
    void window.electronAPI.readMapData().then((result) => {
      if (result.ok && result.data) setMapData(result.data);
    });
  }, []);

  const handleMapRefresh = async () => {
    if (!window.electronAPI?.refreshMap) return;
    setMapRefreshStatus("loading");
    const result = await window.electronAPI.refreshMap();
    if (!result.ok) {
      setMapRefreshStatus("error");
      setTimeout(() => setMapRefreshStatus("idle"), 3000);
      return;
    }
    const readResult = await window.electronAPI.readMapData();
    if (readResult.ok && readResult.data) setMapData(readResult.data);
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
        logSupabaseFailure("admin-page", "fetch_error_issues_for_live_architecture_map", new Error(errMsg));
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

    const issuesChannel = supabase
      .channel(`realtime-error-issues-${windowMinutes}`)
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
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          logActionFailure("admin-page", "subscribe_error_issues_realtime", `Realtime subscription ${status}`, {
            severity: "medium",
            context: { status, windowMinutes },
          });
        }
      });

    const logsChannel = supabase
      .channel(`realtime-error-logs-history-${windowMinutes}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "error_logs" },
        (payload) => {
          const next = payload.new as ErrorLog;
          if (new Date(next.created_at).getTime() < new Date(since).getTime()) return;
          setLogs((prev) => [next, ...prev].slice(0, 500));
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(issuesChannel);
      void supabase.removeChannel(logsChannel);
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

  const focusNode = (nodeId: string) => {
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
    setSelectedId(null);
    setSelectedFingerprint(null);
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
      logSupabaseFailure("admin-page", `update_error_issue_${action}`, error, {
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
        <aside style={{ width: 320, flex: "0 0 320px", background: "#161616", borderLeft: "1px solid #2a2a2a", overflow: "auto", padding: "18px 16px" }}>
          {loadError && (
            <div style={{ color: "#ff3860", borderLeft: "3px solid #ff3860", background: "#1a1010", padding: "8px 10px", fontSize: 11, lineHeight: 1.6, marginBottom: 14 }}>
              error_issues 조회 실패: {loadError}
            </div>
          )}
          {selectedNode ? (
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
              activeIssues={activeIssues}
              activeIssuesBySource={activeIssuesBySource}
              watchNodes={watchNodes}
              nodesById={nodesById}
              onFocusNode={focusNode}
              onOpenTerminal={openTerminal}
            />
          )}
        </aside>
      </div>
    </section>
  );
}

function ArchitectureMapSidebar({
  loading,
  generatedAt,
  nodeCount,
  edgeCount,
  activeIssues,
  activeIssuesBySource,
  watchNodes,
  nodesById,
  onFocusNode,
  onOpenTerminal,
}: {
  loading: boolean;
  generatedAt: string;
  nodeCount: number;
  edgeCount: number;
  activeIssues: ErrorIssue[];
  activeIssuesBySource: Map<string, ErrorIssue[]>;
  watchNodes: MapNode[];
  nodesById: Map<string, MapNode>;
  onFocusNode: (nodeId: string) => void;
  onOpenTerminal: (command?: string) => void;
}) {
  const topSources = Array.from(activeIssuesBySource.entries()).sort((a, b) => b[1].length - a[1].length).slice(0, 5);
  return (
    <>
      <h2 style={{ fontSize: 13, fontWeight: 800, margin: "0 0 14px", color: "#e8e8e8" }}>Notable Findings</h2>
      <div style={findingStyle}><strong>Realtime status</strong>: {loading ? "이슈 상태를 불러오는 중입니다." : `${activeIssues.length}개 열린 이슈, ${watchNodes.length}개 주의 노드를 표시 중입니다.`}</div>
      <div style={findingStyle}><strong>Generated map</strong>: {nodeCount}개 노드와 {edgeCount}개 연결선을 `architectureMap.json`에서 읽어옵니다.</div>
      <div style={findingStyle}><strong>Private app</strong>: 운영 웹 라우트에서 분리된 로컬 전용 맵입니다. 코드 구조 자동 생성과 Supabase 이슈 조회만 유지합니다.</div>

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

const plainSidebarButtonStyle: CSSProperties = {
  width: "100%",
  border: 0,
  borderTop: "1px solid #2a2a2a",
  background: "transparent",
  padding: "10px 0",
  textAlign: "left",
  cursor: "pointer",
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
