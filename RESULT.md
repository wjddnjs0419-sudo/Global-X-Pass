# RESULT: staging 환경 완전 제거 — local→prod 2단 분리 — 2026-06-04

## 배경
- staging(`npm run dev:staging`/`preview:staging`)에서 super admin(admin@test.com) 로그인 시 **MFA 토글 없이 마이페이지만 뜨고 /admin 이동 불가** 증상.
- 근본원인(코드추적+staging 실측): super admin은 `adminGate.ts:207` `bypassActive = is_active && !isSuperAdmin`로 우회 ON이어도 MFA 강제(영구락 방지 설계) → factor 없으면 mfaEnrolled=false → /mypage. 그런데 MyPage가 role을 `decrypt-own-profile` **EF**로 가져오는데 **staging엔 그 EF 미배포(404)** → `profile=null` → `profile?.role==="admin"` false → MFA 등록 섹션 통째 미렌더 → 데드락.
- 실측: staging EF = **2개**(toggle/get-state)뿐, prod = **23개** → **21개 누락**. staging은 사실상 껍데기. "prod 동일 환경"이라는 staging 본래 가치를 못 살리고, super 게이트는 어차피 local=prod 동일. 유지비(EF21+secret+마이그+이중배포)>실익 → **B안: staging 제거** 결정.

## 구현
- **scripts/check-deploy-target.mjs**: `STAGING_REF`·`TARGETS.staging` 제거, prod 전용. 에러 "prod 만 지원". ref검증·CONFIRM_PROD·extractProjectRef 보안가드 전부 유지.
- **scripts/tests/checkDeployTarget.test.mjs**: staging 케이스 제거, prod 전용 **13테스트** 재작성. 보안 우회 케이스(query/fragment/host) 전부 prod로 이전 + "staging 타깃→'알 수 없는 배포 타깃' throw" 검증 추가. TDD RED→GREEN.
- **package.json**: `dev:staging`·`prebuild:staging`·`build:staging`·`preview:staging`·`db:push:staging` 5개 제거, local `preview`(`npm run build && vite preview --port 4173`) 추가(playwright용).
- **playwright.config.ts**: webServer `preview:staging`→`preview`(local Docker DB). 주석에 `db:start` 선행조건 명시.
- **.env.staging**: 삭제.
- **.github/workflows/qa-dispatch.yml**: 삭제(staging 백엔드 의존). tests/qa/*.spec.ts는 보존(로컬 수동 실행 가능).
- **docs/DEPLOY_WORKFLOW.md**: 3단→2단(local→prod) 재작성.
- **원격 staging 프로젝트(bgnkxavrwdwtbgvdmbvr)**: 대시보드에서 사용자가 수동 삭제 완료.

## Verification Matrix
| Change Type | Required Extra Checks | Result |
|---|---|---|
| 배포 가드 축소(staging→prod전용) | 보안가드(ref검증/CONFIRM_PROD) 회귀 없음, cfg 없으면 throw | check-deploy-target 13테스트 통과 |
| 끊긴 참조(cross-file) | STAGING_REF/preview:staging/build:staging/db:push:staging 잔여 0 | grep 0 (테스트 throw-검증 케이스만 의도적) |
| 스크립트 체인 | `npm run preview`→build(prebuild가드 로컬통과)→vite preview 4173, playwright webServer·baseURL 매칭 | 정합 |
| Universal gate | `npm run validate` | 통과 (tsc, eslint 0warn, vitest, vite build, secret scan) |
| 코드 리뷰 | 내장 /code-review high (Codex는 환경문제로 불가→내장 대체) | **FAIL 0** (`[]`) |

## 교훈
- **원격 staging은 EF/secret/마이그를 prod와 계속 싱크해야 의미**가 있다. 2개만 배포된 껍데기 staging은 MyPage 같은 EF 의존 화면이 죄다 404로 깨져 오히려 디버깅 노이즈. local Docker는 모든 EF를 자동 serve하므로 EF 동작 검증엔 local이 우월하고, super admin 게이트처럼 순수 클라 로직은 local=prod 동일.
- staging 고유 실익(EF 콜드스타트 race)은 이전에도 prod 직배포로 우회해 와서 실사용<유지비였음 → 제거가 합리적.

## 비고
- Codex 리뷰는 `gpt-5.4 미지원`+토큰 stale로 2회 실패 → 사용자 승인 하에 내장 `/code-review`로 대체(FAIL 0).
- QA(playwright) 실행 시 `npm run db:start` 선행 필요(webServer가 local Docker 백엔드 기동). 주석 명시함.
