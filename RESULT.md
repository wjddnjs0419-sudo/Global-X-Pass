# RESULT: 세션 종료 핫 컨텍스트 (2026-05-12 — 2차)

## 현재 상태
- Codex 리뷰(P2 이슈 3건) 수정 완료.
- `PostDetailPage` 본문 박스 스타일 조정 완료 (radius `rounded-3xl`→`rounded-[var(--radius-md)]`, 패딩 `p-10`→`p-[var(--space-md)]`, 제목/날짜 `px-[var(--space-md)]` 정렬).
- 하드코딩 토큰화 4차 완료 상태 유지. 12개 공개/기능 페이지의 raw 색상/rgba/hex를 CSS 변수로 전면 교체.
- 남은 토큰화 대상: `HeaderSection.tsx`, `AdminPage.tsx`, `FlowMapPage.tsx`, `AdminSidebar.tsx`, `ui/button.tsx`, `PageShell.tsx` — `Long-Term Backlog` 유지.

## 이번 세션 주요 변경

| 파일 | 변경 내용 |
|------|-----------|
| `PostDetailPage.tsx` | 본문 박스 radius → `var(--radius-md)`, 패딩 → `var(--space-md)`, 제목/날짜 좌측 정렬 맞춤 |
| `AdminPostCreate.tsx` | 미저장 이미지 파일 object URL 생성/해제, 썸네일 후보 포함, 저장 시 실제 URL 업로드 처리 |
| `AdminPage.tsx` | `create` 탭 새로고침 복원 차단 → `dashboard` fallback |
| `NewsPage.tsx` | 수동 썸네일 404 시 자동 이미지 fallback, 2차 실패 시 placeholder |
| `EventArchivePage.tsx` | `NewsPage`와 동일한 thumbnail fallback 패턴 적용 |

## 종료 전 점검
- [x] `PLAN.md` Codex P2 수정 항목 `[Done]` 으로 정리
- [x] `RESULT.md` 최신 핫 컨텍스트 반영
- [x] `npm run validate` (TypeScript, ESLint, Vite production build) ✅

---

# RESULT: 하드코딩 토큰화 3차 — 저위험 공개 페이지/유틸 정리 (2026-05-11)

## 요약
저위험 공개 페이지와 이벤트 상태 유틸의 raw 색상/rgba를 CSS 변수 기반으로 정리했다. 사용자 확인대로 `HeaderSection`, `AdminPage`, `FlowMapPage` 및 어드민 라이트 모드 스크롤 전 상단 헤더/backdrop 색상 로직은 변경하지 않았다.

## 변경 파일

| 파일 | 변경 내용 |
|------|----------|
| `src/styles/theme.css` | FAQ 문의 카드용 `--gradient-blue-soft`, 마감/중립 상태용 `--color-neutral-soft-bg/border` 토큰 추가 |
| `src/app/pages/FaqPage.tsx` | 카드/테두리/텍스트/FAQ 열린 상태/문의 카드/메일 아이콘 색상을 토큰 기반으로 교체 |
| `src/app/pages/NewsPage.tsx` | `NEWS_COLOR`, 카드/테두리/텍스트, 썸네일 placeholder 배경을 토큰화 |
| `src/app/pages/NotFoundPage.tsx` | 404 색상과 홈 버튼 색상을 `--color-accent-blue`, `--color-on-primary` 기반으로 교체 |
| `src/app/pages/UpdatePasswordPage.tsx` | 카드/필드/텍스트/버튼 상태 색상과 `PageShell` accentColor를 토큰화. 오래된 설명성 주석 제거 |
| `src/app/pages/PrivacyPolicyPage.tsx` | 안내 박스, 카드/텍스트/테두리, `PageShell` accentColor를 토큰화 |
| `src/utils/eventApplication.ts` | 행사 신청/모집 상태 색상 맵을 CSS 변수 문자열로 교체 |
| `PLAN.md` | 이번 완료 항목을 `[Done]` 한 줄로 축약하고, 완료 항목을 최신 10개만 남기도록 정리 |
| `RESULT.md` | 이번 수정 내역과 검증 결과 기록 |

