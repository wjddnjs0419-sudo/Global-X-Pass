# AGENTS.md

File guide Claude Code for repo.

## Claude Startup

- 새 chat/session 시작 직후, 답변 전에 프로젝트 루트에서 `npm run claude:bootstrap` 실행.
- 사용자 첫 메시지가 정확히 `ㅎㅇ`이면 일반 인사 금지, `npm run claude:bootstrap` 재실행 후 그 요약으로 첫 응답 시작.
- 부트스트랩 출력의 기본 골격은 `현재 컨텍스트 / 최근 완료 / 대기 계획 / 주요 리스크` 유지.

## Mandatory Workflow

전체 워크플로 규칙(세션 부트스트랩, Plan-First, Validate Loop, UI Cleanup Sweep, Ratchet Principle, PLAN 라이프사이클, `종료` 단축어 등) 원본은 `docs/AGENT_RULES.md`의 `## AI Agent Workflow Mandates` 섹션. 모든 에이전트 그 문서 정본 따름.

Codex 전용 추가 규칙:

- **QA Browser Visibility:** 사용자 `qa` 요청 또는 브라우저 검증 명시 위임 시 `docs/CODEX_QA.md` 참고, 별도 요청 없어도 인앱 브라우저 visible 상태로 직접 띄운 채 진행. 단, 사용자 백그라운드 검증만 원한다 명시 시 예외.

## Commands

```bash
npm run claude:bootstrap # Claude session bootstrap summary
npm run dev      # Start dev server (Vite, default port 5173 or 5174 if occupied)
npm run build    # Production build → dist/
npm run validate # Typecheck + lint + production build verification
```

테스트 러너 없음. TypeScript + ESLint 검증 `npm run validate` 통해 실행.

필수 환경 변수 (`.env`):
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

마이그레이션 스크립트 전용 (앱 미사용):
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

로컬 실행 시 `.env` 를 `http://127.0.0.1:54321` 로 향함 (프로덕션 URL 대신).

### Schema changes workflow

항상 마이그레이션 사용 — 대시보드로 원격 DB 직접 수정 금지.

```bash
supabase db pull   # Pull remote schema → creates supabase/migrations/<timestamp>_remote_schema.sql
supabase db push   # Apply pending local migrations → remote cloud DB
```

마이그레이션 파일 위치 `supabase/migrations/`. 연결된 원격 프로젝트 `yzbjvkifwinumytehxgf` (Northeast Asia, Tokyo).

### Edge Function deployment

```bash
supabase functions deploy <function-name>   # e.g. supabase functions deploy decrypt-profiles
```

함수 위치 `supabase/functions/<name>/index.ts` (Deno runtime). 공유 CORS 헬퍼 `supabase/functions/_shared/cors.ts` — 허용 origin: `https://globalxpass.com`, `http://localhost:5173`, `http://localhost:5174`, `http://127.0.0.1:5173`, `http://127.0.0.1:5174`. 새 origin 추가 시 이 파일 수정.

## Architecture

**Stack:** React 18 + TypeScript + Vite + Tailwind CSS v4 + Supabase (auth, DB, storage, realtime)

**Path alias:** `@` → `./src` (`vite.config.ts` 설정). `@/lib/...`, `@/utils/...` 사용.

**Tailwind v4:** `tailwind.config.js` 없음. 설정은 `src/styles/` 하 CSS 파일:
- `theme.css` — CSS custom properties (brand colors, gradients, glass tokens, dark mode `@custom-variant`)
- `tailwind.css` — `@import 'tailwindcss'` entry with `source()` directive
- `index.css` — global resets and `@keyframes pulse` for skeleton UI
주의: 대부분 컴포넌트 Tailwind dark mode (`dark:` prefix) 우회, `useTheme()` 의 `isDark` + 인라인 스타일 사용.

**Animations:** `motion` 패키지 사용 (not `framer-motion`) — `"motion": "12.x"` 설치됨.

**Entry:** `src/main.tsx` → `src/app/App.tsx` → `src/app/routes.tsx` (React Router v7)

**Layout:** 모든 라우트 `RootLayout` 공유, `HeaderSection` + `FooterSection` 감쌈. admin 라우트 `AdminRoute` (`src/app/components/AdminRoute.tsx`) 보호, 비-admin 은 `/` 로 리디렉션.

