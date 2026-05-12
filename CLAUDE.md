# CLAUDE.md - Global X Pass Project Mandates (Claude Version)

> **CRITICAL:** This file is the authoritative guide for Claude Code and other Claude-based agents. It contains all project rules and session bootstrap mandates.

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

## 🚨 No-Hardcode Mandate (ABSOLUTE)
> **이 규칙은 모든 코딩 컨벤션보다 우선한다. 예외 없이 적용된다.**

- **색상·간격·반경·폰트 크기 등 디자인 값을 raw 리터럴(예: `"#EA4335"`, `16px`, `rgba(...)`)로 코드에 직접 작성하는 것은 전면 금지.**
- 반드시 CSS 변수(`var(--color-*)`, `var(--space-*)`, `var(--radius-*)`)나 `isDark` 분기 기반 기존 토큰 패턴을 사용할 것.
- **불가피하게 하드코딩이 필요하다고 판단되면, 코드 수정 전에 반드시 사용자에게 이유를 설명하고 명시적 동의를 받아야 한다.**
  - 동의 없이 하드코딩된 코드는 즉시 롤백 대상이다.
  - "임시로", "이번만"은 허용되지 않는다.
- **예외가 허용되는 유일한 케이스:** Canvas API (`ctx.fillStyle` 등) 또는 라이브러리가 CSS 변수를 직접 수용하지 않는 것이 명백히 증명된 경우 — 이 경우에도 반드시 사용자 동의 후 진행.

## Coding Conventions
- **Data Fetching:** Direct calls via `supabaseClient.ts` within components. No global state managers (Redux/Zustand) unless explicitly added.
- **Theme Handling:** Use `useTheme()` hook for `isDark` state. Apply conditional styles/classes based on this state.
- **Korean IME:** Avoid `onKeyDown` with "Enter" for Korean text inputs; use explicit "Add/Confirm" buttons.
- **File Uploads:** Always use `encodeFilename()` from `@/utils/file.ts` for Supabase Storage to prevent character encoding issues. Images (jpg, png, etc.) must route to the `images` bucket, while non-image files (pdf, zip, docx, etc.) must route to the `documents` bucket.
- **Public Storage:** The `images` and `documents` buckets are publicly readable. Only public-facing assets and downloadable public resources belong there; sensitive files require a separate private bucket plus signed URL flow.
- **Admin Pages:** Follow the Lazy Fetch + Skeleton UI pattern. Use `React.lazy()` and `<Suspense>` for routing, with theme-aware skeleton fallbacks to eliminate Layout Shifts (CLS).
- **Edge Function CORS:** Shared helper `supabase/functions/_shared/cors.ts` must allow production plus local Vite origins: `https://globalxpass.com`, `http://localhost:5173`, `http://localhost:5174`, `http://127.0.0.1:5173`, `http://127.0.0.1:5174`.
- **Overlay/Dropdown Layering:** When rendering dropdowns or popovers inside repeated cards, ensure the open card or portal layer has a higher stacking context than sibling cards. Prefer a minimal `z-index` change on the open item unless a shared Portal pattern already exists.
- **Admin-Only Floating UI:** Do not render empty admin-only floating containers for non-admin users. Gate the whole container with `isAdmin`, not only the children.
- **RLS Policy Checks:** When writing Row Level Security (RLS) policies for admin-only access, always use the project standard `public.is_admin()` function rather than parsing `auth.jwt() ->> 'role'`.
- **Schema Change Safety:** Before changing any SQL schema, policy, function signature, or Edge Function response, identify the React components that depend on the table/column/function names and preserve their expected field names and response shape unless the plan explicitly covers the UI migration.
- **Home Section Rhythm:** Main-page content sections after `HeroSection` should share the same base rhythm: section padding close to `clamp(60px, 10vw, 100px) ... clamp(70px, 11vw, 110px)`, header bottom spacing `40px`, section titles `clamp(24px, 3vw, 40px)`, and body copy around `15px / 1.65`. `MediaSection` may keep a centered header, but should still follow the same spacing and title scale. `AboutSection` can keep its own visual system, but should not drift far from the common title scale or reintroduce negative letter spacing.
- **Color & Pill Restraint:** Key colors should not repeat across card border, icon, badge, tag, filter, and CTA in the same component. Use color primarily for actionable CTAs or true status states; use neutral tabs/labels for filters, categories, tags, dates, and metadata.
- **Home CTA Pills:** In home content sections, outline CTA pills such as `전체보기` should stay neutral (`slate`/white tint) unless the CTA itself is the primary action. Avoid representative-color border/text on every section CTA because it makes category color feel decorative rather than meaningful.
- **Home Section Cards:** Main-page content cards should stay simple: `th.cardBg` background, `1px solid ${th.cardBorder}` border, around `18px` radius, representative accent as a thin top/left rule, no heavy shadow/glow, and hover limited to small lift plus border/outline emphasis.
- **Home Motion Restraint:** In public content sections, keep motion sparse. Prefer targeted transitions and card hover around `translateY(-2px)`; avoid broad `transition: all`, glow blobs, radial gradients, and decorative dot grids unless a section has an approved exception.
- **Public/Admin Separation:** Public home sections must not expose admin edit controls, representative pickers, or inline editing UI. Admin actions stay in admin pages unless the plan explicitly changes that product boundary.
- **Derived Data Rule:** Do not convert system-derived values into manual inputs. Event remaining seats are derived from acceptance state and `capacity`; `slots_remaining` is fallback/system-managed display data, not an editor-owned truth.
- **Documentation Canon:** Keep root guidance documents lean. `CLAUDE.md` is the canonical project rulebook for Claude context, while temporary execution state lives in `PLAN.md` / `RESULT.md`; avoid maintaining parallel root docs that duplicate the same operating rules.

