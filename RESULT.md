# RESULT: GitHub QA 강도 상향 2차 (2026-05-18)

## 현재 상태
On-Demand QA가 관리자 중심 smoke/CUD를 넘어 실제 일반 유저 행동 플로우까지 다루게 됐다. 이제 행사 신청, 컨설팅 예약, Founder's Club 신청, 관리자 인증 negative case를 각각 독립 suite로 실행할 수 있고, GitHub workflow / Electron Visible QA / Ops UI / QA 문서가 같은 suite 집합을 공유한다.

## 변경 파일
| 파일 | 내용 |
|---|---|
| `tests/qa/utils/auth.ts` | `robustUserLogin()`, `logoutIfNeeded()`, `beginAdminOtpChallenge()`, `submitOtpCode()`, `getAdminCredentials()`, `getUserCredentials()`, `findByQaTitle()` 추가 |
| `tests/qa/user-event-application.spec.ts` | 관리자 행사 fixture 생성 → 일반 유저 신청 → 재진입 시 기존 신청 상태 확인 → 사용자 취소 + 관리자 게시물 cleanup 흐름 추가 |
| `tests/qa/user-consulting-booking.spec.ts` | 관리자 컨설턴트/슬롯 생성 → 일반 유저 예약 → MyPage 노출 확인 → 재오픈 시 슬롯 비노출 확인 → 사용자 취소 + 관리자 cleanup 흐름 추가 |
| `tests/qa/user-founders-club.spec.ts` | 관리자 세션 생성 → 일반 유저 신청 → 재신청 불가 상태 확인 → 관리자 마감 전환 후 공개 `모집 마감` 확인 → 신청/세션 cleanup 추가 |
| `tests/qa/admin-auth-negative.spec.ts` | 잘못된 관리자 비밀번호, 잘못된 OTP, 비관리자 `/admin` 접근 차단 검증 추가 |
| `.github/workflows/qa-dispatch.yml` | 신규 suite choice, `QA_USER_*` 조건부 preflight, suite별 실행 case 확장 |
| `electron/main.cjs` | 신규 suite allowlist / visible spec 매핑 / run title 파싱 확장, user-flow suite용 `QA_USER_*` prompt 추가 |
| `src/app/components/admin/LiveArchitectureMap.tsx` | Ops QA suite 타입/목록/설명 확장 |
| `CODEX_QA.md`, `.env.qa.example` | 신규 suite 의미, 실행 비용, user credentials 준비 경로 문서화 |
| `PLAN.md`, `RESULT.md` | 승인 계획 압축 및 최신 세션 결과 반영 |

## 검증 결과
- `npx playwright test --list` ✅
- `npx playwright test tests/qa/production-smoke.spec.ts --project=chromium` ✅
- `npm run validate` ✅
- `npm run map:build` ✅
- `npm run app:pack` ✅

## 비고
- 새 authenticated suite(`admin-auth-negative`, `user-*`)는 이번 세션에서 구조 등록과 빌드 검증까지 확인했다. 실제 end-to-end 실행은 로컬/CI QA credentials(`QA_ADMIN_*`, `QA_USER_*`)가 연결된 환경에서 이어서 돌리면 된다.

---

# RESULT: GitHub QA workflow 속도 최적화 (2026-05-18)

## 현재 상태
GitHub-hosted runner가 매번 Chromium을 처음부터 다시 받는 병목을 줄이기 위해 Playwright browser cache를 workflow에 붙였다. 이제 `~/.cache/ms-playwright`를 `actions/cache`로 복원하고, hit/miss가 로그에 바로 보인다.

## 변경 파일
| 파일 | 내용 |
|---|---|
| `.github/workflows/qa-dispatch.yml` | Playwright browser cache restore, cache status log step, suite 확장과 user secret preflight 동시 반영 |
| `CODEX_QA.md` | 첫 실행/동일 revision 재실행의 속도 차이와 suite별 실행 비용 문서화 |
| `RESULT.md`, `PLAN.md` | 최신 구현/검증 결과 기록 |

## 검증 결과
- `ruby -e 'require "yaml"; YAML.load_file(".github/workflows/qa-dispatch.yml")'` ✅
- `npm run validate` ✅

---

# RESULT: GitHub QA 강도 상향 1차 (2026-05-18)

## 현재 상태
기존 QA가 렌더링 확인 위주로 통과할 수 있던 지점을 줄였다. 이제 smoke는 헤더 메뉴 구조를 실제로 열어 `/notice` 이동을 확인하고, 모든 QA suite에 공통 런타임 감시를 붙여 `pageerror`, `console.error`, 주요 request 실패, 5xx 응답을 잡는다. 게시물/프로그램 CUD는 관리자 목록 확인에서 끝나지 않고 공개 페이지 반영까지 확인한다.

## 변경 파일
| 파일 | 내용 |
|---|---|
| `tests/qa/utils/auth.ts` | `installQaFailureWatchdog()` 추가. 로그인 env는 `robustLogin()` 내부에서만 읽도록 조정해 smoke가 관리자 secret에 불필요하게 묶이지 않게 함 |
| `tests/qa/production-smoke.spec.ts` | 조건부 통과 제거, 헤더 `News` 드롭다운의 공지 링크 이동 검증, 로그인 버튼 검증, 런타임 감시 추가 |
| `tests/qa/admin-auth.spec.ts`, `tests/qa/admin-complex.spec.ts` | 관리자 인증/스모크 suite에 런타임 감시 추가 |
| `tests/qa/admin-post-cud.spec.ts` | 공지/뉴스/행사/미디어 생성·수정 후 공개 페이지 반영 확인. 행사 상태/일시/장소/정원 필드를 실제 공개 카드에서 검증 |
| `tests/qa/admin-program-mgmt.spec.ts` | 컨설턴트 수정 + 공개 `/consulting` 반영 확인, Founder's Club 상태 변경 + 공개 `/founders-club` 반영 확인 |
| `CODEX_QA.md`, `PLAN.md`, `RESULT.md` | 1차 강화 결과와 2차 사용자 행동 플로우 확장 계획 기록 |

