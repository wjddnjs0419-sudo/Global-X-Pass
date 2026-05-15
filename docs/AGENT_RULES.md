# AGENT_RULES.md - Global X Pass Project Mandates & Conventions

> **CRITICAL:** This document is the authoritative source for all AI agent rules, architecture, security mandates, and coding conventions. It MUST be read and followed by all agents.

## Project Overview
**Global X Pass** is a global corporate collaboration and startup support platform. It facilitates networking, consulting, event management, and resource sharing for founders and global startups.

## Core Architecture & Stack
- **Frontend:** React 18 (TypeScript) + Vite + Tailwind CSS v4 + `motion` (for animations).
- **Backend:** Supabase (Auth, Database, Storage, Edge Functions, Realtime).
- **Styling Philosophy:** "Orbital System" & Glassmorphism. Prefer Vanilla CSS/Inline styles for theme-aware dynamic values (`isDark`) and Tailwind for structural layout.
- **Routing:** React Router v7.

## Security & PII Mandates (CRITICAL)
- **Edge Function 권한 표준화:** 신규 관리자용 Edge Function 생성 시 `_shared/adminAuth.ts`의 `requireVerifiedAdmin()` 필수 호출 (MFA/AAL2 강제).
- **RLS 정책 일관성:** DB 정책 작성 시 `auth.jwt() ->> 'role'` 사용 금지. 반드시 `public.is_admin()` SQL 함수 사용.
- **PII 파이프라인 강제:** PII 반환 API 작성 시 DB 직접 조회 금지, `decrypt-profiles` 또는 `decrypt-own-profile` 함수 필수 사용.
- **프론트엔드 MFA 게이팅:** 관리자 라우트 및 UI 렌더링 시 `!adminLoading && isAdmin && !mfaRequired && mfaEnrolled` 전체 조건 검증 필수.
- **PII Encryption:** `profiles.name`, `profiles.email`, and `profiles.phone` MUST be stored as AES-256-GCM ciphertext (`enc:v1:...`).
- **Processing Flow:**
  - Never query PII directly for display; use `decrypt-profiles` (admin) or `decrypt-own-profile` (user) Edge Functions.
  - Encryption is handled via the `encrypt-profile` Edge Function.
- **Admin MFA:** All admins MUST enroll in and use MFA (TOTP) to access `/admin`. The `is_admin()` SQL function enforces `aal2`.
- **Admin MFA Lock:** 관리자 계정은 `MyPage`에서 MFA 해제를 허용하지 않는다. 관리자 MFA는 필수 상태로 유지되어야 하며, 해제 가능한 UI를 노출하지 않는다.
- **Admin MFA Backend Gate:** `public.is_admin()`은 관리자 프로필 존재만으로 true가 되면 안 된다. 검증된 MFA factor 존재와 `aal2` 세션이 모두 만족될 때만 관리자 권한을 인정해야 한다.
- **Role Change Server Path:** 사용자 role 변경은 클라이언트의 직접 `profiles.update()`에 맡기지 말고, 관리자 재인증을 서버에서 검증하는 전용 Edge Function 또는 동등한 서버 경로를 통해서만 처리할 것.
- **Role Column Guard:** `public.profiles.role`은 authenticated 세션의 직접 UPDATE를 허용하지 말고, DB trigger 또는 동등한 수단으로 service-role 기반 서버 경로에서만 바뀌도록 강제할 것.
- **Idle Logout:** 28-min idle warning -> 30-min auto-logout. Session stale check on mount (>30 min since `gxp_last_active`).

