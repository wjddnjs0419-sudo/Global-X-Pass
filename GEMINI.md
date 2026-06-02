# GEMINI.md - AI Agent Router (Gemini CLI)

> **CRITICAL:** Gemini CLI auto-loads this file. Routes to full project docs.

## 🚀 Efficient Bootstrap Sequence
Save tokens: **MUST** use **Grep-first**. Skip full reads at startup.

1.  **Search Docs**: `rg -n "^##|^###" docs/AGENT_RULES.md docs/AGENT_ANTI_PATTERNS.md` (Check latest rules).
2.  **Recent Context Summary**: `rg -n "^##|^###" PLAN.md RESULT.md` (Quick view of active tasks & latest result).
3.  **Targeted Read**: 
    - Read `PLAN.md` `## In Progress` section only.
    - Read `RESULT.md` (now pruned to latest task only).
    - Skip `RESULT_ARCHIVE.md` unless researching history.

### Example Search:
`rg -n "^##|^###" docs/AGENT_RULES.md docs/AGENT_ANTI_PATTERNS.md RESULT.md PLAN.md`

## 💡 Quick Shortcuts
-   **`ㅎㅇ`**: Treat as a mandatory bootstrap command, not a greeting. On an exact `ㅎㅇ` message, run the full Bootstrap Sequence above before any other response, and start the first reply with the bootstrap summary only.
-   **`종료`**: `npm run diet` 실행(문서 압축), 세션 문서 검증, Supabase 마이그 sync, git 커밋/푸시 준비.

## ⚠️ Core Reminder
-   **Korean Only**: All comms Korean.
-   **Plan Before Code**: Propose plan, get approval before edit.
-   **Validate**: Run `npm run validate` after changes.
-   **No Hardcoding**: Follow No-Hardcode mandate `docs/AGENT_RULES.md`.
-   **`ㅎㅇ` Priority**: If the user's message is exactly `ㅎㅇ`, do not reply with a greeting, small talk, or a scope question. Execute bootstrap first and reply with the context summary.

## 🚫 Anti-Patterns & Lessons Learned
- 운영 빌드 query/localStorage 플래그로 진단 `console.log` 재활성화 금지. 첨부 URL, 게시물 ID, 본문 진단은 개발 모드만, 최소 요약값 한정.

---
*Older sessions: `RESULT_ARCHIVE.md`.*
