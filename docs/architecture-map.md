---
name: architecture-map
description: Build single self-contained interactive HTML architecture map of codebase. Node clusters (entry/routes/services/data/external) with critical-path highlight, plain-English explain, click-detail sidebar, feature filters, pan+zoom, optional fixes/bugs overlays. Outputs one HTML file, open in browser.
---

# Architecture Map

Produce **one self-contained HTML file** (default: `./architecture-map.html`) rendering codebase as interactive graph. No build, no framework, no external assets. Open directly, or serve with `python3 -m http.server 4747`.

Goal not pretty diagram. Goal: map non-engineer can open and grok system from, AND future maintainer spots dead code / hot paths / weak seams at glance.

---

## What you're building

Dark-themed HTML page with:

1. **Left-to-right column clusters.** Typical six: Client · Server entry · Routes · Services · Data · External APIs. Adapt to stack found:
   - CLI app, Entry · Commands · Core · Storage · External
   - Frontend-only, Pages · Components · State · API clients · External
   - Library, Public API · Core · Helpers · Tests · External

   Don't force six-column template if no fit. Pick clusters matching codebase read.

2. **Nodes**, one per significant file, function, or table. Each carries: real file path (with line numbers when relevant), one-sentence technical role, plain-English version, 2-4 bullet notes (line numbers, gotchas, library specifics), feature tags.

3. **Edges** between nodes labeled with flow (function call, HTTP, DB read/write, external API), color-coded by kind.

4. **Filter chips** top: "Overview" (default), one per major feature, one for critical user-flow path, "Show all wires", optional "Roadmap & bugs".

5. **Right-hand sidebar** updates on hover/click: role + plain English + path + notes + incoming/outgoing edges + per-node fixes/bugs.

6. **Pan + zoom**, mouse-drag pan, wheel zoom anchored to cursor, Fit/+/- buttons.

7. **Optional badges** per node: green circle fix count, red circle bug count.

---

## Method (do in order, no skip)

### 1. Map stack first
Read README, every package manifest (package.json, pyproject.toml, Cargo.toml, go.mod, etc.), entry point. Identify clusters from what seen. Only then pick column layout.

### 2. Identify seam
Find single most important code path. LLM app → prompt-assembly function. Web app → request-handler chain for headline feature. CLI → main loop. Mark every node on path `critical: true` and every edge `kind: 'critical'`. Spine; rest decoration.

### 3. For each node, open file and read
No guess. No summarize from filename. Capture:
- `path`, relative path; include `:line` when key callsite at known line
- `role`, one technical sentence
- `plain`, same idea, written for someone never seen codebase. No jargon, no unexpanded acronyms. Imagine explaining to smart friend who isn't engineer.
- `notes`, 2-4 bullets concrete facts: line numbers, model/library versions, surprising couplings
- `tag`, array of feature-filter chip ids node belongs to (always include `'all'`)

### 4. Find dead code
Every top-level export of every service-layer file, grep callers. Zero live callers gets node with `'DEAD, zero callers'` sub-label. Never silent-omit dead code; surfacing it half the value.

### 5. Label every edge with flow
Examples: `'POST /api/foo'`, `'1 · getContext'`, `'messages.stream → sonnet-4-6'`, `'DB write'`, `'cron · nightly'`. Pick edge `kind`:
- `critical` (red), on main seam
- `api` (orange), call to external service
- `db` (amber), DB read/write
- `mount` (sky blue), entry → route mounts
- `normal` (grey), else

### 6. Tag nodes and edges for filters
Every node and edge gets `tag: [...]` array of feature-filter chip ids. Always include `'all'` so "show all wires" works. Pick chips from actual feature surface (e.g. `auth`, `chat`, `billing`, `documents`, `comms`); don't invent chips for things absent.

### 7. (Optional) FIXES + KNOWN_BUGS registries
If user has roadmap or known-bug list, populate two registries keyed by node id:

