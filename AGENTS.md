# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Mandatory Workflow: Plan-First Iterative Approach

Every complex task must follow this exact lifecycle. Do not skip steps.

0.  **Session Shortcuts:** 사용자의 첫 메시지가 `ㅎㅇ`이면 `GEMINI.md`, `PLAN.md`, `RESULT.md`를 읽고 현재 상태를 요약한 뒤에만 새 작업으로 들어간다. 사용자가 `종료`라고 하면 `PLAN.md`의 완료 반영, `RESULT.md` 최신화, 최근 `npm run validate` 기록 여부를 먼저 점검한다.
1.  **Research & Initial Plan:** 새 작업은 `PLAN.md`의 `## Pending Approval` 아래에 추가한다. 이 단계에서 아키텍처, 수정 파일, 구현 전략을 문서화한다.
2.  **User Review (Wait for Feedback):** Stop and ask the user to review `PLAN.md`. The user will provide feedback via comments inside `PLAN.md`.
3.  **Iterative Revision:** Read the comments in `PLAN.md`, update the plan, and repeat until the user gives explicit approval to "Implement".
4.  **Surgical Execution:** Follow the final `PLAN.md`. Implement sub-tasks one by one. Verify with `npm run validate` and any task-specific checks at each step.
5.  **Final Reporting:** Once complete, summarize all changes, technical decisions, and usage notes in a `RESULT.md` file. `RESULT.md`는 현재 또는 바로 직전 세션의 핫 컨텍스트만 유지하고, 과거 작업 기록은 `RESULT_ARCHIVE.md`에 누적한다.
6.  **PLAN Lifecycle, Compaction & Cleanup:** 구현과 `npm run validate`가 끝난 승인 계획은 `PLAN.md`에서 `[Done]` 단일 행으로 축약한다. `PLAN.md`에 `[Done]` 항목이 10개를 넘으면 가장 오래된 완료 항목부터 영구 삭제해 활성/예정 작업만 남긴다.
7.  **Zero-Human Validation Loop:** 코드 수정 후에는 반드시 `npm run validate`를 실행하고, 타입/린트/빌드 에러가 발생하면 사용자 개입을 기다리지 말고 에이전트가 스스로 로그를 분석해 수정·재검증을 반복한다.
8.  **Ratchet Principle:** 에이전트가 스스로 해결한 빌드/린트 오류나 치명적 실수는 재발 방지를 위해 `GEMINI.md`의 `## 🚫 Anti-Patterns & Lessons Learned` 섹션에 1줄 금지 조항으로 기록한다.

## Commands

```bash
npm run dev      # Start dev server (Vite, default port 5173 or 5174 if occupied)
npm run build    # Production build → dist/
npm run validate # Typecheck + lint + production build verification
```

No test runner is configured. TypeScript and ESLint validation now run through `npm run validate`.

Environment variables required (`.env`):
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Migration script only (not used by the app):
```
ENCRYPTION_SECRET_KEY=...        # AES-256-GCM key source for PII encryption
SUPABASE_SERVICE_ROLE_KEY=...    # Service role key (Settings → API Keys → Legacy → service_role)
```

### Supabase local development

```bash
supabase start   # Start local Supabase stack (Studio at http://127.0.0.1:54323)
supabase stop    # Stop local stack
supabase status  # Show local URLs, keys, DB connection string
supabase db query "<SQL>"  # Run a SQL query against local DB
```

Local DB connection: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`

When running locally, point `.env` at `http://127.0.0.1:54321` instead of the production URL.

### Schema changes workflow

Always use migrations — never edit the remote DB directly via the dashboard.

```bash
supabase db pull   # Pull remote schema → creates supabase/migrations/<timestamp>_remote_schema.sql
supabase db push   # Apply pending local migrations → remote cloud DB
```

Migration files live in `supabase/migrations/`. The linked remote project is `yzbjvkifwinumytehxgf` (Northeast Asia, Tokyo).

### Edge Function deployment

```bash
supabase functions deploy <function-name>   # e.g. supabase functions deploy decrypt-profiles
```

Functions live in `supabase/functions/<name>/index.ts` (Deno runtime). Shared CORS helper is at `supabase/functions/_shared/cors.ts` — allowed origins are `https://globalxpass.com`, `http://localhost:5173`, `http://localhost:5174`, `http://127.0.0.1:5173`, `http://127.0.0.1:5174`. Update this file when adding a new allowed origin.

