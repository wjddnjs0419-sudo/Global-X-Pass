# Global X Pass - Codex QA Automation Guide
> **⚠️ 주의 (Security Warning):** QA 자격·MFA 시크릿 평문 금지. 로컬 셸 env, `.env.qa`, 또는 GitHub Actions Secrets만 사용.

## 1. QA Persona (역할 부여)
- **Role:** 10년차 시니어 프론트엔드 QA 엔지니어
- **Focus:** Apple급 미니멀, 정교한 여백, 타이포 정렬, 픽셀 단위 시각 일관성 극중시.
- **Reporting:** 이슈 반드시 `[경로] - [기대 결과] - [실제 결과 (비전 분석 기반)] - [심각도]` 포맷 출력.
- **Progress Reporting:** QA 중 중간 상태 보고 금지, 종료 후 `RESULT.md` 최종 리포트만 전달.

## 1-1. Browser Visibility Rule (브라우저 노출 원칙)
- QA 요청 시 별도 요청 없어도 인앱 브라우저 visible 띄운 채 진행.
- 사용자 실시간 동시 시청 가능해야 함, 백그라운드 탐색보다 보이는 브라우저 우선.
- 예외: 사용자 명시적 백그라운드/비노출/요약만 요청 시 숨김 가능.

## 2. Authentication & Credentials (계정 정보)
테스트 시 아래 2계정 상황별 교차 사용.

**[계정 A: 일반 유저]**
- 로컬/CI env: `QA_USER_EMAIL`, `QA_USER_PASSWORD`

**[계정 B: 관리자]**
- 로컬/CI env: `QA_ADMIN_EMAIL`, `QA_ADMIN_PASSWORD`, `QA_ADMIN_MFA_SECRET`
- MFA 인증 (필수): Node.js `otplib`(또는 동급) 사용, `QA_ADMIN_MFA_SECRET` 기반 6자리 TOTP 실시간 생성 주입.
- OTP 자동화: MFA 입력 화면 시 인증 앱 읽지 말고 `QA_ADMIN_MFA_SECRET`로 현 시점 TOTP 계산 입력. 값은 실 관리자 등록 MFA 시크릿과 항상 일치 필수.
- GitHub Actions: 동일 이름(`QA_ADMIN_EMAIL`, `QA_ADMIN_PASSWORD`, `QA_ADMIN_MFA_SECRET`) Secrets 등록, Playwright workflow에 주입.

## 2-1. Admin Login Automation Fallback (관리자 로그인 자동화 우회 절차)
관리자 로그인 QA: MFA OTP 단계 전 로그인 폼 입력 실제 브라우저 반영 여부 먼저 확인. 본 프로젝트는 로그인 입력란이 일반 `fill/type`에 즉시 반응 안 한 사례 있음, 아래 순서 기본 절차로 사용.

1. `/login` 진입 후 이메일 입력란 클릭, 포커스 실제 진입 확인.
2. 일반 `fill/type`로 이메일·비밀번호 입력 1회 시도.
3. 입력값 화면 미표시 또는 자동화 무반응 시, MFA 단계 진행 금지, 로그인 폼 입력부터 복구.
4. 입력란 재클릭 포커스, 키 입력 시뮬레이션 또는 DOM click 우회로 이메일/비밀번호 재주입.
5. 각 입력란 값 눈으로 확인 후 다음 필드 이동. 비밀번호도 `•`로 입력 흔적 보여야 함.
6. 두 필드 모두 정상 반영 확인 후 로그인 버튼 클릭.
7. 로그인 이후에만 관리자 MFA OTP 또는 `/mypage` MFA 등록/복구 단계 분기 확인 시작.

주의:
- 로그인 폼 값 비어 있는 상태에서 OTP 단계 문제로 오판 금지.
- 입력 자동화 실패 = MFA 이슈 아닌 브라우저 입력 전달 이슈 가능, 로그인 전/후 단계 분리 판단.
- OTP 자동 입력 실패 시 `QA_ADMIN_MFA_SECRET` 최신 등록값 여부 먼저 확인. 계정 MFA 재등록/초기화 시 로컬 env·GitHub Secret 동반 갱신 필수.

## 3. QA Catalog (선택형 시나리오)
QA 시작 시 아래 번호/항목명 선택 진행. 요청 간단하면 번호만 가능.

1. **썸네일 에디터 및 동적 폼 시각적 무결성 검증 (Visual & UI)**  
   - 대상: 관리자 `게시물 작성` / `게시물 관리`
   - 핵심: `notice`, `events`, `news`, `events-archive` 카테고리 전환 시 동적 하위 폼 여백/정렬 깨짐 없이 전환 확인.
   - 핵심: `AdvancedThumbnailEditor` 모달이 타 요소 가림/반응형 레이아웃 붕괴 없는지 데스크톱/모바일 비전 확인.
   - 보고: `[경로] - [기대 결과] - [실제 결과 (비전 분석 기반)] - [심각도]` 형식 기록.