## 검증 결과
- `npx playwright test --list` ✅
- `npx playwright test tests/qa/production-smoke.spec.ts --project=chromium` ✅
- `npm run validate` ✅

## 다음 단계
2차는 일반 사용자 행동 플로우를 분리한다. 후보는 행사 신청, 컨설팅 예약, Founder's Club 신청, 관리자 인증 negative case다.

---

# RESULT: GitHub QA 기본 아티팩트 경량화 (2026-05-18)

## 현재 상태
`GitHub 실행 기록`은 실시간 QA 화면이 아니라 CI runner에서 돈 실행의 사후 디버깅 기록이다. 그래서 기본 보관 아티팩트를 `trace + 실패 screenshot` 중심으로 줄이고, `video`는 기본 비활성으로 전환했다. 필요하면 추후 `PW_QA_RECORD_VIDEO=1`로만 opt-in 활성화할 수 있다.

## 변경 파일
| 파일 | 내용 |
|---|---|
| `playwright.config.ts` | `PW_QA_RECORD_REPLAY=1`일 때 `trace`는 유지하고 `screenshot`은 실패 시에만 남기며, `video`는 `PW_QA_RECORD_VIDEO=1`일 때만 기록하도록 조정 |
| `src/app/components/admin/LiveArchitectureMap.tsx` | GitHub QA 안내 문구를 `trace + 실패 screenshot` 기준으로 수정 |
| `CODEX_QA.md` | GitHub/로컬 QA 실행 모드 설명을 실제 기본 동작과 일치하게 갱신 |
| `PLAN.md`, `RESULT.md` | 승인 계획 및 최신 세션 결과 반영 |

## 검증 결과
- `npm run validate` ✅
- `QA_ADMIN_EMAIL=qa@example.com QA_ADMIN_PASSWORD=password QA_ADMIN_MFA_SECRET=BASE32SECRET QA_USER_EMAIL=user@example.com QA_USER_PASSWORD=password npx playwright test --list` ✅

---

# RESULT: GitHub Actions QA 실제 실행 기록(video/trace/screenshot) 추가 (2026-05-17)

## 현재 상태
`로컬 화면 실행`은 현재 Mac에서 브라우저를 띄우는 디버그용 실행이고, `GitHub 실행 기록`은 실제 GitHub Actions runner에서 돈 QA의 화면 기록을 남기는 실행으로 역할을 분리했다. GitHub-hosted runner는 GUI 실시간 스트리밍을 기본 제공하지 않으므로, 실제 CI 화면 확인은 Playwright video/trace/screenshot 아티팩트 리플레이 기준으로 수행한다.

## 변경 파일
| 파일 | 내용 |
|---|---|
| `.github/workflows/qa-dispatch.yml` | GitHub QA 실행 시 `PW_QA_RECORD_REPLAY=1`을 주입하고 `playwright-report/`, `test-results/`를 각각 아티팩트로 업로드 |
| `playwright.config.ts` | `PW_QA_RECORD_REPLAY=1`일 때 trace/video/screenshot을 항상 기록 |
| `src/app/components/admin/LiveArchitectureMap.tsx` | 버튼/안내 문구를 `GitHub 실행 기록`과 `로컬 화면 실행`으로 분리해 실제 의미가 드러나도록 수정 |
| `CODEX_QA.md`, `PLAN.md`, `RESULT.md` | CI 실시간 관람 불가와 리플레이 아티팩트 기준 운영 방식 문서화 |

## 검증 결과
- `ruby -e 'require "yaml"; YAML.load_file(".github/workflows/qa-dispatch.yml")'` ✅
- `PW_QA_RECORD_REPLAY=1 npx playwright test --list` ✅
- `npm run validate` ✅
- `npm run map:build` ✅
- `npm run app:pack` ✅

---

# RESULT: 게시물 CUD QA timeout/잔여 데이터 정리 안정화 (2026-05-17)

## 현재 상태
`admin-post-cud`가 local/headed 실행에서 60초 timeout으로 중단되면 마지막 일괄 cleanup까지 안정적으로 도달하지 못해 `QA_E2E_...` 게시물이 남을 수 있었다. 이제 각 게시물 케이스가 생성 직후 수정/검증/삭제까지 끝낸 뒤 다음 케이스로 넘어가며, 시작/종료 시 `QA_E2E_` prefix 잔여 게시물을 추가로 정리한다.

## 변경 파일
| 파일 | 내용 |
|---|---|
| `tests/qa/admin-post-cud.spec.ts` | 테스트 timeout을 180초로 확장, 케이스별 원자 CUD 흐름 도입, 실패/종료 cleanup에 `QA_E2E_` prefix sweeping 추가, optional cleanup 탐색 timeout 보강 |
| `PLAN.md`, `RESULT.md` | 실제 실행 결과와 잔여 데이터 확인 기록 |

## 검증 결과
- `QA_ADMIN_EMAIL=... QA_ADMIN_PASSWORD=... QA_ADMIN_MFA_SECRET=... npx playwright test --list tests/qa/admin-post-cud.spec.ts` ✅
- `npm run validate` ✅
- 저장된 앱 QA credentials 기반 실제 `npx playwright test tests/qa/admin-post-cud.spec.ts --project=chromium` ✅ (`1 passed`, 35.2s)
- 관리자 게시물 관리에서 `QA_E2E_` 검색 결과 0개 확인 ✅

---

# RESULT: 로컬 Visible QA 계정 앱 저장 지원 (2026-05-17)