## Architecture

**Stack:** React 18 + TypeScript + Vite + Tailwind CSS v4 + Supabase (auth, DB, storage, realtime)

**Path alias:** `@` → `./src` (configured in `vite.config.ts`). Use `@/lib/...`, `@/utils/...`, etc.

**Tailwind v4:** No `tailwind.config.js`. Configuration lives in CSS files under `src/styles/`:
- `theme.css` — CSS custom properties (brand colors, gradients, glass tokens, dark mode `@custom-variant`)
- `tailwind.css` — `@import 'tailwindcss'` entry with `source()` directive
- `index.css` — global resets and `@keyframes pulse` for skeleton UI
Note: Most components bypass Tailwind dark mode (`dark:` prefix) entirely and use `isDark` from `useTheme()` with inline styles instead.

**Animations:** Use the `motion` package (not `framer-motion`) — already installed as `"motion": "12.x"`.

**Entry:** `src/main.tsx` → `src/app/App.tsx` → `src/app/routes.tsx` (React Router v7)

**Layout:** All routes share `RootLayout` which wraps `HeaderSection` + `FooterSection`. The admin route is protected by `AdminRoute` (`src/app/components/AdminRoute.tsx`), which redirects non-admins to `/`.

`RootLayout` runs the following on every page:
- `useTracker()` — page view analytics
- `useIdleLogout()` — returns `{ warningVisible, extendSession, logout }`; the warning modal is rendered inline in `RootLayout`
- Stale session check — on mount, reads `gxp_last_active` from localStorage; if a session exists but the timestamp is >30 min old, signs out silently and navigates to `/`
- `pagehide` + `beforeunload` listeners — record the current time to `gxp_last_active` so that browser-close followed by a 30+ min absence is detected on next visit

### Key pages and what drives them

| Route | Page | Notes |
|---|---|---|
| `/` | `HomePage` | Assembles section components |
| `/notice` | `NoticePage` | Lists `posts` where `category = "notice"`; tag filter pills (red `#EA4335`) |
| `/news` | `NewsPage` | Lists `posts` where `category = "news"`; tag filter pills (blue `#4377F1`) |
| `/events` | `EventsPage` | Lists `posts` where `category = "events"`; 4-state status system (`event_status`); tag filter pills (green) |
| `/events/archive` | `EventArchivePage` | Past events, 4-column grid + stats boxes (total, 집계예정, category count); tag filter pills (green) |
| `/blog` | `BlogPage` | Featured banner + tag filter pills (purple) + 4-column grid; `is_featured` marks the hero post |
| `/resources` | `ResourcesPage` | Lists `posts` where `category = "resources"` |
| `/faq` | `FaqPage` | Lists `posts` where `category = "faq"`; HTML content rendered with `DOMPurify.sanitize()` |
| `/expenses` | `ExpensesPage` | Role-gated: `admin` or `participant` only |
| `/consulting` | `ConsultingPage` | Reads `consultants` + `consulting_slots` tables |
| `/founders-club` | `FoundersClubPage` | Reads `founders_club_sessions` + applications; admin view shows accepted participant list |
| `/mypage` | `MyPage` | Authenticated only; shows profile info, consulting reservations, club applications, password change |
| `/search` | `SearchPage` | **Static hardcoded data** — not connected to DB |
| `/update-password` | `UpdatePasswordPage` | Password reset flow via Supabase magic link |
| `/flow-map` | `FlowMapPage` | Admin-only (guarded by `AdminRoute`) |
| `/admin` | `AdminPage` | Admin-only, 6-tab dashboard |

### Hooks (`src/hooks/`)

- `useAdmin()` — returns `{ isAdmin, loading, aal, mfaRequired, mfaEnrolled }`. Checks `profiles.role` + Supabase MFA assurance level. Used by `AdminRoute` and `MyPage`.
- `useIdleLogout()` — returns `{ warningVisible, extendSession, logout }`. Used only in `RootLayout`.
- `useTracker()` — records page views; skips if same path visited within 30 min. Used only in `RootLayout`.

### Category store (`src/utils/categoryStore.ts`)

localStorage-based persistence for the post category tag system. Default presets: `["네트워킹","피칭","투자","글로벌","교육","IR","멘토링","데모데이","창업","커뮤니티","기술","정책","뉴스"]`.

