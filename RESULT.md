# RESULT: 행사 신청/목록 썸네일 겹침 + 아이콘 확대 수정 (2026-05-28)

## 현재 상태

- **증상**: 행사 신청 상세 모바일에서 대표 썸네일이 상태/본문 영역과 겹쳐 보이고, `/events` PC 카드에서는 대표 이미지가 본문 경계를 넘어 제목 앞부분을 덮는 현상이 있었다.
- **추가 증상**: VS Code/브라우저 환경에서 행사 신청 상세의 `CalendarDays`, `Ban` 등 lucide 아이콘이 거대하게 렌더됐다.
- **결과**: 대표 이미지 crop 확대는 각 썸네일 영역 내부에서만 보이도록 고정했고, lucide 아이콘은 CSS var 문자열 size 대신 숫자 size로 정리했다.

## 변경 내용

| 대상 | 변경 |
|---|---|
| `EventApplicationPage.tsx` | 상단 대표 이미지 부모에 `position: relative`, `overflow: hidden`, `flexShrink: 0`을 추가하고 이미지를 `absolute inset:0`으로 고정해 crop 확대가 상태 배지/본문 영역으로 넘어오지 못하게 했다. |
| `theme.css` | 행사 신청 대표 이미지 높이를 `clamp(128px, 18vw, 192px)`로 보정해 모바일에서도 썸네일 영역이 너무 얇아지지 않게 했다. |
| `EventsPage.tsx` | 카드 썸네일에 내부 clipping layer와 `contain: paint`를 추가하고, 본문 칼럼은 `relative zIndex:1` + 카드 배경으로 분리해 확대된 이미지가 제목 위로 그려질 경로를 차단했다. |
| 신청/확인 UI 아이콘 | `size="var(--size-event-application-icon-md)"`와 유사한 lucide 패턴을 `size={16}` 또는 `size={48}` 숫자 값으로 교체했다. 대상: `EventApplicationPage`, `ProgramConfirmationCard`, `ModalShell`, `ConsultingBookingModal`, `FoundersClubPage`. |

## 검증 결과

- `npm run validate` ✅ (tsc + eslint --max-warnings=0 + vite build + 프론트 시크릿 23개).
- 잔여 `size="var(--size-event-application...)` 패턴 검색 결과 없음 ✅.
- Playwright `/events` 375px 모바일 smoke ✅: 카드 `flexDirection: column`, 썸네일 하단과 본문 상단 간격 `0px`, 겹침 없음.
- Playwright `/events` 1438px 데스크톱 smoke ✅: 썸네일 `contain: paint`, 본문 `zIndex:1`/배경 적용, 콘솔 에러 0.
- `/events/:id/apply` 직접 브라우저 smoke는 현재 세션이 로그인 상태가 아니라 `/login`으로 리디렉트되어 미실행. 대신 해당 페이지의 원인 코드 경로(`EventApplicationPage` 커버 clipping, lucide size)를 소스와 validate로 확인했다.

## 미실행 / 후속

- 프론트 UI/CSS 수정만 수행 — Supabase 마이그레이션 변경 없음.
- 작업 전부터 있던 미커밋 변경(`.DS_Store`, `.claude/settings.json`, 일부 content/generated 파일, `0`)은 이번 수정 대상이 아니므로 건드리지 않았다.
- Pending Approval 유지: 게시판 gated 일관 적용 미커밋분 Codex 재리뷰는 별건으로 남아 있다.
