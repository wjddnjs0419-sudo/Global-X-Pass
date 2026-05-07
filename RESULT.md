# RESULT: 네이버 블로그 자동 동기화 1차 구현

## 실행일
2026-05-07

## 구현 요약
- Supabase에 블로그 import 실행 로그와 큐 상태를 저장하는 migration을 추가했다.
- `sync-naver-blog` Edge Function을 추가해 긴 크롤링을 직접 수행하지 않고 `blog_import_runs`에 queued run만 생성하도록 했다.
- 기존 Node importer에 `--process-queue` worker 모드를 추가했다. worker는 Naver 카테고리를 크롤링해 queue를 갱신하고, 승인된 항목만 실제 import한다.
- GitHub Actions workflow를 추가해 매일 03:00 KST에 `npm run blog:worker`를 실행할 수 있게 했다.

## 동작 방식
- `news` / `Around X-뉴스레터`: 새 글 발견 시 `approved`로 자동 큐잉되고 worker가 바로 import한다.
- `events-archive` / `★글로벌 기업 협업 프로그램`: 새 글 발견 시 기본 `pending`으로 남긴다. 행사 아카이브는 수동 태그가 필요하기 때문이다.
- 이미 이관된 글은 본문 앞 `GXP_BLOG_IMPORT_META.sourceUrl` 기준으로 감지해 queue status를 `imported`로 맞춘다.
- 실패한 항목은 `blog_import_queue.status = failed`와 `error`에 남고, run counter에도 반영된다.

## 수정 파일
- `supabase/migrations/20260507200000_blog_import_automation.sql`
  - `blog_import_runs`, `blog_import_queue` 테이블 추가
  - 관리자 전용 RLS 정책 추가
  - status/run_id 인덱스와 `updated_at` trigger 추가
- `supabase/functions/sync-naver-blog/index.ts`
  - `BLOG_SYNC_SECRET` 헤더 또는 관리자 인증으로 호출 가능
  - `blog_import_runs`에 queued run 생성 후 즉시 응답
- `supabase/functions/_shared/cors.ts`
  - `x-blog-sync-secret` CORS 허용 헤더 추가
- `scripts/import-blog-posts.mjs`
  - `--process-queue` / `--worker` 모드 추가
  - queued run 확인/생성, 카테고리 크롤링, queue upsert, approved row import, run counter 업데이트 구현
- `package.json`
  - `blog:worker` 스크립트 추가
- `.github/workflows/naver-blog-sync.yml`
  - 매일 18:00 UTC(한국 03:00) 자동 실행
  - `workflow_dispatch`에서 특정 `run_id` 수동 처리 가능

## 운영 준비
- GitHub repository secrets 필요:
  - `VITE_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
- Edge Function cron 호출까지 연결하려면 추가 설정 필요:
  - Supabase Function secret: `BLOG_SYNC_SECRET`
  - Supabase Vault secret: `project_url`, `blog_sync_secret` 또는 동일 목적의 secret
  - `pg_cron` + `pg_net`으로 `sync-naver-blog` 호출 job 생성
- 1차 운영은 GitHub Actions가 queued run이 없어도 worker run을 직접 생성하도록 되어 있어, Supabase cron 없이도 자동 sync가 가능하다.
- `sync-naver-blog` Edge Function은 배포 완료. 다만 secret 기반 cron 호출을 실제로 쓰려면 `BLOG_SYNC_SECRET` 설정이 아직 필요하다.

## 수동 명령
```bash
npm run blog:worker
npm run blog:worker -- --run-id <blog_import_runs.id>
npm run blog:sync
npm run blog:import:dry-run
```

## 검증 결과

- `node --check scripts/import-blog-posts.mjs` 성공
- `npm run validate` 성공 (TypeScript · ESLint · Vite production build 모두 통과)
- `npm run blog:import:dry-run` 성공: 32건 모두 `skip-existing`
- `supabase db push` 성공: `20260507200000_blog_import_automation.sql` remote 반영
- `supabase functions deploy sync-naver-blog` 성공
- `supabase migration list` 재확인: local/remote 모두 `20260507200000` 일치
- `npm run blog:worker` 성공:
  - 발견: `events-archive` 27건 + `news` 5건 = 32건
  - run: `success`, `discovered_count=32`, `failed_count=0`
  - queue 집계: `events-archive/imported=27`, `news/imported=5`

### 참고 경고
- Vite build에서 기존과 같은 `index` chunk 500kB 초과 경고가 출력되었으나 빌드는 성공했다.
- Supabase CLI 업데이트 안내(v2.95.4 → v2.98.2)가 출력되었으나 이번 작업과 무관하다.

## Verification Matrix

### 적용 대상
- Supabase schema/RLS: 신규 migration, 관리자 전용 RLS, service-role worker 경로
- Edge Function: CORS, 인증/secret, response shape
- Storage/upload: 기존 이미지 미러링 경로 재사용
- Documentation-only가 아닌 코드/스키마 변경: `npm run validate` 필수

### 생략/잔여 작업
- Supabase `pg_cron` job 생성은 아직 하지 않았다. 현재 1차 자동 실행은 GitHub Actions schedule 기준이다.
- `BLOG_SYNC_SECRET`은 값이 정해지지 않아 설정하지 않았다. Cron에서 Edge Function을 직접 호출하려면 secret 설정 후 Vault/cron SQL을 추가해야 한다.