`RootLayout` 매 페이지 실행:
- `useTracker()` — page view 분석
- `useIdleLogout()` — `{ warningVisible, extendSession, logout }` 반환; 경고 모달 `RootLayout` 내 인라인 렌더
- Stale session check — 마운트 시 localStorage 의 `gxp_last_active` 읽음; 세션 존재하나 타임스탬프 >30분 경과면 무음 로그아웃 후 `/` 이동
- `pagehide` + `beforeunload` 리스너 — 현재 시각 `gxp_last_active` 기록, 브라우저 종료 후 30분+ 부재 다음 방문 시 감지

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
| `/admin` | `AdminPage` | Admin-only, 6-tab dashboard |

### Hooks (`src/hooks/`)

- `useAdmin()` — `{ isAdmin, loading, aal, mfaRequired, mfaEnrolled }` 반환. `profiles.role` + Supabase MFA assurance level 확인. `AdminRoute`, `MyPage` 사용.
- `useIdleLogout()` — `{ warningVisible, extendSession, logout }` 반환. `RootLayout` 만 사용.
- `useTracker()` — page view 기록; 동일 path 30분 내 방문 시 스킵. `RootLayout` 만 사용.

### Category store (`src/utils/categoryStore.ts`)

post category 태그 시스템용 localStorage 영속화. 기본 프리셋: `["네트워킹","피칭","투자","글로벌","교육","IR","멘토링","데모데이","창업","커뮤니티","기술","정책","뉴스"]`.

- `getActivePresets()` — 기본값 - 숨김 + 커스텀 추가분 반환
- `addCategory(tag)` — 숨김 태그면 숨김 해제; 기본 아니면 커스텀 리스트 추가
- `deleteCategory(tag)` — 숨김 리스트 추가로 소프트 삭제
- Storage keys: `ncf_hidden_tags` (hidden/deleted), `ncf_custom_tags` (user-added)

**Usage scope:** `AdminPostCreate` + `PostDetailPage` (admin edit) 의 태그 픽커가 이것 사용, `events`, `events-archive`, `blog`, `notice`, `news` 카테고리 선택 가능 리스트 관리. 공용 페이지 필터 pill (NoticePage, NewsPage, EventsPage, EventArchivePage, BlogPage) **읽기 전용** — post 데이터에서 태그 파생, categoryStore 호출 안 함.

### State and data fetching

모든 데이터 페치 컴포넌트 내 `src/lib/supabaseClient.ts` 직접 사용 — 글로벌 state 매니저, query 라이브러리 없음. 싱글톤 `supabase` 클라이언트 필요한 곳 import.

두 context provider 가 앱 감쌈:
- `ThemeProvider` (`src/app/ThemeContext.tsx`) — `isDark` boolean + `toggle()`, `localStorage` 영속. 모든 컴포넌트 `useTheme()` 읽고 인라인 스타일 조건부 적용.
- `LanguageContext` (`src/app/LanguageContext.tsx`) — KO/EN toggle.

### User roles and access control

`profiles.role` 세 값: `admin` | `participant` | `user`

- **admin** — `/admin` 대시보드 포함 풀 액세스.
- **participant** (참여사 담당자) — `/expenses` (사업비 자료실) 접근 가능.
- **user** — 표준 인증 사용자.

**Security Restrictions:**
- **Role Change Re-verification (S03):** 사용자 role 수정 시 admin 비밀번호 재입력 검증 필요.
- **Self-Role Protection (S03):** Admin 자신 role 수정 금지.
- **Database Gate:** `is_admin()` Postgres 함수가 role + MFA status (AAL2) 확인.

### Supabase database tables

표준 `profiles`, `posts` 외 프로젝트 추가:
- `consultants`, `consulting_slots`, `consulting_reservations` — 1:1 컨설팅; `consulting_reservations` 에 중복 예약 방지 `UNIQUE (slot_id)` 제약
- `founders_club_sessions`, `founders_club_applications` — Founder's Club FCFS; `founders_club_applications` 에 `UNIQUE (session_id, user_id)`
- `page_views`, `activity_logs` — 분석

