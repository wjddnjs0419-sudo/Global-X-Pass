# PLAN.md

완료된 계획은 `RESULT.md`에 세부 구현 내용과 검증 결과가 기록되어 있으므로, 이 파일에는 활성/예정 작업만 유지합니다. 완료 항목은 `[Done]` 한 줄로 축약하고, 10개를 넘으면 가장 오래된 완료 항목부터 삭제합니다.
## Pending Approval
- [Done] Realtime CHANNEL_ERROR 수정 + 에러 source 정확도 개선 (2026-05-17) — issuesChannel/logsChannel에 재연결 로직(exponential backoff, 최대 5회) 추가. LiveArchitectureMap의 에러 source를 `"admin-page"` → `"architecture-map"`으로 정정하고 errorLogger.ts에 NodeId/매핑 추가. `npm run validate` ✅, `npm run app:pack` ✅
- [Done] 아키텍처 맵 DEAD 판정 정밀화 + 안전한 미사용 파일 정리 (2026-05-15) — 생성기가 nested dynamic import와 `supabase.functions.invoke()` Edge Function 호출, `src/architecture/main.tsx` 별도 entry를 반영하도록 수정했다. DEAD 오탐 63→41개로 축소 후 실제 미사용 레거시 컴포넌트 4개만 삭제했고, 재생성 후 DEAD 37개 상태를 보존 후보/별도 검토 대상으로 남겼다. `npm run validate` ✅, `npm run map:build` ✅, `npm run app:pack` ✅
- [Done] 아키텍처 앱 Alerts/Ops 재구성 + QA 수동 실행 추가 (2026-05-15) — `LiveArchitectureMap`의 `QA Alerts`를 `Alerts`로 확장해 `QA`와 `블로그 동기화`를 메일형 인박스로 분리했고, `Ops`에는 `QA 실행`과 `블로그 동기화 실행` 버튼을 함께 배치했다. QA는 Electron `qa:trigger-run` IPC로 `daily-qa.yml` `workflow_dispatch(ref=main)`를 호출하고, 블로그는 `blog_import_runs` 집계를 Alerts 카드로 승격했다. `npm run validate` ✅, `npm run map:build` ✅, `npm run app:pack` ✅
- [Done] 아키텍처 앱 수동 블로그 동기화 버튼 추가 (2026-05-15) — `LiveArchitectureMap` 오른쪽 패널에 `Ops` 탭을 추가하고 `블로그 동기화 실행` 버튼을 연결했다. 버튼은 GitHub Actions API를 직접 호출하지 않고 기존 `sync-naver-blog` Edge Function을 호출해 admin+AAL2 검증, `blog_import_runs` 실행 기록, workflow_dispatch/fallback 정책을 보존한다. 실행 결과(run id/status/source/생성 시각, dispatch 성공/실패, GitHub workflow 링크)를 앱 안에 표시한다. `npm run validate` ✅, `npm run map:build` ✅, `npm run app:pack` ✅
- [Done] 아키텍처 앱 QA 알림 탭 추가 (2026-05-15) — `LiveArchitectureMap` 내부에 이메일형 `QA Alerts` 인박스를 추가했다. Electron IPC가 GitHub Actions `Daily Production QA` 최신 실행 결과를 읽고, 앱은 성공/실패, 실행 시각, 브랜치, 실패 step, GitHub 링크를 시간순으로 표시한다. `read/unread`, 개별 선택, 전체 선택, 선택 삭제, 전체 삭제를 지원하며 삭제는 GitHub 원본 기록이 아니라 앱 인박스에서만 숨김 처리한다. 앱 안에서 GitHub 토큰을 입력해 연결/해제할 수 있고 토큰은 Electron userData에 로컬 저장된다. `npm run validate` ✅, `npm run map:build` ✅, `npm run app:pack` ✅
- [Done] 자동 QA 자격 증명 env/secrets 분리 (2026-05-15) — Playwright 관리자 테스트, GitHub Actions, 진단 스크립트, QA 운영 문서에서 평문 QA 계정/비밀번호/MFA 시크릿을 제거하고 `QA_ADMIN_EMAIL`, `QA_ADMIN_PASSWORD`, `QA_ADMIN_MFA_SECRET`, `QA_USER_EMAIL`, `QA_USER_PASSWORD` 환경 변수 체계로 통일했다. `npm run validate` ✅, `npx playwright test tests/qa/admin-complex.spec.ts` ✅
- [Done] 24시간 자동 QA 로봇 (Playwright) 후속 안정화 (2026-05-15) — 관리자 통합 테스트의 로그아웃 단계를 헤더/모바일 메뉴 공통 role 기반 셀렉터로 보강하고, 로그아웃 후 실제 앱 동작(`/` 복귀, `/admin` 재진입 시 홈 리다이렉트)에 맞춰 가드 검증을 보정했다. `npm run validate` ✅, `npx playwright test tests/qa/admin-complex.spec.ts` ✅
- [Done] 24시간 자동 QA 로봇 (Playwright) 구축 (2026-05-15) — 운영 사이트(`google-play-changgoo-program.netlify.app`) 대상의 E2E 테스트(Smoke, Admin Master)를 작성하고, `otplib` 기반 MFA 자동 통과 및 UI 이벤트 강제 주입 로직을 완성하여 테스트를 통과시켰다. GitHub Actions(`daily-qa.yml`) 연결 준비를 완료했다.
- [Done] 에러 로그 시스템 PII 보호 및 구조 고도화 (2026-05-15) — errorLogger.ts에 maskPii() 추가 + log-client-error EF 호출로 전환,
 log-client-error EF 신규(서버측 2차 마스킹 + AES-256-GCM enc:v1 암호화), decrypt-error-logs EF 신규(AAL2+admin 게이트 복호화), LiveArchitectureMap fetchLogs를 EF 호출로 전환, explainError를 errorExplainer.ts로 추출(1312→1237줄). `npm run validate` ✅
