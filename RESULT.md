# RESULT: PostDetailPage SPOF 분해 5단계 — DetailHeader 추출 + 최종 슬림화 (2026-05-29)

## 현재 상태

- 4단계까지 렌더 분기 View 3종을 `src/app/pages/postDetail/` 폴더로 분리한 데 이어, 페이지에 잔존하던 **헤더 블록(뒤로/수정 버튼 18줄)** 을 `DetailHeader` 컴포넌트로 흡수.
- 페이지에는 데이터 페칭(`usePostDetail`) + 파생 모델(`buildPostDetailModel`) + 라우팅 가드(loading/notFound/`?edit=1`) + `PageShell` 타이틀/서브타이틀 + 분기 선택만 잔존.
- `PostDetailPage.tsx`: **99 → 82줄** (-17). 1~5단계 누적 **747 → 82줄** (-665, 약 89% 감축).
- Codex 리뷰 1회로 6개 체크포인트 a~f 전부 PASS, 승인.
- 5 카테고리 회귀 QA (notice/news/insights portrait/insights wide/events-archive 영상) 사용자 확인 ✅.

## 변경 내용

| 대상 | 변경 |
|---|---|
| `src/app/pages/postDetail/DetailHeader.tsx` (신규, 35줄) | 페이지 헤더 블록 흡수. props `{post, canRenderAdminControls, border, card}`. 내부에서 `useNavigate()` + `getBackLinkStyle` import. 뒤로 버튼: `post.category === "media" ? navigate("/insights") : navigate(-1)`. 수정 버튼: `canRenderAdminControls` true일 때만 노출, `navigate(\`/admin?editPostId=${post.id}\`)`. DOM은 `flex justify-between items-center mb-8` wrapper로 원본 byte-equal. `Post` 타입은 형제 View들과 일관되게 `../../../lib/types`에서 import. |
| `src/app/pages/PostDetailPage.tsx` (99→82, -17) | 인라인 헤더 18줄 → `<DetailHeader post={post} canRenderAdminControls={canRenderAdminControls} border={border} card={card} />` 1줄. 미사용 import `getBackLinkStyle` 제거. `useNavigate`는 잔존(`useEffect`의 `?edit=1` 자동 리다이렉트에서 `navigate(replace:true)` 호출). |

## 호환 / 리스크 메모

- **useNavigate 양쪽 호출**: 페이지(`useEffect` 자동 리다이렉트 1곳)와 DetailHeader(버튼 핸들러 2곳) 각각 `useNavigate()` 인스턴스를 가짐. React Router의 hook 인스턴스는 컴포넌트별 생성이 정상 패턴이라 부작용 없음. 페이지 측 `navigate` 사용처 1곳뿐이라 hook 제거는 불가.
- **헤더 추출 byte-equal**: className/style/handler/onClick 콜백 시그니처 모두 원본 동일. 사용자 5 카테고리 QA에서 회귀 없음 확인.
- **DetailHeader props 최소화**: `border`/`card`는 CSS variable 문자열 상수(`"var(--color-border-soft)"`/`"var(--color-surface-card)"`)라 향후 prop drilling 부담 시 DetailHeader 내부에서 직접 선언 가능. 현재는 페이지의 공통 토큰 변수와 통일 유지.

## QA / 검증

- `npm run validate` ✅ (`tsc --noEmit` + `eslint src/ --max-warnings=0` + `vite build` + `check:frontend-secrets`)
- Codex 리뷰 (6 체크포인트 a~f, 1회):
  - (a) Props 외부 의존 커버: **PASS**
  - (b) onClick 핸들러 byte-equal: **PASS**
  - (c) Post 타입 import 경로 형제 일관: **PASS**
  - (d) 페이지에서 `getBackLinkStyle` 제거 + 타 사용처 0: **PASS**
  - (e) `useNavigate` 양쪽 호출 정상 패턴: **PASS**
  - (f) DOM/className/style byte-equal: **PASS**
- 종합: 6/6 PASS, 변경 승인.
- 사용자 브라우저 QA: notice/news/insights portrait/insights wide/events-archive 영상 5종 정상 동작 확인.

## 메모

- 5단계 절감 -17줄. 1~5단계 누적 -665줄(89%↓).
- 최종 구조:
  ```
  src/app/pages/PostDetailPage.tsx          82줄 (라우팅·분기 선택)
    ├ src/hooks/usePostDetail.ts            데이터/접근제어/조회수
    ├ src/utils/postDetailModel.ts          파생 상태 순수함수
    ├ src/app/components/content/
    │   ├ AttachmentPopover.tsx             첨부 패널
    │   ├ PostBodyRenderer.tsx              quill+naver 본문 렌더
    │   └ NaverImportDebugLogger.tsx        dev 콘솔 진단
    └ src/app/pages/postDetail/
        ├ DetailHeader.tsx                  뒤로/수정 버튼
        ├ WideVideoPostView.tsx             인사이트 wide / events-archive 영상
        ├ PortraitMediaPostView.tsx         인사이트 portrait
        └ StandardPostView.tsx              일반 게시판
  ```
- PostDetailPage SPOF 분해 시리즈 종결. 후속 작업은 PLAN.md Pending(Codex 게시판 gated 일관 적용 재리뷰)으로.