**Phone number storage:** `profiles.phone` 진실 출처. `auth.users.phone` 의도적 비움 — 이 컬럼은 Supabase SMS auth 용이며 본 프로젝트 미사용.

**`posts` extended columns** (마이그레이션 추가, `src/lib/types.ts` 정의):
- `event_date` TEXT — display string for event date/time (e.g. "2026.05.08 (목) 18:00")
- `location` TEXT — venue string
- `event_status` TEXT — one of `접수예정` | `접수중` | `마감임박` | `마감`
- `capacity` INT — total seats
- `slots_remaining` INT — remaining seats
- `tags` TEXT — **single** 카테고리 태그 (e.g. `"네트워킹"`). 옛 데이터 콤마 분리 값 가능; `EventArchivePage` `split(',')` 로 하위 호환 처리.
- `is_featured` BOOLEAN — `BlogPage` 의 hero/featured post 표시 (카테고리당 한 개만 `true`)
- `updated_at` TIMESTAMPTZ — 매 `update()` 호출 시 수동 set + Postgres trigger (`posts_updated_at`) 자동 갱신. 어드민 "최종 수정일" 정렬 필요.

### Admin dashboard (`AdminPage.tsx`)

`AdminPage.tsx` **얇은 코디네이터** (~132 lines) — 보유: `activeTab`, `adminId`/`adminEmail`, `editingPost`, 세 `refreshKey` 카운터 (`dashRefreshKey`, `postsRefreshKey`, `usersRefreshKey`), `profiles` Realtime 구독.

**Code-splitting:** `AdminPostCreate`, `AdminUserManagement` 은 `React.lazy` + `Suspense` 로딩. 나머지 패널 컴포넌트 즉시 import.

**Tab-based lazy fetch:** 각 패널 마운트 시 자체 데이터 페치. 부모는 `refreshKey` prop 증가로 재페치 트리거 (e.g. post 저장 후 `postsRefreshKey` + `dashRefreshKey` 둘 다 증가).

**Panel components** (각자 내부 state + 모달):
- `AdminDashboard` — stats cards, dual-axis chart (daily + cumulative views), top-5 posts
- `AdminPostManage` — post list with search/filter/pagination; owns delete confirmation via `AdminPostModal`
- `AdminPostCreate` — ReactQuill editor (itself lazy-loaded inside the component); owns save confirmation via `AdminPostModal`; syncs form with `editingPost` prop via `useEffect(..., [editingPost?.id])`
- `AdminUserManagement` — user list, role management, bulk CSV import; owns `AdminRoleModal` and `AdminBulkResultModal`
- `AdminConsultingManagement`, `AdminFoundersClubManagement`

**Skeleton UI:** `@keyframes pulse` 는 `src/styles/index.css` 정의. 각 패널 로딩 중 자체 skeleton row 렌더.

`AdminFlowMap`, `LiveArchitectureMap` 은 사설 architecture-map 표면, 웹사이트 라우트 아님. 로컬 실행 `npm run map:dev`, `/architecture.html` 열기. `NotificationBell` 은 어드민 헤더 독립 컴포넌트.

**`fetchUsers`** (`AdminUserManagement`) — `decrypt-profiles` Edge Function 호출, profiles 테이블 PII ciphertext 저장. Realtime 구독은 profile 변경 시 `fetchUsers()` 트리거.

**`filteredPosts` sort:** 클라이언트 측 `updated_at ?? created_at` 내림차순 — 최근 수정 post 가 모든 카테고리 필터에서 최상단.

**`AdminPostManage`** post 별 마지막 활동 표시 `수정 MM/DD HH:mm` (`updated_at` 존재) 또는 `게시 MM/DD HH:mm` (생성일만).

**`AdminPostCreate` tag picker:** Quill 에디터 **위**에 표시, `events`, `blog`, `events-archive`, `notice`, `news` 카테고리용. **단일 선택** 시스템 — 프리셋 클릭 시 기존 태그 교체. 프리셋 `getActivePresets()` (`src/utils/categoryStore.ts`) 에서 로컬 state 로드; 추가/삭제 후 리스트 새로고침. 각 pill × 버튼은 `deleteCategory()` 호출 소프트 삭제. 커스텀 태그 "추가" 버튼으로 추가 (Enter 키 절대 금지 — 아래 Korean IME 노트). 동일 패턴 `PostDetailPage` 내 admin 편집에도 인라인 복제.

