# GEMINI.md - Global X Pass Project Mandates

> **CRITICAL:** All foundational project context and core guidelines MUST always be maintained at the top of this document for immediate visibility and priority.

This file serves as the foundational context and authoritative guide for all AI agent interactions within this repository.

## Project Overview
**Global X Pass** is a global corporate collaboration and startup support platform. It facilitates networking, consulting, event management, and resource sharing for founders and global startups.

## Core Architecture & Stack
- **Frontend:** React 18 (TypeScript) + Vite + Tailwind CSS v4 + `motion` (for animations).
- **Backend:** Supabase (Auth, Database, Storage, Edge Functions, Realtime).
- **Styling Philosophy:** "Orbital System" & Glassmorphism. Prefer Vanilla CSS/Inline styles for theme-aware dynamic values (`isDark`) and Tailwind for structural layout.
- **Routing:** React Router v7.

## Security & PII Mandates (CRITICAL)
- **PII Encryption:** `profiles.name`, `profiles.email`, and `profiles.phone` MUST be stored as AES-256-GCM ciphertext (`enc:v1:...`).
- **Processing Flow:**
  - Never query PII directly for display; use `decrypt-profiles` (admin) or `decrypt-own-profile` (user) Edge Functions.
  - Encryption is handled via the `encrypt-profile` Edge Function.
- **Admin MFA:** All admins MUST enroll in and use MFA (TOTP) to access `/admin`. The `is_admin()` SQL function enforces `aal2`.
- **Admin MFA Lock:** 관리자 계정은 `MyPage`에서 MFA 해제를 허용하지 않는다. 관리자 MFA는 필수 상태로 유지되어야 하며, 해제 가능한 UI를 노출하지 않는다.
- **Admin MFA Backend Gate:** `public.is_admin()`은 관리자 프로필 존재만으로 true가 되면 안 된다. 검증된 MFA factor 존재와 `aal2` 세션이 모두 만족될 때만 관리자 권한을 인정해야 한다.
- **Role Change Server Path:** 사용자 role 변경은 클라이언트의 직접 `profiles.update()`에 맡기지 말고, 관리자 재인증을 서버에서 검증하는 전용 Edge Function 또는 동등한 서버 경로를 통해서만 처리할 것.
- **Role Column Guard:** `public.profiles.role`은 authenticated 세션의 직접 UPDATE를 허용하지 말고, DB trigger 또는 동등한 수단으로 service-role 기반 서버 경로에서만 바뀌도록 강제할 것.
- **Admin Edge Functions:** Any Edge Function that uses `SUPABASE_SERVICE_ROLE_KEY` for admin work MUST call the shared `requireVerifiedAdmin()` helper, which delegates to `public.is_admin()` so MFA/AAL2 rules match database RLS.
- **Idle Logout:** 28-min idle warning -> 30-min auto-logout. Session stale check on mount (>30 min since `gxp_last_active`).

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
- **Documentation Canon:** Keep root guidance documents lean. `GEMINI.md` is the canonical project rulebook for agent context, while temporary execution state lives in `PLAN.md` / `RESULT.md`; avoid maintaining parallel root docs that duplicate the same operating rules.
- **Blog Import Convention:** Around X 블로그 이관은 RSS로 후보를 발견하고 `PostView.naver`의 `se-main-container` 본문을 파싱하는 반자동 manifest 방식으로 유지할 것. 뉴스레터는 `Around X-뉴스레터` 게시판 기준 `news` + `뉴스레터` 고정 태그, 행사 아카이브는 manifest에서 글별 수동 태그를 지정하고, 썸네일은 1차에서 네이버 원본 이미지 URL을 사용한다. 중복 감지는 본문 앞 `GXP_BLOG_IMPORT_META` HTML comment의 `sourceUrl`로 처리할 것.
- **Blog Sync Automation Boundary:** Supabase 자동화는 `pg_cron` + `pg_net`으로 Edge Function을 호출하는 경량 트리거/델타 확인/큐 적재까지를 기본 경계로 삼는다. 전체 Naver 페이지네이션 크롤링과 이미지 미러링은 Edge Function 제한을 고려해 Node 기반 외부 worker 또는 수동 스크립트에서 처리하는 방향을 우선 검토할 것.

