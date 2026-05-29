# PLAN.md

완료된 계획은 `RESULT.md`에 세부 구현 내용과 검증 결과가 기록되어 있으므로, 이 파일에는 활성/예정 작업만 유지합니다. 완료 항목은 `[Done]` 한 줄로 축약하고, 10개를 넘으면 가장 오래된 완료 항목부터 삭제합니다.

## Pending Approval

- [ ] **Codex 재리뷰 재실행 — 게시판 gated 일관 적용 변경분 (미커밋)** — 미커밋 diff 누적: ①게시판 3단계 접근 모델(1차 리뷰 4건 반영 완료) ②gated 일관 적용 변경분 — 홈 4개 섹션 RPC 전환, AdminBoardManagement board gated 허용, 이머젼 anon RLS, 마이그 2건. `codex login` 정상화 후 `/codex:rescue`로 미커밋 diff 재리뷰 필요. 점검 포인트: (a) gated board 본문이 anon 직접 API로 노출 안 되는지(`posts_select_public_by_flag`=public만), (b) gated 목록 RPC(`list_public_post_previews`)가 본문 500자만 노출하는지, (c) `consultants_select_public`이 `is_active=true`만 노출하는지, (d) gated page 신청 INSERT가 anon 차단되는지.


## In Progress

(없음 — PostDetailPage SPOF 분해 1~5단계 전부 종료, Done 섹션 참조)

## 급한 수정사항 (2026-05-29 QA 발견)

> P2 4단계 완료 후 사용자 직접 QA 중 발견된 별건 이슈. P2 회귀 아님, 각 작업 분리 진행.

- [Skipped] **1. 게시물 공개/비공개 의미 변경(B 정의=어드민만 열람)** — 사용자 의도 확인 후 진행했으나 **원복 결정**(이전으로 돌리자). 마이그 2건 net-zero(`20260529023556_posts_visibility_strict` + `20260529023916_posts_visibility_strict_revert` 원격 sync). UI 라벨도 net 무변동. 향후 재검토 시 PLAN 신설.

- [ ] **2. 언론보도 검색 토글 중간 끊김 (디바운스 + race guard)** — 어드민→자동화→언론보도 관리 화면. `AdminExternalNewsManagement.tsx`(line 53-88 `fetchItems` deps `[currentPage, searchTerm, statusFilter]`, line 222-224 `SearchInput onChange={setSearchTerm}` 디바운스 없음) + `AdminCompanyNewsManagement.tsx`(line 96-140 동일 패턴, line 347-348 동일). 픽스: `useDebounce` 훅으로 `debouncedTerm` 분리 + race guard(`activeFetchRef`로 stale 응답 차단). 양쪽 동일 패턴 동시 적용. 점검: 빠른 타이핑 시 input 끊김/포커스 lost 0건, 응답 순서 역전으로 stale 화면 0건.

- [ ] **3. 프로그램 자동 확정 모델 원복 (선착순 → 승인제)** — 큰 작업. `20260519120000_auto_confirm_program_applications.sql`가 consulting_reservations/event_applications/founders_club_applications를 first-come auto-confirm으로 전환한 상태. 사용자 의도: 신청→슬롯 점유(pending)→어드민 승인(confirmed)/거절(슬롯 복귀+row 잔존 또는 삭제) 흐름 복원. 어드민이 거절 슬롯 직접 삭제 가능해야 함. 영향: ①신규 마이그(DEFAULT pending 복귀 + RLS INSERT WITH CHECK 복구 + 거절 시 슬롯 status='available' 복귀 트리거 + 어드민 DELETE 권한) ②EF 2~3개 신설/수정(승인/거절 핸들러) ③UI 복구(마이페이지 상태 배지 + 어드민 승인/거절 버튼 4~5 화면) ④`npm run validate` + Codex 리뷰. 정책 결정 필요: (a) 거절 시 row 삭제 vs 잔존, (b) 신청자 취소 vs 어드민 취소 구분, (c) capacity 카운트 기준(accepted vs pending+accepted).



## PostDetailPage SPOF 분해 (완료, 1~5단계)

> 750줄 단일 파일 SPOF였던 `src/app/pages/PostDetailPage.tsx`를 관심사별로 5단계에 걸쳐 해체 완료. 747→82줄(-665, 89%↓).

