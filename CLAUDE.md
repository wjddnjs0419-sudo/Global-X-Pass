# CLAUDE.md - AI Agent Router (Claude Code)

> **CRITICAL:** Claude Code auto-loads this file for guidance. It does not execute shell commands by itself.

## 🚀 Efficient Bootstrap Sequence
Save tokens: **MUST** use **Grep-first**. Skip full reads at startup.

1.  **Search Docs**: `grep -nE "^##|^###" docs/AGENT_RULES.md docs/AGENT_ANTI_PATTERNS.md` (check latest rules).
2.  **Recent Context Summary**: `grep -nE "^##|^###" PLAN.md RESULT.md` (quick view of active tasks & latest result).
3.  **Targeted Read**:
    - Read `PLAN.md` `## In Progress` section only.
    - Read `RESULT.md` (now pruned to latest task only).
    - Skip `RESULT_ARCHIVE.md` unless researching history.

### Example Search:
`grep -nE "^##|^###" docs/AGENT_RULES.md docs/AGENT_ANTI_PATTERNS.md RESULT.md PLAN.md`

## 💡 Quick Shortcuts
-   **`ㅎㅇ`**: Treat as a mandatory bootstrap command, not a greeting. On an exact `ㅎㅇ` message, perform the bootstrap sequence first and start the first reply with a concise summary.
-   **`종료`**: Run `npm run diet` (compact docs), verify docs, check Supabase sync, prep git commit/push.

## 🔧 Bootstrap Command
-   Use `npm run claude:bootstrap` to produce the actual bootstrap summary in this workspace.
-   `@file:CLAUDE.md` is a guidance file only; it does not itself trigger command execution.

## ⚠️ Core Reminder
-   **Korean Only**: Communicate in Korean.
-   **Plan Before Code**: Propose plan, get approval before edits.
-   **Validate**: Run `npm run validate` post-change.
-   **No Hardcoding**: Follow the No-Hardcode mandate in `docs/AGENT_RULES.md`.
-   **`ㅎㅇ` Priority**: If the user's message is exactly `ㅎㅇ`, do not reply with a greeting, small talk, or a scope question. Execute bootstrap first and reply with the context summary.

---
*See `RESULT_ARCHIVE.md` for old sessions.*
