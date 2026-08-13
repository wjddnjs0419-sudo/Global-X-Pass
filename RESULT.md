# RESULT: 게시판 이름/설명 수정 미반영 버그 수정 — 2026-06-06

---

# RESULT: 1:1 컨설팅 개선 — 2026-08-13

## 구현

- 온라인 이머전: `ImmersionPanel`에 DB 행이 아닌 synthetic `전체` 탭을 맨 앞에 추가했다. 최초 선택은 전체이며, 전체일 때 활성 전문가만 `display_order` 순으로 조회한다. DB 카테고리와 fallback 카테고리는 기존 흐름 그대로라 신규 관리 카테고리도 자동 노출된다.
- 오피스아워: 신규 migration `20260813100000_add_office_hour_visibility.sql`로 `office_hour_months.is_visible boolean NOT NULL DEFAULT true`를 추가했다. 기존 월은 모두 true로 유지된다.
- 신규 신청 차단: `enforce_office_hour_capacity()`가 일반 user/participant의 INSERT에서 `is_visible=false`이면 `office hour month is not visible`, `is_open=false`이면 기존 `office hour month is closed`를 각각 반환한다. admin INSERT 차단·정원 검사도 보존된다.
- 사용자 화면: `OfficeHourPanel`의 월 목록 query에 `is_visible=true`를 적용했다. 모두 숨기면 기존 empty state를 그대로 사용한다.
- 관리자 화면: 숨김 월도 기존처럼 전체 조회하고, `사용자 노출` 체크박스를 추가해 `capacity`, `is_open`, `is_visible`을 한 저장 경로에서 영속화한다.
- 기존 신청: MyPage의 `office_hour_applications → office_hour_months(period_month)` 조인과 admin Edge Function의 service-role 조인은 수정하지 않아 숨김 전 신청과 월 정보가 유지된다.

## RLS / 역할 회귀

- RLS 정책은 추가·완화하지 않았다. `office_hour_months` 쓰기는 기존 admin 정책, 신청 INSERT는 기존 본인·pending 제한 정책을 그대로 사용한다.
- 비로그인 열람/신청 불가, user·participant 본인 신청, admin 월·신청 관리 및 신청 불가 범위가 유지된다. 숨김 월은 UI와 DB trigger 양쪽에서 신규 신청만 추가로 제한한다.

## Verification Matrix

| Change | Check | Result |
|---|---|---|
| Local schema | `supabase db reset --local` full migration replay | 신규 migration까지 적용 성공, 기존 2026-06~12 rows `is_visible=true` 확인 |
| Visibility trigger | authenticated role/JWT 직접 INSERT SQL | hidden+open 거절(`not visible`), visible+closed 거절(`closed`), visible+open INSERT 성공 |
| Existing applications | hidden-before application joins | 본인 MyPage 조인과 admin service-role 조인 모두 `period_month` 유지 |
| RLS scope | local `pg_policies` inspection | 정책 수/동작 변경 없음, admin month write·own application 정책 유지 |
| Frontend | `npm run validate` | tsc, ESLint, Vitest 143, production build, secret scan 통과 |
| Diff hygiene | `git diff --check` | 통과 |

## 배포 상태

- Production DB, commit, push, deploy 모두 미수행.

## 배경
- 증상: '게시판 관리'에서 참여기업·1:1컨설팅·Founder's Club 의 라벨/설명을 수정해도 화면(네비·페이지)에 반영 안 됨. 사업비 자료실(expenses)은 의도적 잠금이라 제외.
- 근본 원인: 저장은 정상(`post_categories.label/description` DB 기록). 읽는 쪽이 하드코딩.
  - 네비: `HeaderSection` 의 `itemLabel()` 은 `it.category` 가 있을 때만 DB 라벨을 읽는데, 이 3개 nav 항목엔 `category` 미지정.
  - 페이지: 각 페이지가 `<PageShell title="...">` 에 제목/부제를 하드코딩(`useBoardCategoryLabel` 미사용).
- 추가 발견: 기업 뉴스(company-news)는 `post_categories` 행 자체가 없어 게시판 관리에 노출조차 안 됨(편집 불가). 사용자 결정으로 "게시판화"(행 추가).

## 구현
- **`src/app/navigation/mainMenu.ts`**: companies/consulting/founders-club/company-news 4개 nav 항목에 `category` 추가 → 네비 라벨 DB 연동. expenses 는 잠금 의도적 예외임을 주석 명시.
- **`src/app/pages/{Companies,Consulting,FoundersClub,CompanyNews}Page.tsx`**: 하드코딩 title/subtitle → `useBoardCategoryLabel(id, fallback)` / `useBoardCategoryDescription(id, fallback)` 로 교체(빈 설명 시 기존 문구 fallback).
- **`src/app/pages/CompanyNewsPage.tsx`**: 최상위 return 을 `<BoardAccessGate category="company-news">` 로 래핑(다른 3개 페이지와 동일 패턴) → access_level 토글이 실제 게이팅되도록. (Codex Q2 FAIL 대응.)
- **신규 마이그레이션 `supabase/migrations/20260606150622_add_company_news_category.sql`**: company-news 를 `post_categories` 에 `kind='page'`, `access_level='public'`, sort_order 130 으로 INSERT(`ON CONFLICT DO NOTHING`). 데이터는 articles 테이블 기반, 이 행은 라벨/설명 메타데이터용.
- **신규 테스트 `src/app/navigation/mainMenu.test.ts`**: 4개 항목 `category` 매핑 회귀 가드(원 버그 재발 방지).

## Verification Matrix
| Change | Checks | Result |
|---|---|---|
| 전체 코드 | `npm run validate`(tsc/eslint/vitest138/build/secret) | 통과 |
| nav category 매핑 | mainMenu.test.ts (RED→GREEN, 4 cases) | 통과 |
| 로컬 DB INSERT | docker psql 적용 후 4행 조회 확인 | 통과(로컬) |
| Codex 리뷰 | Q1 PASS·Q2 FAIL→수정후 PASS·Q3 WARN→주석 PASS·Q4 PASS, **FAIL 0** | 통과 |
| prod DB push | `db:push:prod` | **미적용(잔여)** |
| 프론트 배포 | prod build + netlify 드래그드롭 | **미적용(잔여)** |

## 교훈
- "저장은 되는데 반영 안 됨" 패턴 = 쓰기/읽기 경로 분리 점검 필수. 읽는 쪽(`HeaderSection.itemLabel`, 페이지 `PageShell title`)이 DB 대신 정적값을 쓰면 DB 수정이 무력화.
- `kind='page'` 특수 페이지는 게시판 목록엔 없어도 `post_categories` 행이 있어야 라벨/설명 편집 가능. 행 없는 정적 페이지(company-news)는 articles 등 별도 소스라 "게시판화"하려면 메타 행을 신규 INSERT.
- 게시판을 access_level 편집 대상에 넣으면(특수 페이지 포함) 페이지를 `BoardAccessGate` 로 감싸야 토글이 실제 게이팅됨. 안 그러면 어드민 UI 와 실제 동작이 어긋남(설정은 바뀌나 차단 안 됨).

## 배포(완료 2026-06-07)
1. ✅ prod DB — company-news 행 prod 확인(`post_categories` id='company-news', kind='page', access_level='public', sort_order 130).
2. ✅ netlify dist/ 드래그드롭 배포 완료(사용자).
3. ✅ 코드 커밋·푸시 완료(`4e17c734`). → 잔여 없음.
