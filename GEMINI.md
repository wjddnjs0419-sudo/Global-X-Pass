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
10. **PLAN Lifecycle, Compaction & Cleanup:** Before implementation, the agent MUST add the approved work as a pending item under `## Pending Approval` in `PLAN.md`. After implementation and successful `npm run validate`, the agent MUST compress that item into a single `[Done]` summary line. If `PLAN.md` accumulates more than 10 `[Done]` items, permanently delete the oldest completed items so the file stays focused on active and upcoming tasks. Detailed implementation notes belong in `RESULT.md`. **CRITICAL: Items classified as 'Technical Debt' or 'Long-term Plan' MUST NEVER be deleted or compressed into `[Done]` until they are completely resolved and verified.**
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
- **Image Mirror Hash Tail Slice:** 이미지 미러링 경로 해시에 URL의 base64 마지막 N자를 쓰지 말 것. 네이버 CDN URL은 `?type=w388` 같은 동일 suffix로 끝나 충돌이 발생한다. 반드시 `createHash('sha256').update(url).digest('hex')`로 전체 URL을 해시할 것.
- **Naver SE Inline Style Override:** 네이버 SE 이관 콘텐츠를 `dangerouslySetInnerHTML`로 렌더링할 때 `font-family`/`color`/`font-size` inline style이 테마를 덮어쓴다. import 시 `stripDangerousStyleProps`로 제거하고, 렌더 래퍼에 `naver-se-content` 클래스를 적용할 것.
- **Naver SE ImageStrip Layout:** `se-imageStrip-container`는 item inline width(`style="width:47%"`)가 있어도 `display:flex`가 없으면 세로로 나열된다. `index.css`에 `.naver-se-content .se-imageStrip-container { display: flex; }` 규칙이 있어야 가로 배치가 복원된다.
- **Naver Import Detection Single Point:** `GXP_BLOG_IMPORT_META` 코멘트 하나만으로 Naver 이관 여부를 판별하지 말 것. 코멘트 시스템 도입 전 이관된 구버전 포스트에는 코멘트가 없으므로, `se-main-container` 같은 콘텐츠 구조 특징을 fallback으로 함께 확인해야 한다.
- **Legacy Naver Reimport Blind Update:** `GXP_BLOG_IMPORT_META`가 없는 구버전 Naver 이관 글을 다시 가져올 때 `--update-existing`와 source URL 매칭만 믿고 재이관하지 말 것. 기존 레코드를 못 찾아 중복 insert가 날 수 있으므로 명시적 포스트 ID 대상 업데이트 경로를 사용해야 하고, 이미지 회귀를 막기 위해 `--mirror-images`도 함께 적용할 것.
- **Naver Queue-Only Reimport Duplicate:** `blog_import_queue.existing_post_id`가 있는 Naver 이관 글은 content marker가 없어도 기존 글로 간주해야 한다. queue-backed 레거시 글을 source URL 매칭만으로 재이관하면 원본을 못 찾아 중복 insert가 발생하므로, queue의 `existing_post_id`를 update target으로 우선 사용한다.
- **Naver Import Spacer Leak:** Naver SE 이관 HTML을 저장/렌더링할 때 inline `margin`/`padding`/`height` 계열 스타일과 zero-width spacer 문단을 그대로 두지 말 것. 뉴스레터/테이블형 본문은 이 값들 때문에 거대 여백이 생긴다.
- **Naver Empty Component Spacer:** zero-width 문단만 제거하면 빈 `se-component se-text` 또는 빈 table spacer 래퍼가 남아 컴포넌트 margin으로 여백이 계속 생길 수 있다. 문단 제거 후 빈 SE 컴포넌트/빈 table row/component까지 함께 제거하거나 숨길 것.
- **Naver Empty Paragraph Overreach:** empty paragraph 정규화를 `<[^>]+>\s*` 같은 broad 패턴 하나로 처리하지 말 것. `<p><span><img ... /></span></p>` 같은 image-only paragraph까지 빈 문단으로 오인해 뉴스/이벤트 상세의 본문 이미지가 전부 사라질 수 있다.
- **Naver Broad Has Hide:** `.se-component:has(.se-module-text:empty)`처럼 broad `:has()` 숨김 규칙을 두지 말 것. 뉴스레터형 `se-table` 안의 빈 모듈 하나 때문에 상위 컴포넌트 전체가 `display:none` 되어 본문이 통째로 사라질 수 있다.
- **Naver Import Thumbnail Duplication:** Naver 이관 글의 썸네일이 본문 첫 이미지와 같다면 `posts.image_url`에 같은 URL을 다시 저장하지 말 것. 카드 썸네일은 본문 첫 이미지를 fallback으로 쓸 수 있으므로, 중복 저장은 상세 페이지 첨부 이미지 중복의 원인이 된다.
- **Public Posts RLS:** 공개 게시판 상세/목록은 `anon` role로도 검증할 것. RLS 정책이 `TO authenticated`에만 묶이면 글은 DB에 있어도 비로그인 사용자는 `/post/:id`에서 빈 결과를 받는다. 단, `expenses`는 계속 `admin`/`participant`만 읽을 수 있어야 한다.
- **Naver SE Pre-wrap Leak:** pretty-printed Naver SE HTML을 Quill 기본 `white-space: pre-wrap` 상태로 렌더링하지 말 것. 컴포넌트 사이 줄바꿈/들여쓰기가 실제 빈 줄로 렌더링되어 `se-horizontalLine` 주변과 본문 상단에 거대 여백이 생긴다.
- **Naver ImageStrip Gap Injection:** `se-imageStrip-container`의 각 item width 합계가 이미 100%인 상태에서 별도 `gap`/margin을 추가하지 말 것. 네이버 원본 멀티 이미지 스트립이 줄바꿈되거나 가로 배치가 틀어진다.
- **Naver Class Token False Positive:** `se-component` 같은 Naver class를 판별할 때 `\bse-component\b` 식 substring 정규식만 믿지 말 것. `se-component-content` 같은 wrapper까지 컴포넌트로 오인되어 canonical coverage/unknown block 진단이 왜곡된다. 반드시 공백 기준 class token 일치로 판별할 것.
- **Naver Coverage Visual Blind Spot:** canonical coverage 100%를 시각 배치 완료로 오해하지 말 것.
- **ThemeProvider Dark Class Missing:** `ThemeProvider`가 `isDark` 상태를 React context만으로 관리하고 `document.documentElement.classList.toggle("dark", isDark)`를 호출하지 않으면 Tailwind의 `dark:` 접두사 유틸리티가 전혀 동작하지 않는다. Button의 `text-foreground` 같은 CSS 변수 기반 색상이 항상 다크 모드 값(#ffffff)으로 고정되어 라이트 모드에서 흰 배경에 흰 텍스트가 된다. ThemeProvider에서 `document.documentElement.classList.toggle("dark", isDark)`를 반드시 함께 호출할 것.
- **Blog Queue Admin UI Missing:** `blog_import_queue`의 pending 항목을 Supabase Dashboard에서 직접 SQL로 approve하지 말 것. Admin UI `/admin` → "블로그 이관 큐" 탭에서 태그 지정 후 승인 버튼을 사용할 것.
- **RootLayout Path-Only Guard:** `RootLayout`에서 경로 문자열(`isDesignSystem` 등)만 보고 컴포넌트를 렌더링하지 말 것. `AdminRoute`를 우회해 비인가 사용자에게 페이지가 노출된다. 관리자 전용 렌더링은 반드시 `!adminLoading && isAdmin && !mfaRequired && mfaEnrolled` 조건을 함께 확인하고, 라우터 레벨에서도 `AdminRoute` children으로 이중 방어할 것.
- **Admin Floating Nav MFA Gate:** `RootLayout`의 관리자 플로팅 nav를 `isAdmin`만으로 게이팅하면 MFA 미완료 관리자 세션에서도 nav가 노출된다. 반드시 `!adminLoading && isAdmin && !mfaRequired && mfaEnrolled` 전체 조건으로 렌더링할 것. `isAdmin` 자체에 aal2를 강제하면 `AdminRoute`의 MFA 리디렉트 흐름이 깨지므로, MFA 상태 확인은 UI 레이어에서 별도로 수행해야 한다.
- **AdminRoute Loading Null:** `AdminRoute`에서 `loading` 중 `null`을 반환하면 DOM이 비어 타이밍으로 권한 상태 추론이 가능하다. `<Navigate to="/" replace />`는 초기 로드 시 관리자 진입을 차단하는 부작용이 있다. `<div aria-hidden style={{ visibility: "hidden" }} />`처럼 중립적인 빈 요소를 반환할 것.
- **Trigger-Only Edge Function Confusion:** `sync-naver-blog` Edge Function은 `blog_import_runs`에 queued 행만 생성하고, 실제 크롤링·이관은 GitHub Actions가 처리한다. "즉시 이관 실행" 버튼은 GitHub Actions `workflow_dispatch`까지 연동되어 있으므로 `GITHUB_PAT` secret이 없으면 dispatch가 실패하고 03:00 KST 예약 처리로 fallback된다. `imageCollage(se-imageGroup)`처럼 block type은 분류됐어도 내부 layout marker/CSS가 없으면 원본 이미지 배치가 세로로 무너질 수 있으므로 대표 포스트 브라우저 확인을 병행한다.
