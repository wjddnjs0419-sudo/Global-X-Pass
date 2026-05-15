# PLAN.md

완료된 계획은 `RESULT.md`에 세부 구현 내용과 검증 결과가 기록되어 있으므로, 이 파일에는 활성/예정 작업만 유지합니다. 완료 항목은 `[Done]` 한 줄로 축약하고, 10개를 넘으면 가장 오래된 완료 항목부터 삭제합니다.
## Pending Approval
- [Done] 자동 QA 자격 증명 env/secrets 분리 (2026-05-15) — Playwright 관리자 테스트, GitHub Actions, 진단 스크립트, QA 운영 문서에서 평문 QA 계정/비밀번호/MFA 시크릿을 제거하고 `QA_ADMIN_EMAIL`, `QA_ADMIN_PASSWORD`, `QA_ADMIN_MFA_SECRET`, `QA_USER_EMAIL`, `QA_USER_PASSWORD` 환경 변수 체계로 통일했다. `npm run validate` ✅, `npx playwright test tests/qa/admin-complex.spec.ts` ✅
- [Done] 24시간 자동 QA 로봇 (Playwright) 후속 안정화 (2026-05-15) — 관리자 통합 테스트의 로그아웃 단계를 헤더/모바일 메뉴 공통 role 기반 셀렉터로 보강하고, 로그아웃 후 실제 앱 동작(`/` 복귀, `/admin` 재진입 시 홈 리다이렉트)에 맞춰 가드 검증을 보정했다. `npm run validate` ✅, `npx playwright test tests/qa/admin-complex.spec.ts` ✅
- [Done] 24시간 자동 QA 로봇 (Playwright) 구축 (2026-05-15) — 운영 사이트(`google-play-changgoo-program.netlify.app`) 대상의 E2E 테스트(Smoke, Admin Master)를 작성하고, `otplib` 기반 MFA 자동 통과 및 UI 이벤트 강제 주입 로직을 완성하여 테스트를 통과시켰다. GitHub Actions(`daily-qa.yml`) 연결 준비를 완료했다.
- [Done] 에러 로그 시스템 PII 보호 및 구조 고도화 (2026-05-15) — errorLogger.ts에 maskPii() 추가 + log-client-error EF 호출로 전환,
 log-client-error EF 신규(서버측 2차 마스킹 + AES-256-GCM enc:v1 암호화), decrypt-error-logs EF 신규(AAL2+admin 게이트 복호화), LiveArchitectureMap fetchLogs를 EF 호출로 전환, explainError를 errorExplainer.ts로 추출(1312→1237줄). `npm run validate` ✅
- [Done] 아키텍처 맵 앱 — 네이티브 터미널 연동 (2026-05-15) — "Fix with Claude" / "Fix with Codex" / "Terminal 열기" 버튼을 NodeSidebar·ArchitectureMapSidebar에 추가했다. xterm.js 임베딩 방식은 한국어 IME 문제로 폐기하고, AppleScript로 iTerm2(우선) 또는 Terminal.app을 프로젝트 폴더에서 열어 명령어를 주입하는 방식으로 전환했다. 패키징된 앱에서 프로젝트 루트를 `.app` 바이너리 위치로부터 역추적(`getPath('exe')` 5단계 위 + `package.json` 검증)해 올바르게 감지한다. `npm run validate` ✅, `npm run app:pack` ✅
- [Done] 플로팅 네비 제거 + 디자인 시스템 숨김 진입점 (2026-05-15) — 관리자 편집 화면을 가리던 고정 플로팅 네비를 `RootLayout.tsx`에서 제거하고, 통합 검색에서 개발자 전용 검색어 `elwkdlstltmxpa` 검색 시 `/design-system`으로 이동하도록 연결했다. 네비 제거로 탈출 동선이 사라진 디자인 시스템 페이지에는 `getBackLinkStyle()`을 재사용한 `← 홈으로 돌아가기` 버튼을 추가했다. `npm run validate` ✅
- [Done] 관리자 콘텐츠 작성 UI 시각적 무결성 QA (2026-05-15) — visible 인앱 브라우저로 `게시물 작성`/`게시물 관리` 흐름을 검증했고, 카테고리 전환과 `AdvancedThumbnailEditor` 모달 자체는 안정적이었다. 다만 긴 편집 화면 하단에서 고정 플로팅 네비가 콘텐츠 본문을 덮는 시각적 간섭을 확인했다.
- [Done] QA 시 인앱 브라우저 자동 노출 규칙 문서화 (2026-05-15) — `AGENTS.md`에 QA 요청 시 `CODEX_QA.md`를 참고하고 인앱 브라우저를 visible 상태로 기본 노출한다는 운영 규칙을 추가했고, `CODEX_QA.md`와 `docs/AGENT_RULES.md`에도 QA 브라우저 가시성 원칙을 반영했다. `npm run validate` ✅
- [Done] 관리자 로그인/MFA QA 검증 (2026-05-15) — 인앱 브라우저를 visible 상태로 띄운 채 `qa@test.com` 로그인 입력 반영, OTP 챌린지, `Secret_Key` 기반 TOTP 인증, `/admin` 진입, `/mypage`의 관리자 MFA 활성 상태를 확인했다. 치명 이슈 없음.
- [Done] 관리자 OTP 자동 입력 방식 문서 명시 (2026-05-15) — `CODEX_QA.md`에 로그인 후 MFA 화면에서 인증 앱 화면을 읽는 것이 아니라, 등록된 `Secret_Key`를 기준으로 현재 시점의 6자리 TOTP를 계산해 자동 주입한다는 점과 그 전제 조건을 명시했다. 문서 변경만 수행.

## Long-Term Backlog
- [Backlog] 토큰화 통합 작업 — 4차수로 진행 예정:
  - [Done] 차수2: `sectionTheme.ts` · `PageShell.tsx` — `--section-*` 22개 + `--page-banner-*` 3개 토큰 추가, JS 하드코딩 51+6개 → `var(--...)` 교체, `isDark` 파라미터 제거 (2026-05-14)
  - [Done] 차수3: `ui/badge.tsx` · `ui/button.tsx` — Tailwind 임의값 → `bg-[var(--...)]` 교체, badge 시맨틱 토큰 10개 + hover 토큰 2개 신규 추가, `dark:` 접두사 의존 제거 (2026-05-14)
  - [Done] 차수4: `HeaderSection.tsx` — `--header-*` 17개 토큰 신규 추가, JS 9변수 + 인라인 8건 치환, SVG stroke attribute → style 변환 (2026-05-14)
  - 차수1: `AdminPage.tsx`(1개) · `AdminFlowMap.tsx` · `AdminSidebar.tsx` — 기존 토큰 1:1 치환, QA 불필요