## 검증 결과
- [x] 대상 파일 raw 색상/rgba 스캔 — 잔여 없음 ✅
- [x] `npm run validate` (TypeScript, ESLint, Vite production build) ✅

## 남은 확인
- 아직 저장소 전체에는 `HeaderSection`, 섹션형 랜딩 컴포넌트, 일부 어드민 패널, UI primitive 등에 레거시 하드코딩 후보가 남아 있다.
- 어드민 상단 헤더/backdrop 계열은 색상 회귀 위험이 있으므로 별도 시각 QA 또는 명시 승인 후 분리 처리하는 것이 안전하다.

---

# RESULT: 리뷰 후속 2차 — PostDetail/AdminPostCreate 하드코딩 토큰화 확대 (2026-05-11)

## 요약
`PostDetailPage.tsx`와 `AdminPostCreate.tsx`의 잔여 색상/배경/테두리/그림자 raw 값을 CSS 토큰 기반으로 정리했다. 어드민 라이트 모드 스크롤 전 상단 헤더/backdrop 로직은 사용자 확인대로 변경하지 않았다.

## 변경 파일

| 파일 | 변경 내용 |
|------|----------|
| `src/styles/theme.css` | blue/purple soft 상태 토큰, card/dialog/media cover shadow 토큰 추가. 기존 `--color-admin-header-backdrop` 의미는 유지 |
| `src/app/pages/PostDetailPage.tsx` | 지역 색상 상수(`textMain`, `border`, `card` 등)를 전역 토큰 참조로 교체. 게시판별 편집 패널 soft 배경/테두리를 `CATEGORY_EDIT_THEME` + CSS 변수로 정리. 입력 필드/첨부 행/미디어 placeholder/카드/모달 shadow와 backdrop을 토큰화 |
| `src/app/components/admin/AdminPostCreate.tsx` | 지역 surface/field/border/danger 상수를 전역 토큰 참조로 교체. 태그 삭제 버튼, 미디어 첨부 행, 드롭존, 삭제/취소 버튼 색상을 토큰화 |
| `PLAN.md` | 승인된 2차 계획을 `[Done]`으로 축약 |
| `RESULT.md` | 이번 수정 내역과 검증 결과 기록 |

## 검증 결과
- [x] `rg` 하드코딩 스캔 (`PostDetailPage.tsx`, `AdminPostCreate.tsx`) — 색상/rgba/shadow arbitrary 잔여 없음 ✅
- [x] `npm run validate` (TypeScript, ESLint, Vite production build) ✅

## 남은 확인
- 이번 차수는 두 파일의 색상/배경/테두리/그림자 계열만 처리했다. 간격/반경/폰트 크기 리터럴 및 다른 파일의 레거시 하드코딩은 별도 차수로 분리하는 것이 안전하다.
- 어드민 상단 헤더/backdrop은 변경하지 않았다.

---

# RESULT: 최근 리뷰 지적사항 1차 수정 (2026-05-11)

## 요약
코드 리뷰에서 지적된 보안 게이트, 썸네일 저장 상태, 테스트 공백, 미사용 import, 최신 변경 라인의 하드코딩을 1차로 정리했다.

## 변경 파일

