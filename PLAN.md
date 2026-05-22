# PLAN.md

완료된 계획은 `RESULT.md`에 세부 구현 내용과 검증 결과가 기록되어 있으므로, 이 파일에는 활성/예정 작업만 유지합니다. 완료 항목은 `[Done]` 한 줄로 축약하고, 10개를 넘으면 가장 오래된 완료 항목부터 삭제합니다.

## Pending Approval

- [Done] Supabase 2개 프로젝트 데이터 혼재 원인 확인 및 Date-planner 분리 (2026-05-22) — `Global X Pass`는 `yzbjvkifwinumytehxgf` 유지, `Codex_sample(Date-planner)` `.env`/CLI link를 `wqjguifsmtblgrhdfnji`로 전환. Date-planner 스키마를 새 프로젝트에 적용하고 테이블/row count 확인. `npm run validate` ✅ (`Codex_sample`, `Global X Pass`)

- [Done] 미디어 페이지 썸네일 머신 통합 (2026-05-21) — `postThumbnail.ts`가 미디어 게시물도 대표 썸네일 단일 진입점으로 처리하도록 확장. 미디어 비율(`16/9`, `540/675`)과 외부 미디어 후보를 추가하고, `/media` 및 홈 미디어 섹션은 `resolvePostThumbnail()` + `getThumbnailImageStyle()` 사용. 관리자 작성/수정의 수동 썸네일 허용 범위에 `media` 포함. `npm run validate` ✅

- [Done] 창구 프로그램 페이지 소개 영역 재구성 (2026-05-21) — 타임라인 상단 중복 제목/짧은 설명 제거, `창구 로고` 상단 + Hero 프로그램 설명 중앙 정렬 intro 추가. 설명 데이터는 `windowProgramInfo`로 분리해 Hero와 페이지가 import 공유. `npm run validate` ✅, Playwright 데스크톱/모바일 확인 ✅

- [Done] 창구 프로그램 페이지 배경/여백 통합 및 타임라인 공통화 (2026-05-21) — `WindowProgramTimeline`/데이터 모듈 분리, 홈 `AboutSection`과 창구 전용 섹션이 import 공유. 창구 페이지는 기존 `PageShell` 제목/설명 배너를 유지하되 본문 maxWidth/padding 제거로 배너·타임라인·푸터 0px 맞닿음. `npm run validate` ✅, Playwright 데스크톱/모바일 확인 ✅

- [Done] HeroSection 프로그램 정보 타이틀 줄바꿈 문구 수정 (2026-05-21) — `INFO_CONTENT.title` 한/영 모두 React `<br />`로 `Around X` 다음 줄에 `창구 프로그램`/`ChangGoo Program` 표시. `npm run validate` ✅, Playwright `<br>` 렌더 확인 ✅

- [Done] `Around X > 창구 프로그램` 단순 랜딩 페이지 추가 (2026-05-21) — `/around-x/window-program` 공개 라우트 생성, `PageShell` 상단 소개 배너와 기존 `AboutSection` 재사용. `npm run validate` ✅, Playwright 데스크톱/모바일 렌더·overflow 확인 ✅

- [Done] `Around X` 메인 메뉴 및 하위 메뉴 추가 (2026-05-21) — 네비게이션 설정을 `src/app/navigation/mainMenu.ts`로 분리하고, 헤더는 `Support` 우측/사이드 메뉴는 `Programs` 하단에 `Around X`와 `창구 프로그램`·`르노`·`핀칸티에리` 링크를 추가. `npm run validate` ✅, Playwright 렌더 확인 ✅

- [Done] 참여 기업 연도 배지/모달 중복 표시 후속 정리 (2026-05-21) — 카드의 연도 배지는 `2026`으로 단순화하고, 상세 모달 헤더의 중복 연도 배지는 제거해 `참여 정보` 섹션만 연도 문구를 담당하게 함. `npm run validate` ✅, `/companies` 브라우저 확인 ✅
- [Done] 참여 기업 행사 참여 년도 표시 추가 및 전체 기업 2026년 주입 (2026-05-21) — `companies.participation_year` 컬럼/체크/GRANT 추가, 기존 원격 100개 기업 전체 2026 백필, 관리자 폼·CSV·목록과 공개 카드·상세 모달 반영. `npm run validate` ✅, `/companies` 브라우저 확인 ✅

- [Done] 아키텍처 맵 `LiveArchitectureMap.tsx` 과밀화 해소 리팩터링 (2026-05-21) — 타입/상수/storage/mapUtils/styles/인박스/Ops/사이드바를 `admin/architecture/` 모듈로 분리하고 리뷰 보강(QA polling, Blog pipeline, clipboard guard, ignore 정리) 반영. `npm run validate` ✅, `npm run map:build` ✅
