# RESULT: GitHub QA local-runner 복원 + Visible QA 사전 가드 — 2026-06-04

## 배경
- 제가 `staging 제거`와 `QA GitHub 표면 제거`를 혼동해 아키텍처 앱의 QA GitHub 실행/조회 흐름까지 걷어낸 상태가 됐다.
- 실제 의도는 `GitHub QA도 staging이 아니라 local backend 기준으로 돌린다`는 것이었고, 동시에 로컬 Visible QA에는 `db:start` 선행조건을 실패 전에 차단하는 가드가 필요했다.
- 목표는 **QA GitHub 표면을 복원하되 백엔드를 runner 내부 local Supabase로 전환**하고, **현재 Mac에서 돌리는 Visible QA에는 로컬 스택 preflight를 유지**하는 것이었다.

## 구현
- **아키텍처 앱 QA 표면 복원**: `LiveArchitectureMap`, `opsPipeline`, `ArchitectureInboxPanel`에서 QA GitHub run 조회, dispatch, Inbox QA 항목, workflow 링크를 다시 연결했다. QA 탭은 `GitHub 실행`과 `로컬 화면 실행`을 함께 제공하고, 문구는 `GitHub = runner local Supabase`, `로컬 = 현재 Mac headed 디버그`로 분리했다.
- **Electron QA 브리지 복원**: `electron/preload.cjs`, `electron/main.cjs`에 `readQaRuns`/`triggerQaRun` IPC와 `qa-dispatch.yml` GitHub API 경로를 다시 붙였다. GitHub token 저장 검증도 QA workflow 조회 기준으로 복원했다.
- **QA GitHub workflow 복원**: `.github/workflows/qa-dispatch.yml`을 다시 추가했다. 이제 workflow는 staging secret을 쓰지 않고, GitHub runner에서 `supabase start`를 통해 local stack을 부팅한 뒤 `supabase status -o env` 결과를 `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`로 주입해 Playwright preview를 실행한다.
- **CI local build 예외 추가**: `scripts/check-build-target.mjs`에 `ALLOW_LOCAL_BUILD_IN_CI=1` 우회 경로를 추가해, 일반 CI/Netlify 가드는 유지하면서도 QA runner의 local Supabase preview 빌드는 허용했다.
- **로컬 Visible QA 사전 가드 유지**: `runVisibleQaSuite()`의 `supabase status` preflight, `npm run db:start` 복구 안내, `.env.qa` 힌트 정정은 그대로 유지했다. 따라서 로컬 디버그 QA는 스택 미기동 시 Playwright를 시작하지 않고 먼저 막는다.
- **문서 정정**: `docs/AGENT_RULES.md`, `docs/CODEX_QA.md`, `PLAN.md`를 모두 “GitHub QA 제거”가 아니라 “GitHub QA local-runner 복원 + Visible QA preflight” 기준으로 정정했다.

## Verification Matrix
| Change Type | Required Extra Checks | Result |
|---|---|---|
| 아키텍처 앱 QA UI/IPC 복원 | preload/main/renderer 타입 정합, QA 버튼/인박스/props 연결 확인 | `npm run validate` 통과 |
| QA GitHub workflow 복원 | workflow 문법/runner local env 주입 확인 | `ruby -e 'require \"yaml\"; YAML.load_file(\".github/workflows/qa-dispatch.yml\")'` 통과 |
| 아키텍처 앱 전용 변경 | Electron/architecture 전용 번들 빌드 확인 | `npm run map:build` 통과 |
| Universal gate | 타입/린트/프로덕션 빌드 확인 | `npm run validate` 통과 |

## 교훈
- `staging 제거`와 `QA GitHub 표면 제거`를 같은 작업으로 취급하면 운영 표면을 과삭제하게 된다. QA 실행 위치와 QA 백엔드 대상을 분리해 판단해야 한다.
- 로컬 Visible QA는 디버그 편의 경로이고, GitHub QA는 재현 가능한 runner 경로다. 둘 중 하나를 정리할 때 다른 하나의 역할까지 지우지 말아야 한다.