### 전체 큰 구조 (목표 최종 형태)

```
src/app/pages/PostDetailPage.tsx          (~80줄, 라우팅·분기만)
  ├ src/hooks/usePostDetail.ts            [1단계 Done] 데이터·접근제어·조회수
  ├ src/utils/postDetailModel.ts          [2단계 Next] 파생 상태 순수함수
  ├ src/app/components/content/
  │   ├ AttachmentPopover.tsx             [3단계] 첨부 패널
  │   ├ PostBodyRenderer.tsx              [3단계] quill+naver 본문 렌더
  │   └ NaverImportDebugLogger.tsx        [3단계] dev 콘솔 진단
  └ src/app/pages/postDetail/
      ├ WideVideoPostView.tsx             [4단계] 인사이트 wide / events-archive 영상
      ├ PortraitMediaPostView.tsx         [4단계] 인사이트 portrait
      └ StandardPostView.tsx              [4단계] 일반 게시판 + events-archive 일반
                                          [5단계] 페이지 슬림화 + 회귀 QA + RESULT 통합
```

### 단계별 진행 상태

- [Done] **1단계** — `usePostDetail(id)` 훅 추출 (2026-05-29, Codex PASS). `PostDetailPage.tsx` 747→619줄.
- [Done] **2단계** — `buildPostDetailModel(post, mediaCategories)` 추출 (2026-05-29, Codex 6 PASS / 1 WARN-수용). `PostDetailPage.tsx` 619→586줄. WARN: `files` 계산이 `normalizePublicStorageUrl` 경유 `import.meta.env` 의존 → 빌드 타임 상수라 실질 회귀 위험 0, 수용.
- [Done] **3단계** — UI 컴포넌트 3종 분리 (2026-05-29, Codex 1차 FAIL 1건→픽스→2차 PASS 2 + 무위험 WARN 3). `PostDetailPage.tsx` 586→295줄 (-291). 신규 `src/app/components/content/{AttachmentPopover,PostBodyRenderer,NaverImportDebugLogger}.tsx` 220+28+89줄. FAIL: `PostBodyRenderer` 빈 본문 가드가 전역 `.ql-editor { min-height: 400px }` 미적용 → 가드 제거 + wide-video 외부 가드 축소(`(content || files) → content`). 상세 RESULT.md.
- [Done] **4단계** — 렌더 분기 View 컴포넌트화 (2026-05-29, Codex 8/8 PASS). 신규 `src/app/pages/postDetail/{WideVideoPostView,PortraitMediaPostView,StandardPostView}.tsx` 97+98+76줄. `PostDetailPage.tsx` 295→99줄 (-196). 상세 RESULT.md 아카이브.
- [Done] **5단계** — DetailHeader 추출 + 최종 슬림화 (2026-05-29, Codex 6/6 PASS, 사용자 5카테고리 QA ✅). 신규 `src/app/pages/postDetail/DetailHeader.tsx` 35줄(뒤로/수정 버튼 흡수). `PostDetailPage.tsx` 99→82줄(-17). 누적 747→82줄(-665, 89%↓). 상세 RESULT.md.

## Done

