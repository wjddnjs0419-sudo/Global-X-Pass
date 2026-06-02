# AGENT_RULES.md - Global X Pass Project Mandates & Conventions

> **CRITICAL:** Authoritative source for AI agent rules, architecture, security, conventions. MUST read and follow.

## Project Overview
**Global X Pass** = global corporate collab + startup support platform. Networking, consulting, events, resource sharing for founders + global startups.

## Core Architecture & Stack
- **Frontend:** React 18 (TypeScript) + Vite + Tailwind CSS v4 + `motion`.
- **Backend:** Supabase (Auth, Database, Storage, Edge Functions, Realtime).
- **Styling Philosophy:** "Orbital System" + Glassmorphism. Vanilla CSS/inline for theme-aware (`isDark`); Tailwind for structural layout.
- **Routing:** React Router v7.

## Security & PII Mandates (CRITICAL)
- **Edge Function 권한 표준화:** 신규 관리자 Edge Function 시 `_shared/adminAuth.ts`의 `requireVerifiedAdmin()` 필수 (MFA/AAL2 강제).
- **RLS 정책 일관성:** `auth.jwt() ->> 'role'` 금지. `public.is_admin()` SQL 함수 사용.
- **PII 파이프라인 강제:** PII 반환 API 시 DB 직접 조회 금지, `decrypt-profiles` 또는 `decrypt-own-profile` 필수.
- **프론트엔드 MFA 게이팅:** 관리자 라우트/UI 렌더 시 `!adminLoading && isAdmin && !mfaRequired && mfaEnrolled` 전체 검증 필수.
- **PII Encryption:** `profiles.name`, `profiles.email`, `profiles.phone` MUST 저장 AES-256-GCM 암호문 (`enc:v1:...`).
- **Processing Flow:**
  - 절대 PII 직접 조회 금지; `decrypt-profiles` (admin) 또는 `decrypt-own-profile` (user) Edge Function 사용.
  - 암호화 = `encrypt-profile` Edge Function.
- **Admin MFA:** 관리자 MUST MFA (TOTP) 등록+사용 → `/admin` 접근. `is_admin()` SQL이 `aal2` 강제.
- **Admin MFA Enrollment Lock:** TOTP factor 미검증 관리자 = security-locked. role 승격 후 새로고침/재진입은 `/mypage`로 라우팅, 일반 nav/content 숨김, MFA 등록 flow만 노출.
- **Admin MFA Lock:** 관리자 = `MyPage`에서 MFA 해제 금지. 필수 유지, 해제 UI 노출 금지.
- **Admin MFA Backend Gate:** `public.is_admin()`은 관리자 프로필 존재만으로 true 금지. 검증 MFA factor + `aal2` 세션 모두 만족 시에만 인정.
- **Role Change Server Path:** role 변경은 클라이언트 직접 `profiles.update()` 금지. 관리자 재인증 서버 검증 전용 Edge Function/동등 서버 경로만 사용.
- **Role Column Guard:** `public.profiles.role`은 authenticated 세션 직접 UPDATE 금지. DB trigger/동등 수단으로 service-role 서버 경로만 변경 허용.
- **Idle Logout:** 28분 idle 경고 → 30분 auto-logout. mount 시 stale 체크 (`gxp_last_active` >30분).

## No-Hardcode Mandate (CRITICAL)
- **컴포넌트/페이지/훅/유틸에 디자인 raw 리터럴 직접 추가 금지.** 색상, 배경, 테두리, 그림자, 간격, 반경, 폰트 크기, z-index 등 반복 UI 값은 CSS 변수(`var(--color-*)`, `var(--space-*)`, `var(--radius-*)`, `var(--shadow-*)`), 공용 상수, `isDark` 토큰 패턴 사용.
- **토큰 정의 파일 예외.** `src/styles/theme.css` (원천 값), `adminConstants.ts` (CSS 변수 매핑), Tailwind/shadcn 설정 = raw 값 허용.
- **일회성 raw 값도 기존 토큰 우선 검색.** 적합 토큰 없으면 새 의미 토큰을 `theme.css`에 추가 후 호출부가 참조. "이번 화면만" 사유로 hex/`rgba(...)`/임의 `px` 박지 말 것.
- **예외 시 사전 동의.** Canvas API(`ctx.fillStyle`), 외부 라이브러리 CSS 변수 미수용, 도메인 숫자 리터럴 등 불가피한 경우 사전 설명+승인 받을 것.
- **레거시 하드코딩은 작업 범위 파일부터 줄임.** 대규모 정리는 별도 승인. 새 수정 라인엔 하드코딩 추가 금지.

