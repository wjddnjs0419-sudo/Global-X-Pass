import { useState } from "react";
import { Check, Copy, ExternalLink, FileText, LocateFixed, PlayCircle, RefreshCw, X } from "lucide-react";
import { FLOATING_PANEL_EDGE_MARGIN, FLOATING_PANEL_WIDTH, SEVERITY_COLOR } from "./constants";
import { formatTime, generateAgentPrompt, getBlogRunMeta, getBlogRunSummary } from "./mapUtils";
import { compactButtonStyle, compactDangerButtonStyle, floatingCloseButtonStyle, linkButtonStyle, qaMetricStyle } from "./styles";
import type { ArchitectureInboxItem, QaRun } from "./types";

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

export function ArchitectureInboxPanel({
  items,
  selectedIds,
  readIds,
  qaLoading,
  qaError,
  blogLoading,
  blogError,
  counts,
  layout,
  onClose,
  onOpenOps,
  onRefresh,
  onToggleSelection,
  onSelectAll,
  onMarkRead,
  onHide,
  onFocusNode,
  onOpenHref,
}: {
  items: ArchitectureInboxItem[];
  selectedIds: Set<string>;
  readIds: Set<string>;
  qaLoading: boolean;
  qaError: string | null;
  blogLoading: boolean;
  blogError: string | null;
  counts: { issue: number; qa: number; blog: number };
  layout: { left: number; bottom: number; maxHeight: number };
  onClose: () => void;
  onOpenOps: () => void;
  onRefresh: () => void;
  onToggleSelection: (itemId: string) => void;
  onSelectAll: (selected: boolean) => void;
  onMarkRead: (ids: string[]) => void;
  onHide: (ids: string[]) => void;
  onFocusNode: (nodeId: string) => void;
  onOpenHref: (href: string) => void;
}) {
  const allSelected = items.length > 0 && items.every((item) => selectedIds.has(item.id));
  const selectedItemIds = Array.from(selectedIds).filter((id) => items.some((item) => item.id === id));
  const unreadCount = items.filter((item) => !readIds.has(item.id)).length;
  const [expandedPromptId, setExpandedPromptId] = useState<string | null>(null);
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);

  const copyToClipboard = (run: QaRun) => {
    if (!navigator.clipboard?.writeText) return;
    void navigator.clipboard.writeText(generateAgentPrompt(run)).then(() => {
      setCopiedPromptId(run.id);
      setTimeout(() => setCopiedPromptId((current) => (current === run.id ? null : current)), 2000);
    }).catch(() => undefined);
  };

  return (
    <section
      role="dialog"
      aria-modal="true"
      aria-label="이슈 인박스"
      onClick={(event) => event.stopPropagation()}
      style={{
        position: "fixed",
        left: layout.left,
        bottom: layout.bottom,
        width: FLOATING_PANEL_WIDTH,
        maxWidth: `calc(100vw - ${FLOATING_PANEL_EDGE_MARGIN * 2}px)`,
        maxHeight: layout.maxHeight,
        background: "var(--color-bg-elevated)",
        border: "1px solid var(--color-border-soft)",
        borderRadius: 18,
        boxShadow: "0 22px 56px rgba(0, 0, 0, 0.38)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        zIndex: 40,
      }}
    >
      <div style={{ padding: "16px 18px 12px", borderBottom: "1px solid var(--color-border-soft)" }}>
        <div style={{ display: "flex", alignItems: "start", justifyContent: "space-between", gap: 12 }}>
          <div>
            <h2 style={{ margin: 0, color: "var(--color-text-primary)", fontSize: 14, fontWeight: 900 }}>이슈 인박스</h2>
            <div style={{ color: "var(--color-text-muted)", fontSize: 11, marginTop: 4 }}>운영 신호를 한 곳에서 보고 정리합니다.</div>
          </div>
          <button type="button" onClick={onClose} aria-label="인박스 닫기" style={floatingCloseButtonStyle}>
            <X size={18} aria-hidden />
          </button>
        </div>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 12 }}>
          <span style={qaMetricStyle}>{items.length} inbox</span>
          <span style={qaMetricStyle}>{unreadCount} unread</span>
          <span style={qaMetricStyle}>Issue {counts.issue}</span>
          <span style={qaMetricStyle}>QA {counts.qa}</span>
          <span style={qaMetricStyle}>Blog {counts.blog}</span>
        </div>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 12 }}>
          <label style={{ ...compactButtonStyle, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
            <input
              type="checkbox"
              checked={allSelected}
              onChange={(event) => onSelectAll(event.currentTarget.checked)}
              style={{ width: 13, height: 13, margin: 0 }}
            />
            전체 선택
          </label>
          <button type="button" onClick={onRefresh} disabled={qaLoading || blogLoading} style={compactButtonStyle}>
            <RefreshCw size={12} aria-hidden />
            새로고침
          </button>
          <button type="button" disabled={selectedItemIds.length === 0} onClick={() => onMarkRead(selectedItemIds)} style={compactButtonStyle}>
            읽음
          </button>
          <button type="button" disabled={selectedItemIds.length === 0} onClick={() => onHide(selectedItemIds)} style={compactDangerButtonStyle}>
            선택 삭제
          </button>
          <button type="button" disabled={items.length === 0} onClick={() => onHide(items.map((item) => item.id))} style={compactDangerButtonStyle}>
            전체 삭제
          </button>
        </div>
      </div>

      <div style={{ padding: "12px 18px 16px", overflowY: "auto" }}>
        {(qaError || blogError) && (
          <div style={{ display: "grid", gap: 8, marginBottom: 12 }}>
            {qaError && (
              <div style={{ color: "#ffcf7d", borderLeft: "3px solid #fbbc05", background: "#2a2410", padding: "8px 10px", fontSize: 11, lineHeight: 1.6 }}>
                QA 신호를 불러오지 못했습니다. {qaError}
              </div>
            )}
            {blogError && (
              <div style={{ color: "#ffb4b4", borderLeft: "3px solid #ea4335", background: "#1a1010", padding: "8px 10px", fontSize: 11, lineHeight: 1.6 }}>
                블로그 동기화 신호를 불러오지 못했습니다. {blogError}
              </div>
            )}
            <button type="button" onClick={onOpenOps} style={{ ...linkButtonStyle, width: "fit-content" }}>
              <PlayCircle size={12} aria-hidden />
              Ops 열기
            </button>
          </div>
        )}

        {items.length === 0 ? (
          <div style={{ color: "var(--color-text-muted)", fontSize: 12, lineHeight: 1.7, padding: "24px 2px" }}>
            현재 인박스에 표시할 운영 신호가 없습니다.
          </div>
        ) : items.map((item) => {
          const unread = !readIds.has(item.id);
          const selected = selectedIds.has(item.id);
          const qaRun = item.qaRun;
          const blogRun = item.blogRun;
          const isFailedQa = Boolean(qaRun && qaRun.conclusion && qaRun.conclusion !== "success");
          const qaMeta = qaRun ? getQaRunMeta(qaRun) : null;
          const blogMeta = blogRun ? getBlogRunMeta(blogRun) : null;
          const badge = item.kind === "qa"
            ? qaMeta
            : item.kind === "blog"
            ? blogMeta
            : { label: item.kind.toUpperCase(), color: SEVERITY_COLOR[item.severity], bg: "rgba(255,255,255,0.04)" };

          return (
            <article key={item.id} style={{ border: `1px solid ${selected ? "#4ea1ff" : "var(--color-border-soft)"}`, background: unread ? "#171d21" : "#121212", borderRadius: 12, padding: 12, marginBottom: 10 }}>
              <div style={{ display: "grid", gridTemplateColumns: "18px minmax(0, 1fr) auto", gap: 8, alignItems: "start" }}>
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => onToggleSelection(item.id)}
                  style={{ width: 14, height: 14, marginTop: 3 }}
                  aria-label={`${item.title} 선택`}
                />
                <button
                  type="button"
                  onClick={() => onMarkRead([item.id])}
                  style={{ border: 0, background: "transparent", color: "var(--color-text-primary)", padding: 0, textAlign: "left", minWidth: 0, cursor: "pointer" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                    {unread && <span style={{ width: 7, height: 7, borderRadius: 999, background: item.kind === "blog" ? "#a855f7" : item.kind === "qa" ? "#4ea1ff" : SEVERITY_COLOR[item.severity], flex: "0 0 auto" }} />}
                    <span style={{ fontSize: 12, fontWeight: unread ? 900 : 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.title}
                    </span>
                  </div>
                  <div style={{ color: "var(--color-text-muted)", fontSize: 10, marginTop: 4 }}>
                    {item.meta}
                  </div>
                </button>
                <span style={{ border: `1px solid ${badge.color}`, background: badge.bg, color: badge.color, borderRadius: 999, padding: "3px 7px", fontSize: 10, fontWeight: 900 }}>
                  {badge.label}
                </span>
              </div>

              <div style={{ color: "var(--color-text-secondary)", fontSize: 11, lineHeight: 1.55, marginTop: 8, paddingLeft: 26 }}>
                {item.subtitle}
              </div>

              {item.locationLabel && (
                <div style={{ color: "var(--color-text-muted)", fontSize: 10, lineHeight: 1.45, marginTop: 6, paddingLeft: 26 }}>
                  {item.locationLabel}
                </div>
              )}

              {blogRun && !blogRun.error && (
                <div style={{ color: "#d6d6d6", fontSize: 11, lineHeight: 1.55, marginTop: 6, paddingLeft: 26 }}>
                  {getBlogRunSummary(blogRun)}
                </div>
              )}

              {qaRun?.failedStep && (
                <div style={{ color: "#ffb4b4", fontSize: 11, lineHeight: 1.5, marginTop: 6, paddingLeft: 26 }}>
                  {qaRun.failedStep.job} / {qaRun.failedStep.step}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginTop: 10, paddingLeft: 26 }}>
                <span style={{ color: "var(--color-text-muted)", fontSize: 10 }}>
                  {qaRun
                    ? `attempt ${qaRun.runAttempt} · ${qaRun.actor ?? "unknown"}`
                    : blogRun
                    ? `시작 ${blogRun.started_at ? formatTime(blogRun.started_at) : "대기"} · 종료 ${blogRun.finished_at ? formatTime(blogRun.finished_at) : "미완료"}`
                    : formatTime(item.createdAt)}
                </span>
                <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
                  {item.nodeId && (
                    <button type="button" onClick={() => onFocusNode(item.nodeId!)} style={linkButtonStyle}>
                      <LocateFixed size={12} aria-hidden />
                      Node
                    </button>
                  )}
                  {isFailedQa && qaRun && (
                    <button
                      type="button"
                      onClick={() => setExpandedPromptId((current) => (current === qaRun.id ? null : qaRun.id))}
                      style={linkButtonStyle}
                    >
                      <FileText size={12} aria-hidden />
                      작업 지시서
                    </button>
                  )}
                  {item.href && (
                    <button type="button" onClick={() => onOpenHref(item.href!)} style={linkButtonStyle}>
                      <ExternalLink size={12} aria-hidden />
                      {item.kind === "blog" && !blogRun?.github_run_id ? "Workflow" : "Open"}
                    </button>
                  )}
                </div>
              </div>

              {isFailedQa && qaRun && expandedPromptId === qaRun.id && (
                <div style={{ marginTop: 10, paddingLeft: 26 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: 10, color: "var(--color-text-muted)", fontWeight: 700 }}>AI 에이전트 작업 지시서</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(qaRun)}
                      style={linkButtonStyle}
                      title="클립보드에 복사"
                    >
                      {copiedPromptId === qaRun.id ? <Check size={12} aria-hidden /> : <Copy size={12} aria-hidden />}
                      {copiedPromptId === qaRun.id ? "복사됨" : "복사"}
                    </button>
                  </div>
                  <pre
                    style={{
                      margin: 0,
                      padding: "10px 12px",
                      background: "#0d1117",
                      border: "1px solid #2a2a2a",
                      borderRadius: 6,
                      fontSize: 10,
                      lineHeight: 1.6,
                      color: "#c9d1d9",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-all",
                      maxHeight: 280,
                      overflowY: "auto",
                    }}
                  >
                    {generateAgentPrompt(qaRun)}
                  </pre>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