## 현재 상태
아키텍처 앱 `Ops` 탭에서 `Visible QA 계정`을 저장하면 이후 `로컬 Visible 실행` 시 터미널에 이메일/비밀번호/MFA secret을 직접 입력하지 않아도 된다. 저장값은 GitHub token과 같은 앱 로컬 userData 영역에만 보관되며, 터미널 명령에는 secret 원문을 노출하지 않고 저장된 env 파일을 source한다.

## 변경 파일
| 파일 | 내용 |
|---|---|
| `electron/main.cjs` | `qa-credentials:get-status/save/clear` IPC 추가, `qa-credentials.env` 저장/삭제, Visible QA 실행 시 저장 credentials 자동 source |
| `electron/preload.cjs` | renderer bridge에 QA credentials IPC 추가 |
| `src/app/components/admin/LiveArchitectureMap.tsx` | Ops 탭에 `Visible QA 계정` 저장/삭제 UI 추가. 저장 후에는 입력칸을 비우고 저장 여부만 표시 |
| `CODEX_QA.md`, `PLAN.md`, `RESULT.md` | 앱 저장 방식과 fallback 우선순위 문서화 |

## 동작 우선순위
Visible QA는 저장된 앱 credentials를 우선 사용하고, 없으면 `.env.qa`, shell env, 터미널 prompt 순서로 fallback한다.

## 검증 결과
- `node --check electron/main.cjs && node --check electron/preload.cjs` ✅
- `npm run validate` ✅
- `npm run map:build` ✅
- `npm run app:pack` ✅

---

# RESULT: 로컬 Visible QA env 안내 및 zsh 종료 코드 오류 수정 (2026-05-17)

## 현재 상태
로컬 Visible QA는 GitHub Actions Secrets를 역조회하지 않고 현재 Mac의 `.env.qa` 또는 shell env만 읽는다. `.env.qa`/shell env가 없으면 열린 터미널에서 이번 실행용 `QA_ADMIN_EMAIL`, `QA_ADMIN_PASSWORD`, `QA_ADMIN_MFA_SECRET`를 직접 입력받아 실행한다.

## 변경 파일
| 파일 | 내용 |
|---|---|
| `electron/main.cjs` | zsh readonly 변수 `status` 대신 `qa_exit_code` 사용, env 간접 참조를 zsh 전용 문법에서 POSIX-compatible `eval` 방식으로 변경, GitHub Secrets 역조회 불가 안내 및 터미널 credentials prompt 추가 |
| `.env.qa.example` | 로컬 Visible QA용 샘플 env 파일 추가 |
| `.gitignore` | 실제 비밀값 파일 `.env.qa` ignore 추가 |
| `CODEX_QA.md`, `PLAN.md` | `.env.qa.example` 복사 방식과 로컬/CI credentials 경계 문서화 |

## 사용 방법
```bash
cp .env.qa.example .env.qa
```

그 다음 `.env.qa`에 실제 QA 관리자 계정, 비밀번호, MFA secret을 채우고 아키텍처 앱 `Ops` 탭에서 `로컬 Visible 실행`을 다시 누르면 된다. `.env.qa`를 만들지 않아도 터미널 prompt에 직접 입력해 1회 실행할 수 있다.

## 검증 결과
- `node --check electron/main.cjs && node --check electron/preload.cjs` ✅
- `npm run validate` ✅
- `npm run map:build` ✅
- `npm run app:pack` ✅

---

# RESULT: On-Demand QA 실패 로그 기반 반복 안정화 (2026-05-17)

## 현재 상태
사용자가 실행한 On-Demand QA 실패 3건을 GitHub Actions 아티팩트 기준으로 추적해, 실패한 suite를 하나씩 수정→실행→재수정 루프로 안정화했다. 최종적으로 개별 `admin-post-cud`, `admin-program-mgmt`가 통과했고, 전체 `all` suite도 통과했다.

## 반영 내용
| 파일 | 내용 |
|---|---|
| `tests/qa/utils/auth.ts` | 확인 모달 클릭 후 모달이 사라질 때까지 대기해 저장/삭제 완료 전 다음 단계로 넘어가지 않도록 보강 |
| `tests/qa/admin-post-cud.spec.ts` | 게시물 생성 후 실제 row 출현까지 대기, 행사 날짜 입력은 실제 UI에 있을 때만 optional 처리, 검색/수정/삭제 row locator를 제목 기준 ancestor로 좁힘 |
| `tests/qa/admin-program-mgmt.spec.ts` | `전문가 등록` 중복 텍스트 strict 오류 제거, 컨설턴트 필수 필드 입력 추가, 카드 내부 삭제 버튼 locator 보강, Founder's Club 설명 필드를 실제 input placeholder에 맞춤 |

## GitHub Actions 결과
- `admin-post-cud` run #6 (`25985775845`) ✅
- `admin-program-mgmt` run #8 (`25985853314`) ✅
- `all` run #9 (`25985892912`) ✅

## 검증 결과
- `QA_ADMIN_EMAIL=qa@example.com QA_ADMIN_PASSWORD=password QA_ADMIN_MFA_SECRET=... npx playwright test --list` ✅
- `npm run validate` ✅

---

# RESULT: QA 수동 실행 Visible 모드 추가 (2026-05-17)

## 현재 상태
아키텍처 앱 `Ops` 탭에서 QA suite를 실행할 때 두 가지 경로를 선택할 수 있다.

- `GitHub 실행`: 기존처럼 `qa-dispatch.yml`을 workflow_dispatch로 호출해 백그라운드에서 실행한다.
- `로컬 Visible 실행`: 현재 Mac의 iTerm/Terminal을 열고 `npx playwright test ... --headed --project=chromium`을 실행해 Chromium 브라우저 진행 화면을 직접 볼 수 있다.

로컬 Visible 실행은 QA 비밀값을 앱에 저장하지 않는다. 저장소 루트의 `.env.qa` 또는 shell env에 `QA_ADMIN_EMAIL`, `QA_ADMIN_PASSWORD`, `QA_ADMIN_MFA_SECRET`가 있어야 하며, 누락되면 열린 Terminal에서 누락 변수명을 보여주고 종료한다.

