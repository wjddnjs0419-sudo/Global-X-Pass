import type { CSSProperties } from "react";
import { ExternalLink, LocateFixed } from "lucide-react";

export type IncidentSeverity = "low" | "medium" | "high" | "critical";
export type IncidentKind = "issue" | "qa" | "blog";

export type IncidentFeedItem = {
  id: string;
  kind: IncidentKind;
  severity: IncidentSeverity;
  title: string;
  subtitle: string;
  meta: string;
  createdAt: string;
  nodeId?: string;
  href?: string;
};

type IncidentFeedProps = {
  items: IncidentFeedItem[];
  onFocusNode: (nodeId: string) => void;
  onOpenHref: (href: string) => void;
};

const KIND_LABEL: Record<IncidentKind, string> = {
  issue: "Issue",
  qa: "QA",
  blog: "Blog",
};

const SEVERITY_COLOR: Record<IncidentSeverity, string> = {
  low: "var(--color-brand-green)",
  medium: "var(--color-brand-yellow)",
  high: "var(--color-brand-red)",
  critical: "var(--color-brand-red)",
};

export function IncidentFeed({ items, onFocusNode, onOpenHref }: IncidentFeedProps) {
  const visibleItems = items.slice(0, 8);

  return (
    <section style={sectionStyle} aria-label="Incident feed">
      <div style={headerStyle}>
        <div>
          <h2 style={titleStyle}>Incident Feed</h2>
          <div style={captionStyle}>{items.length} active signals</div>
        </div>
      </div>

      {visibleItems.length === 0 ? (
        <div style={emptyStyle}>현재 합쳐서 볼 운영 신호가 없습니다.</div>
      ) : visibleItems.map((item) => (
        <article key={item.id} style={itemStyle}>
          <div style={itemHeaderStyle}>
            <span style={{ ...severityDotStyle, background: SEVERITY_COLOR[item.severity] }} />
            <span style={kindStyle}>{KIND_LABEL[item.kind]}</span>
            <span style={metaStyle}>{item.meta}</span>
          </div>
          <div style={itemTitleStyle}>{item.title}</div>
          <div style={itemSubtitleStyle}>{item.subtitle}</div>
          {(item.nodeId || item.href) && (
            <div style={actionRowStyle}>
              {item.nodeId && (
                <button type="button" onClick={() => onFocusNode(item.nodeId!)} style={actionButtonStyle}>
                  <LocateFixed size={12} aria-hidden />
                  Node
                </button>
              )}
              {item.href && (
                <button type="button" onClick={() => onOpenHref(item.href!)} style={actionButtonStyle}>
                  <ExternalLink size={12} aria-hidden />
                  Open
                </button>
              )}
            </div>
          )}
        </article>
      ))}
    </section>
  );
}

const sectionStyle: CSSProperties = {
  border: "1px solid var(--color-glass-border)",
  background: "var(--color-glass-bg)",
  borderRadius: "var(--radius-sm)",
  padding: "var(--space-sm)",
  marginBottom: "var(--space-md)",
};

const headerStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "var(--space-xs)",
  marginBottom: "var(--space-sm)",
};

const titleStyle: CSSProperties = {
  color: "var(--color-text-primary)",
  fontSize: 13,
  fontWeight: 900,
  margin: 0,
};

const captionStyle: CSSProperties = {
  color: "var(--color-text-muted)",
  fontSize: 10,
  marginTop: "var(--space-2xs)",
};

const emptyStyle: CSSProperties = {
  color: "var(--color-text-secondary)",
  fontSize: 11,
  lineHeight: 1.6,
};

const itemStyle: CSSProperties = {
  borderTop: "1px solid var(--color-glass-border)",
  paddingTop: "var(--space-xs)",
  marginTop: "var(--space-xs)",
};

const itemHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "var(--space-2xs)",
  minWidth: 0,
};

const severityDotStyle: CSSProperties = {
  width: 7,
  height: 7,
  borderRadius: "var(--radius-pill)",
  flex: "0 0 auto",
};

const kindStyle: CSSProperties = {
  color: "var(--color-text-primary)",
  fontSize: 10,
  fontWeight: 900,
};

const metaStyle: CSSProperties = {
  color: "var(--color-text-muted)",
  fontSize: 10,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const itemTitleStyle: CSSProperties = {
  color: "var(--color-text-primary)",
  fontSize: 12,
  fontWeight: 850,
  lineHeight: 1.45,
  marginTop: "var(--space-2xs)",
};

const itemSubtitleStyle: CSSProperties = {
  color: "var(--color-text-secondary)",
  fontSize: 11,
  lineHeight: 1.55,
  marginTop: "var(--space-2xs)",
};

const actionRowStyle: CSSProperties = {
  display: "flex",
  gap: "var(--space-2xs)",
  flexWrap: "wrap",
  marginTop: "var(--space-xs)",
};

const actionButtonStyle: CSSProperties = {
  border: "1px solid var(--color-glass-border)",
  background: "transparent",
  color: "var(--color-text-primary)",
  borderRadius: "var(--radius-sm)",
  padding: "var(--space-2xs) var(--space-xs)",
  fontSize: 10,
  fontWeight: 850,
  display: "inline-flex",
  alignItems: "center",
  gap: "var(--space-2xs)",
  cursor: "pointer",
};
