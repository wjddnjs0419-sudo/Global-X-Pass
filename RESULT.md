# RESULT: 테스트/프로덕션 분리 2단계 — 클라우드 staging 신설 — 2026-05-31

## 배경
1단계(로컬 Docker 격리, RESULT_ARCHIVE 참조) 위에 3단(로컬/staging/프로덕션) 중 **클라우드 staging** 신설. QA·머지 전 검증을 프로덕션(`yzbjvkifwinumytehxgf`) 대신 staging으로 돌려 100개 참여사 실데이터 오염 위험 제거. 프로덕션 DB 미접촉.

## 구현
- **staging 프로젝트**: Supabase MCP `create_project` → `bgnkxavrwdwtbgvdmbvr` (ap-northeast-1, 무료티어). 로컬 마이그 **82개 전부 적용**(끝줄 `fc_applications_insert_remove_self_ref_recursion`까지 로컬과 동일).
- **`.env.staging`**(gitignore 등록): staging URL + publishable anon만(비밀값 없음, service_role은 셸 env 전용).
- **`package.json`**: `dev:staging`/`build:staging`/`preview:staging` + `prebuild:staging` 가드.
- **`playwright.config.ts`**: 기본 baseURL을 `localhost:4173`(staging preview)으로, `webServer`가 로컬·CI 양쪽에서 `preview:staging` 자동 기동. `PW_BASE_URL` 지정 시 webServer 미기동(외부 staging/프로덕션 스모크용).
- **`.github/workflows/qa-dispatch.yml`**: test step에 staging public VITE env(URL/anon) 주입 → CI가 PW_BASE_URL 없이 webServer+staging으로 자가완결 QA. 프로덕션 미접촉.

## Codex 어드버서리얼 리뷰 (2라운드)
- **1차**: FAIL 2(기본 baseURL flip이 CI·배포타깃 스펙을 존재하지 않는 로컬로 silent 전환) + WARN 1(build:staging/preview:staging 빌드가드 미발화).
- **수정**: webServer 자동기동(localhost를 실존 타깃화) + CI에 staging env 주입 + prebuild:staging 가드 + preview:staging을 `npm run build:staging` 경유로.
- **2차**: FAIL 1(`PW_BASE_URL=''` 빈문자열에서 `!env`/`??` 혼용 분기 어긋남) → `?.trim()` + `||` 일관화 패치.
- **3차**: **FAIL 0 / PASS 4** ✅.

## 검증
- 빌드가드 3시나리오: 로컬 통과 / CI+staging 통과 / CI+localhost 차단(exit1) ✅.
- `playwright test --list`: 빈문자열·오버라이드 분기 모두 11스펙/9파일 수집 ✅.
- `package.json` JSON 유효 ✅.
- **전부 미커밋.**

## 후속
- staging 프론트엔드 배포 부재 → 현재 CI는 webServer로 로컬 빌드+서빙. 추후 staging 전용 netlify 배포 시 PW_BASE_URL로 외부 스모크 전환 가능.
- 남은 In Progress: 브라우저 E2E QA headed 실동작 검증(PLAN 참조).