방금 실패한 GitHub QA에 대해서는 로컬 환경에 GitHub token과 `QA_ADMIN_*` env가 없어 run 상세 로그를 직접 조회하지 못했다. 대신 `qa-dispatch.yml`에 `Check QA secrets` preflight를 추가해, GitHub Secrets 누락이면 Playwright 진입 전에 어떤 secret이 빠졌는지 Actions 로그에 명확히 표시되도록 했다.

## 변경 파일
| 파일 | 내용 |
|---|---|
| `electron/main.cjs` | `qa:run-visible` IPC 추가. suite allowlist 검증 후 iTerm/Terminal에서 headed Playwright 명령 실행 |
| `electron/preload.cjs` | renderer bridge에 `runVisibleQa(suite)` 추가 |
| `src/app/components/admin/LiveArchitectureMap.tsx` | Ops 탭에 `GitHub 실행` / `로컬 Visible 실행` 버튼 분리, visible 실행 상태/오류 메시지 추가 |
| `.github/workflows/qa-dispatch.yml` | `Check QA secrets` preflight 추가 |
| `CODEX_QA.md`, `PLAN.md` | Visible QA 운영 방식과 검증 결과 반영 |

## 검증 결과
- `node --check electron/main.cjs && node --check electron/preload.cjs` ✅
- `ruby -e 'require "yaml"; YAML.load_file(".github/workflows/qa-dispatch.yml")'` ✅
- `QA_ADMIN_EMAIL=qa@example.com QA_ADMIN_PASSWORD=password QA_ADMIN_MFA_SECRET=... npx playwright test --list` ✅
- `npm run validate` ✅
- `npm run map:build` ✅
- `npm run app:pack` ✅

---

# RESULT: QA 자동화 고도화 및 On-Demand 실행 환경 구축 (2026-05-17)

## 현재 상태
cron 기반 daily QA를 제거하고, 아키텍처 앱 `Ops` 탭에서 원하는 QA suite를 직접 선택 실행하는 On-Demand QA 구조로 전환했다. GitHub Actions workflow는 `qa-dispatch.yml`로 바뀌었고, `workflow_dispatch.test_suite`는 `smoke`, `admin-auth`, `admin-post-cud`, `admin-program-mgmt`, `all` 허용값만 받는다.

Playwright 테스트는 공통 인증 유틸을 사용하도록 분리했고, 기존 MFA TOTP 값 로그 출력은 제거했다. 관리자 CUD 테스트는 `QA_E2E_<runId>_...` prefix를 사용하며, 생성한 테스트 데이터만 정리하는 경로를 포함한다.

## 변경 파일
| 파일 | 내용 |
|---|---|
| `.github/workflows/qa-dispatch.yml` | 신규 On-Demand QA workflow. `test_suite` choice input으로 suite별 Playwright spec 실행 |
| `.github/workflows/daily-qa.yml` | cron 기반 daily workflow 제거 |
| `tests/qa/utils/auth.ts` | 관리자 로그인/MFA/로그아웃 공통 유틸, `QA_E2E` title helper 추가 |
| `tests/qa/admin-auth.spec.ts` | 관리자 로그인, MFA, 로그아웃, 권한 가드 suite |
| `tests/qa/admin-complex.spec.ts` | 경량 smoke/visual suite로 축소 |
| `tests/qa/admin-post-cud.spec.ts` | 공지/뉴스/행사/미디어 게시물 생성/수정/삭제 suite |
| `tests/qa/admin-program-mgmt.spec.ts` | 컨설팅/Founders Club 관리 CUD 기본 suite |
| `electron/main.cjs`, `electron/preload.cjs` | `qa-dispatch.yml` dispatch, suite allowlist, suite metadata 반환 |
| `src/app/components/admin/LiveArchitectureMap.tsx` | Ops 탭 suite 선택 UI, trigger payload, Alerts/Incident Feed suite 표시 |
| `CODEX_QA.md`, `docs/AGENT_RULES.md`, `PLAN.md` | On-Demand QA 운영 규칙과 검증 결과 반영 |

## 검증 결과
- `npm run validate` ✅
- `npm run map:build` ✅
- `npm run app:pack` ✅
- `npx playwright test tests/qa/production-smoke.spec.ts` ✅
- `QA_ADMIN_EMAIL=qa@example.com QA_ADMIN_PASSWORD=password QA_ADMIN_MFA_SECRET=... npx playwright test --list` ✅

## 비고
- 로컬 셸에 실제 `QA_ADMIN_*` 값이 없어 관리자 인증/CUD suite의 실주행은 수행하지 않았다. GitHub Secrets 또는 로컬 환경 변수 연결 후 아키텍처 앱 `Ops` 탭에서 suite별 실행이 필요하다.

---

# RESULT: 아키텍처 맵 앱 고도화 1차 — Incident Feed + 구조 Diff (2026-05-17)

## 현재 상태
아키텍처 맵 앱의 기본 Map 사이드바에 통합 `Incident Feed`를 추가했다. 이제 열린 `error_issues`, 실패/진행 중인 QA workflow run, 실패/대기/진행 중인 블로그 동기화 run을 한 피드에서 볼 수 있고, 항목별로 관련 노드 또는 GitHub workflow/run 링크로 바로 이동할 수 있다.

구조 새로고침(`map:refresh`) 전후 또는 로컬에 저장된 직전 스냅샷 대비 `architectureMap.json` 변화도 표시한다. 노드/간선 추가·삭제, DEAD 코드 증감, cluster별 노드 수 변화를 Map 사이드바에서 바로 확인할 수 있다.