## Verification Matrix
`npm run validate` remains the universal gate after any repository change. In addition, every approved task must identify which matrix rows apply, perform the relevant checks when feasible, and record results or explicit skip reasons in `RESULT.md`.

| Change Type | Required Extra Checks |
|---|---|
| UI/UX or layout | Responsive smoke check for affected routes; use browser or screenshot verification when visual behavior matters. |
| Supabase schema, migration, RLS, RPC | Confirm migration files, RLS naming convention, `public.is_admin()` usage for admin paths, and React field/response-shape dependencies. |
| Edge Function | Confirm CORS origins, request/response shape compatibility, and `requireVerifiedAdmin()` for service-role admin operations. |
| Auth, role, MFA, PII | Confirm no direct PII display query, decrypt/encrypt Edge Function flow, role boundary, and AAL2/MFA impact. |
| Storage or upload | Confirm bucket choice, public/private sensitivity, MIME and size validation, and `encodeFilename()` usage. |
| Documentation-only | `npm run validate` still runs by default; if skipped for a truly non-code note, record the reason in `RESULT.md`. |

## Current Session Context (2026-05-07)
- `RESULT.md` is the session handoff file. It contains modified files, verification results, remaining risks, and reviewer-ready summaries for the current or immediately previous session only.
- `RESULT_ARCHIVE.md` is the long-term cold storage for older session records. Read it only when historical context is specifically needed.
- Verified command: `npm run validate` is the required universal verification path after repository changes, with task-specific matrix checks recorded in `RESULT.md`.
- Recent completed work:
  - 네이버 블로그 자동 동기화 1차 구현:
    - `blog_import_runs` / `blog_import_queue` migration 추가로 Supabase에 실행 로그와 큐 상태 저장
    - `sync-naver-blog` Edge Function 추가: 긴 크롤링 없이 queued run만 생성, `BLOG_SYNC_SECRET` 또는 관리자 인증으로 보호
    - `scripts/import-blog-posts.mjs --process-queue` worker 모드 추가: Naver 카테고리 크롤링 → queue upsert → approved 항목 import → run counter 업데이트
    - `news` 뉴스레터는 자동 승인/이관, `events-archive`는 태그 검수 필요 시 `pending` 유지
    - `.github/workflows/naver-blog-sync.yml` 추가로 매일 03:00 KST GitHub Actions 실행 가능
    - 원격 migration push, `sync-naver-blog` function deploy, `npm run blog:worker` 실검증 완료 (events-archive 27 + news 5 모두 queue imported)
  - Supabase 기반 네이버 블로그 자동 동기화 설계 완료:
    - Supabase 공식 지원 범위 확인: `pg_cron` + `pg_net`으로 Edge Function 주기 호출 가능, Vault secret 사용 권장
    - Edge Function 제한 확인: Deno 런타임, wall-clock 제한, request idle timeout 때문에 전체 크롤링/이미지 미러링을 그대로 넣기 부적합
    - 권장 아키텍처: Supabase Cron은 큐잉/델타 확인만 담당하고, 기존 Node importer는 외부 worker 또는 수동 운영 경로로 유지
    - 세부 내용은 `RESULT.md`에 기록
  - 네이버 블로그 importer 후속 버그 수정 완료:
    - `--crawl` 모드: `tagParam` JS 변수 기반 정확 파싱 (events-archive 27건 + news 5건, 블로그 표시와 일치)
    - `--mirror-images`: 본문/썸네일 이미지를 Supabase `images/blog-import/` 버킷에 미러링 (403 문제 해결)
    - 날짜 추출: `PostList.naver` 카드 HTML에서 날짜 추출 (`PostView`의 `se_publishDate`는 렌더링 시점을 반환해 신뢰 불가)
    - `pubDateOverride` 필드로 manifest에서 날짜 직접 지정 가능
    - update 페이로드에 `created_at` 포함 (날짜 재동기화 가능)
    - 사용자 확인 기준 events-archive 27건 + 뉴스레터 5건 Supabase 이관 성공
    - 새 npm 스크립트: `blog:crawl`, `blog:sync`