## No-Hardcode Mandate (CRITICAL)
- **컴포넌트/페이지/훅/유틸 코드에 디자인 raw 리터럴을 직접 추가하지 말 것.** 색상, 배경, 테두리, 그림자, 간격, 반경, 폰트 크기, z-index 등 반복 가능한 UI 값은 CSS 변수(`var(--color-*)`, `var(--space-*)`, `var(--radius-*)`, `var(--shadow-*)`), 공용 상수, 또는 기존 `isDark` 토큰 패턴을 사용한다.
- **토큰 정의 파일은 예외다.** `src/styles/theme.css`처럼 디자인 토큰의 원천 값을 선언하는 파일, `adminConstants.ts`처럼 CSS 변수 참조를 카테고리 의미에 매핑하는 파일, Tailwind/shadcn 기반 설정 파일은 필요한 raw 값을 정의할 수 있다.
- **일회성 raw 값도 먼저 기존 토큰을 찾는다.** 적합한 토큰이 없으면 새 의미 토큰을 `theme.css`에 추가하고 호출부는 그 토큰을 참조한다. 단순히 “이번 화면에만 필요하다”는 이유로 새 hex, `rgba(...)`, 임의 `px` 값을 컴포넌트에 박아 넣지 않는다.
- **예외가 필요한 경우 사전 동의를 받는다.** Canvas API(`ctx.fillStyle` 등), 외부 라이브러리가 CSS 변수를 수용하지 않는 경우, 계산식상 숫자 리터럴이 도메인 값인 경우처럼 불가피한 예외는 코드 수정 전에 이유와 범위를 사용자에게 설명하고 명시적 승인을 받는다.
- **기존 레거시 하드코딩은 작업 범위 안에서 건드린 파일부터 줄인다.** 대규모 일괄 정리는 별도 승인 작업으로 분리하되, 새로 수정하는 라인에서는 하드코딩을 늘리지 않는다.