- `getActivePresets()` — returns defaults minus hidden, plus custom additions
- `addCategory(tag)` — un-hides the tag if hidden; adds to custom list if not a default
- `deleteCategory(tag)` — soft-deletes by adding to hidden list
- Storage keys: `ncf_hidden_tags` (hidden/deleted), `ncf_custom_tags` (user-added)

**Usage scope:** Tag picker in `AdminPostCreate` and `PostDetailPage` (admin edit) use this to manage the selectable list for `events`, `events-archive`, `blog`, `notice`, and `news` categories. Public page filter pills (NoticePage, NewsPage, EventsPage, EventArchivePage, BlogPage) are **read-only** — they derive tags from post data and do not call categoryStore.

### State and data fetching

All data fetching is done directly in components via `src/lib/supabaseClient.ts` — there is no global state manager or query library. The singleton `supabase` client is imported wherever needed.

Two context providers wrap the app:
- `ThemeProvider` (`src/app/ThemeContext.tsx`) — `isDark` boolean + `toggle()`, persisted to `localStorage`. Every component reads `useTheme()` and applies inline styles conditionally.
- `LanguageContext` (`src/app/LanguageContext.tsx`) — KO/EN toggle.

### User roles and access control

`profiles.role` has three values: `admin` | `participant` | `user`

- **admin** — full access including `/admin` dashboard.
- **participant** (참여사 담당자) — can access `/expenses` (사업비 자료실).
- **user** — standard authenticated user.

**Security Restrictions:**
- **Role Change Re-verification (S03):** Modifying a user's role requires the admin to re-enter their password for verification.
- **Self-Role Protection (S03):** Admins are prohibited from modifying their own roles.
- **Database Gate:** The `is_admin()` Postgres function checks role and MFA status (AAL2).

### Supabase database tables

Beyond standard `profiles` and `posts`, the project adds:
- `consultants`, `consulting_slots`, `consulting_reservations` — 1:1 consulting flow; `consulting_reservations` has a `UNIQUE (slot_id)` constraint to prevent double-booking
- `founders_club_sessions`, `founders_club_applications` — Founder's Club FCFS system; `founders_club_applications` has `UNIQUE (session_id, user_id)`
- `page_views`, `activity_logs` — analytics

**Phone number storage:** `profiles.phone` is the source of truth. `auth.users.phone` is intentionally left empty — that column is for Supabase SMS auth which this project does not use.

**`posts` extended columns** (added via migration, defined in `src/lib/types.ts`):
- `event_date` TEXT — display string for event date/time (e.g. "2026.05.08 (목) 18:00")
- `location` TEXT — venue string
- `event_status` TEXT — one of `접수예정` | `접수중` | `마감임박` | `마감`
- `capacity` INT — total seats
- `slots_remaining` INT — remaining seats
- `tags` TEXT — **single** category tag (e.g. `"네트워킹"`). Old data may contain comma-separated values; `EventArchivePage` handles both via `split(',')` for backwards compatibility.
- `is_featured` BOOLEAN — marks the hero/featured post on `BlogPage` (only one per category should be `true`)
- `updated_at` TIMESTAMPTZ — set manually on every `update()` call and auto-updated by a Postgres trigger (`posts_updated_at`). Required for "최종 수정일" sort in the admin panel.

### Admin dashboard (`AdminPage.tsx`)

`AdminPage.tsx` is a **thin coordinator** (~132 lines) — it holds only: `activeTab`, `adminId`/`adminEmail`, `editingPost`, three `refreshKey` counters (`dashRefreshKey`, `postsRefreshKey`, `usersRefreshKey`), and a Realtime subscription on `profiles`.

**Code-splitting:** `AdminPostCreate` and `AdminUserManagement` are loaded via `React.lazy` + `Suspense`. All other panel components are eagerly imported.

**Tab-based lazy fetch:** Each panel component self-fetches its own data on mount. The parent re-triggers a fetch by incrementing the relevant `refreshKey` prop (e.g. after a post is saved, `postsRefreshKey` and `dashRefreshKey` are both incremented).

