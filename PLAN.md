# PLAN.md

완료된 계획은 `RESULT.md`에 세부 구현 내용과 검증 결과가 기록되어 있으므로, 이 파일에는 활성/예정 작업만 유지합니다. 완료 항목은 `[Done]` 한 줄로 축약하고, 10개를 넘으면 가장 오래된 완료 항목부터 삭제합니다.

## Pending Approval

### [장기 플랜/기술 부채] 2차 리팩토링 및 기술 부채 청산 (2026-05-08 신규 리뷰어 감사 결과 반영)

**배경**
- 3인의 외부 신규 리뷰어(Clean Code, Performance, DevOps) 교차 감사 결과, 코드는 동작하지만 장기 유지보수 및 확장성에 치명적인 병목과 엣지 케이스가 발견되어 이를 기술 부채로 분류하고 청산 계획을 수립함.

**조치 계획 (Action Items)**
1. **[UI/UX] 테마 변환(isDark) 불완전성 완전 제거 (Clean Code)**
   - `AdminRoleModal`, `AdminConsultingManagement` 등 일부 컴포넌트에 여전히 남아있는 `isDark` 기반 삼항 연산자 색상 로직을 `theme.css` CSS 변수로 100% 마이그레이션하여 DRY 원칙 준수.
2. **[기능] `useBlogImportAdmin` God Hook 해체 및 렌더링 병목 해결 (Performance & Clean Code)**
   - 비대한 상태(데이터 Fetch, 필터, 폼, API)를 도메인별 하위 훅으로 쪼개거나 `useReducer`로 캡슐화.
   - 검색어 입력 등 상태 변경 시 액션 핸들러들의 참조가 매번 재생성되어 리스트 전체가 리렌더링(Wasted Render)되는 성능 병목을 `useCallback`과 상태 구조 개선으로 해결.
3. **[인프라] 파이프라인 좀비 상태 방지 및 예외 처리 (DevOps)**
   - `.github/workflows/naver-blog-sync.yml`의 `curl` 명령에 `-f`, `--max-time`, `--retry` 옵션 추가.
   - 워크플로우 실패 시 `blog_import_runs` 테이블의 해당 run 상태를 `failed`로 롤백하는 `if: failure()` 복구 스텝 추가.
4. **[테스트] 파서 엣지 케이스 커버리지 보강 (DevOps)**
   - `naverHtmlParser.test.mjs`에 `null` 입력, 닫히지 않은 태그 등 손상된 HTML 입력 시의 예외 처리(Crash 방지) 단위 테스트 추가.

---

### [예정] 게시물 대표 썸네일 수동 지정 기능 (events-archive, news)

**배경**
- `EventArchivePage`와 `NewsPage` 모두 네이버 동기화로 썸네일이 자동 지정됨
- 자동 썸네일을 관리자가 원하는 이미지로 교체할 수 있어야 함
- 현재 썸네일 결정 순서: `image_url` 첫 이미지 → content 첫 `<img>` → placeholder

**변경 후 썸네일 우선순위**
`thumbnail_url` (명시적 설정) → `image_url` 첫 이미지 → content 첫 `<img>` → placeholder

---

#### 변경 파일 목록

**① `supabase/migrations/YYYYMMDDHHMMSS_add_thumbnail_url_to_posts.sql`** (신규)
```sql
ALTER TABLE posts ADD COLUMN IF NOT EXISTS thumbnail_url text;
```
- nullable, 기존 행에 영향 없음
- `supabase db push` 후 원격 반영 확인 필요

**② `src/app/components/admin/AdminPostCreate.tsx`**
- `thumbnailUrl` state 추가 (`string | null`, 초기값 `null`)
- 편집 진입 시 `editingPost.thumbnail_url`로 초기화 (useEffect 내 `setThumbnailUrl`)
- `category === "events-archive" || category === "news"` 조건으로 **대표 썸네일 섹션** 렌더링:
  - `existingImages.filter(isImage)` 목록을 썸네일 그리드(3~4열)로 표시
  - 클릭 시 해당 URL을 `thumbnailUrl`로 설정 / 재클릭 시 해제
  - 선택된 이미지: 파란 테두리 + 체크 아이콘 오버레이
  - 이미지가 없을 때: "첨부 이미지를 먼저 저장하면 여기서 선택할 수 있습니다." 안내
- `handleConfirmSave` — insert/update 페이로드에 `thumbnail_url: thumbnailUrl ?? null` 포함
  - `extraFields` 조건 블록 (`events-archive`, `news`) 안에 추가

