# DEPLOY_WORKFLOW.md — 로컬 → 프로덕션

> 2단 환경 분리(테스트/프로덕션 격리)의 캐논 배포 절차. 사람·AI 공용. 세션마다 재설명 불필요.
> staging(클라우드 `bgnkxavrwdwtbgvdmbvr`)은 **2026-06-04 제거**됨 — EF 23개 중 2개만 배포된 껍데기라 유지비>실익. super admin 게이트는 local=prod 동일하고, staging 고유 실익(EF 콜드스타트 race)은 prod 직배포로 우회해 옴.

## 환경 2단

| 단계 | Supabase | 프론트 | 용도 |
|---|---|---|---|
| **로컬** | Docker `127.0.0.1:54321` (ref `Global_X_Pass`) | `npm run dev` | 자유 수정·파괴, 모든 EF 자동 serve |
| **프로덕션** | 클라우드 `yzbjvkifwinumytehxgf` | netlify(**수동 배포** — GitHub 자동빌드 연동 안 됨) | 라이브, 100사 |

스키마(86 마이그)·코드는 동일. **데이터·env 키·런타임 엣지는 다름.** 로컬 Docker는 `supabase/functions/`의 모든 EF를 자동 제공하므로 EF 동작도 로컬서 검증 가능.

> **⚠️ 로컬 제약 — prod 전용 secret 의존 EF는 로컬서 동작 불가.**
> `supabase/functions/.env`에 없는 secret을 쓰는 EF는 로컬(127.0.0.1)에서 실패한다(분리의 정상 동작, 버그 아님).
> 대표: **회사뉴스 크롤**(`trigger-company-news-crawl`) — `GITHUB_PAT`로 GitHub Actions(`company-news-crawl.yml`)를 디스패치하는데 PAT는 prod secret 전용. 로컬엔 없어 `dispatched:false` 또는 non-2xx.
> 분리 전엔 로컬 앱이 prod Supabase에 직결돼 prod의 PAT로 동작했으나, 분리 후 로컬 EF가 실행되며 깨진 것. **로컬서 굳이 돌리려면** `functions/.env`에 `GITHUB_PAT` 추가 + edge runtime 재기동이 필요하나, 디스패치 시 **실제 크롤이 prod 데이터에 실행**되니 권장 안 함 → prod 앱에서 확인할 것.

## 배포는 2개 트랙 (독립!)

1. **프론트 코드** → `npm run build` 후 **netlify 수동 배포**(대시보드 드래그드롭 또는 netlify CLI). ⚠️ GitHub `main` push 자동빌드 연동 **안 됨** — push만으론 라이브 미반영. `git push`는 코드 백업/히스토리용.
2. **DB 스키마(마이그)** → 수동, `npm run db:push:prod`. 자동 아님.

⚠️ **새 컬럼/정책 쓰는 코드를 push했는데 마이그를 프로덕션에 안 올리면 라이브가 깨진다. 마이그 먼저(또는 동시).**

## 절차

### 1) 로컬 개발·검증
```bash
npm run db:start          # Docker 로컬 스택 (모든 EF 자동 serve)
npm run dev               # 코드 수정
# DB 변경 시: supabase/migrations/ 에 새 .sql 추가
npm run db:reset          # 86 마이그 from-scratch 재생 검증
npm run validate          # tsc+eslint+vitest+build+secret scan
# E2E QA(선택): npx playwright test  # webServer가 npm run preview(4173, local DB) 자동 기동
```

### 2) 프로덕션 배포 (네가 직접)
```bash
# (a) DB 먼저 — 가드가 ref 일치 + CONFIRM_PROD 강제(오발사 방지)
export SUPABASE_DB_URL_PROD="postgresql://postgres.yzbjvkifwinumytehxgf:<pw>@<host>:6543/postgres"
CONFIRM_PROD=yes npm run db:push:prod
# (b) 코드 — 빌드 후 netlify 수동 배포 (자동빌드 연동 없음)
npm run build                      # dist/ 생성. 로컬 빌드라 .env.production.local(prod URL) 로드
#   검증: grep supabase.co dist/assets/*.js  → prod 백엔드 가리키는지 확인
#   → netlify 대시보드 Deploys에 dist/ 드래그드롭, 또는: npx netlify deploy --prod --dir=dist
git push origin main              # 코드 백업·히스토리용 (자동배포 아님, 라이브 무관)
```

## 안전 가드 (`scripts/check-deploy-target.mjs`)

`db:push:prod`가 호출. 순수함수 `resolveDeployTarget`이 검증, 실패 시 push 미실행:
- DB URL은 셸 env로만(`SUPABASE_DB_URL_PROD`). 커밋 금지.
- URL의 ref가 타깃과 **불일치하면 차단**(prod 명령에 다른 프로젝트 URL 등 오발사 방지).
- 프로덕션은 `CONFIRM_PROD=yes` 명시 필수.
- 테스트: `node --test scripts/tests/checkDeployTarget.test.mjs`.

⚠️ supabase CLI는 현재 **프로덕션에 link**됨(`supabase/.temp/project-ref` = `yzbjvkifwinumytehxgf`). 그래서 `db:push:prod`는 link 대신 `--db-url`로 명시 타깃을 친다.

## 관련 메모리
[[project_local_supabase_isolation]] · [[project_supabase_migration_sync]]
