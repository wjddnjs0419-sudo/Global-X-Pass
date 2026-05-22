import { LocateFixed } from "lucide-react";
import { explainError } from "../../../../lib/errorExplainer";
import { CURRENT_BUILD_ID, SEVERITY_COLOR, STATUS_META } from "./constants";
import { extractCodeLocation, formatTime, summarizeStack } from "./mapUtils";
import { explainLabelStyle, explainTextStyle, fixButtonStyle, issueActionButtonStyle, mapDiffPanelStyle, plainSidebarButtonStyle, sideItemStyle, sideLabelStyle, sideTitleStyle, sideValueStyle } from "./styles";
import type { ArchitectureMapDiff } from "./mapDiff";
import type { ErrorIssue, ErrorLog, MapEdge, MapNode, NodeStatus } from "./types";

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

export function ArchitectureMapSidebar({
  generatedAt,
  mapDiff,
  nodesById,
  onFocusNode,
}: {
  generatedAt: string;
  mapDiff: ArchitectureMapDiff | null;
  nodesById: Map<string, MapNode>;
  onFocusNode: (nodeId: string) => void;
}) {
  return (
    <>
      <MapDiffSummary mapDiff={mapDiff} nodesById={nodesById} onFocusNode={onFocusNode} />

      <div style={sideLabelStyle}>Generated</div>
      <div style={sideValueStyle}>{formatTime(generatedAt)}</div>
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

export function NodeSidebar({
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