**Panel components** (each self-contained with internal state and modals):
- `AdminDashboard` — stats cards, dual-axis chart (daily + cumulative views), top-5 posts
- `AdminPostManage` — post list with search/filter/pagination; owns delete confirmation via `AdminPostModal`
- `AdminPostCreate` — ReactQuill editor (itself lazy-loaded inside the component); owns save confirmation via `AdminPostModal`; syncs form with `editingPost` prop via `useEffect(..., [editingPost?.id])`
- `AdminUserManagement` — user list, role management, bulk CSV import; owns `AdminRoleModal` and `AdminBulkResultModal`
- `AdminConsultingManagement`, `AdminFoundersClubManagement`

**Skeleton UI:** `@keyframes pulse` is defined in `src/styles/index.css`. Each panel renders its own skeleton rows during loading.

`AdminFlowMap` is a separate admin-only page at `/flow-map`, not a tab. `NotificationBell` is a standalone component in the admin header.

**`fetchUsers`** in `AdminUserManagement` calls the `decrypt-profiles` Edge Function — the profiles table stores PII as ciphertext. Realtime subscription triggers `fetchUsers()` on profile changes.

**`filteredPosts` sort:** Sorted client-side by `updated_at ?? created_at` descending — most recently touched post appears first across all category filters.

**`AdminPostManage`** shows each post's last activity as `수정 MM/DD HH:mm` (if `updated_at` exists) or `게시 MM/DD HH:mm` (creation date only).

**`AdminPostCreate` tag picker:** Appears **above** the Quill editor for `events`, `blog`, `events-archive`, `notice`, and `news` categories. It is a **single-select** system — clicking a preset replaces any existing tag. Presets are loaded from `getActivePresets()` (`src/utils/categoryStore.ts`) into local state; the list is refreshed after any add/delete. Each pill has an × button that calls `deleteCategory()` to soft-delete it. Custom tags are added via a "추가" button (never Enter key — see Korean IME note below). The same pattern is replicated inline inside `PostDetailPage` for admin edits from the detail view.

**CSV bulk user import** (`AdminUserManagement`): Only the fields `id, name, email, phone, company, role` are whitelisted — any other CSV column causes the import to fail with an error. Uses a quote-aware CSV parser to handle fields containing commas.

**`PostDetailPage` events edit fields:** When `post.category === "events"`, the edit form shows a full 행사 상세 정보 panel (same fields as `AdminPostCreate`): `event_status`, `event_date`, `location`, `capacity`, `slots_remaining`. These are initialized from the post in the `useEffect` that fetches data, and included in the `.update()` payload only for events posts.