## Coding Conventions
- **Data Fetching:** Direct calls via `supabaseClient.ts` within components. No global state managers (Redux/Zustand) unless explicitly added.
- **Theme Handling:** Use `useTheme()` hook for `isDark` state. Apply conditional styles/classes based on this state.
- **Breakpoint Standard:** Official layout breakpoints are Mobile `320px ~ 767px` (base), Tablet `768px ~ 1023px` (`md`), Desktop `1024px ~ 1279px` (`lg`), and Large Desktop `1280px+` (`xl`). Treat `sm` (`640px+`) as an auxiliary large-phone / narrow-width adjustment only, not as a primary layout breakpoint.
- **Korean IME:** Avoid `onKeyDown` with "Enter" for Korean text inputs; use explicit "Add/Confirm" buttons.
- **File Uploads:** Always use `encodeFilename()` from `@/utils/file.ts` for Supabase Storage to prevent character encoding issues. Images (jpg, png, etc.) must route to the `images` bucket, while non-image files (pdf, zip, docx, etc.) must route to the `documents` bucket.
- **Public Storage:** The `images` and `documents` buckets are publicly readable. Only public-facing assets and downloadable public resources belong there; sensitive files require a separate private bucket plus signed URL flow.
- **Admin Pages:** Follow the Lazy Fetch + Skeleton UI pattern. Use `React.lazy()` and `<Suspense>` for routing, with theme-aware skeleton fallbacks to eliminate Layout Shifts (CLS).
- **Edge Function CORS:** Shared helper `supabase/functions/_shared/cors.ts` must allow production plus local Vite origins: `https://globalxpass.com`, `http://localhost:5173`, `http://localhost:5174`, `http://127.0.0.1:5173`, `http://127.0.0.1:5174`.
- **Overlay/Dropdown Layering:** When rendering dropdowns or popovers inside repeated cards, ensure the open card or portal layer has a higher stacking context than sibling cards. Prefer a minimal `z-index` change on the open item unless a shared Portal pattern already exists.
- **Admin-Only Floating UI:** Do not render empty admin-only floating containers for non-admin users. Gate the whole container with `isAdmin`, not only the children.
- **RLS Policy Checks:** When writing Row Level Security (RLS) policies for admin-only access, always use the project standard `public.is_admin()` function rather than parsing `auth.jwt() ->> 'role'`.
- **Data API Explicit Grants (CRITICAL):** Starting May 30, 2026 (new projects) and October 30, 2026 (all projects), Supabase requires explicit `GRANT` statements for tables to be accessible via Data API (supabase-js). Every migration that creates or modifies a table in the `public` schema MUST include explicit `GRANT` statements for `anon`, `authenticated`, and `service_role` as applicable. Without these, the Data API will return 42501 errors.
- **Schema Change Safety:** Before changing any SQL schema, policy, function signature, or Edge Function response, identify the React components that depend on the table/column/function names and preserve their expected field names and response shape unless the plan explicitly covers the UI migration.
- **Home Section Rhythm:** Main-page content sections after `HeroSection` should share the same base rhythm: section padding close to `clamp(60px, 10vw, 100px) ... clamp(70px, 11vw, 110px)`, header bottom spacing `40px`, section titles `clamp(24px, 3vw, 40px)`, and body copy around `15px / 1.65`. `MediaSection` may keep a centered header, but should still follow the same spacing and title scale. `AboutSection` can keep its own visual system, but should not drift far from the common title scale or reintroduce negative letter spacing.
- **Color & Pill Restraint:** Key colors should not repeat across card border, icon, badge, tag, filter, and CTA in the same component. Use color primarily for actionable CTAs or true status states; use neutral tabs/labels for filters, categories, tags, dates, and metadata.
- **Home CTA Pills:** In home content sections, outline CTA pills such as `전체보기` should stay neutral (`slate`/white tint) unless the CTA itself is the primary action. Avoid representative-color border/text on every section CTA because it makes category color feel decorative rather than meaningful.
- **Home Section Cards:** Main-page content cards should stay simple: `th.cardBg` background, `1px solid ${th.cardBorder}` border, around `18px` radius, representative accent as a thin top/left rule, no heavy shadow/glow, and hover limited to small lift plus border/outline emphasis.
- **Home Motion Restraint:** In public content sections, keep motion sparse. Prefer targeted transitions and card hover around `translateY(-2px)`; avoid broad `transition: all`, glow blobs, radial gradients, and decorative dot grids unless a section has an approved exception.
- **Public/Admin Separation:** Public home sections must not expose admin edit controls, representative pickers, or inline editing UI. Admin actions stay in admin pages unless the plan explicitly changes that product boundary.
- **Derived Data Rule:** Do not convert system-derived values into manual inputs. Event remaining seats are derived from acceptance state and `capacity`; `slots_remaining` is fallback/system-managed display data, not an editor-owned truth.
- **Live Architecture Map:** 개인용 로컬 앱 `/architecture.html`의 실시간 맵 데이터는 `scripts/generate-architecture-map.mjs`와 `src/generated/architectureMap.json`을 통해 생성한다. `npm run map:dev`로 실행하며, 운영 웹사이트 라우트에는 노출하지 않는다. 구조 변경 시 생성기를 우선 갱신하고, 중요한 파일은 JSDoc 태그(`@role`, `@plain`, `@notes`, `@critical`, `@cluster`, `@tag`)로 맵 설명을 보강한다. 런타임 에러 위치는 `src/lib/errorLogger.ts`의 `NodeId`와 맵 노드 ID가 일치해야 배지로 표시된다.
- **UX Observability:** 중요한 Supabase/RPC/Storage 실패를 `setError`나 `console.error`로만 처리하지 말고 `src/lib/uxTelemetry.ts`의 `logSupabaseFailure()` 또는 `logActionFailure()`로 함께 기록한다. 클릭 무반응 감지가 필요한 주요 버튼에는 `data-monitor-action`을 붙이고, 레이아웃 overflow/interactive target 이슈는 `uxHealth` low severity 로그로 확인한다.
- **QA Secrets Boundary:** Playwright/진단 스크립트/QA 문서에서 QA 계정, 비밀번호, MFA 시크릿을 하드코딩하지 말 것. 자동 QA 자격 증명은 로컬 셸 환경 변수 또는 GitHub Actions Secrets(`QA_ADMIN_EMAIL`, `QA_ADMIN_PASSWORD`, `QA_ADMIN_MFA_SECRET`, 필요 시 `QA_USER_EMAIL`, `QA_USER_PASSWORD`)로만 주입한다.
- **Documentation Canon:** Keep root guidance documents lean. `GEMINI.md` (or `CLAUDE.md`) is the canonical project router, while temporary execution state lives in `PLAN.md` / `RESULT.md`.
- **Blog Import Convention:** Around X 블로그 이관은 RSS로 후보를 발견하고 `PostView.naver`의 `se-main-container` 본문을 파싱하는 반자동 manifest 방식으로 유지할 것. 뉴스레터는 `Around X-뉴스레터` 게시판 기준 `news` + `뉴스레터` 고정 태그, 행사 아카이브는 manifest에서 글별 수동 태그를 지정하고, 썸네일은 1차에서 네이버 원본 이미지 URL을 사용한다. 중복 감지는 본문 앞 `GXP_BLOG_IMPORT_META` HTML comment의 `sourceUrl`로 처리할 것.
- **Blog Sync Automation Boundary:** Supabase 자동화는 `pg_cron` + `pg_net`으로 Edge Function을 호출하는 경량 트리거/델타 확인/큐 적재까지를 기본 경계로 삼는다. 전체 Naver 페이지네이션 크롤링과 이미지 미러링은 Edge Function 제한을 고려해 Node 기반 외부 worker 또는 수동 스크립트에서 처리하는 방향을 우선 검토할 것.