## Coding Conventions
- **Data Fetching:** 컴포넌트 내 `supabaseClient.ts` 직접 호출. 전역 상태 매니저(Redux/Zustand) 금지 unless 명시 추가.
- **Theme Handling:** `useTheme()` 훅으로 `isDark` 상태. 조건부 스타일/클래스 적용.
- **Breakpoint Standard:** Mobile `320px ~ 767px` (base), Tablet `768px ~ 1023px` (`md`), Desktop `1024px ~ 1279px` (`lg`), Large Desktop `1280px+` (`xl`). `sm` (`640px+`) = 보조 large-phone/narrow-width 조정만, 주 breakpoint 아님.
- **Korean IME:** 한글 입력에 `onKeyDown` + "Enter" 금지; 명시 "Add/Confirm" 버튼 사용.
- **File Uploads:** Supabase Storage 시 `@/utils/file.ts`의 `encodeFilename()` 필수 (인코딩 이슈 방지). 이미지(jpg, png 등)는 `images` bucket, 비이미지(pdf, zip, docx 등)는 `documents` bucket.
- **Public Storage:** `images`, `documents` bucket = 공개 읽기. 공개 자산/다운로드 공개 리소스만 허용. 민감 파일은 별도 private bucket + signed URL.
- **Admin Pages:** Lazy Fetch + Skeleton UI 패턴. `React.lazy()` + `<Suspense>` 라우팅, theme-aware skeleton fallback으로 CLS 제거.
- **Edge Function CORS:** 공유 helper `supabase/functions/_shared/cors.ts`는 production + 로컬 Vite origin 허용 필수: `https://globalxpass.com`, `http://localhost:5173`, `http://localhost:5174`, `http://127.0.0.1:5173`, `http://127.0.0.1:5174`.
- **Overlay/Dropdown Layering:** 반복 카드 내 dropdown/popover 렌더 시, 열린 카드/portal 레이어가 형제 카드보다 높은 stacking context 보장. 공유 Portal 패턴 없으면 열린 항목에 최소 `z-index` 변경.
- **Admin-Only Floating UI:** 비관리자에게 빈 admin-only floating 컨테이너 렌더 금지. children뿐 아니라 전체 컨테이너를 `isAdmin`으로 게이팅.
- **RLS Policy Checks:** admin-only RLS 작성 시 `auth.jwt() ->> 'role'` 파싱 금지, 표준 `public.is_admin()` 사용.
- **Data API Explicit Grants (CRITICAL):** 2026-05-30 (신규)/2026-10-30 (전체)부터 Supabase는 Data API (supabase-js) 접근 위해 명시 `GRANT` 필수. `public` schema 테이블 생성/수정 migration은 `anon`, `authenticated`, `service_role` 명시 `GRANT` 포함 필수. 없으면 Data API 42501 에러.
- **Schema Change Safety:** SQL schema/policy/function signature/Edge Function response 변경 전, 의존 React 컴포넌트의 테이블/컬럼/함수명 식별 후 필드명+응답 shape 보존. UI migration 명시 포함 시 예외.
- **Home Section Rhythm:** `HeroSection` 이후 메인 섹션 공통 리듬: 섹션 padding `clamp(60px, 10vw, 100px) ... clamp(70px, 11vw, 110px)`, header 하단 `40px`, 타이틀 `clamp(24px, 3vw, 40px)`, 본문 `15px / 1.65`. `MediaSection`은 centered header OK, 공통 spacing+title scale 유지. `AboutSection`은 자체 시스템 OK, 공통 title scale에서 멀리 가지 말고 negative letter spacing 재도입 금지.
- **Color & Pill Restraint:** 같은 컴포넌트 내 카드 border/icon/badge/tag/filter/CTA에 키 컬러 반복 금지. 컬러는 actionable CTA/실제 status에만. 필터/카테고리/태그/날짜/메타데이터는 중립 탭/라벨 사용.
- **Home CTA Pills:** 홈 콘텐츠 섹션 outline CTA pill (`전체보기` 등)은 CTA 자체가 primary 아니면 중립(`slate`/white tint) 유지. 모든 섹션 CTA에 대표 색상 border/text 금지 (카테고리 색상이 장식처럼 느껴짐).
- **Home Section Cards:** 메인 카드는 단순 유지: `th.cardBg` 배경, `1px solid ${th.cardBorder}` border, `18px` 정도 radius, 대표 accent는 얇은 top/left rule, 무거운 shadow/glow 금지, hover는 small lift + border/outline 강조만.
- **Home Motion Restraint:** 공개 콘텐츠 섹션은 motion 절제. 타깃 전환 + 카드 hover `translateY(-2px)` 정도. 광범위 `transition: all`, glow blob, radial gradient, 장식 dot grid 금지 unless 승인 예외.
- **Public/Admin Separation:** 공개 홈 섹션은 admin 편집 컨트롤/대표 picker/인라인 편집 UI 노출 금지. admin 작업은 admin 페이지에만.
- **Derived Data Rule:** 시스템 파생 값을 수동 입력으로 전환 금지. 이벤트 잔여 좌석은 수락 상태 + `capacity`에서 파생; `slots_remaining`은 fallback/시스템 관리 display, editor 진실 아님.
- **Program Auto-Confirm Rule:** 이벤트 신청, 1:1 컨설팅 예약, Founder's Club 신청 = first-come auto-confirmed. 새 event/Founder's Club row는 `accepted`, 새 컨설팅 row는 `confirmed` 생성. admin UI는 승인/거절보다 취소 중심으로 관리.
- **Program Confirmation UI:** 이벤트/1:1 컨설팅/Founder's Club 공개 확인 화면은 `ProgramConfirmationCard` 재사용. 녹색 체크 아이콘, 카드 내 추가 status badge 금지, 후속 안내는 contact-phone 아닌 이메일 기반.
- **Live Architecture Map:** 개인 로컬 앱 `/architecture.html`의 실시간 맵 데이터는 `scripts/generate-architecture-map.mjs` + `src/generated/architectureMap.json`으로 생성. `npm run map:dev`로 실행, 운영 웹 라우트 노출 금지. 구조 변경 시 생성기 우선 갱신, 중요 파일은 JSDoc 태그(`@role`, `@plain`, `@notes`, `@critical`, `@cluster`, `@tag`)로 보강. 런타임 에러 위치는 `src/lib/errorLogger.ts`의 `NodeId`와 맵 노드 ID 일치 시 배지 표시.
- **Architecture Deadcode Semantics:** 아키텍처 맵 `DEAD 코드`는 삭제 승인 아님 - 생성기가 찾은 incoming reference 0개라는 정적 힌트. 삭제 전 nested `import()`, `architecture.html` 같은 별도 Vite entry, `supabase.functions.invoke("...")` 문자열 호출, 외부 배포/cron 호출, 문서상 보존 의도를 별도 검색으로 확인 필수.
- **Architecture Alerts & Ops:** 아키텍처 앱 `Alerts` 탭은 `QA`+`블로그 동기화`를 분리 메일형 인박스로, `Ops` 탭은 수동 실행 버튼만. 인박스 read/hidden 상태는 앱 로컬만 관리, GitHub Actions 원본 run/`blog_import_runs` 원본 기록 삭제/수정 금지.
- **Architecture QA Alerts:** 아키텍처 앱 QA Alerts 조회/수동 실행은 GitHub workflow runs/jobs API + `workflow_dispatch` 사용. GitHub 토큰은 앱 내 연결 UI 입력 → Electron `userData` 로컬 저장. 환경 변수 `GXP_GITHUB_TOKEN`, `GITHUB_TOKEN`, `GH_TOKEN`은 fallback. QA 수동 실행 workflow = `qa-dispatch.yml`, ref = `main`. cron 자동 실행 금지, Ops 탭에서 `smoke | admin-auth | admin-post-cud | admin-program-mgmt | all` 중 명시 선택.
- **Architecture Manual Blog Sync:** 아키텍처 앱 수동 블로그 동기화 버튼은 GitHub Actions API 직접 호출 금지, `sync-naver-blog` Edge Function만 호출. admin+AAL2 검증, `blog_import_runs` 실행 기록, `GITHUB_PAT` 기반 workflow_dispatch/fallback 정책을 기존 관리자 화면과 동일 보존.
- **Architecture AI Blog Drafting:** 아키텍처 앱 `Ops` 탭 AI 블로그 초안 생성/수정은 renderer에서 Gemini/Supabase 시크릿 직접 다루지 말고 Electron preload/main IPC 뒤에서 실행. 결과는 앱 세션 내 표시·복사 중심, `blog_import_runs` 같은 영속 실행 로그 테이블 신규 생성 금지. 초안 수정도 기존 `aiStyleAnalyzer`의 제목/본문/해시태그 검증 규칙 재사용.
- **UX Observability:** 중요 Supabase/RPC/Storage 실패를 `setError`/`console.error`로만 처리 금지, `src/lib/uxTelemetry.ts`의 `logSupabaseFailure()` 또는 `logActionFailure()`로 함께 기록. 클릭 무반응 감지 필요 버튼엔 `data-monitor-action` 부착, 레이아웃 overflow/interactive target 이슈는 `uxHealth` low severity 로그로 확인.
- **QA Secrets Boundary:** Playwright/진단 스크립트/QA 문서에 QA 계정/비밀번호/MFA 시크릿 하드코딩 금지. 자동 QA 자격 증명은 로컬 셸 환경 변수 또는 GitHub Actions Secrets(`QA_ADMIN_EMAIL`, `QA_ADMIN_PASSWORD`, `QA_ADMIN_MFA_SECRET`, 필요 시 `QA_USER_EMAIL`, `QA_USER_PASSWORD`)로만 주입.
- **QA CUD Data Boundary:** 운영 사이트 대상 CUD QA는 `QA_E2E_<runId>_...` prefix 필수, 테스트가 생성한 row/storage object만 수정·삭제. TOTP 값은 어떤 로그에도 출력 금지.
- **Documentation Canon:** 루트 가이드 문서 lean 유지. `GEMINI.md` (or `CLAUDE.md`) = 정식 프로젝트 라우터, 임시 실행 상태는 `PLAN.md` / `RESULT.md`.
- **Blog Import Convention:** Around X 블로그 이관 = RSS로 후보 발견 + `PostView.naver`의 `se-main-container` 본문 파싱 반자동 manifest 방식. 뉴스레터는 `Around X-뉴스레터` 게시판 기준 `news` + `뉴스레터` 고정 태그, 행사 아카이브는 manifest에서 글별 수동 태그, 썸네일은 1차에서 네이버 원본 이미지 URL. 중복 감지는 본문 앞 `GXP_BLOG_IMPORT_META` HTML comment의 `sourceUrl`로 처리.
- **Blog Sync Automation Boundary:** Supabase 자동화는 `pg_cron` + `pg_net`으로 Edge Function 호출하는 경량 트리거/델타 확인/큐 적재까지 기본 경계. 전체 Naver 페이지네이션 크롤링 + 이미지 미러링은 Edge Function 제한 고려해 Node 기반 외부 worker 또는 수동 스크립트 우선 검토.
- **Company News Relevance Gate:** 기업 뉴스 크롤러는 `scripts/utils/companyNewsRelevance.mjs`의 관련도 통과 기사만 저장. `articles.relevance_score`, `matched_terms`, `relevance_reason` 함께 저장, 관리자 `승인 대기` 큐는 관련도 내림차순 기본. 기존 기사 정리는 삭제보다 dry-run audit + `rejected` 후보 처리 우선.

