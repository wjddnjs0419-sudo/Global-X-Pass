# PLAN.md

완료된 계획은 `RESULT.md`에 세부 구현 내용과 검증 결과가 기록되어 있으므로, 이 파일에는 활성/예정 작업만 유지합니다. 완료 항목은 `[Done]` 한 줄로 축약하고, 10개를 넘으면 가장 오래된 완료 항목부터 삭제합니다.

## Pending Approval
- [Done] Codex 리뷰 P2 이슈 2건 + 자체 리뷰 P2 1건 수정 (2026-05-12) — `useBlogImportAdmin` buildTagDrafts에 editedTagIdsRef 기반 서버 태그 갱신 로직 추가. `PostDetailPage` editThumbnailCandidates에 editFiles object URL 후보 포함 + pendingThumbnailFile 업로드 흐름 추가 + 취소/권한강등 시 editThumbnailUrl·pendingThumbnailFile 리셋 누락 수정. `npm run validate` ✅
- [Done] Codex 리뷰 P2 이슈 3건 수정 (2026-05-12) — `AdminPostCreate` 미저장 이미지 파일 썸네일 후보 포함(object URL + 저장 시 업로드), `AdminPage` create 탭 새로고침 복원 시 dashboard fallback, `NewsPage`/`EventArchivePage` 썸네일 404 시 자동 이미지 fallback. `npm run validate` ✅

- [Done] 하드코딩 토큰화 4차 — 공개/기능 페이지 잔여 정리 (2026-05-12) — 12개 페이지(`SearchPage`, `SignupPage`, `TermsOfUsePage`, `NoticePage`, `ResourcesPage`, `BlogPage`, `EventArchivePage`, `ConsultingPage`, `MediaPage`, `EventsPage`, `FoundersClubPage`, `EventApplicationPage`)의 raw 색상/rgba/hex를 CSS 변수 기반으로 교체. `theme.css`에 `--color-img-placeholder`, `--color-capacity-fill/track`, `--color-accent-blue-soft-bg-hover`, `--shadow-card-rest/hover` 라이트 토큰 추가. `MediaGrid` props에서 `isDark/textMuted/textMain/placeholderBg` 제거. `npm run validate` ✅

- [Done] 하드코딩 토큰화 3차 — 저위험 공개 페이지/유틸 정리 (2026-05-11) — `FaqPage`·`NewsPage`·`NotFoundPage`·`UpdatePasswordPage`·`PrivacyPolicyPage`·`eventApplication` raw 색상/rgba를 CSS 변수 기반으로 교체. `theme.css`에 blue soft gradient와 neutral soft 상태 토큰 추가. `HeaderSection`/`AdminPage`/`FlowMapPage` 및 어드민 상단 헤더/backdrop 색상 로직은 변경하지 않음. 대상 파일 raw 색상 스캔 ✅, `npm run validate` ✅

- [Done] 리뷰 후속 2차 — PostDetail/AdminPostCreate 하드코딩 토큰화 확대 (2026-05-11) — `PostDetailPage.tsx`/`AdminPostCreate.tsx`의 색상·배경·테두리·그림자 raw 값을 CSS 토큰 기반으로 정리. `theme.css`에 blue/purple soft 상태 토큰과 card/dialog/media cover shadow 토큰 추가. 어드민 라이트 모드 스크롤 전 상단 헤더/backdrop 로직은 변경하지 않음. `rg` 하드코딩 스캔 ✅, `npm run validate` ✅

- [Done] 최근 리뷰 지적사항 1차 수정 (2026-05-11) — `PostDetailPage.tsx` 관리자 UI/편집 화면 MFA 전체 게이트 적용, 권한 상태 하락 시 편집/모달 닫기, 상세 편집 저장 후 반환 post로 `editThumbnailUrl` 동기화. `AdminPostCreate.tsx`/`PostDetailPage.tsx` 미사용 import 제거, Naver active content 제거 회귀 테스트 추가, 최신 변경 라인 일부 색상 토큰화. `node --test scripts/tests/naverHtmlParser.test.mjs` ✅, `npm run validate` ✅

- [Done] GEMINI.md No-Hardcode Mandate 반영 및 조정 (2026-05-11) — `CLAUDE.md`의 하드코딩 금지 규칙을 `GEMINI.md` 공통 규칙으로 통합. 컴포넌트/페이지/훅/유틸 raw UI 리터럴 추가 금지, `theme.css` 등 토큰 정의 파일 예외, 불가피한 예외 사전 동의 원칙 명시. `RESULT.md` 기록 및 `npm run validate` ✅