## 변경 파일
| 파일 | 내용 |
|---|---|
| `src/app/components/admin/LiveArchitectureMap.tsx` | Incident Feed 데이터 정규화, 구조 diff 상태/스냅샷 저장, Map 사이드바 통합, `MapDiffSummary` 추가 |
| `src/app/components/admin/architecture/IncidentFeed.tsx` | error issue/QA/blog sync를 공통 카드로 보여주는 신규 컴포넌트 |
| `src/app/components/admin/architecture/mapDiff.ts` | `ArchitectureMap` 스냅샷 비교 헬퍼. 노드/간선/DEAD/cluster 변화량 계산 |
| `PLAN.md` | 승인 계획을 `[Done]`으로 축약하고 완료 항목 10개 유지 규칙에 맞춰 오래된 완료 항목 2개 정리 |

## 검증 결과
- `npm run validate` ✅
- `npm run map:build` ✅
- `npm run app:pack` ✅

---

# RESULT: QA 자동화 고도화 및 On-Demand 실행 환경 구축 계획 수립 (2026-05-17)

## 현재 상태
기존 QA 시스템의 허점(단일 블록화, 공통 로직 부재, 표면적 검증)을 분석하고, 이를 개선하기 위한 **원자적(Atomic) 테스트 분리** 및 **아키텍처 앱 연동 On-Demand 실행** 전략을 수립하여 `PLAN.md`에 반영했다. 사용자의 요청에 따라 이번 세션에서는 직접적인 코드 수정 없이 **연구 및 계획 수립**만 수행했다.

## 수립된 계획 요약
1. **인증 로직 분리**: `tests/qa/utils/auth.ts`를 신설하여 MFA 포함 로그인/로그아웃 로직을 공통화.
2. **Atomic CUD 테스트**: `admin-post-cud.spec.ts`, `admin-program-mgmt.spec.ts`를 신규 작성하여 실제 데이터 생성~삭제 풀 사이클 검증.
3. **On-Demand 실행 환경**: GitHub Actions의 `cron`을 제거하고 `workflow_dispatch` 파라미터를 추가하여, 아키텍처 앱 `Ops` 탭 UI에서 원하는 테스트만 골라 실행할 수 있도록 연동.

## 변경 파일
| 파일 | 내용 |
|---|---|
| `PLAN.md` | QA 고도화 및 On-Demand 실행 환경 구축 계획 추가 |

## 검증 결과
- `PLAN.md` 업데이트 완료 ✅
- 직접적인 소스 코드 수정 없음 ✅

---

# RESULT: Realtime CHANNEL_ERROR 수정 + 에러 source 정확도 개선 (2026-05-17)

## 현재 상태
Supabase Realtime 구독 실패(CHANNEL_ERROR/TIMED_OUT) 시 자동 재연결 로직을 추가했고, `LiveArchitectureMap`에서 발생하는 에러 source를 `"admin-page"`에서 `"architecture-map"`으로 정정했다. Electron 앱 재빌드 완료.

## 변경 파일
| 파일 | 내용 |
|---|---|
| `src/app/components/admin/LiveArchitectureMap.tsx` | issuesChannel/logsChannel 모두 CHANNEL_ERROR·TIMED_OUT 시 exponential backoff(2→4→8→16→32초) 최대 5회 재연결. 5회 소진 후에만 로그 기록. logsChannel에 누락된 에러 핸들러 추가. 6곳의 source `"admin-page"` → `"architecture-map"` 변경. |
| `src/lib/errorLogger.ts` | `NodeId` 타입에 `"architecture-map"` 추가. `FILENAME_TO_NODE`에 `LiveArchitectureMap` → `"architecture-map"` 매핑 추가. |

## 검증 결과
- `npm run validate` ✅
- `npm run app:pack` ✅

---

# RESULT: 아키텍처 맵 DEAD 판정 정밀화 + 안전한 미사용 파일 정리 (2026-05-15)

## 현재 상태
아키텍처 맵의 `DEAD 코드` 판정이 단순 top-level import 기준에서 벗어나 nested dynamic import, Supabase Edge Function 문자열 호출, 아키텍처 앱 별도 entry를 반영한다. 재생성 결과 기존 DEAD 63개가 41개로 줄었고, 실제 미사용으로 확인된 레거시 컴포넌트 4개만 삭제했다. 삭제 후 최종 맵은 162 nodes / 468 edges / DEAD 37개다.

## 변경 파일
| 파일 | 내용 |
|---|---|
| `scripts/generate-architecture-map.mjs` | AST 순회를 재귀 방식으로 바꿔 `React.lazy(() => import(...))` 같은 nested dynamic import를 탐지한다. `supabase.functions.invoke("...")` 호출을 해당 `supabase/functions/<name>/index.ts` 노드와 `api` edge로 연결하고, `src/architecture/main.tsx`를 별도 entry로 보호한다. |
| `src/generated/architectureMap.json` | 새 생성기 기준으로 맵 데이터를 재생성했다. |
| `src/app/components/FoundersClubCalendarWidget.tsx` | 현재 import/entry 없음, 과거 홈에서 제거된 레거시 컴포넌트라 삭제했다. |
| `src/app/components/NoticeSection.tsx` | 현재 홈은 `NoticeResourceSection`을 사용하므로 삭제했다. |
| `src/app/components/ResourceSection.tsx` | 현재 홈은 `NoticeResourceSection`을 사용하므로 삭제했다. |
| `src/app/components/figma/ImageWithFallback.tsx` | 현재 import가 없는 Figma 잔여 컴포넌트라 삭제했다. |
| `docs/AGENT_RULES.md`, `docs/AGENT_ANTI_PATTERNS.md`, `.gemini_prompts/maker_feature.md` | `DEAD 코드`는 삭제 승인 신호가 아니라 정적 힌트라는 운영 규칙을 추가했다. |