## Verification Matrix
`npm run validate` = 모든 저장소 변경 후 universal gate. 추가로, 승인된 모든 작업은 적용 matrix 행 식별, 가능 시 체크 수행, 결과/명시 skip 사유를 `RESULT.md`에 기록.

| Change Type | Required Extra Checks |
|---|---|
| UI/UX or layout | 영향 라우트 responsive smoke check; 시각 동작 중요 시 브라우저/스크린샷 검증. QA 요청 브라우저 검증은 사용자가 별도 숨김 요청 없으면 visible 인앱 브라우저 기본. |
| Supabase schema, migration, RLS, RPC | migration 파일, RLS 명명 규칙, admin 경로 `public.is_admin()` 사용, React 필드/응답 shape 의존성 확인. |
| Edge Function | CORS origin, request/response shape 호환, service-role admin 작업 `requireVerifiedAdmin()` 확인. |
| Auth, role, MFA, PII | PII 직접 조회 표시 없음, decrypt/encrypt Edge Function flow, role 경계, AAL2/MFA 영향 확인. |
| Storage or upload | bucket 선택, public/private 민감도, MIME+크기 검증, `encodeFilename()` 사용 확인. |
| Documentation-only | `npm run validate` 기본 실행; 비코드 노트 skip 시 `RESULT.md`에 사유 기록. |

