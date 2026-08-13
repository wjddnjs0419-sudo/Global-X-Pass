# RESULT: Around X 브랜드 포지셔닝 및 SEO 수정 — 2026-08-13

## 배경
- 기존 staged SEO 변경이 Around X 전체를 `구글플레이 창구 프로그램 8기 공식 포털`로 한정하고 있었음.
- 사업 범위를 구글플레이(앱·게임), 르노코리아(모빌리티), 핀탄티에리(조선·해양)와의 글로벌 기업 협업 프로그램으로 반영.

## 구현
- **`index.html`**: title을 `Around X - 넥스트챌린지`로 변경. description, OG, Twitter, WebSite JSON-LD `alternateName`/`description`을 Around X 전체 액셀러레이팅 프로그램 설명으로 전환. canonical, robots, 미리보기 이미지와 metadata 구조는 유지. keyword meta는 기존 제거 상태를 유지.
- **`src/app/content/aroundXBrandInfo.ts`**: About 영역은 기존 Around X 브랜드 소개 문구를 유지.
- **`src/app/components/HeroSection.tsx`**: 창구 상세 데이터 의존을 제거하고 Around X 글로벌 협업 프로그램 정보로 교체. 담당자 확정 소개 문구를 Hero에 정확히 반영하며, `글로벌기업(구글플레이, 르노코리아, 핀탄티에리)과` 표기를 사용. 창구 전용 상세 페이지 데이터는 변경하지 않음.
- **`src/app/components/AboutSection.tsx`**: 기존 staged `aria-label` 접근성 개선 유지.

## Verification Matrix

| Change | Checks | Result |
|---|---|---|
| SEO metadata | title, description, OG/Twitter, JSON-LD, canonical/robots 정적 코드 확인 | 통과 |
| 브랜드 콘텐츠 | Hero 확정 소개 문구 및 About 기존 브랜드 소개 문구 확인 | 통과 |
| 코드 품질 | `npm run validate` (tsc, ESLint 경고 0, Vitest 143, Vite build, secret scan) | 통과 |
| Visible UI QA | 데스크톱/모바일 인앱 브라우저 점검 | 미실행 — 현재 세션에 사용 가능한 인앱 브라우저 없음 |

## 미실행 항목

- 인앱 브라우저 연결 후 Hero 확장 패널과 About 문단을 desktop/mobile viewport에서 시각 확인 필요.

---

# RESULT: Around X Renault · Fincantieri 프로그램 정식 오픈 — 2026-08-13

## 배경
- `/around-x/renault`, `/around-x/fincantieri`가 명시 라우트 없이 `WildcardRoute`의 `comingSoon` 메뉴 경로 판별에 의존해 공통 Coming Soon 페이지를 표시했다.
- 사용자가 제공한 원본 로고는 저장소에는 없고 Downloads에 Renault PNG와 Fincantieri SVG로 존재했다.

## 구현
- **`src/app/pages/AroundXRenaultProgramPage.tsx`**, **`src/app/pages/AroundXFincantieriProgramPage.tsx`**: 기존 `PageShell`을 사용해 각각의 확정 한국어 제목·부제·핵심 소개·상세 설명을 렌더한다. PageShell 제목은 브랜드명(르노코리아/핀칸티에리)만 표시한다.
- **`src/app/components/ProgramIntroSection.tsx`**: 두 소개 페이지가 공유하는 원본 비율 로고, 핵심 소개, 상세 설명 레이아웃만 제공한다. Changgu 소개 영역과 같은 `useTheme()` 기반 본문 색상, 14–18px 크기, 1.85 줄간격, 로고/섹션 `clamp()` 여백을 사용한다. 헤더→로고 상단 간격은 Changgu의 바깥 timeline section `44–76px`와 내부 intro `20–44px`를 합산해 동일하게 맞췄으며, 로고의 별도 배경·테두리·본문 중복 프로그램명은 두지 않는다.
- **`src/imports/renault-logo.png`**, **`src/imports/fincantieri-logo.svg`**: 사용자 제공 원본을 파일명만 정리해 추가했다. 로고 형태·색상은 수정하지 않았다.
- **`src/app/routes.tsx`**: Changgu와 동일한 `AROUND_X_ROUTES` + `toChildRoutePath` 패턴으로 Renault/Fincantieri 명시 라우트를 WildcardRoute 앞에 추가했다.
- **`src/app/navigation/mainMenu.ts`**: Renault/Fincantieri 두 항목의 `comingSoon`만 제거했다. 공통 Coming Soon 시스템과 Changgu/Companies 메뉴는 변경하지 않았다.
- **`src/app/navigation/mainMenu.test.ts`**: 두 메뉴가 정식 페이지 상태여서 `comingSoon`이 아님을 보장하는 회귀 테스트를 추가했다. RED 단계에서 두 항목이 `true`여서 실패한 뒤, 메뉴 설정 변경 후 GREEN을 확인했다.
- Renault/Fincantieri 양쪽 상세 설명의 **“글로벌 진출 액셀러레이팅 프로그램”**을 `<strong>`으로 강조했다. Changgu와 동일하게 light mode `#0D1117`, dark mode `#ffffff`, 굵기 `850`을 적용했다. 소개 간 단락 여백은 `clamp(14px, 3vw, 16px)`로 조정해 작은 화면에서 과도하게 벌어지지 않도록 했다.

## 다국어 결정
- 기존 Changgu 페이지는 PageShell 제목·부제를 한국어로 고정한다. 담당자 확정 영문 마케팅 문구가 없어 Renault/Fincantieri도 같은 최소 패턴을 따랐으며, 임의 번역은 추가하지 않았다.

## Verification Matrix
| Change | Checks | Result |
|---|---|---|
| 메뉴 정식 오픈 상태 | `npm test -- src/app/navigation/mainMenu.test.ts` | RED: Renault/Fincantieri 2건이 `comingSoon: true`로 실패 → GREEN: 6/6 통과 |
| 전체 프런트엔드 | `npm run validate` | TypeScript, ESLint, Vitest **145/145**, Vite production build, frontend secret scan 통과 |
| 직접 URL 응답 | Vite dev server `curl` | Renault/Fincantieri/Changgu 각 HTTP 200 |
| Coming Soon 범위 | `rg comingSoon` + diff | 공통 `WildcardRoute` 로직 유지, Renault/Fincantieri 메뉴에서는 제거 |
| UI cleanup | 변경 diff 검토 | 불필요 state/handler/fallback 없음; Changgu timeline 미변경 |
| 브라우저 시각 QA | `agent-browser`, 인앱 Browser 연결 | 현재 세션에서 자동 브라우저 CLI와 연결 가능한 브라우저가 없어 미수행 |

## 배포 상태
- 사용자 지시대로 DB 변경, deploy, commit, push 모두 실행하지 않았다.

---

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