## 남긴 항목
- `AdminFlowMap.tsx`: 현재 import는 없지만 문서상 private architecture-map surface로 언급되어 있어 이번 정리에서는 보존했다.
- 미사용 shadcn UI primitive: 디자인 시스템 예비 부품일 수 있어 일괄 삭제하지 않았다.
- `encrypt-profile`, `reset-user-mfa`: 현재 직접 호출 흔적은 약하지만 Edge Function은 배포/외부 호출 영향이 있어 별도 확인 대상으로 남겼다.

## 검증 결과
- `node scripts/generate-architecture-map.mjs` ✅
- `npm run validate` ✅
- `npm run map:build` ✅
- `npm run app:pack` ✅

---

# RESULT: 아키텍처 앱 Alerts/Ops 재구성 + QA 수동 실행 추가 (2026-05-15)

## 현재 상태
아키텍처 앱에서 `QA Alerts`를 `Alerts`로 확장하고, `QA`와 `블로그 동기화` 소식을 각각 메일형 인박스로 분리해 볼 수 있게 했다. `Ops` 탭에는 `QA 실행`과 `블로그 동기화 실행`을 함께 배치했다.

## 변경 파일
| 파일 | 내용 |
|---|---|
| `src/app/components/admin/LiveArchitectureMap.tsx` | 탭 구조를 `Map / Alerts / Ops`로 재구성했다. `Alerts` 안에 `QA`와 `블로그 동기화` 인박스를 분리했고, 둘 다 read/unread, 선택, 숨김(삭제) UX를 지원한다. 블로그 쪽은 `blog_import_runs`의 `status`, `discovered_count`, `inserted_count`, `updated_count`, `skipped_count`, `failed_count`, `error`를 사용해 메일형 요약 카드를 만든다. `Ops`에는 `QA 실행`과 `블로그 동기화 실행` 버튼을 함께 배치했다. |
| `electron/main.cjs` | GitHub Actions `daily-qa.yml`에 `workflow_dispatch` POST를 보내는 `qa:trigger-run` IPC를 추가하고, 기존 GitHub token/fallback env 경로를 재사용하도록 했다. |
| `electron/preload.cjs` | renderer bridge에 `triggerQaRun()` 추가 |
| `docs/AGENT_RULES.md` | 아키텍처 앱의 `Alerts`/`Ops` 역할 분리와 QA 수동 실행 workflow 정책 추가 |
| `docs/AGENT_ANTI_PATTERNS.md` | Electron IPC 결과 union narrowing을 명시 비교로 처리하라는 재발 방지 항목 추가 |
| `PLAN.md` | 승인 계획 완료 반영 및 완료 항목 개수 정리 |

## 동작 정책
- `Alerts`는 결과/상태를 보는 곳이고, `Ops`는 수동 작업을 실행하는 곳이다.
- QA Alerts는 GitHub Actions 원본 run을 삭제하지 않고 앱 로컬 read/hidden 상태만 관리한다.
- 블로그 Alerts도 `blog_import_runs` 원본 기록을 삭제하지 않고 앱 로컬 read/hidden 상태만 관리한다.
- QA 수동 실행은 GitHub `daily-qa.yml`을 `main` ref로 dispatch 한다.
- 블로그 수동 실행은 계속 `sync-naver-blog` Edge Function만 호출하며, admin+AAL2 검증과 `blog_import_runs` 기록, `GITHUB_PAT` 기반 workflow_dispatch/fallback 정책을 유지한다.

## 검증 결과
- `npm run validate` ✅
- `npm run map:build` ✅
- `npm run app:pack` ✅
- UI smoke: 별도 클릭 검증은 생략. 대신 architecture 번들 빌드와 패키징 앱 생성까지 확인했다.

---

# RESULT: 아키텍처 앱 수동 블로그 동기화 버튼 추가 (2026-05-15)

## 현재 상태
아키텍처 앱에서 수동으로 Naver 블로그 동기화 작업을 큐잉하고 GitHub Actions dispatch까지 요청할 수 있게 했다.

## 변경 파일
| 파일 | 내용 |
|---|---|
| `src/app/components/admin/LiveArchitectureMap.tsx` | 오른쪽 패널에 `Ops` 탭 추가. `블로그 동기화 실행` 버튼이 `sync-naver-blog` Edge Function을 호출하고, run id/status/source/생성 시각 및 GitHub Actions dispatch 결과를 표시한다. |
| `docs/AGENT_RULES.md` | 아키텍처 앱 수동 블로그 동기화는 GitHub Actions API 직접 호출이 아니라 Edge Function 경로를 사용한다는 운영 규칙 추가 |
| `docs/AGENT_ANTI_PATTERNS.md` | telemetry source에는 `NodeId` union에 등록된 값만 사용한다는 재발 방지 항목 추가 |
| `.gemini_prompts/maker_feature.md` | 기능 구현 메이커 지침에 아키텍처 앱 운영 버튼 경계 추가 |
| `PLAN.md` | 승인 계획을 완료 항목으로 축약하고 오래된 완료 항목 2개 정리 |

## 동작 정책
- 버튼은 `supabase.functions.invoke("sync-naver-blog", { body: { triggerSource: "manual" } })`만 호출한다.
- admin+AAL2 권한 검증, `blog_import_runs` 실행 기록, `GITHUB_PAT` 기반 workflow_dispatch/fallback 정책은 기존 관리자 화면과 동일하게 보존된다.
- GitHub Actions 원본 기록은 삭제하거나 수정하지 않는다.

## 검증 결과
- `npm run validate` ✅
- `npm run map:build` ✅
- `npm run app:pack` ✅
- UI smoke: 별도 브라우저 클릭 검증은 생략. Electron 패키징 산출물 생성으로 앱 번들 포함 여부를 확인했다.

---

# RESULT: 아키텍처 앱 QA 알림 탭 추가 (2026-05-15)

## 현재 상태
아키텍처 앱에서 GitHub Actions `Daily Production QA` 실행 결과를 이메일형 인박스로 확인할 수 있게 했다.