| 파일 | 변경 내용 |
|------|----------|
| `PostDetailPage.tsx` | 관리자 수정/삭제 UI와 편집 화면 렌더링을 `!adminLoading && isAdmin && !mfaRequired && mfaEnrolled`로 게이트. 권한 상태가 내려가면 편집 모드/모달을 닫도록 보정. 상세 편집 저장 후 반환된 post 데이터로 `editThumbnailUrl` 등 편집 상태를 동기화해 data URL 썸네일 재업로드 중복을 방지. 미사용 import 제거 및 최신 변경 라인 일부 색상 하드코딩을 토큰으로 치환 |
| `AdminPostCreate.tsx` | 미사용 `isDataImageUrl` import 제거. 태그 피커에 전달되던 미사용 raw 색상 인자 제거. 저장 버튼/삭제 X 텍스트 색상 토큰화 |
| `scripts/tests/naverHtmlParser.test.mjs` | `normalizeNaverImportedHtml`가 `<script>`, `<style>`, inline `on*` 이벤트 핸들러를 제거하는지 회귀 테스트 추가 |
| `PLAN.md` | 승인된 리뷰 후속 수정 항목을 `[Done]`으로 축약 |
| `RESULT.md` | 이번 수정 내역과 검증 결과 기록 |

## 검증 결과
- [x] `node --test scripts/tests/naverHtmlParser.test.mjs` ✅
- [x] `npm run validate` (TypeScript, ESLint, Vite production build) ✅

## 남은 확인
- 이번 작업은 리뷰 지적사항 1차 범위만 처리했다. 저장소 전체 레거시 하드코딩 청산은 별도 승인 작업으로 분리하는 것이 안전하다.

---

# RESULT: GEMINI.md No-Hardcode Mandate 반영 (2026-05-11)

## 요약
`CLAUDE.md`에만 있던 No-Hardcode Mandate를 `GEMINI.md`의 공통 프로젝트 규칙으로 반영했다. 다만 `theme.css` 같은 토큰 원천 파일까지 금지하면 디자인 시스템 자체를 정의할 수 없으므로, “UI 호출부 raw 리터럴 금지 + 토큰 정의부 예외” 형태로 조정했다.

## 변경 파일

| 파일 | 변경 내용 |
|------|----------|
| `GEMINI.md` | `## No-Hardcode Mandate (CRITICAL)` 섹션 추가. 컴포넌트/페이지/훅/유틸에서 raw 색상·간격·반경·폰트 크기 등 UI 리터럴 추가 금지, 토큰 정의 파일 예외, 불가피한 예외 사전 동의 원칙 명시 |
| `PLAN.md` | 승인된 문서 반영 작업을 Pending 항목으로 추가 |
| `RESULT.md` | 이번 문서 규칙 변경 기록 |

## 검증 결과
- [x] `npm run validate` (TypeScript, ESLint, Vite production build) ✅

---

# RESULT: 리뷰 후속 조치 2차 (2026-05-11)

## 요약
리뷰어 피드백 4개 항목을 일괄 처리했다.
1. AdminPage.tsx MFA 보안 게이팅 완성
2. uploadThumbnailIfDataUrl 공통화
3. naverImportShared.js 파이프라인 XSS 방어 레이어 추가
4. theme.css NCF soft 토큰 추가 및 PostDetailPage.tsx 하드코딩 일괄 교체

## 변경 파일 (6개)

| 파일 | 교체 내용 |
|------|----------|
| `AdminPage.tsx` | `mfaRequired`/`mfaEnrolled` destructure + MFA 가드 2단계 추가; `#0a1020` → `var(--color-bg-surface)` |
| `postThumbnail.ts` | `supabase` import 추가; `uploadThumbnailIfDataUrl` export 함수 추가 |
| `AdminPostCreate.tsx` | 로컬 `uploadThumbnailIfDataUrl` 제거 → postThumbnail.ts import |
| `PostDetailPage.tsx` | 로컬 `uploadThumbnailIfDataUrl` 제거 → import; `MEDIA_COLOR`/NCF rgba/accent hex → CSS 토큰; `inputBg2` → `var(--color-field-bg)` |
| `naverImportShared.js` | `normalizeNaverImportedHtml` 진입 시 `<script>/<style>` 블록 및 `on*` 이벤트 핸들러 정규식 제거 레이어 추가 |
| `theme.css` | NCF soft 토큰 7종 추가: `--color-accent-ncf-soft-bg/badge-bg/border/border-strong/on-ncf/on-ncf-muted` + 라이트모드 override |