- Pending: 없음.

## AI Agent Workflow Mandates (CRITICAL)
All AI agents interacting with this repository MUST adhere to the following workflow rules:
0. **Session Bootstrap:** At the start of every new chat/session, the agent MUST read `GEMINI.md`, `PLAN.md`, and `RESULT.md` from the project root before answering, planning, or editing. The agent should briefly summarize the current context, latest completed work, pending plans, and known risks before proceeding. Consult `RESULT_ARCHIVE.md` only when older session history is required.
1. **`ㅎㅇ` Shortcut:** If the user's opening message is `ㅎㅇ`, the agent MUST treat it as an explicit bootstrap trigger and complete Rule 0 before asking for new scope or proposing edits.
2. **Korean Only:** All communication (explanations, plans, reports) must be in Korean.
3. **Plan Before Code:** The agent MUST propose a detailed plan (files to edit, what to change) and receive EXPLICIT approval (e.g., "진행해", "승인") from the user BEFORE making any code modifications.
4. **Validate Verification:** After making changes, the agent MUST run `npm run validate` to verify type safety, lint cleanliness, and production build health before reporting back.
5. **Verification Matrix:** Before final reporting, the agent MUST map the task to the `## Verification Matrix`, perform the applicable extra checks when feasible, and document both results and skipped checks in `RESULT.md`.
6. **Zero-Human Feedback Loop:** After completing a task, the agent MUST run `npm run validate`. If any error occurs, the agent must not ask the user to intervene. The agent must inspect the terminal logs, fix the code, rerun validation, and repeat this loop until it succeeds.
7. **The Ratchet Principle:** If the agent fixes a build/lint error on its own or corrects a critical mistake, it MUST record the failure mode as a one-line prohibition under `## 🚫 Anti-Patterns & Lessons Learned` at the end of this document so the same mistake is not repeated.
8. **Reviewer Summary:** Once changes and validation are complete, the agent must provide a formatted summary of modified files and key changes that the user can easily copy and paste to a Reviewer.
9. **Review Waiting:** After providing the summary, the agent must pause and wait for the Reviewer's feedback before proceeding with new modifications.
10. **PLAN Lifecycle, Compaction & Cleanup:** Before implementation, the agent MUST add the approved work as a pending item under `## Pending Approval` in `PLAN.md`. After implementation and successful `npm run validate`, the agent MUST compress that item into a single `[Done]` summary line. If `PLAN.md` accumulates more than 10 `[Done]` items, permanently delete the oldest completed items so the file stays focused on active and upcoming tasks. Detailed implementation notes belong in `RESULT.md`.
11. **`종료` Shortcut:** If the user says `종료`, the agent MUST check whether approved work has been reflected in `PLAN.md`, whether `RESULT.md` contains the latest session summary, and whether the latest `npm run validate` status has been recorded. If anything is missing, update the docs first and only then treat the session as closed. In addition, if any Supabase-related changes were made during the session (schema, RLS, Edge Functions, migrations), the agent MUST run `supabase migration list` to confirm all local migrations are reflected in the remote database. If any migrations are unsynced (Remote column empty), run `supabase db push` before closing.
12. **End of Session Documentation:** Whenever concluding a session, the agent MUST update this `GEMINI.md` and any relevant `.gemini_prompts/maker_*.md` files with any new architectural rules, coding conventions, or workflow mandates established during that session.

## Directory Structure Highlights
- `src/app/components/ui/`: Shared UI primitives (shadcn-based or custom).
- `src/app/components/admin/`: Admin-specific panels and logic.
- `supabase/functions/`: Deno Edge Functions for sensitive operations (PII, user management).
- `supabase/migrations/`: All schema changes must be versioned here.
- `.gemini_prompts/`: (Hidden) Stores Multi-Agent persona system prompts.

## Project Specific Context
- **Roles:** `admin`, `participant` (can access `/expenses`), `user` (standard).
- **Post Categories:** `notice`, `news`, `events`, `blog`, `resources`, `faq`.
- **Category Colors:** Defined in `adminConstants.ts` (Red/Notice, Blue/News, Green/Events, etc.).