**CSV bulk user import** (`AdminUserManagement`): `id, name, email, phone, company, role` 필드만 화이트리스트 — 다른 CSV 컬럼 시 import 에러 실패. 쉼표 포함 필드 처리 위해 quote-aware CSV 파서 사용.

**`PostDetailPage` events edit fields:** `post.category === "events"` 일 때 edit form 에 풀 행사 상세 정보 패널 표시 (`AdminPostCreate` 와 동일 필드): `event_status`, `event_date`, `location`, `capacity`, `slots_remaining`. 데이터 페치 `useEffect` 에서 초기화, events post 한정 `.update()` payload 포함.

**Admin date inputs:** 날짜 필드 (e.g. 컨설팅 `slot_date`, Founder's Club `session_date`) 는 별도 state (`*_y`, `*_m`, `*_d`) 를 `<select>` 드롭다운으로 채움. 시간 필드는 hour/minute 드롭다운 **10분 단위**. 전체 문자열 제출 시 조립.

**Booking Concurrency:** slot status 업데이트 시 (e.g., `ConsultingBookingModal`) 항상 `.eq('status', 'available')` 필터 update 에 포함, 두 사용자 동시 동일 slot 예약 방지. `.select("id")` 로 결과 검증.

**Korean IME input:** 한글 텍스트 입력 제출에 `onKeyDown` + `e.key === "Enter"` 절대 금지 — IME composition end 와 keydown 동시 발생, 부분 조합 음절 + 완성 단어 두 값 제출됨. 한글 텍스트 확정에 항상 별도 버튼 클릭 (e.g. "추가") 사용.

## Design System

**Philosophy:** "Orbital System" + Glassmorphism — pill 모양 컴포넌트, 글래스 투명도 (15% 배경, 40% 보더).

**Section / category color conventions** (`Badge`/`Button` variant 매칭 사용):
- Notice (공지사항) → `red` / `#EA4335`
- Events (행사) → `green` / `#18A343`
- Newsletter → `yellow` / `#FBBC05`
- Community / Blog → `purple` / `#A855F7`
- Consulting / News / Resources / Admin accent → `blue` / `#4377F1`
- FAQ → `yellow` / `#FBBC05`
- Expenses (사업비) → `red` / `#EA4335`
- Founder's Club → `purple` / `#A855F7`

모든 post 카테고리의 표준 색상 맵은 `src/app/components/admin/adminConstants.ts` 의 `CATEGORY_COLOR`.

**Shared components** 위치 `src/app/components/ui/`. shadcn/ui 프리미티브 다수 설치되었으나 앱 대부분 커스텀 인라인-스타일 컴포넌트 사용. `ui/` 의 `Badge`, `Button` 만 페이지 전반 활용 — 섹션별 커스텀 badge/button 스타일 추가 금지.

`Badge` variants: `blue` `green` `yellow` `red` `purple` `glass` `secondary` `outline`
`Button` variants: `default` (blue) · `purple` · `outline` · `ghost` · `secondary` · `destructive` · `link`

**Theme-aware inline styles:** 대부분 섹션이 인라인 스타일 (Tailwind 클래스 아님) 로 테마 처리, 항상 `useTheme()` 의 `isDark` 분기. ghost/outline variant 에서 light-mode dark-background 버그 회피 위해 `bg-background` 대신 `bg-transparent` 사용.

**Tailwind vs inline style conflict:** 동일 엘리먼트 동일 CSS 속성에 Tailwind 반응형 클래스 + 인라인 `style={{}}` 혼용 금지. 인라인 스타일이 Tailwind 유틸리티 이김, `style={{ width: "100%" }}` 가 `sm:w-[260px]` 무음 파괴. 속성당 한 방식만 — 구조 레이아웃 (width, flex, grid) 은 Tailwind, 동적/테마 값 (colors, backgrounds) 만 인라인 스타일 권장.

**`PageShell`** (`src/app/components/PageShell.tsx`) — 모든 콘텐츠 페이지 표준 래퍼; `title`, `subtitle`, `accentColor` 전달.

### PII Encryption

`profiles.name`, `profiles.email`, `profiles.phone` 은 AES-256-GCM ciphertext 저장. 포맷: `enc:v1:<iv_hex>:<ciphertext_hex>:<authtag_hex>`. `enc:v1:` 시작 안 하는 값은 plaintext (마이그레이션 이전 또는 암호화 실패 — 미암호화 취급).

**Key derivation:** `ENCRYPTION_SECRET_KEY` SHA-256 → 32-byte AES key. Node.js 마이그레이션 스크립트와 Deno Edge Function 동일 derivation 사용.

**Edge Functions** (`supabase/functions/`):
- `decrypt-profiles` — admin 전용; 전체 profiles 페치, PII 복호화, JSON 반환.
- `decrypt-own-profile` — 사용자 대상; 호출자 본인 프로필 row 복호화 (`MyPage` 사용).
- `encrypt-profile` — `{ userId }` 받음; 해당 사용자 프로필 row 암호화 (가입 후 사용).
- `delete-user` — admin 전용; `auth.users` + `public.profiles` 모두 삭제.
- `bulk-register-users` — admin 전용; `auth.admin.createUser()` 통해 로그인 계정 일괄 생성, PII 암호화로 프로필 초기화, 임시 비밀번호 반환.
- `change-password` — 사용자 대상; `{ oldPassword, newPassword }` 받음, 서버측 옛 비밀번호 재검증 후 `auth.admin.updateUserById()` (service role) 갱신. MFA 등록 시 `updateUser` 의 AAL2 요구 우회.

### PII Processing Flow (S06)

1. **Signup/Registration:** `handle_new_user` 트리거가 프로필 row 생성 -> `encrypt-profile` Edge Function PII 암호화 (AES-256-GCM).
2. **Admin View:** `AdminPage` 가 `decrypt-profiles` Edge Function 호출, plaintext PII 표시.
3. **MyPage:** 사용자 본인 PII 복호화로 프로필 관리.

**One-time migration script:** `scripts/migrate-encrypt-pii.mjs` — 기존 row 100개 단위 배치 암호화. 먼저 `--dry-run` 실행. `.env` 에 `SUPABASE_SERVICE_ROLE_KEY` 필요. 재실행 안전 (`enc:v1:` 접두사 체크로 기암호화 row 스킵).

**Never query `profiles.name/email/phone` directly for display** — 항상 `decrypt-profiles` Edge Function 또는 클라이언트 측 복호화 경유. `MyPage` 프로필 표시 + 향후 PII 읽는 기능 모두 암호화 포맷 고려 필요.

## Supabase conventions

- 이미지용 Storage bucket: `images`
- 파일 업로드는 `src/utils/file.ts` 의 `encodeFilename()` 사용 — **항상 거기서 import, `encodeURIComponent` 로 로컬 재정의 금지**. b64 인코딩 방식이 한글/특수문자 파일명의 Supabase Storage "Invalid key" 에러 회피.
- 이미지 업로드 클라이언트 측 검증: MIME 타입 `image/` 시작 + 크기 ≤ 10MB. 둘 다 필요 — input 의 `accept="image/*"` 우회 가능.
- Admin 쓰기는 `is_admin()` Postgres 함수 존재 필요; 모든 새 admin-writable 테이블에 이것 사용하는 `FOR ALL` 정책 필요
- Public-readable 테이블 (e.g. `consultants`, `founders_club_sessions`) 은 `anon` role 위한 명시적 `SELECT` 정책 필요
- `profiles` SELECT 은 본인 row (`id = auth.uid()`) 또는 admin 으로 제한 — public/anon SELECT 정책 추가 금지
- **RLS naming convention:** `{table}_{operation}_{who}` — e.g. `posts_insert_admin`, `consulting_reservations_select_own`, `fc_sessions_select_public`. Operations: `select / insert / update / delete / all`. Who: `admin / user_own / public / auth`.
- `expenses` posts 는 DB 레벨 제한 — `admin`, `participant` role 만 SELECT 가능. `posts_select_auth` 정책 이를 강제; 우회하는 광범위한 `USING (true)` SELECT 정책 추가 금지.

## Security notes

### General Security Notes

- **XSS:** `dangerouslySetInnerHTML` 로 렌더되는 모든 post HTML 콘텐츠는 `DOMPurify.sanitize()` 로 래핑 필요 — 패턴은 `PostDetailPage.tsx`, `FaqPage.tsx` 참고
- **Admin MFA (TOTP):** 
    - **Enforcement:** Admin 은 `/admin` 대시보드 접근 위해 MFA 등록 **필수**. 미등록 시 `AdminRoute` + `LoginPage` 가 `/mypage` 로 강제 리디렉션 시켜 등록 유도.
    - **Verification:** `LoginPage.tsx` 가 등록된 admin 로그인 흐름 가로채 6자리 OTP 코드 요구.
    - **Database:** `is_admin()` Postgres 함수가 MFA 등록 admin 에게 `aal2` 엄격 요구.
- **Storage Security:** `images` 버킷은 10MB 크기 제한 + `image/*` MIME 타입 (SVG 제외) 을 버킷 설정으로 서버 레벨 강제.
- **Edge Function Security:** 모든 Edge Function (`delete-user`, `decrypt-profiles`, `encrypt-profile`) 제한된 CORS origin 사용, 필요 시 admin role 검증.
- **Admin CSV Import Security:**
    - **Robust Parsing:** 쉼표/특수문자 포함 필드 정확 처리 위한 quote-aware CSV 파서 사용.
    - **Integrity Protection:** 필수 `id` (UUID) 필드 체크 강제, 사고적 데이터 덮어쓰기 방지 위해 bulk `upsert` 전 수동 확인 요구.
- **DoS Protection (page_views):**
    - **Rate Limiting:** DB 레벨 트리거가 `visitor_id` 당 분당 최대 10건 page view 항목 제한.
    - **Schema Validation:** RLS 정책이 path 길이 제한 (<512 chars), 구조 검증 (`/` 시작 필수), User-Agent 길이 제한 (<1000 chars) 강제.
- **Idle logout:** `useIdleLogout` (`src/hooks/useIdleLogout.ts`) 2단계 시스템: 28분 idle → 경고 모달 표시 (`warningVisible`); 2분 내 미동작 → `doLogout()` 발동.
 hook `{ warningVisible, extendSession, logout }` 반환; 모달 `RootLayout` 렌더. 실제 세션 존재 시만 발동 (모달 표시 전 `getSession()` 확인).
- **Stale session (browser close):** `RootLayout` 가 `pagehide`/`beforeunload` 통해 정확 종료 시각을 `gxp_last_active` (localStorage) 기록. 다음 마운트 시 세션 존재 + `gxp_last_active` >30분 이전이면 무음 로그아웃, `/` 로 이동. 이 경우 모달/배너 없음.
- **Session expiry banner:** `LoginPage` 가 `sessionStorage.getItem("logout_reason")` 읽음; `"idle"` 값이면 노란 배너 표시. 키 읽기 시 클리어. idle-logout 흐름 한정 `navigate("/login")` 전 set.
- **Page view throttle:** `useTracker` 가 동일 path 30분 내 방문 시 기록 스킵 (`localStorage` 저장)
- **Password minimum:** `SignupPage` 에 8자 강제. Supabase Dashboard → Authentication → Settings 에도 동일 최소 설정으로 API 레벨 강제.
- **MyPage password change flow:** Supabase 는 MFA 등록 계정의 `updateUser` 에 AAL2 요구, 앱 role 무관. `handlePasswordUpdate` 흐름 분기:
  - **Admin + MFA enrolled:** OTP 입력 표시; `mfa.challenge` + `mfa.verify` 로 세션 AAL2 승격; 이후 `supabase.auth.updateUser()` 직접 호출.
  - **All other cases** (non-admin, 또는 잔존 MFA 등록 가진 former admin): `change-password` Edge Function 을 `{ oldPassword, newPassword }` 로 호출. 함수가 옛 비밀번호 재검증 + service role 로 갱신 — AAL2 불필요.
  - 비밀번호 재검증에 **main** 클라이언트의 `supabase.auth.signInWithPassword()` 절대 호출 금지 — 활성 세션 교체됨. no-op storage 임시 클라이언트 (`persistSession: false`) 또는 Edge Function 사용.