```js
const FIXES      = { 'node-id': [{n: 1, t: 'short fix description'}, ...] };
const KNOWN_BUGS = { 'node-id': [{sev: 'high'|'med'|'low', ref: 'optional-code', t: '...'}, ...] };
```

Single fix can appear under multiple node ids — expected, useful (shows everywhere fix touches). Render fix count + bug count as small circular badges in top-right of each node, and "Roadmap & bugs" filter chip dimming all except nodes with badges.

### 8. Sidebar default view earns map its keep
Default sidebar (no node selected) must contain "Notable findings from this map" section with at least one of: dead code located, unexpectedly heavy hot paths, schema/code mismatches, libraries or models you didn't expect, fields re-rendered into same prompt twice, services that look duplicated. Maintainer reads this first.

---

## Visual / technical contract

- **One HTML file.** Embedded `<style>` and `<script>`. No external scripts, fonts, images, D3, React. Vanilla SVG.
- **Hand-positioned layout.** Each node explicit `x, y, w, h`. No auto-layout library; manual positions keep map readable and stable across edits. Leave clear vertical channels between clusters so edges curve through gutters not nodes.
- **Edges are cubic beziers**: `M x1 y1 C cx1 y1, cx2 y2, x2 y2` with arrowhead markers at destination end. Stagger labels on shared gutters to avoid pile-up.
- **Pan/zoom:** apply `transform: translate(tx, ty) scale(s)` to SVG; anchor zoom to wheel cursor.
- **Click on canvas background clears selection.** Click node selects and dims unconnected. Hover = temporary selection.

### Required script shape
User must be able to edit map by hand later. Script section must follow this shape exactly:

```js
const clusters = [
  { id, label, x, y, w, h },   // one column box per cluster
  ...
];

const N = (id, cluster, label, sub, x, y, w, h, color, opts = {}) => ({
  id, cluster, label, sub, x, y, w, h, color, ...opts
});

const nodes = [
  N('node-id', 'cluster-id', 'label.js', 'sub-label', x, y, w, h, 'service', {
    role:  'one technical sentence',
    plain: 'plain-English version',
    path:  'relative/path/to/file.js:42',
    notes: ['line:N, note', 'line:N, note'],
    tag:   ['overview', 'feature-name', 'all'],
    critical: true,   // optional, marks node on the spine
  }),
  ...
];

const edges = [
  { from: 'a', to: 'b', kind: 'critical', label: '1 · doThing', tag: ['overview','feature','all'] },
  ...
];

const FIXES      = { /* optional */ };
const KNOWN_BUGS = { /* optional */ };
```

### Color palette (CSS vars)

```
--bg        #0F0F0F   --panel     #161616
--panel-2   #1c1c1c   --border    #2a2a2a
--text      #e8e8e8   --muted     #8a8a8a
--client    #4ea1ff   --route     #7bd389
--service   #c792ea   --db        #ffb86b
--external  #ff6b9d   --critical  #ff3860
--accent    #f5b942   --accent-2  #ff7a45
```

Cluster fill = darker tint of cluster color; node stroke uses color direct. Critical nodes get thicker stroke (~2.2px) to stand out.

---

## Rules

- **One file. No build.** Opens in any modern browser.
- **Every label is real file or function name from repo.** Every path real. Every cited line number confirmed by reading file at that line.
- **No invented bugs.** `KNOWN_BUGS` only includes things citable with `file:line`.
- **Plain-English text** in `plain:` readable by someone never seen codebase. No jargon, no unexpanded acronyms.
- **Preserve script shape** above so user can edit nodes/edges by hand without reverse-engineering structure.
- **No emojis** in node labels or sub-labels. Use only in section headers or legend if aids scanning.

---

## Deliverables

1. HTML file at path user requested (default `./architecture-map.html`).
2. Short reply summarizing: node/edge count, critical path identified, dead code found, top 3 surprises.
3. How to view: open file direct, or `python3 -m http.server 4747` and visit `http://localhost:4747/architecture-map.html`.