## 검증 결과
- [x] `npm run validate` (TypeScript, ESLint, Vite production build) ✅

---

# RESULT: 어드민·모달·레이아웃 하드코딩 제거 (2026-05-11)

## 요약
어드민 상태 맵, 모달 버튼, SVG 차트, 레이아웃 오버레이 등 중간 우선순위 하드코딩을 일괄 교체했다. 신규 토큰 5종으로 의미 계층이 명확해졌다.

## theme.css 신규 토큰

| 토큰 | 값 | 용도 |
|------|----|------|
| `--color-accent-ncf` | `#20D6A2` | NCF 미디어 카테고리 |
| `--color-backdrop` | `rgba(0,0,0,0.55)` | 모달 전체 배경 오버레이 |
| `--color-neutral` | `#64748B` | 취소·비활성 중립 상태 |
| `--color-on-primary` | `#ffffff` | 컬러 배경 위 텍스트 (항상 흰색) |
| `--color-disabled-bg` | `#9ca3af` | 비활성 버튼 배경 |

## 변경 파일 (14개)

| 파일 | 교체 내용 |
|------|----------|
| `adminConstants.ts` | `CATEGORY_COLOR.color` 모두 CSS var 교체 |
| `AdminBlogQueueManagement.tsx` | 에러 배너/링크 색상 |
| `AdminBulkResultModal.tsx` | 실패 라벨 `#dc2626` → `--color-brand-red` |
| `AdminConsultingManagement.tsx` | 버튼 `#fff` → `--color-on-primary`, 비활성 pill → `--color-neutral` |
| `AdminDashboard.tsx` | SVG `fill`/`stroke` → CSS var (style prop 방식) |
| `AdminEventManagement.tsx` | 거절 버튼 색상 |
| `AdminFoundersClubManagement.tsx` | 상태 맵, 버튼 색상 |
| `AdminPostModal.tsx` | 확인/삭제 버튼 |
| `AdminRoleModal.tsx` | 확인 버튼 |
| `AdminUserManagement.tsx` | 삭제 버튼 색상 |
| `MyPage.tsx` | MFA 버튼, 에러 텍스트, 상태 맵 2종 |
| `PostDetailPage.tsx` | 링크색, 저장/삭제 버튼, 태그 배지, 행사 섹션 |
| `RootLayout.tsx` | 아이들 경고 모달 오버레이·버튼 |
| `ConsultingBookingModal.tsx` | 오버레이·슬롯 선택·신청 버튼 |

## 검증 결과
- [x] `npm run validate` (TypeScript, ESLint, Vite production build) ✅

---

# RESULT: 공개 화면 하드코딩 제거 (2026-05-11)

## 요약
세션 만료 노란 블록을 계기로 공개 화면 전체의 하드코딩 디자인 값을 감사하고, 13개 파일에서 CSS 토큰으로 교체했다. 누락 토큰은 `theme.css`에 신규 추가했다.

## theme.css 신규 토큰

| 토큰 | 값 | 용도 |
|------|----|------|
| `--color-accent-blue` | `#4377F1` | 창구 CTA, 스피너 |
| `--color-accent-green` | `#18A343` | 모집중·신청 버튼 |
| `--color-accent-purple` | `#A855F7` | FoundersClub, 블로그 |
| `--color-warning` | `#F59E0B` | 잔여석 amber 경고 |
| `--color-success` | `#0FA37F` | 여유석 teal |
| `--color-scrim` | `rgba(0,0,0,0.52)` | 이미지 위 배지 오버레이 |
| `--color-warning-soft-bg/border` | `rgba(251,188,5,0.10/0.30)` | 노란 안내 배너 (dark) / `0.08/0.25` (light) |
| `--color-success-soft-bg/border` | `rgba(24,163,67,0.10/0.28)` | 초록 상태 배지 |
| `--shadow-primary` | `0 8px 24px rgba(67,119,241,0.30)` | 주요 버튼 그림자 |

## 변경 파일