## Verification Matrix
`npm run validate` remains the universal gate after any repository change. In addition, every approved task must identify which matrix rows apply, perform the relevant checks when feasible, and record results or explicit skip reasons in `RESULT.md`.

| Change Type | Required Extra Checks |
|---|---|
| UI/UX or layout | Responsive smoke check for affected routes; use browser or screenshot verification when visual behavior matters. QA 요청으로 브라우저 기반 검증을 수행할 때는 사용자가 별도로 숨김을 요청하지 않는 한 visible 인앱 브라우저를 기본으로 사용한다. |
| Supabase schema, migration, RLS, RPC | Confirm migration files, RLS naming convention, `public.is_admin()` usage for admin paths, and React field/response-shape dependencies. |
| Edge Function | Confirm CORS origins, request/response shape compatibility, and `requireVerifiedAdmin()` for service-role admin operations. |
| Auth, role, MFA, PII | Confirm no direct PII display query, decrypt/encrypt Edge Function flow, role boundary, and AAL2/MFA impact. |
| Storage or upload | Confirm bucket choice, public/private sensitivity, MIME and size validation, and `encodeFilename()` usage. |
| Documentation-only | `npm run validate` still runs by default; if skipped for a truly non-code note, record the reason in `RESULT.md`. |

## Context Efficiency & Search-First Mandate (CRITICAL)
To minimize token usage and maximize focus, agents MUST follow the **Grep-first** principle for both documentation and large source files.

- **Do not read entire files first.** Always attempt to narrow down the scope using search tools (`grep_search`, `rg`, `glob`).
- **Header Discovery:** Use search to list headers (`^#`) in documentation to find the relevant section before reading.
- **Keyword Targeting:** Search for specific symbols, features, or mandates (e.g., "MFA", "Naver", "PII") to locate the exact lines of interest.
- **Diff Awareness:** Check recent changes or logs to understand the current state before reading the full context.

### Search Examples (Standardized Queries):
- **Doc Structure:** `rg -n "^##|^###" docs/AGENT_RULES.md docs/AGENT_ANTI_PATTERNS.md RESULT.md`
- **Security/Auth:** `rg -n "MFA|AdminRoute|is_admin|requireVerifiedAdmin" docs src supabase`
- **Storage/Public:** `rg -n "Storage|bucket|encodeFilename|public" docs src supabase`
- **Blog Import:** `rg -n "Naver|blog_import|queue|mirror" docs scripts supabase src`
- **UI/IME:** `rg -n "theme|token|raw literal|IME" docs src`

