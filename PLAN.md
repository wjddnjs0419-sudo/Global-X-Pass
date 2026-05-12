# PLAN.md

완료된 계획은 `RESULT.md`에 세부 구현 내용과 검증 결과가 기록되어 있으므로, 이 파일에는 활성/예정 작업만 유지합니다. 완료 항목은 `[Done]` 한 줄로 축약하고, 10개를 넘으면 가장 오래된 완료 항목부터 삭제합니다.
## Pending Approval
- [Done] 에러 로그 시스템 PII 보호 및 구조 고도화 (2026-05-15) — errorLogger.ts에 maskPii() 추가 + log-client-error EF 호출로 전환, log-client-error EF 신규(서버측 2차 마스킹 + AES-256-GCM enc:v1 암호화), decrypt-error-logs EF 신규(AAL2+admin 게이트 복호화), LiveArchitectureMap fetchLogs를 EF 호출로 전환, explainError를 errorExplainer.ts로 추출(1312→1237줄). `npm run validate` ✅
- [Done] 아키텍처 맵 앱 — 네이티브 터미널 연동 (2026-05-15) — "Fix with Claude" / "Fix with Codex" / "Terminal 열기" 버튼을 NodeSidebar·ArchitectureMapSidebar에 추가했다. xterm.js 임베딩 방식은 한국어 IME 문제로 폐기하고, AppleScript로 iTerm2(우선) 또는 Terminal.app을 프로젝트 폴더에서 열어 명령어를 주입하는 방식으로 전환했다. 패키징된 앱에서 프로젝트 루트를 `.app` 바이너리 위치로부터 역추적(`getPath('exe')` 5단계 위 + `package.json` 검증)해 올바르게 감지한다. `npm run validate` ✅, `npm run app:pack` ✅
- [Done] 플로팅 네비 제거 + 디자인 시스템 숨김 진입점 (2026-05-15) — 관리자 편집 화면을 가리던 고정 플로팅 네비를 `RootLayout.tsx`에서 제거하고, 통합 검색에서 개발자 전용 검색어 `elwkdlstltmxpa` 검색 시 `/design-system`으로 이동하도록 연결했다. 네비 제거로 탈출 동선이 사라진 디자인 시스템 페이지에는 `getBackLinkStyle()`을 재사용한 `← 홈으로 돌아가기` 버튼을 추가했다. `npm run validate` ✅
- [Done] 관리자 콘텐츠 작성 UI 시각적 무결성 QA (2026-05-15) — visible 인앱 브라우저로 `게시물 작성`/`게시물 관리` 흐름을 검증했고, 카테고리 전환과 `AdvancedThumbnailEditor` 모달 자체는 안정적이었다. 다만 긴 편집 화면 하단에서 고정 플로팅 네비가 콘텐츠 본문을 덮는 시각적 간섭을 확인했다.
- [Done] QA 시 인앱 브라우저 자동 노출 규칙 문서화 (2026-05-15) — `AGENTS.md`에 QA 요청 시 `CODEX_QA.md`를 참고하고 인앱 브라우저를 visible 상태로 기본 노출한다는 운영 규칙을 추가했고, `CODEX_QA.md`와 `docs/AGENT_RULES.md`에도 QA 브라우저 가시성 원칙을 반영했다. `npm run validate` ✅
- [Done] 관리자 로그인/MFA QA 검증 (2026-05-15) — 인앱 브라우저를 visible 상태로 띄운 채 `qa@test.com` 로그인 입력 반영, OTP 챌린지, `Secret_Key` 기반 TOTP 인증, `/admin` 진입, `/mypage`의 관리자 MFA 활성 상태를 확인했다. 치명 이슈 없음.
- [Done] 관리자 OTP 자동 입력 방식 문서 명시 (2026-05-15) — `CODEX_QA.md`에 로그인 후 MFA 화면에서 인증 앱 화면을 읽는 것이 아니라, 등록된 `Secret_Key`를 기준으로 현재 시점의 6자리 TOTP를 계산해 자동 주입한다는 점과 그 전제 조건을 명시했다. 문서 변경만 수행.
- [Done] 관리자 로그인 자동화 절차 문서 보강 (2026-05-15) — `CODEX_QA.md`에 로그인 폼 입력란이 일반 `fill/type`에 즉시 반응하지 않을 수 있다는 실제 이슈와 우회 절차를 반영했다. 포커스 확인 → 기본 입력 시도 → 무반응 시 키 입력 시뮬레이션/DOM click 기반 우회 → 값 시각 확인 후 로그인 → 이후 MFA 단계 판단 순서로 정리했다. 문서 변경만 수행.
- [Done] 관리자 MFA 분실 복구 + 권한 강등 시 MFA 자동 초기화 (2026-05-15) — `update-user-role`가 `admin → non-admin` 강등 시 service role로 대상 사용자의 MFA factor를 자동 삭제하도록 수정했고, `reset-user-mfa` Edge Function과 `AdminUserManagement`의 `MFA 초기화` 액션을 추가해 다른 관리자가 OTP 분실 계정을 복구할 수 있게 했다. `npm run validate` ✅
- [Done] 관리자 MFA 중복 factor 복구 + 로그인 플로우 정상화 (2026-05-15) — `listFactors().all` 기준으로 `verified`/`unverified` TOTP factor를 구분하는 공통 헬퍼를 추가하고, `MyPage`를 미설정/미완료/완료 3상태로 분리했다. pending factor가 남아 있으면 재등록 대신 OTP 마무리 또는 초기화 후 재설정으로 유도하고, `LoginPage` OTP 검증은 `challengeAndVerify()` + 세션 토큰 반영으로 정리했다. `npm run validate` ✅, 인앱 브라우저에서 `qa@test.com`의 pending MFA 복구 UI 노출 확인 ✅
- [Done] 아키텍처 맵 색상 반영 누락 후속 수정 (2026-05-15) — `LiveArchitectureMap.tsx`의 클러스터 팔레트를 CSS 변수/`color-mix` 조합에서 명시 hex·rgba 값으로 교체해 Electron SVG 렌더링 의존성을 제거했다. `blue/green/purple/red/yellow`별 node fill, cluster fill, accent bar를 분리했고, 상태(`safe/watch/danger`)는 stroke/indicator 역할만 유지했다. `npm run validate` ✅, `npm run map:build` ✅, `npm run app:pack` ✅, 재발 방지 규칙 `docs/AGENT_ANTI_PATTERNS.md` 반영 ✅
- [Done] 아키텍처 맵 노드 클러스터 색상 복원 (2026-05-15) — `LiveArchitectureMap.tsx`에서 노드 카드와 클러스터 박스가 `architectureMap.json`의 클러스터 색을 직접 반영하도록 `color-mix` 기반 fill/stroke 로직을 추가했다. 상태(`safe/watch/danger`) 색은 경고 신호로만 남기고, 안전 상태에서는 클러스터 고유 색이 보이도록 분리했다. `npm run validate` ✅
- [Done] 아키텍처 맵 앱 — 로그인 오버레이 + 구조 새로고침 버튼 (2026-05-15) — `src/architecture/main.tsx`를 admin+AAL2 로그인 플로우(login→OTP→checkAdmin→ready)로 전체 재작성. 디자인은 웹 LoginPage 모티프(다크 글래스카드, `#4377F1` 버튼, `InputOTP`). `electron/main.cjs`에 `map:read-data`/`map:refresh` IPC 핸들러 추가, `preload.cjs`에 노출. `LiveArchitectureMap`에 상태 기반 mapData + 새로고침 버튼 UI 추가. 패키징된 앱에서 node PATH 문제(`spawn("node")` ENOENT)를 `/bin/zsh -l -c "node ..."` 로 수정. `vite.architecture.config.ts` port 5175 고정. `npm run app:build` ✅

## Long-Term Backlog
- [Backlog] 토큰화 통합 작업 — 4차수로 진행 예정:
  - [Done] 차수2: `sectionTheme.ts` · `PageShell.tsx` — `--section-*` 22개 + `--page-banner-*` 3개 토큰 추가, JS 하드코딩 51+6개 → `var(--...)` 교체, `isDark` 파라미터 제거 (2026-05-14)
  - [Done] 차수3: `ui/badge.tsx` · `ui/button.tsx` — Tailwind 임의값 → `bg-[var(--...)]` 교체, badge 시맨틱 토큰 10개 + hover 토큰 2개 신규 추가, `dark:` 접두사 의존 제거 (2026-05-14)
  - [Done] 차수4: `HeaderSection.tsx` — `--header-*` 17개 토큰 신규 추가, JS 9변수 + 인라인 8건 치환, SVG stroke attribute → style 변환 (2026-05-14)
  - 차수1: `AdminPage.tsx`(1개) · `AdminFlowMap.tsx` · `AdminSidebar.tsx` — 기존 토큰 1:1 치환, QA 불필요
