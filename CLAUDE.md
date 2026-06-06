# CLAUDE.md - AI Agent Router (Claude Code)

> **CRITICAL:** Claude Code auto-loads this file for guidance. It does not execute shell commands by itself.

## 🚀 Efficient Bootstrap Sequence
Save tokens: **MUST** use **Grep-first**. Skip full reads at startup.

0.  **Git Sync (멀티 환경 필수)**: 매 세션 `npm run claude:bootstrap` 의 `0. Git Sync` 확인. state(`in-sync`·`behind-only`·`ahead-only`·`diverged`·`unknown`)별 — `behind-only` 일 때만 `git pull --ff-only`; `ahead-only` 는 푸시 대기(정상), `diverged` 는 `--ff-only` 불가하니 rebase/merge 수동 해결, `unknown` 은 수동 `git status` 확인. state 와 별개로 작업트리 변경분(미커밋)이 있으면 pull 전에 먼저 정리. 맥/윈도우 양쪽 작업이므로 확인 필수.
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

## 🔁 멀티 환경 (맥 ↔ 윈도우) 동기화 규칙
-   **작업 전 동기화 확인**: 부트스트랩 `0. Git Sync` state 확인 → `behind-only` 면 `git pull --ff-only`, 그 외 상태는 위 0단계 지침대로. 무조건 pull 아님(ahead-only/diverged/unknown 예외, 미커밋 변경분은 먼저 정리).
-   **lock은 윈도우만 관리**: `package-lock.json` 은 **윈도우에서만** 커밋. 맥에서 `npm install` 후 lock 변경분은 **커밋 금지** → `git checkout -- package-lock.json` 으로 되돌림. (OS별 네이티브 바이너리로 lock 이 갈라져 pull 충돌 유발하므로 한쪽만 관리.)
-   **의존성 변경 handoff**: 맥에서 `package.json` 의존성을 바꿨으면, 윈도우에서 `npm install` 로 `package-lock.json` 재생성·커밋해 lock 을 정본화. (맥은 코드/`package.json` 만 커밋, lock 갱신은 윈도우 몫.)
-   **node_modules 비추적**: git 추적 대상 아님. lock 규칙과 별개로 각 머신 자체 `npm install`.

## ⚠️ Core Reminder
-   **Korean Only**: Communicate in Korean.
-   **Plan Before Code**: Propose plan, get approval before edits.
-   **Validate**: Run `npm run validate` post-change.
-   **No Hardcoding**: Follow the No-Hardcode mandate in `docs/AGENT_RULES.md`.
-   **`ㅎㅇ` Priority**: If the user's message is exactly `ㅎㅇ`, do not reply with a greeting, small talk, or a scope question. Execute bootstrap first and reply with the context summary.

---
*See `RESULT_ARCHIVE.md` for old sessions.*
