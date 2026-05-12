# CLAUDE.md - AI Agent Router (Claude Code)

> **CRITICAL:** This file is automatically loaded by Claude Code. It serves as a router to the full project documentation.

## 🚀 Efficient Bootstrap Sequence
To minimize token usage, you **MUST** use the **Grep-first** principle. Instead of reading entire documents, use search tools to find relevant headers and sections first.

1.  **Search Docs**: List headers in `docs/AGENT_RULES.md` and `docs/AGENT_ANTI_PATTERNS.md` to identify relevant sections.
2.  **Recent Context**: Read `PLAN.md` (active tasks) and `RESULT.md` (latest state).
3.  **Targeted Read**: Read only the identified documentation sections or source code lines using line-range reads.

### Example Search:
`grep -nE "^##|^###" docs/AGENT_RULES.md docs/AGENT_ANTI_PATTERNS.md RESULT.md`

## 💡 Quick Shortcuts
-   **`ㅎㅇ`**: Perform the full Bootstrap Sequence above.
-   **`종료`**: Verify session documentation (`PLAN.md`, `RESULT.md`), check Supabase migration sync, and prepare git commit/push.

## ⚠️ Core Reminder
-   **Korean Only**: All communication must be in Korean.
-   **Plan Before Code**: Propose a plan and get explicit approval before editing.
-   **Validate**: Always run `npm run validate` after changes.
-   **No Hardcoding**: Strictly follow the No-Hardcode mandate in `docs/AGENT_RULES.md`.

---
*Refer to `RESULT_ARCHIVE.md` for older session history if needed.*
