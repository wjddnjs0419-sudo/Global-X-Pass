# RESULT: 회사 뉴스 운영 관리 기능 추가 (2026-05-22)

## 현재 상태

기업 뉴스 수집/검토 흐름을 운영 가능한 형태로 보강했다. 수집량은 기본 회사당 5개로 낮췄고, `articles`는 최신 300개만 유지하도록 자동 정리한다. 관리자는 `/admin`의 `기업 뉴스 관리` 탭에서 터미널 없이 수집 실행, 기사 검색/필터링, 승인/거절/삭제를 처리할 수 있다. 뉴스 크롤링에서는 썸네일 수집과 표시를 제거하고 텍스트 메타데이터만 사용한다.

## 변경 내용

| 대상 | 변경 |
|---|---|
| `scripts/crawl-company-news.mjs` | `results_per_company` 기본값을 5로 낮춤. `--max-stored-articles`/`NEWS_MAX_STORED_ARTICLES` 지원 추가. 실수집 완료 후 `published_at DESC, created_at DESC` 기준 최신 300개 초과분 자동 삭제. 썸네일 fetch/mirror 로직 제거. |
| `.github/workflows/company-news-crawl.yml` | 기본 `results_per_company=5`, `max_stored_articles=300` 입력 추가 및 스크립트 인자 전달. 썸네일 입력 제거. |
| `supabase/functions/trigger-company-news-crawl/index.ts` | 관리자 권한 확인 후 GitHub Actions `company-news-crawl.yml`을 `workflow_dispatch`로 실행하는 Edge Function 추가. 브라우저에 Naver/API secret을 노출하지 않는다. 썸네일 입력 제거. |
| `src/app/components/admin/AdminCompanyNewsManagement.tsx` | 관리자 `기업 뉴스 관리` 화면 추가. 즉시 수집, 옵션 조정, 상태 필터, 검색, 20개 단위 페이지네이션, 승인/거절/대기 전환/삭제 제공. 썸네일 옵션 제거. |
| `src/app/pages/CompanyNewsPage.tsx` | 공개 기업 뉴스 카드를 썸네일 없는 텍스트형 카드로 정리. |
| `src/app/pages/AdminPage.tsx` | `company-news` lazy tab 추가. |
| `src/app/components/admin/AdminSidebar.tsx` | 콘텐츠 섹션에 `기업 뉴스 관리` 메뉴 추가. |
| `supabase/migrations/20260522103000_company_articles_retention.sql` | retention 정리용 `articles_published_created_idx` 추가, `articles` GRANT 명시. |
| `supabase/migrations/20260522110000_drop_company_article_thumbnails.sql` | 뉴스 기사 썸네일 컬럼 `articles.thumbnail_url` 제거. |

## 운영 기준

- 전체 저장 상한: 최신 300개
- 기본 자동/수동 수집: `batch_size=25`, `results_per_company=5`
- 공개 노출: 기존과 동일하게 `status = 'approved'`만 `/company-news`에 표시
- 직접 실행: `/admin` → `기업 뉴스 관리` → `즉시 수집`
- 썸네일: 수집/저장/표시하지 않음

## 검증 결과

- `npm run validate` ✅
- `npm run news:crawl:dry-run -- --batch-size 1 --results-per-company 1 --delay-ms 100 --max-stored-articles 300` ✅
- `supabase db push` ✅ (`20260522103000_company_articles_retention.sql` 원격 반영)
- `supabase functions deploy trigger-company-news-crawl` ✅

## 참고

- `즉시 수집` 버튼은 Edge Function이 GitHub Actions를 dispatch한다. Supabase 프로젝트 secret에 기존 블로그 동기화와 동일한 `GITHUB_PAT`가 있어야 성공한다.
- GitHub Actions 쪽에는 `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET` secrets가 필요하다.