## 변경 파일
| 파일 | 내용 |
|---|---|
| `electron/main.cjs` | GitHub Actions workflow runs/jobs API를 읽는 `qa:read-runs` IPC 추가. 실패 run은 실패 job/step 요약까지 가져온다. 앱 내 토큰 저장/상태/해제 IPC도 추가했다. |
| `electron/preload.cjs` | `readQaRuns()`, `getGithubTokenStatus()`, `saveGithubToken()`, `clearGithubToken()` bridge 추가 |
| `src/app/components/admin/LiveArchitectureMap.tsx` | 오른쪽 패널에 `Map`/`QA Alerts` 탭 추가. QA 인박스는 GitHub 토큰 연결 UI, read/unread, 개별 선택, 전체 선택, 읽음 처리, 선택 삭제, 전체 삭제, GitHub 실행 링크 열기를 지원한다. |
| `PLAN.md` | 완료 항목 반영 |

## 동작 정책
- 삭제는 앱 인박스에서만 숨김 처리한다.
- GitHub Actions 원본 실행 기록은 삭제하지 않는다.
- 비공개 저장소 API 접근용 GitHub 토큰은 앱 안에서 입력해 연결할 수 있으며, Electron `userData` 경로에 로컬 저장된다.
- 환경 변수 `GXP_GITHUB_TOKEN`, `GITHUB_TOKEN`, `GH_TOKEN`도 fallback으로 계속 지원한다.

## 검증 결과
- `npm run validate` ✅
- `npm run map:build` ✅
- `npm run app:pack` ✅

---

# RESULT: 자동 QA 자격 증명 env/secrets 분리 (2026-05-15)

## 현재 상태
자동 QA 관련 코드와 문서에서 평문 QA 계정/비밀번호/MFA 시크릿을 제거하고, 로컬 셸 환경 변수 및 GitHub Actions Secrets 기반 주입 구조로 전환했다.

## 변경 파일
| 파일 | 내용 |
|---|---|
| `tests/qa/admin-complex.spec.ts` | `QA_ADMIN_EMAIL`, `QA_ADMIN_PASSWORD`, `QA_ADMIN_MFA_SECRET` 필수 환경 변수 로더 추가 |
| `.github/workflows/daily-qa.yml` | Playwright 실행 단계에 GitHub Secrets 기반 `QA_ADMIN_*` env 주입 추가 |
| `scripts/diag-admin-ui.mjs` | 관리자 로그인/MFA 진단 스크립트를 `QA_ADMIN_*` env 기반으로 전환 |
| `scripts/diag-mfa.mjs` | MFA 진단 스크립트를 `QA_ADMIN_*` env 기반으로 전환하고 현재 TOTP preview 로그 추가 |
| `CODEX_QA.md` | 평문 계정/시크릿 제거, `QA_ADMIN_*` / `QA_USER_*` 변수명과 GitHub Secrets 운영 절차 명시 |
| `docs/AGENT_RULES.md` | QA 자동화 자격 증명은 저장소 하드코딩이 아니라 env/secrets로만 주입한다는 규칙 추가 |
| `.gemini_prompts/maker_feature.md` | 기능 구현 프롬프트에 QA 비밀값 경계 규칙 추가 |

## 검증 결과
- `npm run validate` ✅
- `npx playwright test tests/qa/admin-complex.spec.ts` ✅

## 비고
- 현재 로컬 셸에는 `QA_ADMIN_*` / `QA_USER_*` 환경 변수가 기본 설정되어 있지 않아, 이번 검증은 동일 변수명을 런타임 주입하는 방식으로 수행했다.
- GitHub Actions 원격 실행이 실제로 통과하려면 저장소 Secrets에 `QA_ADMIN_EMAIL`, `QA_ADMIN_PASSWORD`, `QA_ADMIN_MFA_SECRET`가 등록되어 있어야 한다.

---

# RESULT: 24시간 자동 QA 시스템 로그아웃 단계 안정화 (2026-05-15)

## 현재 상태
관리자 Playwright 통합 QA의 마지막 로그아웃/권한 가드 단계가 현재 운영 UI와 일치하도록 안정화되었다.

## 변경 파일
| 파일 | 내용 |
|---|---|
| `tests/qa/admin-complex.spec.ts` | 로그아웃 검증을 `text=` 기반 탐색에서 헤더 `banner`/모바일 메뉴 `dialog`의 role 기반 링크 탐색으로 교체하고, 로그아웃 후 `/` 복귀 및 `/admin` 재진입 시 홈 리다이렉트 검증으로 보정 |

## 검증 결과
- `npx playwright test tests/qa/admin-complex.spec.ts` ✅
- `npm run validate` ✅

---

# RESULT: 24시간 자동 QA 시스템 (Playwright + GitHub Actions) 구축 (2026-05-15)

## 현재 상태
운영 사이트(`https://google-play-changgoo-program.netlify.app`)를 대상으로 매일 24시간 자동 감시를 수행하는 Playwright 기반 E2E 테스트 환경과 GitHub Actions 워크플로우를 구축했다.

## 기술적 성과
1. **관리자 로그인 및 MFA 자동화 완수**:
   - `otplib` 라이브러리의 `generateSync`를 활용하여 `CODEX_QA.md`에 명시된 시크릿 키 기반 6자리 TOTP를 실시간으로 생성.
   - `input-otp` 컴포넌트의 특이성을 파악하여, `page.fill`과 `dispatchEvent('input')` 조합으로 키보드 이벤트 강제 트리거.
   - '인증 및 로그인' 버튼 활성화를 이끌어내어 2단계 인증의 모든 관문을 통과했다.
2. **실제 운영 UI 기반 셀렉터 정밀 보정**:
   - 관리자 대시보드 진입 후 사이드바 네비게이션을 정확히 뚫어내고, 게시물 관리 화면의 '카테고리 필터 탭'을 조작하는 로직으로 고도화.
   - 시각적 무결성 점검 시, 렌더링 지연 및 카테고리 전환 충돌을 방지하기 위한 `waitForTimeout` 및 `isVisible` 조건 보완.