| 파일 | 교체 내용 |
|------|----------|
| `src/styles/theme.css` | 신규 토큰 9종 추가 (dark + light 오버라이드) |
| `src/app/pages/LoginPage.tsx` | 노란 경고 블록 → `--color-warning-soft-bg/border` |
| `src/app/pages/ConsultingPage.tsx` | 에러 배너 → `--color-danger-soft-bg/border`, `--color-brand-red` |
| `src/app/pages/EventsPage.tsx` | 잔여석 → `--color-warning/success`, 신청 버튼 → `--color-accent-green`, `--color-text-primary` |
| `src/app/pages/EventArchivePage.tsx` | 연도 배지 → `--color-scrim`, `--color-text-primary` |
| `src/app/components/NoticeSection.tsx` | 호버 border → `--color-danger-soft-border` |
| `src/app/components/FoundersClubCalendarWidget.tsx` | 호버 border + 라벨 → `--color-accent-purple` |
| `src/app/components/LoadingSpinner.tsx` | 스피너 ring → `--color-glass-border`, top → `--color-accent-blue` |
| `src/app/pages/MediaPage.tsx` | 재생 배지 → `--color-scrim`, `--color-text-primary` |
| `src/app/pages/ResourcesPage.tsx` | 다운로드 카운트 배지 → `--color-accent-blue`, `--color-bg-surface` |
| `src/app/pages/BlogPage.tsx` | 피처드 카드 태그/텍스트 → glass/text 토큰 |
| `src/app/pages/FoundersClubPage.tsx` | 상태 배지 맵 → success/danger/glass 토큰 |
| `src/app/pages/UpdatePasswordPage.tsx` | 버튼 그라디언트 → `--gradient-blue`, 그림자 → `--shadow-primary` |

## 검증 결과
- [x] `npm run validate` (TypeScript, ESLint, Vite production build) ✅

---

# RESULT: 리뷰 후속 조치 1차 진행 중 (2026-05-11)

## Step 3 — 수동 썸네일 Storage URL 기반 저장 전략 (완료)

### 변경 파일

| 파일 | 변경 내용 |
|------|----------|
| `src/utils/postThumbnail.ts` | `resolvePostThumbnail()` 조건 완화 — `thumbnail_url`이 설정되어 있으면 Storage URL 포함 무조건 신뢰. `thumbnail_crop`이 null이거나 data URL이면 crop도 null 반환 |
| `src/app/components/admin/AdminPostCreate.tsx` | `isDataImageUrl` import 추가. `uploadThumbnailIfDataUrl()` 헬퍼 추가. 저장 핸들러에서 data URL 감지 시 `images/thumbnails/` 버킷 업로드 → public URL로 교체 후 `getThumbnailSavePayload` 호출 |
| `src/app/pages/PostDetailPage.tsx` | 동일 패턴 적용 |

### 구현 메모
- `AdminConsultingManagement`는 이미 `persistConsultantImageUrl` 패턴으로 처리 중이므로 변경 없음.
- 기존 `thumbnail_url + thumbnail_crop` (CSS objectPosition crop) 방식 게시물은 변경 없이 그대로 동작.
- 신규 편집기 결과(Storage URL)는 `thumbnail_crop = null`로 저장 → 카드에서 기본 `objectFit: cover` 적용.
- `resolvePostThumbnail`의 기존 제한(`candidateUrls.has(manualUrl) || isDataImageUrl`) 제거로 Storage URL이 무시되던 버그 해소.

### 검증 결과
- [x] `npm run validate` (TypeScript, ESLint, Vite production build) ✅

## Step 4 — 블로그 큐 페이지네이션 보정 + 최소 ARIA (완료)

### 변경 파일

