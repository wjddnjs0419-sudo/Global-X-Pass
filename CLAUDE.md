# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server (Vite, default port 5173 or 5174 if occupied)
npm run build    # Production build → dist/
```

No test runner or linter is configured. TypeScript errors surface through Vite's dev server.

Environment variables required (`.env`):
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
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

## Architecture

**Stack:** React 18 + TypeScript + Vite + Tailwind CSS v4 + Supabase (auth, DB, storage, realtime)

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

- **admin** — full access including `/admin` dashboard
- **participant** (참여사 담당자) — can access `/expenses` (사업비 자료실)
- **user** — standard authenticated user

Role is checked at two levels:
1. **Frontend gate:** `useAdmin()` hook (`src/hooks/useAdmin.ts`) for the admin route; `ExpensesPage` fetches the profile role directly. After login, `LoginPage` queries `profiles.role` to decide whether to navigate to `/admin` or `/` — do not use email address comparisons for this.
2. **Database:** Supabase RLS policies. The helper function `is_admin()` in Postgres checks `profiles.role = 'admin'` and is used in admin-write policies.

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

`AdminPage.tsx` is a single large component that owns all shared state (posts, users, chart data) and passes it down to 6 panel components in `src/app/components/admin/`:

`AdminDashboard` → `AdminUserManagement` → `AdminPostCreate` → `AdminPostManage` → `AdminConsultingManagement` → `AdminFoundersClubManagement`

`AdminFlowMap` is a separate admin-only page (not a tab) rendered at `/flow-map`. `NotificationBell` is a standalone component used in the admin header.

Realtime updates for the `profiles` table are subscribed in `AdminPage.tsx` so the user list auto-refreshes without manual refetch.

**`filteredPosts` sort:** Sorted client-side by `updated_at ?? created_at` descending — most recently touched post appears first across all category filters.

**`AdminPostManage`** shows each post's last activity as `수정 MM/DD HH:mm` (if `updated_at` exists) or `게시 MM/DD HH:mm` (creation date only).

**`AdminPostCreate` tag picker:** Appears **above** the Quill editor for `events`, `blog`, `events-archive`, `notice`, and `news` categories. It is a **single-select** system — clicking a preset replaces any existing tag. Presets are loaded from `getActivePresets()` (`src/utils/categoryStore.ts`) into local state; the list is refreshed after any add/delete. Each pill has an × button that calls `deleteCategory()` to soft-delete it. Custom tags are added via a "추가" button (never Enter key — see Korean IME note below). The same pattern is replicated inline inside `PostDetailPage` for admin edits from the detail view.

**CSV bulk user import** (`AdminUserManagement`): Only the fields `id, name, email, phone, company, role` are whitelisted — any other CSV column causes the import to fail with an error. Simple `split(',')` parsing (no quoted-field support).

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

- **XSS:** All post HTML content rendered via `dangerouslySetInnerHTML` must be wrapped with `DOMPurify.sanitize()` — see `PostDetailPage.tsx` and `FaqPage.tsx` for the pattern
- **Admin MFA (TOTP):** Admins can enroll in 2FA via `/mypage`. `LoginPage.tsx` intercepts the login flow to prompt for a 6-digit OTP code using the `InputOTP` UI component. The `useAdmin` hook and `AdminRoute` enforce `aal2` (Authenticator Assurance Level 2). At the database level, the `is_admin()` Postgres function strictly requires `aal2` for any admin who has MFA enrolled.
- **Idle logout:** `useIdleLogout` (`src/hooks/useIdleLogout.ts`) is a two-phase system: 28 min idle → warning modal appears (`warningVisible`); if no action within 2 min → `doLogout()` fires. The hook returns `{ warningVisible, extendSession, logout }`; the modal is rendered in `RootLayout`. Only fires when a session actually exists (checks `getSession()` before showing the modal).
- **Stale session (browser close):** `RootLayout` records the exact close time via `pagehide`/`beforeunload` into `gxp_last_active` (localStorage). On next mount, if a session exists and `gxp_last_active` is >30 min ago, silently signs out and navigates to `/`. No modal or banner for this case.
- **Session expiry banner:** `LoginPage` reads `sessionStorage.getItem("logout_reason")`; value `"idle"` shows a yellow banner. The key is cleared on read. Set it before `navigate("/login")` only for idle-logout flows.
- **Page view throttle:** `useTracker` skips recording if the same path was visited within 30 min (stored in `localStorage`)
- **Password minimum:** 8 characters enforced in `SignupPage`. Also set the same minimum in Supabase Dashboard → Authentication → Settings to enforce it at the API level.