3. **충돌 방지 및 안전성 확보**:
   - 단일 관리자 계정(`qa@test.com`)을 사용하는 특성상, 세션 충돌을 막기 위해 `playwright.config.ts`의 `fullyParallel`을 `false`로 지정.
   - 글로벌 타임아웃을 60초로 확장하고 `actionTimeout` 등 세부 대기 시간을 넉넉하게 부여.

## 변경 파일
| 파일 | 내용 |
|---|---|
| `playwright.config.ts` | 초기화, 운영 사이트 `baseURL` 지정, 순차 실행(`workers: 1`) 및 60초 타임아웃 설정 |
| `.github/workflows/daily-qa.yml` | 매일 00:00 UTC (한국 아침 9시) 자동 실행 로봇 배치, `playwright-report` 아티팩트 보관 |
| `tests/qa/production-smoke.spec.ts` | 메인 페이지, 주요 메뉴 접근, 로그인 폼 노출 기초 검증 (Smoke Test) |
| `tests/qa/admin-complex.spec.ts` | 풀 사이클 검증: [로그인 → MFA 생성/주입 → 게시물 카테고리별 에디터 무결성 → 로그아웃 검증] 통합 |

## 검증 결과
- `npx playwright test tests/qa/admin-complex.spec.ts` 로컬 실행 완벽 통과 ✅
- 로그인 버튼 클릭 → MFA 화면 진입 → OTP 토큰 정상 생성(`generateSync`) 및 입력 → 대시보드 진입 확인 ✅

# RESULT: 아키텍처 맵 앱 — 로그인 오버레이 + 구조 새로고침 버튼 (2026-05-15)

## 현재 상태
Electron 아키텍처 맵 앱에 admin+AAL2 로그인 오버레이와 런타임 구조 새로고침 버튼을 추가했다.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `src/architecture/main.tsx` | 전체 재작성 — login→OTP→checkAdmin→ready 플로우, 다크 글래스카드 디자인, `InputOTP` 컴포넌트 |
| `electron/main.cjs` | `map:read-data` / `map:refresh` IPC 핸들러 추가; refresh는 `/bin/zsh -l -c "node ..."` 로그인 셸 사용 |
| `electron/preload.cjs` | `readMapData` / `refreshMap` contextBridge 노출 |
| `src/app/components/admin/LiveArchitectureMap.tsx` | `mapData` → React state 전환, 마운트 시 IPC로 JSON 로드, 새로고침 버튼 UI(idle/loading/ok/error) |
| `vite.architecture.config.ts` | 함수형 defineConfig로 전환, `server.port: 5175` 고정, `base: "./"` 빌드 전용 |
| `package.json` | `map:dev` 스크립트에 `--config vite.architecture.config.ts` 추가 |

## 검증 결과
- `npm run app:build` ✅ — Vite 빌드 + electron-builder 패키징 완료
- 패키징된 앱에서 로그인 오버레이 표시 확인 ✅
- 세션 캐시 시 로그인 스킵 정상 동작 ✅
- 구조 새로고침 버튼 패키징 앱에서 성공 ✅

---

# RESULT: 에러 로그 시스템 PII 보호 및 구조 고도화 (2026-05-15)

## 현재 상태
에러 로그 파이프라인 전체에 PII 격리 계층을 추가하고, explainError 로직을 별도 파일로 분리했다.

## 변경 파일

| 파일 | 변경 |
|---|---|
| `src/lib/errorLogger.ts` | `maskPii()` 추가 (클라이언트 1차 방어), `supabase.rpc()` → `supabase.functions.invoke("log-client-error")` 전환 |
| `src/lib/errorExplainer.ts` | **신규** — `explainError()` 추출, 최소 인터페이스(ExplainInput/NodeLabel) 정의 |
| `supabase/functions/log-client-error/index.ts` | **신규** — 서버측 2차 마스킹 + AES-256-GCM(enc:v1) 암호화, `build_id`/`source_location` 평문 유지, 사용자 JWT 포워딩으로 RPC rate-limit/dedup 보존 |
| `supabase/functions/decrypt-error-logs/index.ts` | **신규** — `requireVerifiedAdmin({ requireAal2: true })` 게이트, `_enc` 복호화 후 반환, `type: "logs"|"issues"` 분기 |
| `src/app/components/admin/LiveArchitectureMap.tsx` | `fetchLogs` → `decrypt-error-logs` EF 호출로 전환, `explainError` 인라인 정의 제거 → import (1312→1237줄) |

## 보안 데이터 흐름

```
[브라우저] options.context
  → maskPii() 1차 마스킹
  → supabase.functions.invoke("log-client-error")
    → [EF] maskPii() 2차 마스킹
    → build_id, source_location 평문 분리
    → 나머지 키 AES-256-GCM 암호화 → _enc
    → log_client_error RPC (dedup/rate-limit 보존)
    → DB: {build_id, source_location, _enc: "enc:v1:..."}

[Electron 맵 앱 — AAL2 세션]
  → supabase.functions.invoke("decrypt-error-logs")
    → requireVerifiedAdmin({ requireAal2: true }) ✓
    → service role로 DB 조회
    → _enc 복호화
    → 복호화된 context 반환
```

## 검증 결과
- `[성공]` `npm run validate` — TypeScript 오류 없음, 빌드(1848 모듈) ✅, 시크릿 스캔 ✅

## 잔여 사항
- `_shared/errorLogger.ts`(Edge Function 내부용) — 현재 PII 위험 낮으나 동일 패턴 적용 가능
- `LiveArchitectureMap` Realtime 구독: 신규 삽입 시 context에 `_enc`가 보임 (message/stack/source_location 전용 컬럼은 평문이므로 핵심 기능 영향 없음)