## Multi-Agent Cross-Validation System

To ensure peak code quality, architectural integrity, and uncompromising security (PII, RLS), this project employs a Multi-Agent Cross-Validation system.

### 1. Prompt Directory Mandate
- All persona-specific system prompts (6 files) MUST be stored in the hidden directory: `.gemini_prompts/`.
- Agents MUST first internalize the global context from this `GEMINI.md` before executing specific instructions from their persona files.

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

## 🚫 Anti-Patterns & Lessons Learned
- **PII Direct Query:** `profiles(name, email)`와 같이 PII 테이블을 직접 조인하여 화면에 렌더링하는 코드를 절대 작성하지 말 것. 반드시 `decrypt-profiles` 등 암호화 Edge Function을 사용할 것.
- **Broad Lint Retrofit:** 기존 코드베이스 정리 없이 저장소 전체에 범용 ESLint recommended 규칙을 한 번에 켜지 말 것. 래칫은 목표 금지 규칙만 좁게 추가하거나 별도 정리 마이그레이션과 함께 도입할 것.
- **Service-Role Gate:** `SUPABASE_SERVICE_ROLE_KEY`를 사용하는 Edge Function은 호출자 인증과 소유권/관리자 검증을 먼저 통과시키지 않은 채 외부에 열어두지 말 것.
- **Focus Ring Cascade:** `focus-visible` 스타일을 인라인 `outline`이 덮어쓰는 구조로 두지 말고, 같은 cascade에서 처리하거나 필요 시 명시적으로 우선순위를 높여 실제 포커스 표시를 보장할 것.
- **Public Documents Warning:** public `documents` 버킷에 올라가는 문서는 즉시 공개 URL이 생기므로, 첨부 UI에서 허용 형식 검증과 공개 경고를 함께 강제하지 않은 채 문서 업로드를 허용하지 말 것.
- **Role Update Escape Hatch:** 관리자 UI만 서버 함수로 바꿔놓고 `public.profiles.role`의 직접 UPDATE 경로를 DB에서 막지 않은 상태로 두지 말 것. 우회 경로가 남으면 재인증 강제는 불완전하다.
- **Edge Function Blind Error:** `supabase.functions.invoke()` 실패를 `error.message`의 generic `non-2xx` 문자열만 보여주는 상태로 두지 말 것. 응답 본문(JSON/text)을 파싱해 실제 서버 에러를 사용자와 디버깅 로그에 드러내야 한다.
- **Global Category Store:** `categoryStore.ts`의 함수를 `boardId` 없이 호출하지 말 것. 단일 전역 키를 쓰면 게시판(notice·news·events·blog 등) 간 태그 풀이 공유되어 한 게시판의 태그 추가/삭제가 다른 게시판에 영향을 준다.
- **Naver PostList Broad Scrape:** `PostList.naver` HTML 전체에서 `logNo=` 패턴을 긁으면 사이드바·공유버튼 등이 포함돼 실제 게시글보다 많이 추출된다. 반드시 `tagParam = '' || '...'` JS 변수를 우선 사용해 해당 페이지의 실제 게시글만 추출할 것.
- **Naver PostView Date Drift:** `PostView.naver`의 `article:published_time` 메타태그와 `se_publishDate` span은 페이지 렌더링 시점 또는 최근 수정일을 반환할 수 있어 원본 발행일과 다를 수 있다. 발행일은 `PostList.naver` 카드 HTML에서 logNo 근처의 날짜 텍스트(`20XX. M. D`)를 추출하는 방식이 신뢰할 수 있는 유일한 소스이다.
- **Import Update Missing created_at:** import `update` 페이로드에 `created_at`을 포함하지 않으면 날짜를 수정해도 DB에 반영되지 않는다. insert와 동일하게 update 페이로드에도 `created_at`을 항상 포함할 것.
- **Heavy Crawler Edge Function:** 전체 Naver 카테고리 크롤링, 본문 파싱, 이미지 미러링을 한 Edge Function에 몰아넣지 말 것. Supabase Edge Function은 짧은 델타 확인/큐 적재에 쓰고, 긴 import 작업은 Node worker 또는 수동 스크립트로 분리한다.