## AI Agent Workflow Mandates (CRITICAL)
All AI agents (especially Claude) MUST adhere to the following workflow rules:
0. **Session Bootstrap:** At the start of every new chat/session, the agent MUST read `CLAUDE.md`, `PLAN.md`, and `RESULT.md` from the project root before answering, planning, or editing. The agent should briefly summarize the current context, latest completed work, pending plans, and known risks before proceeding.
1. **`ㅎㅇ` Shortcut:** If the user's opening message is `ㅎㅇ`, the agent MUST treat it as an explicit bootstrap trigger and complete Rule 0 before asking for new scope or proposing edits.
2. **Korean Only:** All communication (explanations, plans, reports) must be in Korean.
3. **Plan Before Code:** The agent MUST propose a detailed plan (files to edit, what to change) and receive EXPLICIT approval (e.g., "진행해", "승인") from the user BEFORE making any code modifications.
4. **Validate Verification:** After making changes, the agent MUST run `npm run validate` to verify type safety, lint cleanliness, and production build health before reporting back.
5. **Verification Matrix:** Before final reporting, the agent MUST map the task to the `## Verification Matrix` in `GEMINI.md`, perform the applicable extra checks when feasibility, and document both results and skipped checks in `RESULT.md`.
6. **Zero-Human Feedback Loop:** After completing a task, the agent MUST run `npm run validate`. If any error occurs, the agent must not ask the user to intervene. The agent must inspect the terminal logs, fix the code, rerun validation, and repeat this loop until it succeeds.
7. **The Ratchet Principle:** If the agent fixes a build/lint error on its own or corrects a critical mistake, it MUST record the failure mode as a one-line prohibition under `## 🚫 Anti-Patterns & Lessons Learned` in `GEMINI.md`.
8. **Reviewer Summary:** Once changes and validation are complete, the agent must provide a formatted summary of modified files and key changes that the user can easily copy and paste to a Reviewer.
9. **Review Waiting:** After providing the summary, the agent must pause and wait for the Reviewer's feedback before proceeding with new modifications.
10. **PLAN Lifecycle, Compaction & Cleanup:** Before implementation, the agent MUST add the approved work as a pending item under `## Pending Approval` in `PLAN.md`. After implementation and successful `npm run validate`, the agent MUST compress that item into a single `[Done]` summary line.
11. **`종료` Shortcut:** If the user says `종료`, the agent MUST check whether approved work has been reflected in `PLAN.md`, whether `RESULT.md` contains the latest session summary, and whether the latest `npm run validate` status has been recorded. After all checks pass, the agent MUST: (1) run `git status` and `git diff --stat` to identify changed files; (2) draft a commit message summarizing the session's key changes; (3) present the changed file list and draft commit message to the user; (4) ask the user to choose one of **"푸시도 해줘"** (commit + push), **"커밋만"** (commit only, no push), or **"취소"** (skip). Push is **never automatic** — it requires explicit user selection.

Refer to `GEMINI.md` for the shared `## Verification Matrix` and `## 🚫 Anti-Patterns & Lessons Learned` to keep this file lean.