- [Done] 리뷰 후속 조치 2차 전체 (2026-05-11) — AdminPage.tsx MFA 게이팅(`mfaRequired`/`mfaEnrolled` 추가, AdminRoute.tsx 패턴 동일화). `uploadThumbnailIfDataUrl` 공통화(postThumbnail.ts export, AdminPostCreate/PostDetailPage 로컬 정의 제거). `normalizeNaverImportedHtml` 파이프라인에 `<script>/<style>` 블록 및 `on*` 이벤트 핸들러 제거 레이어 추가(Node+브라우저 공유 모듈이므로 정규식 기반). theme.css에 NCF soft 토큰 7종 추가(`--color-accent-ncf-soft-bg/badge-bg/border/border-strong/on-ncf/on-ncf-muted` 등). AdminPage.tsx `#0a1020` → `var(--color-bg-surface)`. PostDetailPage.tsx `MEDIA_COLOR`, accent hex, NCF rgba 패턴 → CSS 토큰 교체. `npm run validate` ✅

- [Done] 어드민·모달·레이아웃 하드코딩 제거 (2026-05-11) — theme.css에 accent-ncf, backdrop, neutral, on-primary, disabled-bg 토큰 추가. adminConstants·AdminBlogQueue·AdminBulkResult·AdminConsulting·AdminDashboard·AdminEvent·AdminFoundersClub·AdminPostModal·AdminRoleModal·AdminUserManagement·MyPage·PostDetailPage·RootLayout·ConsultingBookingModal 14개 파일 CSS 변수 교체. `npm run validate` ✅

- [Done] 공개 화면 하드코딩 제거 (2026-05-11) — theme.css에 accent-blue/green/purple, warning, success, scrim, shadow-primary, warning/success soft 토큰 추가. LoginPage·ConsultingPage·EventsPage·EventArchivePage·NoticeSection·FoundersClubCalendarWidget·LoadingSpinner·MediaPage·ResourcesPage·BlogPage·FoundersClubPage·UpdatePasswordPage 13개 파일 CSS 변수 교체. `npm run validate` ✅

- [Done] 리뷰 후속 조치 1차 전체 (2026-05-11) — run_id 셸 주입 차단, crop 손실 회귀 차단, 썸네일 Storage URL 저장 전환, 블로그 큐 페이지네이션+ARIA, AdminConsultingManagement IME Enter 회귀 제거, 모바일 2열→1열/adminLoading 스켈레톤/이메일 말줄임 정리. `npm run validate` ✅
- [Done] 2차 리팩토링 및 기술 부채 청산 (2026-05-11) — `theme.css`에 공용 surface/border/danger 토큰을 추가하고 `AdminRoleModal`·`AdminConsultingManagement`의 `isDark` 색상 삼항을 제거. `useBlogImportAdmin`을 data/control 파트로 분리하고 filter/pagination/tag draft 파생값을 훅 내부로 이동, stable callback + draft ref로 action 참조 안정화. `naver-blog-sync.yml`에 `curl -f --retry --max-time`와 failure rollback PATCH를 추가. `naverHtmlParser`/`naverImportShared`에 null-safe guard를 보강하고 손상 HTML fallback 테스트를 추가. `node --test scripts/tests/naverHtmlParser.test.mjs` ✅, `npm run validate` ✅
- [Done] breakpoint 표준화 및 기존 사용처 감사 (2026-05-11) — 공식 기준을 Mobile 320~767 / Tablet 768~1023 / Desktop 1024~1279 / Large Desktop 1280+로 확정하고, `sm(640+)`는 보조 미세조정 단계로 문서화. 현행 사용처 감사 결과 `sm` 70회, `md` 47회, `lg` 30회, `xl` 8회, arbitrary breakpoint 8회, 수동 `@media` 12회 확인. `npm run validate` ✅

## Long-Term Backlog
- [Backlog] 헤더/어드민/FlowMap 민감 영역 토큰화 — `HeaderSection.tsx`, `AdminPage.tsx`, `FlowMapPage.tsx`, `AdminFlowMap.tsx`, `AdminSidebar.tsx`, 일부 어드민 패널의 레거시 색상 값을 정리한다. 어드민 라이트 모드 스크롤 전 상단 헤더/backdrop 색상 회귀 위험이 있으므로 별도 승인과 브라우저 시각 QA 후 진행한다.
- [Backlog] 공용 컴포넌트/토큰 설계 정비 — `ui/button.tsx`, `ui/badge.tsx`, `PageShell.tsx`, `sectionTheme.ts`의 raw 색상과 섹션 테마 값을 공용 토큰 체계로 정리한다. 영향 범위가 넓으므로 페이지 단위 토큰화가 안정화된 뒤 별도 차수로 진행한다.
