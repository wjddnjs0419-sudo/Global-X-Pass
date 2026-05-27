# RESULT: 홈 공지·행사 섹션 빈 공간 해결 (2026-05-28)

## 현재 상태

- **증상**: 메인페이지 게시물이 적어 ①공지사항 섹션은 공지 1개가 컬럼 전체 높이로 stretch되어 세로 중앙 거대 카드처럼 보이고, ②행사 소식 섹션은 공개 행사 1개(=대표 1개, 우측 목록 0개)일 때 2단 grid의 우측 절반이 통째로 비어 보임.
- **결과**: 두 섹션 모두 "위부터/꽉 차게" 채워지도록 수정. 라이브 데이터(행사 1·공지 1) 기준 빈 공간 해소 확인.

## 변경 내용

| 대상 | 변경 |
|---|---|
| `NoticeResourceSection.tsx` 공지 컬럼 | grid 두 컬럼이 동일 높이로 stretch되는데 공지 컨테이너 `flex:1` + 각 `NoticeRow`/로딩 스켈레톤 `flex:"1 1 0"`이 1개 행을 컬럼 전체로 늘리던 원인 제거. stretch 3곳 삭제 → `minHeight:74` 자연 높이로 위부터 쌓임 |
| `EventSection.tsx` 적응형 레이아웃 | 대표 카드 콘텐츠(badge/제목·설명/footer)를 `featuredInner` 변수로 추출해 두 레이아웃 공유. `hasUpcoming = upcomingEvents.length > 0` 분기 |
| ↳ 우측 목록 0개(`!hasUpcoming`) | 대표 카드를 풀폭 가로 hero로 렌더(썸네일 패널 좌 `min-[640px]:flex-row` + 내용 우), 우측 목록 div 미렌더 → 빈 우측 절반 제거 |
| ↳ 1개+(`hasUpcoming`) | 기존 2단(대표 `height:100%` + 우측 목록) 그대로 유지 |
| ↳ grid 클래스 | `loading || hasUpcoming`일 때만 `min-[900px]:grid-cols-2`, 아니면 1단. 로딩 스켈레톤은 2단 유지 |

## 검증 결과

- `npm run validate` ✅ ×2 (tsc + eslint --max-warnings=0 + vite build + 프론트 시크릿 23개).
- Codex 리뷰 2건(공지·행사 각 1회) **BLOCKING 0** — 회귀/다크모드/반응형(640·900px) 부작용 없음. 잔여 리스크는 모바일 col 모드 footer 시각 완성도(비블로킹).
- 브라우저 `/` 홈 smoke(Playwright): 공지 섹션 캡처(공지 1행 상단 정렬·자료실 4그리드 정상), 행사 섹션 캡처(풀폭 가로 hero), 콘솔 에러 0 육안 확인 ✅.

## 미실행 / 후속

- 프론트만 변경 — Supabase 마이그레이션 변경 없음(sync 영향 없음).
- 미커밋 잔여: `.claude/settings.json`(이번 스모크 임시 권한)·`src/generated/architectureMap.json`(생성물 1줄) — 기능 커밋서 제외.
- **Pending Approval 유지**: 게시판 gated 일관 적용 미커밋분 Codex 재리뷰는 별건(PLAN.md 참고).