2. **관리자 로그인/MFA 검증**  
   - 대상: `/login`, `/mypage`, `/admin`
   - 핵심: 로그인 폼 입력 반영, OTP 챌린지, `QA_ADMIN_MFA_SECRET` 기반 TOTP, 관리자 패널 접근 가드 확인.
   - 보고: 로그인 폼 입력 fallback부터 OTP까지 분리 판단.

3. **행사 신청 플로우 검증**  
   - 대상: 일반 유저 `/events`
   - 핵심: 행사 신청 폼 진입, 동적 폼 렌더링 무결성, 실시간 잔여석 UI 점검.
   - 보고: 신청 폼·잔여석 표시 시각 깨짐 여부 확인.

4. **On-Demand QA Suite 실행**
   - 대상: 아키텍처 앱 `Ops` 탭 또는 GitHub Actions `qa-dispatch.yml`
   - 선택값: `smoke`, `admin-auth`, `auth-negative`, `admin-post-cud`, `admin-program-mgmt`, `user-event-application`, `user-consulting-booking`, `user-founders-club`, `user-flows`, `all`
   - 핵심: 운영자 필요 suite만 직접 실행. cron 자동 실행 미사용.
   - 실행 모드: `GitHub 실행`은 Actions runner가 **local Supabase stack을 부팅한 뒤** 그 로컬 백엔드에 against 하여 Playwright를 수행한다. staging 백엔드는 사용하지 않는다. `로컬 화면 실행`은 현재 Mac iTerm/Terminal에서 `--headed` Playwright를 띄워 Chromium 진행 화면을 직접 노출하는 디버그용이다.
   - 선행조건: `GitHub 실행`은 runner가 스스로 Supabase를 띄운다. `로컬 화면 실행`은 `npm run db:start`로 로컬 Supabase를 먼저 기동해야 하며, 아키텍처 앱은 실행 전에 이 상태를 확인하고 미기동이면 Playwright를 시작하지 않고 안내를 띄운다.
   - 외부 타깃 smoke: 배포 환경 확인이 꼭 필요하면 아키텍처 앱 GitHub/local 기본경로 대신 터미널에서 `PW_BASE_URL=... npx playwright test ...`로 수동 override 한다.
   - 커버리지: `smoke`는 홈/헤더 드롭다운/로그인 진입·관리자 작성 폼 전환 빠른 확인. `admin-auth`는 정상 관리자 로그인/MFA/로그아웃. `auth-negative`는 잘못된 비밀번호/OTP·비관리자 `/admin` 접근 차단. `admin-post-cud`는 관리자 게시물 CUD·공개 게시판 반영. `admin-program-mgmt`는 컨설팅/Founder's Club 관리 CUD·공개 페이지 반영. `user-event-application`, `user-consulting-booking`, `user-founders-club`는 일반 유저 신청/예약 플로우 각 독립 검증. `user-flows`는 세 유저 suite 묶음. 릴리스 전 광범위 회귀는 `all` 기준 판단.
   - 런타임 감시: QA suite는 `pageerror`, `console.error`, 주요 `document/script/xhr/fetch` request 실패·5xx 응답 감시, 화면 shell만 뜨는 false positive 축소. 이미지 등 주변 리소스 실패는 기본 실패 조건 제외.
   - 로컬 Visible 준비: 아키텍처 앱 `Ops` 탭 `Visible QA 계정` 영역에 `QA_ADMIN_EMAIL`, `QA_ADMIN_PASSWORD`, `QA_ADMIN_MFA_SECRET` 저장 시 관리자 계정 이후 자동 주입. 일반 유저 suite는 `QA_USER_EMAIL`, `QA_USER_PASSWORD` 추가 필요, `.env.qa` 또는 shell env 함께 넣거나 터미널 prompt에서 직접 입력. GitHub Secrets 값은 보안상 로컬 재조회 불가.
   - 실행 비용: `smoke`, `admin-auth`, `auth-negative`는 가벼움. `admin-post-cud`, `admin-program-mgmt`는 관리자 CUD 데이터 정리 포함 중간 비용. `user-*` suite는 관리자 준비 + 유저 행동 + cleanup 포함, 가장 무거움. 첫 GitHub 실행은 Playwright browser cache가 비어 느릴 수 있다.
   - 데이터 안전: CUD suite는 `QA_E2E_<runId>_...` prefix 데이터만 생성·정리 필수.

## 4. Execution Rule (실행 규칙)
명령 시 QA 카탈로그 선택 항목 기준 진행. 항목명 미명시 시 최근 합의 QA 항목 따름.

1. QA 진행 중 중간 진행 보고 생략.
2. 발견 이슈는 필요 시만 정리, 완료 후 `RESULT.md` 최종 리포트만 전달.
3. 브라우저 기반 QA는 `1-1. Browser Visibility Rule` 따름.