| 파일 | 변경 내용 |
|------|----------|
| `src/hooks/useBlogImportAdmin.ts` | `totalPages` 감시 `useEffect` 추가 — `currentPage > totalPages`일 때 자동 클램프(승인/건너뜀 후 빈 페이지 고정 버그 해소) |
| `src/app/components/admin/AdminBlogQueueManagement.tsx` | 필터 탭 그룹 `role="group"` + 각 버튼 `aria-pressed`; 실행 기록 토글에 `aria-expanded`/`aria-controls="blog-runs-list"`; 목록 컨테이너에 `id="blog-runs-list"`; 알림/오류 닫기 버튼에 `aria-label` 추가 |

### 검증 결과
- [x] `npm run validate` ✅

## Step 4 후속 — IME Enter 회귀 수정 (완료)

- `AdminConsultingManagement.tsx` 카테고리 추가 input의 `onKeyDown` 핸들러 제거. 버튼 클릭 전용 제출로 전환. `npm run validate` ✅

## Step 5 — 모바일 잔여 이슈 정리 (완료)

### 변경 파일

| 파일 | 변경 내용 |
|------|----------|
| `src/app/components/admin/AdminConsultingManagement.tsx` | 등록 폼 / 수정 폼 grid `gridTemplateColumns: "1fr 1fr"` → `grid grid-cols-1 sm:grid-cols-2`. 모바일(~640px)에서 1열, sm 이상에서 2열 |
| `src/app/pages/AdminPage.tsx` | `if (adminLoading) return null` → 헤더 backdrop + `HeaderSection` + `SkFallback rows=5` 렌더. 빈 화면 플래시 제거 |
| `src/app/components/admin/AdminUserManagement.tsx` | 이메일 span에 `whiteSpace: "nowrap"` 추가 → `textOverflow: "ellipsis"` 실제 동작 |

### 검증 결과
- [x] `npm run validate` ✅

---

## 리뷰 후속 조치 1차 전체 완료
- Step 1: GitHub Actions `run_id` 셸 주입 차단 ✅
- Step 2: 기존 crop 메타 손실 회귀 차단 ✅
- Step 3: 수동 썸네일 Storage URL 기반 저장 전략 ✅
- Step 4: 블로그 큐 페이지네이션 + ARIA ✅ (+ IME Enter 회귀 후속 수정 ✅)
- Step 5: 모바일 잔여 이슈 정리 ✅

---

# RESULT: 2차 리팩토링 및 기술 부채 청산 (2026-05-11)

## 실행일
2026-05-11

## 요약
리뷰어 감사에서 지적된 4개 축의 기술 부채를 한 차수로 정리했다.
어드민 테마 색상 삼항을 CSS 토큰 기반으로 통일했고, 블로그 이관 어드민 훅을 data/control 책임으로 분해했으며, GitHub Actions 실패 시 Supabase run 상태가 좀비 상태로 남지 않도록 복구 경로를 추가했다.
마지막으로 Naver HTML 파서와 정규화 경로에 null-safe guard와 손상 입력 테스트를 보강해 worker 전체 중단 가능성을 낮췄다.

## 최종 수정 내용