- [Done] P2 코드 품질 4단계 — `editingPost` 타입 명시 (2026-05-29, Codex 1차 1 FAIL→2차 1 FAIL→3차 5/5 PASS) — `editingPost: any | null` → `Post | null` 직치환. 사전 분석으로 PostFormData 신설 불필요 판정: `editingPost`는 DB row 읽기 전용 소스, 폼 state는 별도 useState 훅 16종이 보유. `setEditingPost` 3 소스 모두 `Post | null`로 표현 가능. 변경: `AdminPage.tsx:77` useState 제네릭, `:105-117` setter + 런타임 typeof 풀 가드(Post required 7종), `AdminPostCreate.tsx:29` Post import 추가, `:109` prop 시그니처. Codex 사이클: 1차 4 PASS / 1 FAIL((b) shape 검증 부족) → 3종 minimal 가드 픽스 → 2차 (b) 재FAIL((b') content/image_url 직접 소비 발견, 풀 가드 요구) → Post required 7종(id/title/content/category/image_url/created_at/views, image_url은 nullable 허용) typeof 풀 가드 픽스 → 3차 5/5 PASS. 크롤 파이프라인 사전 영향 검증: 네이버 블로그(`scripts/import-blog-posts.mjs`)는 posts INSERT 시 7종 전부 채움(content/image_url/views 명시, created_at DB DEFAULT), 기업뉴스(`scripts/crawl-company-news.mjs`)는 articles 테이블만 사용해 posts 무관, AdminPostCreate INSERT는 content/image_url 명시 → 전부 가드 통과 보장. 카테고리별 분기 UI(events 일시/장소, media 썸네일 1:1 토글, events-archive 영상 링크, news 썸네일 편집) 무변경. `npm run validate` ✅×3. diff stat 2 파일 +18/-7. P2 전 4단계 완료 → 종료 후 ESLint `no-explicit-any: warn` 도입 대기. 상세 RESULT.md.

- [Done] P2 코드 품질 3단계 — Supabase 응답 타입 명시 (2026-05-29) — `src/lib/types.ts`에 4 composite row 타입(`ConsultingReservationWithSlot`/`OfficeHourApplicationWithMonth`/`FoundersClubApplicationWithSession`/`EventApplicationWithPost`) 추가. `MyPage.tsx` `useState<any[]>` ×4 → 각 row 타입, `(r/a: any)` map 콜백 ×4 → 추론, `handleCancel*(application: any)` ×4 → 각 row 타입; `setX((data ?? []) as unknown as Row[])` 패턴(supabase-js v2 nested join 추론 한계 회피). `AdminPostManage.tsx` `onStartEdit:(post:any)` props + `useState<any[]>` + `toggleFeatured/togglePublic(post:any)` 4곳 → `Post`. `AdminPage.handleStartEdit(post:any)` → `Post`. `ResourcesPage.tsx` `useState<any[]>` + `handleDownloadClick(post:any)` → `Post`. `editingPost: any | null` 2곳(AdminPage state line 77 + AdminPostCreate prop line 109)은 폼 partial 입력 흐름 → 4단계 `PostFormData` 이월. `npm run validate` ✅. diff stat 5 파일 +80/-29. Codex 리뷰 예정. 상세 RESULT.md.

- [Done] P2 코드 품질 2단계 — `ReservationCard` props 인터페이스화 (2026-05-29) — `src/app/components/admin/AdminConsultingManagement.tsx:710` `ReservationCard({...}: any)` → `ReservationCardProps` 12개 prop 명시(`r: ConsultingReservationRow`, 색상 8종 `string`, `inputStyle: CSSProperties`, `statusBadge: (s:string)=>ReactNode`, `loading: boolean`, `onUpdate: (id:string, status:"cancelled", note:string)=>Promise<void>`). `import type { CSSProperties, ReactNode } from "react"` 추가. 호출부(line 624) 무변경. `npm run validate` ✅, Codex 5/5 PASS(호출부 prop 일치/ReactNode 적정/Promise<void> 정확/CSSProperties 호환/옵셔널 체인 일관). diff +17/-1. 잔여 P2: 3단계(Supabase 응답 타입), 4단계(editingPost). 상세 RESULT.md.

- [Done] P2 코드 품질 1단계 — `catch (err: any)` → `unknown` 전환 (2026-05-29) — `AdminUserManagement.tsx:258`, `AdminConsultingManagement.tsx:229/276`, `AdminPostCreate.tsx:654`, `MyPage.tsx:392/479` 6곳을 `catch (err: unknown)` + `typeof err === "object" && err !== null && "message" in err && typeof err.message === "string" ? err.message : "알 수 없는 오류"` 속성 가드 패턴으로 전환. 초기 `instanceof Error` 가드를 Codex 권고로 속성 가드로 격상(supabase-js `PostgrestError`/`AuthError`/`FunctionsError` + plain object 에러 모두 포괄). 기존 fallback 문자열 동등 보존, `err.code`/`err.status` 사용처 0건 확인. `npm run validate` ✅, Codex `/codex:adversarial-review` 4/4 PASS. diff +24/-9. 잔여 P2 단계(`ReservationCard` props, supabase 응답 타입, `editingPost`) 대기. 상세 RESULT.md.

- [Done] PostDetailPage SPOF 분해 5단계 — DetailHeader 추출 + 최종 슬림화 (2026-05-29) — 페이지 헤더 블록(뒤로/수정 버튼 18줄)을 `src/app/pages/postDetail/DetailHeader.tsx` 35줄로 흡수. props `{post, canRenderAdminControls, border, card}` + 내부 `useNavigate` + `getBackLinkStyle` import. `PostDetailPage.tsx` 99→82줄(-17). 미사용 `getBackLinkStyle` import 제거, `useNavigate`는 `useEffect` `?edit=1` 리다이렉트(`replace:true`) 1곳 잔존. 1~5단계 누적 747→82줄(-665, 89%↓). 최종 구조: 페이지(라우팅·분기) → `usePostDetail`(데이터) → `buildPostDetailModel`(파생) → `content/` 3 컴포넌트(첨부/본문/디버그) → `postDetail/` 4 컴포넌트(헤더 + 3 View). `npm run validate` ✅, Codex 6/6 PASS, 사용자 5카테고리(notice/news/insights portrait/insights wide/events-archive 영상) QA ✅. 상세 RESULT.md.

- [Done] PostDetailPage SPOF 분해 4단계 — 렌더 분기 View 3종 분리 (2026-05-29) — wide-video/portrait-media/standard 인라인 JSX 3분기를 `src/app/pages/postDetail/{WideVideoPostView,PortraitMediaPostView,StandardPostView}.tsx` (97+98+76줄)로 흡수. View props 시그니처는 `{post, model, isDark, textMain, textMuted, border}` 공통 + Standard 만 `{card, contentRef}` 추가. `MEDIA_COLOR = "var(--color-accent-ncf)"` 상수는 Wide/Portrait 모듈에 동일 복제(Standard 미사용, 의도). 페이지에서 `getThumbnailImageStyle`/`getYouTubeVideoId`/`AttachmentPopover`/`PostBodyRenderer` import 제거(각 View가 직접 import). `isMediaLayout = post.category === "media" || isArchiveVideoType` 도출(`!post||!model` 가드 통과 후 사용으로 optional-chain 불필요). `PostDetailPage.tsx` 295→99줄 (-196). `npm run validate` ✅, Codex 8/8 PASS 승인. 상세 RESULT.md 아카이브.

- [Done] PostDetailPage SPOF 분해 3단계 — UI 컴포넌트 3종 분리 (2026-05-29) — 인라인 `AttachmentPopover` 217줄 + dev debug `useEffect` 73줄 + 본문 div 3 인라인 패턴을 `src/app/components/content/{AttachmentPopover,PostBodyRenderer,NaverImportDebugLogger}.tsx` (220+28+89줄)로 분리. `PostBodyRenderer`는 `forwardRef<HTMLDivElement>`, 내부에서 className wrapper + ql-editor 합성 후 `sanitizeRichHtml` 호출. `NaverImportDebugLogger`는 `return null` 컴포넌트, `useEffect`만 보유. 페이지에서 미사용 import 4종(`useState`, `getFileNameFromUrl`, `getNaverImportDiagnostics`, `sanitizeRichHtml`) 제거. `PostDetailPage.tsx` 586→295줄 (-291). Wide-video 외부 가드 `{(content || files.length > 0) && (...)}` → `{content && (...)}` 축소(PostBodyRenderer가 항상 ql-editor 렌더하므로 빈 본문+파일만 400px placeholder 노출 방지; `files`는 모델 단계 `[]` 강제로 도달 불가 dead-code 정리). `npm run validate` ✅, Codex 1차 FAIL 1건(`PostBodyRenderer` 빈 본문 가드가 전역 `.ql-editor { min-height: 400px }` 미적용 → portrait/standard 레이아웃 접힘) → 가드 제거 픽스 → 2차 PASS 2 + 무위험 WARN 3(Naver `min-height: 0 !important` 예외/wide-video files=[] 도달 불가/DOMPurify 빈 string 위임). 상세 RESULT.md.

- [Done] PostDetailPage SPOF 분해 2단계 — `buildPostDetailModel` 추출 (2026-05-29) — `PostDetailPage.tsx:287-322`의 파생 상태 22종(attachmentUrls/images/files/isArchive·Wide/mediaMeta/wideVideo*/rawBody/renderedBody/mediaCover/portraitAspect/portraitCoverCrop/mediaBodyImages 등) + `buildNaverRenderModel` 호출을 `src/utils/postDetailModel.ts:buildPostDetailModel(post, mediaCategories)` 순수 함수로 흡수. 페이지는 `useMemo([post, mediaCategories])`로 model 1회 계산 후 `if (!post || !model) return ...` 가드 뒤에서 destructure. Naver debug useEffect는 deps `[model, post]`로 축약하고 model 분해를 effect 내부에서 수행해 exhaustive-deps 통과. portrait media 분기 인라인 badge 식은 `wideVideoBadgeLabel`(비-archive 경로 = 동일 식) 재사용으로 치환. `PostDetailPage.tsx` 619→586줄(-33), 신규 model 유틸 123줄. `npm run validate` ✅, Codex 리뷰 6 PASS / 1 WARN. WARN: `normalizePublicStorageUrl`이 빌드 타임 `import.meta.env.VITE_SUPABASE_URL` 의존 → 환경 상수라 같은 입력→같은 출력 보장, 실질 회귀 위험 0으로 수용. 상세 RESULT.md.

- [Done] PostDetailPage SPOF 분해 1단계 — `usePostDetail(id)` 훅 추출 (2026-05-29) — 데이터 페칭/접근 제어(`get_post_access_info` RPC + RLS fallback)/조회수 RPC를 `src/hooks/usePostDetail.ts`로 추출. 안전장치 3종 신설: ①`activeIdRef` race 가드(A→B 빠른 전환 시 A 응답 setState 차단) ②`incrementedForIdRef` StrictMode dev 가드(`increment_view_count` id당 1회) ③`navigateRef`/`locationRef`로 useCallback deps `[id]` 만 유지하면서도 라우터 인스턴스 변경 안전. `PostDetailPage.tsx` 747→619줄 (-128줄). `npm run validate` ✅, Codex 리뷰(7개 체크포인트 a~g) DEFECT 0 PASS. 2~5단계(파생 모델 유틸 + UI 컴포넌트 분리 + 렌더 분기 분리) 후속 예정. 상세 RESULT.md.

- [Done] 행사 게시물 일시/장소 구조 컬럼 도입 + 작성/수정 UI 개편 (2026-05-28) — `posts.event_start_at`/`venue_name`/`venue_address` 추가 + `events`만 backfill, 기존 `event_date`/`location` 문자열 보존. `AdminPostCreate`를 Founder’s Club식 날짜·시간·장소명·주소 입력으로 개편하고, 홈/행사목록/신청/마이페이지/어드민 행사현황이 새 구조 필드를 우선 읽도록 전환. 홈 `EventSection`의 게시일(`created_at`) 노출 버그 제거. `npm run validate` ✅, `supabase db push`로 원격 프로젝트 `yzbjvkifwinumytehxgf` 반영 완료. 상세 RESULT.md.

- [Done] 홈 진입 시 간헐적 `/mypage` 강제 이동 + 로그인 필요 alert 루프 차단 (2026-05-28) — 원인: 남아 있던 예전 Supabase 세션을 `RootLayout`의 admin MFA 강제 이동이 stale-session signOut보다 먼저 읽으면서 홈 → `/mypage` 튐, 이어 `MyPage`의 `alert + navigate("/login")`가 경고 루프를 유발. 조치: `mypage`를 `AuthRoute`로 감싸 세션 변경을 구독하는 라우트 가드로 승격, `RootLayout`은 `staleSessionChecked` 완료 전 `/mypage` 강제 이동 금지, `MyPage`의 비로그인 alert 리다이렉트 제거. `npm run validate` ✅. 상세 RESULT.md.

- [Done] 행사 신청 상단 와이드 crop 미리보기/실제 렌더 불일치 보정 (2026-05-28) — 신청 페이지 상단 커버를 가변 `clamp()` 높이 대신 `EVENT_COVER_THUMBNAIL_ASPECT`와 동일한 4:1 고정 비율로 렌더하도록 변경해, 어드민 crop preview(`1600x400`)와 실화면 표시 범위를 같은 수식으로 통일. `npm run validate` ✅, Chrome visible QA로 `/events/f1ae5fa7-a7e6-438f-8f3a-63bd3bc98e76/apply` 상단 커버 확인. 상세 RESULT.md.

- [Done] 상세 페이지 첨부 패널화 + 디버그 콘솔 하드닝 (2026-05-28) — `PostDetailPage` 첨부파일을 본문 박스 밖 우측 상단 메타 영역의 텍스트 토글로 이동하고, 다건은 중앙 모달 대신 앵커형 플로팅 패널로 열리게 변경. 본문 밀림 제거, 단일 첨부는 실제 파일명 표시, 패널 내부는 카드형 박스 제거 후 텍스트+하이라이트 라인만 유지. 모바일 360px visible QA에서 닫힘/열림 상태 모두 overflow 없이 확인. 추가로 Naver import debug 로그는 `import.meta.env.DEV`에서만 동작하게 제한하고, 첨부 URL/본문 text snippet 같은 민감 원문은 콘솔에 남기지 않도록 요약 수치만 기록하게 축소. `npm run validate` ✅. 상세 RESULT.md.

- [Done] 인사이트 목록 썸네일 crop 미리보기와 실제 렌더 불일치 보정 (2026-05-28) — `AdvancedThumbnailEditor`가 metadata crop 저장 시 `sourceAspect`를 함께 기록하도록 확장. `postThumbnail.getThumbnailImageStyle()`은 `sourceAspect + aspect + zoom`으로 절대 배치 수식을 써서 에디터 preview와 같은 crop rect를 공개 렌더에서 재현. `MediaSection`/`MediaPage`뿐 아니라 뉴스·행사·상세 등 manual crop 사용처 wrapper를 `position:relative` 기준으로 정리해 회귀 방지. `npm run validate` ✅, Playwright 로컬 `/insights`·홈 인사이트 섹션 스크린샷 확인 ✅. 상세 RESULT.md.

- [Done] 인사이트 상세 게시판명 잔존 + 상세 표지 1:1 선택 분리 (2026-05-28) — 상세 헤더를 `BoardCategoriesContext` 라벨/설명으로 전환해 `미디어` 잔존 제거. 세로형 인사이트 목록/홈은 `540:675` 고정 + `thumbnail_crop` 직접 범위 지정 유지. 상세 좌측 표지만 `thumbnail_crop_cover.aspect === "1/1"`일 때 정사각형 렌더, 없으면 `540:675` 폴백. 어드민 표지 영역에 `목록 썸네일 범위`(540:675 crop)와 `상세 좌측 표지 비율` 토글(540:675/1:1) 분리. `npm run validate` ✅, Playwright `/`·`/insights`·첫 상세 클릭 콘솔 smoke ✅. 상세 RESULT.md.

- [Done] 어드민 MFA 우회 토글 (시한제, super admin only) (2026-05-28) — 행사중 일반 어드민 OTP 피로 해소용. `admin_mfa_bypass` 단일 row + `is_admin_mfa_bypassed()`(STABLE, `enabled AND expires_at>now()`) + `is_admin()` 패치(bypass OR aal2+factor). 4축 동시 우회: ①DB RLS(`is_admin()`) ②EF AAL2 가드(`_shared/adminAuth.ts`+`noBypass` 옵션) ③LoginPage OTP 챌린지·factor 등록 강제 ④`useAdmin` 프론트 게이트. Super admin은 env `SUPER_ADMIN_UIDS`(admin@test.com UID `4bcae9aa…`) 매칭. 토글 EF는 super admin + AAL2(`noBypass: true`) 강제 + `duration_days`(0/1/3/7) 엄격 검증(typeof number+Number.isInteger). UI는 dashboard 토글 카드(라디오·사유) + 어드민 전역 활성 배너. Bypass 활성 시 LoginPage가 MFA API 호출 자체 skip → 곧바로 navigate. 비활성 admin은 fail-close(에러/null → signOut/가드 닫음). 마이그 `045339` 원격 sync, EF 8개 배포(toggle 1회 추가 재배포 포함), `npm run validate` ✅×3, Codex 4회(1차 3건→픽스→2차 2건→픽스→3차 1건→픽스→4차 PASS). ⑧ AAL2 6 EF 예외 확대는 의도된 디자인. 상세 RESULT.md.


## Future / 추후 수정

### 코드 품질 P2~P4 (대기, 2026-05-29 도입)

> 외부 리뷰 권고. PostDetailPage SPOF 분해 종결 후 다음 회차로 후보. 단계별 amend + Codex 리뷰 사이클 적용.

#### 🟠 Priority 2 — 타입 안정성 복원 (`any` 퇴출 작전)

`any`가 깔린 상태에서는 TS 의미·리팩터링 토대 모두 약화. 추가 유입 차단까지 동반. 위험 낮은 순으로 4단계 분할.

- [Done] **1단계** — `catch (err: any)` 6곳 → `unknown` + 속성 가드 패턴 (2026-05-29, Codex 4/4 PASS). Done 섹션 참조.
- [Done] **2단계** — `ReservationCard` props 12개 → `ReservationCardProps` 인터페이스 (2026-05-29, Codex 5/5 PASS). Done 섹션 참조.
- [Done] **3단계** — Supabase 응답 타입 4 row + Post 적용 (2026-05-29, Codex 대기). `src/lib/types.ts`에 `ConsultingReservationWithSlot`/`OfficeHourApplicationWithMonth`/`FoundersClubApplicationWithSession`/`EventApplicationWithPost` 4 composite 타입 추가, `MyPage.tsx` `any` 10곳(useState ×4 + map 콜백 ×4 + cancel 핸들러 ×4 중 4 슬롯) 제거, `AdminPostManage.tsx` 4곳 + `AdminPage.handleStartEdit` 1곳 → `Post`, `ResourcesPage.tsx` 2곳 → `Post`. `editingPost: any` 2곳(AdminPage state + AdminPostCreate prop)은 4단계 PostFormData 이월. Done 섹션 참조.
- [Done] **4단계** — `editingPost: any | null` 2곳 → `Post | null` 직치환 (2026-05-29, Codex 대기). PostFormData 신설 불필요 판정(editingPost는 읽기 전용 DB row, 폼 state는 별도 useState 16개가 보유). `AdminPage.tsx:77` state + `:107` setter 캐스트 + `AdminPostCreate.tsx:109` prop + Post import. Done 섹션 참조.
- [ ] **종료 후** — `.eslintrc`에 `@typescript-eslint/no-explicit-any: warn` 추가 — 신규 `any` 유입 차단(첫 단계는 warn, 향후 error 승격 검토)

**점검 포인트(향후 Codex)**: (a) RPC/RLS 응답 shape이 실제 row 타입과 일치하는지 (b) supabase-js 응답 `null` 처리 보존 (c) `editingPost` 의 partial 폼 입력 흐름이 onSubmit 시 `Post` 보장 (validator/zod 합의)

#### 🟡 Priority 3 — 인라인 스타일 걷어내기 (shadcn/ui + Tailwind 정상화)

`style={{...}}` + `var(--color-...)` 직접 주입이 가독성·테마 일관성 모두 약화.

- [ ] `src/app/components/ui/`의 기존 컴포넌트(Badge/Button/Card) 적극 활용 → `PostDetailPage` 분해 산출물(`postDetail/*View.tsx`, `content/*.tsx`)과 `HomePage`에 단계적 마이그레이션
- [ ] 인라인 `var(--color-*)` → Tailwind 클래스 매핑(`text-primary`, `bg-card`, `border-soft` 등; `tailwind.config.js` 토큰 사전 정의)
- [ ] 불가피한 복잡 레이아웃만 CSS Module 또는 분리 스타일 파일로 이관

**점검 포인트**: (a) 다크/라이트 모드 회귀 (Orbital System 설계 보존, 메모리 `project_design_system.md`) (b) `MEDIA_COLOR = var(--color-accent-ncf)` 처리 (Wide/Portrait 양쪽 복제 → 토큰화 시 단일화 가능) (c) `getBackLinkStyle`/`getThumbnailImageStyle` 같은 동적 계산 스타일은 잔존 허용

#### 🟡 Priority 4 — `postThumbnail.ts` 유틸리티 다이어트

350줄+ 단일 유틸이 DB 해석/CSS 계산/Crop 로직 모두 포함 → 책임 분리.

- [ ] `thumbnailParser.ts` — DB 데이터(crop metadata, sourceAspect, aspect) 해석
- [ ] `thumbnailRenderer.ts` — CSS/Style 계산(`getThumbnailImageStyle` 등 공개 렌더용)
- [ ] `thumbnailEditor.ts` — `AdvancedThumbnailEditor` 전용 crop 좌표 변환

**점검 포인트**: (a) `MediaSection`/`MediaPage`/`PortraitMediaPostView`/뉴스·행사 상세 렌더가 byte-equal (b) 어드민 `AdvancedThumbnailEditor` preview rect 보존 (2026-05-28 수정한 sourceAspect 절대배치 수식) (c) 사용처 import 경로 일괄 갱신

---

### Discord Bot 구현 (보류, 2026-05-22~)

**목표**: Discord 채팅으로 자동화 실행 + 에러 알림 + Groq LLM 에러 분석 봇

**아키텍처**:
- `discord-bot` Supabase Edge Function — Slash commands (Interactions Endpoint)
- `discord-alert` Supabase Edge Function — DB Webhook 수신 → 에러 자동 알림
- Groq API (Llama 3.3 70B) — 에러 자연어 분석·답변
- Discord 채널: `#gxp-ops` (명령어), `#gxp-alerts` (에러 알림)

**Slash Commands 목록**:
- `/run qa [suite]` → qa-dispatch.yml workflow_dispatch
- `/run news` → trigger-company-news-crawl Edge Function
- `/run blog` → sync-naver-blog Edge Function
- `/errors` → 최근 에러 목록 출력
- `@봇 [자연어 질문]` → Groq LLM 에러 분석

---

#### 선행 작업 체크리스트 (Discord Developer Portal)

- [x] Discord Application 생성 완료 (Application ID: 150733774600247157)
- [x] Bot 생성 완료
- [ ] **BOT_TOKEN 복사** — Bot 페이지 → Reset Token → 복사 저장
- [ ] **PUBLIC_KEY 복사** — 일반 정보 페이지 → Public Key 복사
- [ ] **봇 서버 초대** — 설치 페이지에서 기본 설치 설정 → 길드 설치 → scopes: bot + applications.commands → 봇 권한: 메시지 보내기 + 링크 임베드 + 파일 첨부 → 저장 후 생성된 설치 링크 열기 → 서버 선택 → Authorize
- [ ] **#gxp-ops Webhook URL** — 채널 우클릭 → 편집 → 연동 → Webhooks → New Webhook → URL 복사
- [ ] **#gxp-alerts Webhook URL** — 동일하게
- [ ] **GitHub PAT 발급** — Settings → Developer Settings → Fine-grained tokens → Actions R/W + Contents R
- [ ] **Groq API Key 발급** — console.groq.com/keys → Create API Key

#### Supabase Secrets 등록 (선행 작업 완료 후)

```bash
supabase secrets set DISCORD_PUBLIC_KEY=...
supabase secrets set DISCORD_BOT_TOKEN=...
supabase secrets set DISCORD_APP_ID=150733774600247157
supabase secrets set DISCORD_OPS_WEBHOOK_URL=...
supabase secrets set DISCORD_ALERT_WEBHOOK_URL=...
supabase secrets set GXP_GITHUB_TOKEN=...
supabase secrets set GROQ_API_KEY=...
```

#### 구현 작업 (선행 작업 완료 후 시작)

- [ ] `supabase/functions/discord-bot/index.ts` — Slash commands + LLM 연동
- [ ] `supabase/functions/discord-alert/index.ts` — DB Webhook → Discord 알림
- [ ] `supabase/migrations/YYYYMMDD_discord_alert_webhook.sql` — error_logs INSERT DB Webhook 설정
- [ ] Discord Slash Commands 등록 스크립트 (`scripts/register-discord-commands.mjs`)
- [ ] Discord Developer Portal → Interactions Endpoint URL 입력
- [ ] `npm run validate` + 전체 배포 검증
