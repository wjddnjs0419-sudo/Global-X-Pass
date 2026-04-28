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

## Architecture

**Stack:** React 18 + TypeScript + Vite + Tailwind CSS v4 + Supabase (auth, DB, storage, realtime)

**Entry:** `src/main.tsx` → `src/app/App.tsx` → `src/app/routes.tsx` (React Router v7)

**Layout:** All routes share `RootLayout` which wraps `HeaderSection` + `FooterSection`. The admin route is protected by `AdminRoute` (`src/app/components/AdminRoute.tsx`), which redirects non-admins to `/`.

`RootLayout` runs two global hooks on every page: `useTracker()` (page view analytics) and `useIdleLogout()` (30-min inactivity auto-logout).

### Key pages and what drives them

| Route | Page | Notes |
|---|---|---|
| `/` | `HomePage` | Assembles section components |
| `/events` | `EventsPage` | Lists `posts` where `category = "events"`; 4-state status system (`event_status`) |
| `/events/archive` | `EventArchivePage` | Past events, 4-column grid + stats boxes |
| `/blog` | `BlogPage` | Featured banner + tag filter + 4-column grid; `is_featured` marks the hero post |
| `/expenses` | `ExpensesPage` | Role-gated: `admin` or `participant` only |
| `/consulting` | `ConsultingPage` | Reads `consultants` + `consulting_slots` tables |
| `/founders-club` | `FoundersClubPage` | Reads `founders_club_sessions` + applications; admin view shows accepted participant list |
| `/flow-map` | `FlowMapPage` | Admin-only (guarded by `AdminRoute`) |
| `/admin` | `AdminPage` | Admin-only, 6-tab dashboard |

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
1. **Frontend gate:** `useAdmin()` hook (`src/hooks/useAdmin.ts`) for the admin route; `ExpensesPage` fetches the profile role directly.
2. **Database:** Supabase RLS policies. The helper function `is_admin()` in Postgres checks `profiles.role = 'admin'` and is used in admin-write policies.

### Supabase database tables

Beyond standard `profiles` and `posts`, the project adds:
- `consultants`, `consulting_slots`, `consulting_reservations` — 1:1 consulting flow; `consulting_reservations` has a `UNIQUE (slot_id)` constraint to prevent double-booking
- `founders_club_sessions`, `founders_club_applications` — Founder's Club FCFS system; `founders_club_applications` has `UNIQUE (session_id, user_id)`
- `subscribers` — newsletter signups
- `page_views`, `activity_logs` — analytics

**`posts` extended columns** (added via migration, defined in `src/lib/types.ts`):
- `event_date` TEXT — display string for event date/time (e.g. "2026.05.08 (목) 18:00")
- `location` TEXT — venue string
- `event_status` TEXT — one of `접수예정` | `접수중` | `마감임박` | `마감`
- `capacity` INT — total seats
- `slots_remaining` INT — remaining seats
- `tags` TEXT — comma-separated tags for events; single tag for blog posts
- `is_featured` BOOLEAN — marks the hero/featured post on `BlogPage` (only one per category should be `true`)

### Admin dashboard (`AdminPage.tsx`)

`AdminPage.tsx` is a single large component that owns all shared state (posts, users, chart data) and passes it down to 6 panel components in `src/app/components/admin/`:

`AdminDashboard` → `AdminUserManagement` → `AdminPostCreate` → `AdminPostManage` → `AdminConsultingManagement` → `AdminFoundersClubManagement`

Realtime updates for the `profiles` table are subscribed in `AdminPage.tsx` so the user list auto-refreshes without manual refetch.

**Admin date inputs:** Date fields (e.g. `slot_date` in consulting, `session_date` in Founder's Club) use three separate state fields (`*_y`, `*_m`, `*_d`) populated by individual `<select>` dropdowns. The full `YYYY-MM-DD` string is assembled only at insert/update time: `const date = y && m && d ? \`${y}-${m}-${d}\` : null`. Never store a date as a single assembled string in state — the split approach avoids cascading re-render bugs.

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

**Shared components** live in `src/app/components/ui/`. Do not add per-section custom badge or button styles — always use `<Badge variant="red" shape="pill">` etc.

**Theme-aware inline styles:** Since most sections use inline styles (not Tailwind classes) for theme handling, always branch on `isDark` from `useTheme()`. Use `bg-transparent` not `bg-background` for ghost/outline variants to avoid the light-mode dark-background bug.

**Tailwind vs inline style conflict:** Never mix Tailwind responsive classes and inline `style={{}}` for the same CSS property on the same element. Inline styles always win over Tailwind utilities, so a `style={{ width: "100%" }}` will silently break `sm:w-[260px]`. Use only one approach per property — prefer Tailwind for structural layout (width, flex, grid) and inline styles only for dynamic/theme-driven values (colors, backgrounds).

**`PageShell`** (`src/app/components/PageShell.tsx`) is the standard wrapper for all content pages — pass `title`, `subtitle`, and `accentColor`.

## Supabase conventions

- Storage bucket for images: `images`
- File uploads use `encodeFilename()` from `src/utils/file.ts` to handle special characters
- Image uploads are limited to **10MB** client-side before calling Supabase storage
- Admin writes require the `is_admin()` Postgres function to exist; all new admin-writable tables need a `FOR ALL` policy using it
- Public-readable tables (e.g. `consultants`, `founders_club_sessions`) need an explicit `SELECT` policy for the `anon` role
- `profiles` SELECT is restricted to own row (`id = auth.uid()`) or admin — do not add a public/anon SELECT policy

## Security notes

- **XSS:** All post HTML content rendered via `dangerouslySetInnerHTML` must be wrapped with `DOMPurify.sanitize()` — see `PostDetailPage.tsx` and `FaqPage.tsx` for the pattern
- **Idle logout:** `useIdleLogout` (`src/hooks/useIdleLogout.ts`) auto-signs-out after 30 min of inactivity; it is mounted in `RootLayout`
- **Page view throttle:** `useTracker` skips recording if the same path was visited within 30 min (stored in `localStorage`)