**③ `src/app/pages/EventArchivePage.tsx`**
- 카드 렌더링 썸네일 결정 코드 수정:
  ```ts
  // 변경 전
  const thumbnailUrl = attachmentImages[0] ?? (content img 정규식);
  // 변경 후
  const thumbnailUrl = post.thumbnail_url
    ?? attachmentImages[0]
    ?? (content img 정규식);
  ```

**④ `src/app/pages/NewsPage.tsx`**
- 동일한 썸네일 우선순위 적용 (`post.thumbnail_url` 우선)

---

#### 검증 매트릭스
- [ ] `npm run validate` ✅
- [ ] events-archive 카드: 수동 지정 썸네일 정상 표시 확인
- [ ] news 카드: 수동 지정 썸네일 정상 표시 확인
- [ ] 지정 해제 시 자동 폴백(image_url → content img) 동작 확인
- [ ] 신규 글(기존 이미지 없음)에서 안내 문구 표시 확인
- [ ] `supabase migration list` 원격 반영 확인

---

- [Done] 블로그 동기화 버튼 라벨 수정 (2026-05-08) — `AdminBlogQueueManagement.tsx` "즉시 이관 실행" → "즉시 동기화". `npm run validate` ✅
- [Done] 보안 리뷰어 지적사항 수정 — MFA 미완료 관리자 nav 노출 차단 (2026-05-08) — `RootLayout` nav/DesignSystem 조건에 `!mfaRequired && mfaEnrolled` 추가; `AdminRoute` loading 중 `null` → `<div aria-hidden />` 교체. `npm run validate` ✅
- [Done] 관리자 플로팅 nav + `/design-system` 인증 우회 보안 수정 (2026-05-08) — `RootLayout` `loading` 가드 추가(`!adminLoading && isAdmin`), `DesignSystemPage` 비인가 접근 시 `/` 리디렉트, `routes.tsx`에서 `design-system` 경로를 `AdminRoute` 아래로 이동(이중 방어). `npm run validate` ✅
- [Done] EventArchivePage 통계 섹션 제거 + 연도 필터 + 전 게시판 페이지네이션 통일 (2026-05-08) — `get_event_archive_participant_stats` RPC 호출 제거, 연도 자동 필터 추가, `pagination.tsx` 한국어·라이트모드 수정, Blog/EventArchive(12개)/Notice·News·Events·Resources(10개) 페이지네이션 통일. `npm run validate` ✅
- [Done] 라이트 모드 CSS 변수 근본 수정 (2026-05-08) — `ThemeProvider`에 `document.documentElement.classList.toggle("dark", isDark)` 추가, `theme.css`에 `html:not(.dark)` 라이트 모드 오버라이드 블록 추가(배경·텍스트·글래스·보더 변수 전체). `EventArchivePage` Pagination import 누락 수정 포함. `npm run validate` ✅
- [Done] AdminBlogQueueManagement UI/UX 미니멀 리팩터 + 명칭 변경 (2026-05-08) — "블로그 이관 큐" → "블로그 동기화" 사이드바·헤딩 변경. `tabStyle` 탭 필터, `Badge`/`Button` 컴포넌트, 단순 카드(card/border/radius:16), 컬러 accent·인셋 영역 제거. 번들 15.5 → 11.4 kB. `npm run validate` ✅
- [Done] 블로그 이관 큐 Admin UI + GitHub Actions 즉시 실행 연동 (2026-05-08) — `AdminBlogQueueManagement.tsx` 신규 생성, `AdminSidebar`/`AdminPage` 탭 추가, `sync-naver-blog` Edge Function에 GitHub Actions `workflow_dispatch` 연동 추가.
- [Done] 네이버 이관 canonical pipeline 5차(32건 스코프 보정 및 queue/콜라주 복구) - `fullCoveragePosts=32`, `partialCoveragePosts=0`, `unknownClassSummary=[]`, `unstructuredPosts=[]`. `npm run validate` ✅
- [Done] 네이버 이관 canonical pipeline 4차(`se-oglink` link-card 승격) - `fullCoveragePosts=24`, `partialCoveragePosts=0`, `unknownClassSummary=[]`. `npm run validate` ✅
- [Done] 네이버 이관 canonical pipeline 3차(실데이터 unknown block 수집 및 schema 승격) - `se-sticker`/`se-imageGroup` canonical 승격. `npm run validate` ✅
- [Done] 네이버 이관 canonical pipeline 2차(anomaly 진단/새 타입 분류 기반) - `getNaverCanonicalDiagnostics()` 추가, PostDetailPage debug 로그 확장. `npm run validate` ✅
- [Done] 네이버 이관 canonical block pipeline 1차 구현 - `data-gxp-se` 마커 주입, index.css marker-first 이행. `npm run validate` ✅
