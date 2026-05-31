# DEPLOY_WORKFLOW.md — 로컬 → staging → 프로덕션

> 3단 환경 분리(테스트/프로덕션 격리)의 캐논 배포 절차. 사람·AI 공용. 세션마다 재설명 불필요.

## 환경 3단

| 단계 | Supabase | 프론트 | 용도 |
|---|---|---|---|
| **로컬** | Docker `127.0.0.1:54321` (ref `Global_X_Pass`) | `npm run dev` | 자유 수정·파괴 |
| **staging** | 클라우드 `bgnkxavrwdwtbgvdmbvr` (ap-northeast-1) | `npm run preview:staging` | 머지 전 QA |
| **프로덕션** | 클라우드 `yzbjvkifwinumytehxgf` | netlify(GitHub `main` 자동 빌드) | 라이브, 100사 |

스키마(82 마이그)·코드는 3단 동일. **데이터·env 키·런타임 엣지(Edge Functions 로컬 미serve 등)는 다름.**

## 배포는 2개 트랙 (독립!)

1. **프론트 코드** → `git push origin main` → netlify 자동 빌드(대시보드 env = 프로덕션 URL).
2. **DB 스키마(마이그)** → 수동, `npm run db:push:*`. 자동 아님.

⚠️ **새 컬럼/정책 쓰는 코드를 push했는데 마이그를 프로덕션에 안 올리면 라이브가 깨진다. 마이그 먼저(또는 동시).**

## 절차

### 1) 로컬 개발·검증
```bash
npm run db:start          # Docker 로컬 스택
npm run dev               # 코드 수정
# DB 변경 시: supabase/migrations/ 에 새 .sql 추가
npm run db:reset          # 82+신규 마이그 from-scratch 재생 검증
npm run validate          # tsc+eslint+vitest+build+secret scan
```

### 2) staging QA
```bash
# (a) staging에 마이그 적용 — DB URL은 셸 env로만(비밀)
export SUPABASE_DB_URL_STAGING="postgresql://postgres.bgnkxavrwdwtbgvdmbvr:<pw>@<host>:6543/postgres"
npm run db:push:staging
# (b) staging 백엔드로 E2E
npm run preview:staging   # 4173에 staging 빌드 서빙
npx playwright test       # webServer 자동 기동, staging 대상 QA
```

### 3) 프로덕션 배포 (네가 직접)
```bash
# (a) DB 먼저 — 가드가 ref 일치 + CONFIRM_PROD 강제(오발사 방지)
export SUPABASE_DB_URL_PROD="postgresql://postgres.yzbjvkifwinumytehxgf:<pw>@<host>:6543/postgres"
CONFIRM_PROD=yes npm run db:push:prod
# (b) 코드 — push하면 netlify 자동 배포
git push origin main
```

## 안전 가드 (`scripts/check-deploy-target.mjs`)

`db:push:staging` / `db:push:prod`가 호출. 순수함수 `resolveDeployTarget`이 검증, 실패 시 push 미실행:
- DB URL은 셸 env로만(`SUPABASE_DB_URL_STAGING` / `_PROD`). 커밋 금지.
- URL의 ref가 타깃과 **불일치하면 차단**(staging 명령에 프로덕션 URL 등 오발사 방지).
- 프로덕션은 `CONFIRM_PROD=yes` 명시 필수.
- 테스트: `node --test scripts/tests/checkDeployTarget.test.mjs` (7케이스).

⚠️ supabase CLI는 현재 **프로덕션에 link**됨(`supabase/.temp/project-ref` = `yzbjvkifwinumytehxgf`). 그래서 `db:push:*`는 link 대신 `--db-url`로 명시 타깃을 친다.

## 관련 메모리
[[project_local_supabase_isolation]] · [[project_supabase_migration_sync]]