| 파일 | 변경 내용 |
|------|----------|
| `src/styles/theme.css` | `surface/card/subtle/selected`, `field`, `soft border`, `danger soft`, `skeleton` 계열 토큰을 추가해 라이트/다크 공통 참조점을 만들었다. |
| `src/app/components/contentListStyles.ts` | `getMutedLabelStyle`, `getStatusPillStyle`를 CSS 변수 기반으로 바꿔 호출부가 `isDark` 분기에 덜 의존하도록 정리했다. |
| `src/app/components/admin/AdminRoleModal.tsx` | `useTheme().isDark` 삼항을 제거하고 토큰만 참조하도록 변경했다. 확인 버튼 색상도 브랜드 토큰으로 치환했다. |
| `src/app/components/admin/AdminConsultingManagement.tsx` | 카드/입력/배지/삭제 상태 색상을 토큰으로 치환하고, 내부 `isDark` 의존을 제거했다. |
| `src/hooks/useBlogImportAdmin.ts` | `useBlogImportAdminData`, `useBlogImportAdminControls` 조합 구조로 재편했다. fetch/mutation, UI state, 파생 filter/pagination 계산을 분리하고, draft ref 기반 stable callback으로 approve/retry 핸들러 참조를 안정화했다. |
| `src/app/components/admin/AdminBlogQueueManagement.tsx` | 필터 탭/페이지네이션/검색 파생 계산을 훅에서 받아 쓰도록 단순화하고, draft/update/clear/toggle action을 훅 API에 맞게 연결했다. |
| `.github/workflows/naver-blog-sync.yml` | Supabase PATCH `curl`에 `-f --retry --retry-all-errors --max-time`를 추가했고, `run_id`가 있는 실패 실행에 한해 `blog_import_runs`를 `failed`로 롤백하는 step을 추가했다. |
| `scripts/utils/naverHtmlParser.mjs` | `parseCategoryNoFromHtml()`에 null-safe guard를 추가해 손상 입력에서 `null` fallback을 반환하도록 했다. |
| `src/utils/naverImportShared.js` | `stripNaverImportMeta`, `isNaverImportedContent`, `extractImageSourcesFromHtml`, `normalizeNaverImportedHtml`에 문자열 coercion guard를 추가했다. |
| `scripts/tests/naverHtmlParser.test.mjs` | `null`, 잘못된 category 입력, 닫히지 않은 HTML에 대한 fallback 테스트를 추가했다. |
| `PLAN.md` | 승인된 계획을 `[Done]` 한 줄로 축약하고 완료 항목 10개 유지 규칙에 맞춰 가장 오래된 완료 항목 1개를 제거했다. |
| `GEMINI.md` | 훅 분해 뒤 return shape와 호출부를 함께 검증하라는 anti-pattern 금지 조항을 추가했다. |

## 구현 메모
- `useBlogImportAdmin`은 외부에서 여전히 단일 훅으로 쓰되, 내부에서 data/control 책임을 나눠 기존 사용 흐름을 크게 흔들지 않았다.
- tag draft는 items 갱신 시 기존 draft를 최대한 보존하도록 merge하고, approve/retry는 `ref`를 통해 최신 draft를 읽게 해서 callback dependency 폭을 줄였다.
- GitHub Actions rollback은 예약 실행처럼 `run_id`가 없는 경우를 건드리지 않도록 `if: failure() && github.event.inputs.run_id != ''` 조건으로 제한했다.
- 손상 HTML 방어는 “예쁘게 복구”보다 “throw 없이 fallback”을 우선했다.

## Verification Matrix 적용
- UI/UX 또는 레이아웃 변경: 해당
  - `npm run validate` 수행
  - 브라우저 시각 스모크 테스트는 이번 턴에서 미실행. 대신 테마 토큰 치환 대상 컴포넌트의 색상 경로를 코드 기준으로 검토했다.
- 인프라 / 워크플로우 변경: 해당
  - workflow failure path와 `run_id` 조건 분기를 코드로 점검했다.
  - 별도 GitHub Actions 실실행은 이번 턴에서 미실시.
- 테스트 / 파서 변경: 해당
  - `node --test scripts/tests/naverHtmlParser.test.mjs` 수행
  - `npm run validate` 수행
- 문서 변경: 해당
  - `PLAN.md`, `RESULT.md`, `GEMINI.md` 최신화 완료

## 검증 결과
- [x] `node --test scripts/tests/naverHtmlParser.test.mjs` ✅
- [x] `npm run validate` (TypeScript, ESLint, Vite production build) ✅

## 남은 확인
- `/admin`의 블로그 이관 큐 화면과 컨설팅 관리 화면은 실제 브라우저에서 라이트/다크 테마를 한 번 더 눈으로 확인하면 더 안전하다.
- GitHub Actions rollback step은 다음 수동 `workflow_dispatch(run_id 포함)` 실패 케이스에서 실제 Supabase row가 `failed`로 내려가는지 운영 시 한 번 확인하는 것이 좋다.