## Context Efficiency & Search-First Mandate (CRITICAL)
토큰 최소화 + 집중 최대화 위해 문서+대용량 소스 모두 **Grep-first** 원칙 필수.

- **전체 파일 먼저 읽기 금지.** 검색 도구(`grep_search`, `rg`, `glob`)로 범위 좁힘.
- **Header Discovery:** 문서에서 헤더(`^#`) 검색으로 관련 섹션 찾고 읽기.
- **Keyword Targeting:** 특정 심볼/기능/mandate(예: "MFA", "Naver", "PII") 검색으로 정확한 라인 찾기.
- **Diff Awareness:** 최근 변경/로그 확인으로 현재 상태 파악 후 전체 컨텍스트 읽기.

### Search Examples (Standardized Queries):
- **Doc Structure:** `rg -n "^##|^###" docs/AGENT_RULES.md docs/AGENT_ANTI_PATTERNS.md RESULT.md`
- **Security/Auth:** `rg -n "MFA|AdminRoute|is_admin|requireVerifiedAdmin" docs src supabase`
- **Storage/Public:** `rg -n "Storage|bucket|encodeFilename|public" docs src supabase`
- **Blog Import:** `rg -n "Naver|blog_import|queue|mirror" docs scripts supabase src`
- **UI/IME:** `rg -n "theme|token|raw literal|IME" docs src`