## AI Agent Workflow Mandates (CRITICAL)
All AI agents interacting with this repository MUST adhere to the following workflow rules:
0. **Session Bootstrap:** At the start of every new chat/session, the agent MUST read the router file (`GEMINI.md` or `CLAUDE.md`), `PLAN.md`, and `RESULT.md` from the project root before answering, planning, or editing. The agent should briefly summarize the current context, latest completed work, pending plans, and known risks before proceeding. Consult `RESULT_ARCHIVE.md` only when older session history is required.
1. **`ㅎㅇ` Shortcut:** If the user's opening message is `ㅎㅇ`, the agent MUST treat it as an explicit bootstrap trigger and complete Rule 0 before asking for new scope or proposing edits.
2. **Korean Only:** All communication (explanations, plans, reports) must be in Korean.
3. **Plan Before Code:** The agent MUST propose a detailed plan (files to edit, what to change) and receive EXPLICIT approval (e.g., "진행해", "승인") from the user BEFORE making any code modifications.
4. **Validate Verification:** After making changes, the agent MUST run `npm run validate` to verify type safety, lint cleanliness, and production build health before reporting back.
5. **Verification Matrix:** Before final reporting, the agent MUST map the task to the `## Verification Matrix`, perform the applicable extra checks when feasible, and document both results and skipped checks in `RESULT.md`.
6. **Zero-Human Feedback Loop:** After completing a task, the agent MUST run `npm run validate`. If any error occurs, the agent must not ask the user to intervene. The agent must inspect the terminal logs, fix the code, rerun validation, and repeat this loop until it succeeds.
7. **The Ratchet Principle:** If the agent fixes a build/lint error on its own or corrects a critical mistake, it MUST record the failure mode as a one-line prohibition under `## 🚫 Anti-Patterns & Lessons Learned` in `docs/AGENT_ANTI_PATTERNS.md`.
8. **Reviewer Summary:** Once changes and validation are complete, the agent must provide a formatted summary of modified files and key changes that the user can easily copy and paste to a Reviewer.
9. **Review Waiting:** After providing the summary, the agent must pause and wait for the Reviewer's feedback before proceeding with new modifications.
10. **PLAN Lifecycle, Compaction & Cleanup:** Before implementation, the agent MUST add the approved work as a pending item under `## Pending Approval` in `PLAN.md`. After implementation and successful `npm run validate`, the agent MUST compress that item into a single `[Done]` summary line. If `PLAN.md` accumulates more than 10 `[Done]` items, permanently delete the oldest completed items so the file stays focused on active and upcoming tasks. Detailed implementation notes belong in `RESULT.md`. **CRITICAL: Items classified as 'Technical Debt' or 'Long-term Plan' MUST NEVER be deleted or compressed into `[Done]` until they are completely resolved and verified.**
11. **`종료` Shortcut:** If the user says `종료`, the agent MUST check whether approved work has been reflected in `PLAN.md`, whether `RESULT.md` contains the latest session summary, and whether the latest `npm run validate` status has been recorded. If anything is missing, update the docs first and only then treat the session as closed. In addition, if any Supabase-related changes were made during the session (schema, RLS, Edge Functions, migrations), the agent MUST run `supabase migration list` to confirm all local migrations are reflected in the remote database. If any migrations are unsynced (Remote column empty), run `supabase db push` before closing. After all checks pass, the agent MUST: (1) run `git status` and `git diff --stat` to identify changed files; (2) draft a commit message summarizing the session's key changes; (3) present the changed file list and draft commit message to the user; (4) ask the user to choose one of **"푸시도 해줘"** (commit + push), **"커밋만"** (commit only, no push), or **"취소"** (skip). Push is **never automatic** — it requires explicit user selection.
12. **End of Session Documentation:** Whenever concluding a session, the agent MUST update `docs/AGENT_RULES.md` and any relevant `.gemini_prompts/maker_*.md` files with any new architectural rules, coding conventions, or workflow mandates established during that session.

## Multi-Agent Cross-Validation System

To ensure peak code quality, architectural integrity, and uncompromising security (PII, RLS), this project employs a Multi-Agent Cross-Validation system.

### 1. Prompt Directory Mandate
- All persona-specific system prompts (6 files) MUST be stored in the hidden directory: `.gemini_prompts/`.
- Agents MUST first internalize the global context from this `AGENT_RULES.md` before executing specific instructions from their persona files.

### 2. Persona Roles & Scopes
Work is divided into three distinct tracks, each featuring a **Maker** (Execution) and a **Reviewer** (Audit).

#### Part 1: UI/UX Optimization
- **Maker (`maker_uiux.md`):** Responsible for direct code modifications. Focuses on high-fidelity visual implementation, Tailwind CSS v4, and `motion` animations.
- **Reviewer (`reviewer_uiux.md`):** Read-only. Audits for accessibility, responsive layout integrity (mobile-first), and visual consistency.

#### Part 2: Feature Development
- **Maker (`maker_feature.md`):** Responsible for direct code modifications. Implements business logic and Supabase integrations within the React 18 architecture.
- **Reviewer (`reviewer_feature.md`):** Read-only. Audits for component reusability, state management efficiency, and rendering optimization.

#### Part 3: Cybersecurity & Compliance (CRITICAL)
- **Maker (`maker_security.md`):** Responsible for direct code modifications. Implements PII encryption/decryption workflows and XSS/Injection defense logic.
- **Reviewer (`reviewer_security.md`):** Read-only. Audits for Supabase RLS bypasses, PII exposure risks, and Admin MFA logic flaws from an attacker's perspective.