- [Done] 아키텍처 맵 앱 — 네이티브 터미널 연동 (2026-05-15) — "Fix with Claude" / "Fix with Codex" / "Terminal 열기" 버튼을 NodeSidebar·ArchitectureMapSidebar에 추가했다. xterm.js 임베딩 방식은 한국어 IME 문제로 폐기하고, AppleScript로 iTerm2(우선) 또는 Terminal.app을 프로젝트 폴더에서 열어 명령어를 주입하는 방식으로 전환했다. 패키징된 앱에서 프로젝트 루트를 `.app` 바이너리 위치로부터 역추적(`getPath('exe')` 5단계 위 + `package.json` 검증)해 올바르게 감지한다. `npm run validate` ✅, `npm run app:pack` ✅
- [Done] 플로팅 네비 제거 + 디자인 시스템 숨김 진입점 (2026-05-15) — 관리자 편집 화면을 가리던 고정 플로팅 네비를 `RootLayout.tsx`에서 제거하고, 통합 검색에서 개발자 전용 검색어 `elwkdlstltmxpa` 검색 시 `/design-system`으로 이동하도록 연결했다. 네비 제거로 탈출 동선이 사라진 디자인 시스템 페이지에는 `getBackLinkStyle()`을 재사용한 `← 홈으로 돌아가기` 버튼을 추가했다. `npm run validate` ✅

## Long-Term Backlog
- [Backlog] 토큰화 통합 작업 — 4차수로 진행 예정:
  - [Done] 차수2: `sectionTheme.ts` · `PageShell.tsx` — `--section-*` 22개 + `--page-banner-*` 3개 토큰 추가, JS 하드코딩 51+6개 → `var(--...)` 교체, `isDark` 파라미터 제거 (2026-05-14)
  - [Done] 차수3: `ui/badge.tsx` · `ui/button.tsx` — Tailwind 임의값 → `bg-[var(--...)]` 교체, badge 시맨틱 토큰 10개 + hover 토큰 2개 신규 추가, `dark:` 접두사 의존 제거 (2026-05-14)
  - [Done] 차수4: `HeaderSection.tsx` — `--header-*` 17개 토큰 신규 추가, JS 9변수 + 인라인 8건 치환, SVG stroke attribute → style 변환 (2026-05-14)
  - 차수1: `AdminPage.tsx`(1개) · `AdminFlowMap.tsx` · `AdminSidebar.tsx` — 기존 토큰 1:1 치환, QA 불필요