## AI Agent Workflow Mandates (CRITICAL)
모든 AI 에이전트 필수 준수:
0. **Session Bootstrap:** 모든 새 chat/session 시작 시, 라우터(`GEMINI.md` or `CLAUDE.md`), `PLAN.md`, `RESULT.md` 읽기 필수 → 답변/계획/편집 전. 현재 컨텍스트, 최근 완료, 대기 계획, 알려진 리스크 간단 요약 후 진행. 오래된 세션 이력 필요 시에만 `RESULT_ARCHIVE.md` 참조.
1. **`ㅎㅇ` Shortcut:** 사용자 시작 메시지가 정확히 `ㅎㅇ`이면 이를 **일반 인사로 해석 금지**, 새 세션 bootstrap 명령으로만 처리. 새 범위 묻기/편집 제안/잡담 응답 전 Rule 0 완료 필수. 첫 응답은 반드시 bootstrap 요약(현재 컨텍스트, 최근 완료, 대기 계획, 주요 리스크)으로 시작하고, 인사말/범용 안내로 시작하면 안 됨.
2. **Korean Only:** 모든 커뮤니케이션(설명, 계획, 보고) 한국어.
3. **Plan Before Code:** 상세 계획(편집 파일, 변경 내용) 제안 후 명시 승인(`진행해`, `승인` 등) 받기 필수 → 그 후 코드 수정.
4. **Validate Verification:** 변경 후 `npm run validate` 실행으로 type/lint/production build 확인 후 보고.
5. **UI Cleanup Sweep:** UI 수정 시, workflow 종반+최종 보고 전, 변경으로 도입되거나 불필요해진 obsolete UI leftover 감사+제거. 미사용 state, handler, effect, modal, form, fallback 렌더, 구 직접 save/delete/upload 경로, 중복 버튼, stale route/query 진입점 포함. 현재 product affordance+접근 경로(admin edit 버튼, 권한 게이트, 유효한 save/delete 컨트롤)는 현재 표준 구현에 재연결하여 보존, 기능 삭제 금지.
6. **Verification Matrix:** 최종 보고 전, 작업을 `## Verification Matrix`에 매핑, 적용 가능 추가 체크 수행, 결과+skip 체크 `RESULT.md` 문서화.
7. **Zero-Human Feedback Loop:** 작업 완료 후 `npm run validate` 실행. 에러 시 사용자 개입 요청 금지. 터미널 로그 검사, 코드 수정, 재검증, 성공까지 루프 반복.
8. **The Ratchet Principle:** build/lint 에러 자체 수정 또는 critical mistake 정정 시, 실패 모드를 `docs/AGENT_ANTI_PATTERNS.md`의 `## 🚫 Anti-Patterns & Lessons Learned` 아래 한 줄 금지 사항으로 기록.
9. **Reviewer Summary:** 변경+검증 완료 시, 수정 파일+주요 변경 포맷 요약 제공 → 사용자가 Reviewer에 복붙 가능.
10. **Review Waiting:** 요약 제공 후 Reviewer 피드백 대기, 새 수정 진행 금지.
11. **PLAN Lifecycle, Compaction & Cleanup:** 구현 전, 승인된 작업을 `PLAN.md`의 `## Pending Approval`에 pending item 추가. 구현+`npm run validate` 성공 후, 그 항목을 단일 `[Done]` 요약 라인으로 압축. `PLAN.md`에 `[Done]` 10개 초과 시, 오래된 완료 항목 영구 삭제 → active+upcoming 집중 유지. 상세 구현 노트는 `RESULT.md`. **CRITICAL: 'Technical Debt' 또는 'Long-term Plan' 항목은 완전 해결+검증 전까지 절대 삭제/`[Done]` 압축 금지.**
12. **`종료` Shortcut:** 사용자 `종료` 시, 승인 작업이 `PLAN.md`에 반영됐는지, `RESULT.md`에 최신 세션 요약 있는지, 최신 `npm run validate` 상태 기록됐는지 확인. 누락 시 문서 먼저 갱신 후 세션 종료. 또한 세션 중 Supabase 관련 변경(schema, RLS, Edge Function, migration) 있으면 `supabase migration list` 실행으로 로컬 migration이 원격에 반영됐는지 확인. unsynced(Remote 컬럼 빈) 있으면 종료 전 `supabase db push` 실행. 모든 체크 통과 후: (1) `git status`+`git diff --stat`로 변경 파일 식별; (2) 세션 주요 변경 요약 commit 메시지 초안; (3) 변경 파일 목록+초안 commit 메시지 제시; (4) 사용자에게 **"푸시도 해줘"** (commit + push), **"커밋만"** (commit only, no push), **"취소"** (skip) 중 선택 요청. Push는 **절대 자동 아님** — 명시 선택 필수.
13. **End of Session Documentation:** 세션 종료 시, 그 세션에서 정립된 신규 아키텍처 규칙/코딩 컨벤션/workflow mandate를 `docs/AGENT_RULES.md` + 관련 `.gemini_prompts/maker_*.md` 갱신 필수.