**Admin date inputs:** Date fields (e.g. `slot_date` in consulting, `session_date` in Founder's Club) use separate state fields (`*_y`, `*_m`, `*_d`) populated by `<select>` dropdowns. Time fields use hour/minute dropdowns with **10-minute increments**. The full string is assembled at submission.

**Booking Concurrency:** When updating slot status (e.g., in `ConsultingBookingModal`), always include an `.eq('status', 'available')` filter in the update call to ensure a race condition doesn't allow two users to book the same slot. Verify the result using `.select("id")`.

**Korean IME input:** Never use `onKeyDown` with `e.key === "Enter"` to submit Korean text inputs — the IME composition end and the keydown fire simultaneously, causing the partially composed syllable to be submitted as a second value alongside the completed word. Always use a separate button click (e.g. "추가") for confirming Korean text input.

## Design System

**Philosophy:** "Orbital System" + Glassmorphism — pill-shaped components, glass-style transparency (15% background, 40% border).

**Section / category color conventions** (use the matching `Badge`/`Button` variant):
- Notice (공지사항) → `red` / `#EA4335`
- Events (행사) → `green` / `#18A343`
- Newsletter → `yellow` / `#FBBC05`
- Community / Blog → `purple` / `#A855F7`
- Consulting / News / Resources / Admin accent → `blue` / `#4377F1`
- FAQ → `yellow` / `#FBBC05`
- Expenses (사업비) → `red` / `#EA4335`
- Founder's Club → `purple` / `#A855F7`

The canonical color map for all post categories is `CATEGORY_COLOR` in `src/app/components/admin/adminConstants.ts`.

**Shared components** live in `src/app/components/ui/`. Many shadcn/ui primitives are installed but most of the app uses custom inline-styled components. Only `Badge` and `Button` from `ui/` are actively used across pages — do not add per-section custom badge or button styles.

`Badge` variants: `blue` `green` `yellow` `red` `purple` `glass` `secondary` `outline`
`Button` variants: `default` (blue) · `purple` · `outline` · `ghost` · `secondary` · `destructive` · `link`

**Theme-aware inline styles:** Since most sections use inline styles (not Tailwind classes) for theme handling, always branch on `isDark` from `useTheme()`. Use `bg-transparent` not `bg-background` for ghost/outline variants to avoid the light-mode dark-background bug.

**Tailwind vs inline style conflict:** Never mix Tailwind responsive classes and inline `style={{}}` for the same CSS property on the same element. Inline styles always win over Tailwind utilities, so a `style={{ width: "100%" }}` will silently break `sm:w-[260px]`. Use only one approach per property — prefer Tailwind for structural layout (width, flex, grid) and inline styles only for dynamic/theme-driven values (colors, backgrounds).

**`PageShell`** (`src/app/components/PageShell.tsx`) is the standard wrapper for all content pages — pass `title`, `subtitle`, and `accentColor`.

### PII Encryption

`profiles.name`, `profiles.email`, `profiles.phone` are stored as AES-256-GCM ciphertext. Format: `enc:v1:<iv_hex>:<ciphertext_hex>:<authtag_hex>`. Values not starting with `enc:v1:` are plaintext (pre-migration or failed encryption — treat as unencrypted).

**Key derivation:** SHA-256 of `ENCRYPTION_SECRET_KEY` → 32-byte AES key. Both the Node.js migration script and the Deno Edge Functions use this same derivation.

**Edge Functions** (`supabase/functions/`):
- `decrypt-profiles` — admin-only; fetches all profiles, decrypts PII, returns JSON.
- `decrypt-own-profile` — user-facing; decrypts the caller's own profile row (used by `MyPage`).
- `encrypt-profile` — accepts `{ userId }`; encrypts that user's profile row (used after signup).
- `delete-user` — admin-only; deletes both `auth.users` and `public.profiles`.
- `bulk-register-users` — admin-only; performs bulk creation of login accounts via `auth.admin.createUser()`, initializes profiles with PII encryption, and returns temporary passwords.
- `change-password` — user-facing; accepts `{ oldPassword, newPassword }`, re-verifies old password server-side, then updates via `auth.admin.updateUserById()` (service role). Bypasses Supabase's AAL2 requirement for `updateUser` when MFA is enrolled.

### PII Processing Flow (S06)

1. **Signup/Registration:** `handle_new_user` trigger creates the profile row -> `encrypt-profile` Edge Function encrypts PII (AES-256-GCM).
2. **Admin View:** `AdminPage` calls `decrypt-profiles` Edge Function to display plaintext PII.
3. **MyPage:** Users decrypt their own PII for profile management.

**One-time migration script:** `scripts/migrate-encrypt-pii.mjs` — encrypts existing rows in batches of 100. Run with `--dry-run` first. Requires `SUPABASE_SERVICE_ROLE_KEY` in `.env`. Safe to re-run (already-encrypted rows are skipped via `enc:v1:` prefix check).

**Never query `profiles.name/email/phone` directly for display** — always go through `decrypt-profiles` Edge Function or decrypt client-side. The `MyPage` profile display and any future features reading PII must account for the encrypted format.

## Supabase conventions

- Storage bucket for images: `images`
- File uploads use `encodeFilename()` from `src/utils/file.ts` — **always import from there, never redefine locally with `encodeURIComponent`**. The b64 encoding approach avoids Supabase Storage "Invalid key" errors from Korean/special characters in filenames.
- Image uploads are validated client-side: MIME type must start with `image/` and size must be ≤ 10MB. Both checks are required — `accept="image/*"` on the input is byppassable.
- Admin writes require the `is_admin()` Postgres function to exist; all new admin-writable tables need a `FOR ALL` policy using it
- Public-readable tables (e.g. `consultants`, `founders_club_sessions`) need an explicit `SELECT` policy for the `anon` role
- `profiles` SELECT is restricted to own row (`id = auth.uid()`) or admin — do not add a public/anon SELECT policy
- **RLS naming convention:** `{table}_{operation}_{who}` — e.g. `posts_insert_admin`, `consulting_reservations_select_own`, `fc_sessions_select_public`. Operations: `select / insert / update / delete / all`. Who: `admin / user_own / public / auth`.
- `expenses` posts are restricted at the DB level — only `admin` and `participant` roles can SELECT them. The `posts_select_auth` policy enforces this; do not add a broad `USING (true)` SELECT policy that would bypass it.

## Security notes

### General Security Notes

- **XSS:** All post HTML content rendered via `dangerouslySetInnerHTML` must be wrapped with `DOMPurify.sanitize()` — see `PostDetailPage.tsx` and `FaqPage.tsx` for the pattern
- **Admin MFA (TOTP):** 
    - **Enforcement:** Admins **must** enroll in MFA to access the `/admin` dashboard. `AdminRoute` and `LoginPage` force redirection to `/mypage` for enrollment if not set up.
    - **Verification:** `LoginPage.tsx` intercepts the login flow for enrolled admins to prompt for a 6-digit OTP code.
    - **Database:** The `is_admin()` Postgres function strictly requires `aal2` for any admin who has MFA enrolled.
- **Storage Security:** The `images` bucket enforces a 10MB size limit and `image/*` MIME types (excluding SVG) at the server level via bucket configuration.
- **Edge Function Security:** All Edge Functions (`delete-user`, `decrypt-profiles`, `encrypt-profile`) use restricted CORS origins and verify admin roles where necessary.
- **Admin CSV Import Security:**
    - **Robust Parsing:** Uses a quote-aware CSV parser to correctly handle fields containing commas or special characters.
    - **Integrity Protection:** Enforces a mandatory `id` (UUID) field check and requires manual confirmation before performing bulk `upsert` operations to prevent accidental data overwrites.
- **DoS Protection (page_views):**
    - **Rate Limiting:** A database-level trigger limits each `visitor_id` to a maximum of 10 page view entries per minute.
    - **Schema Validation:** RLS policies enforce path length limits (<512 chars), structure validation (must start with `/`), and User-Agent length limits (<1000 chars).
- **Idle logout:** `useIdleLogout` (`src/hooks/useIdleLogout.ts`) is a two-phase system: 28 min idle → warning modal appears (`warningVisible`); if no action within 2 min → `doLogout()` fires.
 The hook returns `{ warningVisible, extendSession, logout }`; the modal is rendered in `RootLayout`. Only fires when a session actually exists (checks `getSession()` before showing the modal).
- **Stale session (browser close):** `RootLayout` records the exact close time via `pagehide`/`beforeunload` into `gxp_last_active` (localStorage). On next mount, if a session exists and `gxp_last_active` is >30 min ago, silently signs out and navigates to `/`. No modal or banner for this case.
- **Session expiry banner:** `LoginPage` reads `sessionStorage.getItem("logout_reason")`; value `"idle"` shows a yellow banner. The key is cleared on read. Set it before `navigate("/login")` only for idle-logout flows.
- **Page view throttle:** `useTracker` skips recording if the same path was visited within 30 min (stored in `localStorage`)
- **Password minimum:** 8 characters enforced in `SignupPage`. Also set the same minimum in Supabase Dashboard → Authentication → Settings to enforce it at the API level.
- **MyPage password change flow:** Supabase requires AAL2 for `updateUser` on any account with MFA enrolled, regardless of application role. The flow branches in `handlePasswordUpdate`:
  - **Admin + MFA enrolled:** OTP input is shown; `mfa.challenge` + `mfa.verify` elevates the session to AAL2; then `supabase.auth.updateUser()` is called directly.
  - **All other cases** (non-admin, or former admin with residual MFA enrollment): the `change-password` Edge Function is invoked with `{ oldPassword, newPassword }`. The function re-verifies the old password and uses the service role to update — no AAL2 required.
  - Never call `supabase.auth.signInWithPassword()` on the **main** client for password re-verification — it replaces the active session. Use a no-op storage temporary client (`persistSession: false`) or the Edge Function instead.

## Development Status (S-Codes)

- **S01:** Admin login MFA logic (OTP challenge / forced enrollment) — **DONE**
- **S03:** Role change password re-verification + self-edit restriction — **DONE**
- **S04:** Security dashboard cards (PII, MFA, Hardening, Rate Limits, Auto-logout) — **DONE**
- **S05:** Realtime profile updates with explicit decryption re-fetch — **DONE**
- **S06:** Standardized PII processing flow (Encryption/Decryption) — **DONE**
