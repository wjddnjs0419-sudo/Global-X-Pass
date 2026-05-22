# RESULT: 기업 뉴스 관련성 필터 및 수집 데이터 초기화 (2026-05-22)

## 현재 상태

기업 뉴스 수집 파이프라인에 관련성 점수 기반 필터를 추가했다. 앞으로 신규 크롤링 기사는 회사명 중심 쿼리로 검색되고, 제목/요약에서 회사명 또는 `search_keywords`가 충분히 매칭된 경우에만 `articles`에 저장된다. 관리자 `기업 뉴스 관리`의 `승인 대기` 목록은 관련도 높은 기사부터 보여준다.

요청에 따라 기존 원격 수집 데이터도 초기화했다. `public.articles`에 있던 73건을 전부 삭제했고, `public.companies.last_crawled_at`이 있던 25개 회사는 `NULL`로 되돌렸다. 이제 다음 실제 수집은 같은 회사 목록을 새 관련도 필터 기준으로 처음부터 다시 처리한다.

## 변경 내용

| 대상 | 변경 |
|---|---|
| `scripts/utils/companyNewsRelevance.mjs` | 회사 뉴스 검색 쿼리 생성, 관련성 점수 계산, 통과 여부 판정 유틸 추가. 회사명 매칭은 강하게 인정하고, 회사명 없는 키워드-only 기사는 더 높은 기준을 요구한다. |
| `scripts/crawl-company-news.mjs` | 회사명 중심 검색 쿼리 사용, 기사별 `relevance_score`/`matched_terms`/`relevance_reason` 저장, 기준 미달 기사 저장 제외, accepted/rejected 로그 출력 추가. |
| `scripts/crawl-company-news.mjs` | `--min-relevance-score`, `--audit-existing-relevance`, `--apply-existing-relevance`, `--reject-low-relevance-existing`, `--existing-status`, `--existing-limit` 옵션 추가. 기존 기사 정리는 삭제 없이 audit/백필/명시적 rejected 처리로 분리했다. |
| `supabase/migrations/20260522123000_add_article_relevance_metadata.sql` | `articles.relevance_score`, `matched_terms`, `relevance_reason` 추가 및 `pending` 관련도 정렬 인덱스 추가. |
| `src/app/components/admin/AdminCompanyNewsManagement.tsx` | 즉시 수집 옵션에 `최소 관련도` 추가. `승인 대기` 기본 정렬을 `relevance_score DESC`, `published_at DESC`, `created_at DESC`로 변경. 기사 카드에 관련도와 매칭 키워드 표시. |
| `.github/workflows/company-news-crawl.yml` | `min_relevance_score` workflow input 추가 및 크롤러 인자 전달. |
| `supabase/functions/trigger-company-news-crawl/index.ts` | 관리자 즉시 수집 요청에서 `min_relevance_score`를 GitHub Actions로 전달. |
| `src/lib/types.ts` | `Article` 타입에 관련도 메타데이터 필드 추가. |
| `docs/AGENT_RULES.md`, `docs/AGENT_ANTI_PATTERNS.md`, `.gemini_prompts/maker_feature.md` | 기업 뉴스 관련도 게이트와 광범위 키워드 오탐 방지 규칙 문서화. |
| 원격 Supabase 데이터 | `articles` 73건 삭제, `companies.last_crawled_at` 25건 초기화. `companies` 자체와 다른 게시판/사용자 데이터는 수정하지 않음. |

## 운영 기준

- 기본 최소 관련도: `3`
- 회사명이 제목에 직접 나오면 높은 점수로 통과한다.
- 회사명 없이 키워드만 걸린 기사는 기본 기준보다 더 높은 점수를 요구한다.
- 기존 기사 상태는 자동 변경하지 않았다. 관련도 메타데이터만 백필했고, 낮은 관련도 항목을 거절하려면 `--reject-low-relevance-existing`를 명시해야 한다.

## 검증 결과

- `node --test scripts/tests/companyNewsRelevance.test.mjs` ✅
- `node --test scripts/tests/*.test.mjs` ✅
- `npx tsc --noEmit` ✅
- `npm run validate` ✅
- `npm run news:crawl:dry-run -- --batch-size 1 --results-per-company 5 --delay-ms 100 --max-stored-articles 300 --min-relevance-score 3` ✅
  - 예시 결과: 5개 검색 결과 중 1개 accepted, 4개 `rejectedByRelevance`
- `npm run news:crawl:dry-run -- --audit-existing-relevance --existing-status pending --existing-limit 20 --min-relevance-score 3` ✅
  - pending 20건 중 relevant 4건, lowRelevance 16건
- `npm run news:crawl -- --audit-existing-relevance --apply-existing-relevance --existing-status all --existing-limit 300 --min-relevance-score 3` ✅
  - 76건 관련도 메타데이터 백필, 상태 변경 없음
- 원격 데이터 초기화 ✅
  - 초기화 전: `articles=73`, `last_crawled_at` 보유 회사 `25`
  - 초기화 후: `articles=0`, `last_crawled_at` 보유 회사 `0`
- `npm run news:crawl:dry-run -- --batch-size 1 --results-per-company 5 --delay-ms 100 --max-stored-articles 300 --min-relevance-score 3` ✅
  - 초기화 후 첫 회사가 다시 로드되고, accepted 후보 1건 확인
- `supabase db push` ✅
- `supabase migration list` ✅ (`20260522123000` 원격 반영 확인)
- `supabase functions deploy trigger-company-news-crawl` ✅
- 관리자 화면 브라우저 스모크 체크는 인증/MFA 세션이 필요한 운영 화면이라 이번 턴에서는 생략하고, `tsc`/ESLint/production build로 렌더 타입과 번들 검증을 수행했다.

## 참고

- Edge Function 배포 첫 시도는 `esm.sh` 522 네트워크 오류로 실패했으나, 같은 명령 재시도 후 정상 배포됐다.
- 기존 lowRelevance 기사들은 삭제/거절하지 않았다. 운영자가 관리자 화면에서 검토하거나, 별도 명시 옵션으로 `rejected` 처리할 수 있다.