## Multi-Agent Cross-Validation System

최고 코드 품질, 아키텍처 무결성, 무타협 보안(PII, RLS) 위해 Multi-Agent Cross-Validation 채택.

### 1. Prompt Directory Mandate
- 모든 persona별 시스템 프롬프트(6개)는 hidden 디렉토리 `.gemini_prompts/`에 저장.
- 에이전트는 persona 파일 지시 실행 전 `AGENT_RULES.md` 전역 컨텍스트 먼저 내재화.

### 2. Persona Roles & Scopes
작업 3개 트랙 분리, 각 트랙에 **Maker** (실행) + **Reviewer** (감사).

#### Part 1: UI/UX Optimization
- **Maker (`maker_uiux.md`):** 직접 코드 수정. 고충실 시각 구현, Tailwind CSS v4, `motion` 애니메이션.
- **Reviewer (`reviewer_uiux.md`):** Read-only. 접근성, responsive 레이아웃 무결성(mobile-first), 시각 일관성 감사.

#### Part 2: Feature Development
- **Maker (`maker_feature.md`):** 직접 코드 수정. React 18 아키텍처 내 비즈니스 로직 + Supabase 통합 구현.
- **Reviewer (`reviewer_feature.md`):** Read-only. 컴포넌트 재사용성, 상태 관리 효율, 렌더 최적화 감사.

#### Part 3: Cybersecurity & Compliance (CRITICAL)
- **Maker (`maker_security.md`):** 직접 코드 수정. PII 암호화/복호화 workflow + XSS/Injection 방어 로직 구현.
- **Reviewer (`reviewer_security.md`):** Read-only. Supabase RLS 우회, PII 노출 리스크, Admin MFA 로직 결함 공격자 관점 감사.
