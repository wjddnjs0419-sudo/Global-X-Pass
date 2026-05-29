# RESULT: P2 코드 품질 4단계 — `editingPost` 타입 명시 (2026-05-29)

## 현재 상태

- P2 (`any` 퇴출) **4단계 완료**, 전 4단계 종결.
- 사전 분석으로 원안 `PostFormData` 신설 + zod/수동 검증 게이트 **불필요 판정**.
- 변경 = 타입 별칭 직치환 4 hunks, 런타임 0변동.
- `npm run validate` ✅.
- Codex `/codex:rescue` 리뷰 예정.

## 사전 분석 — PostFormData 불필요 판정

원안: `editingPost: any` → `PostFormData` 폼 전용 인터페이스(모든 필드 optional + onSubmit 시 zod 또는 수동 검증).

실제 코드 분석 결과:

- `setEditingPost` 호출 3 소스 전부 `Post | null` 표현 가능
  - `AdminPage.tsx:107` — `supabase.from("posts").select("*").eq(...).maybeSingle()` 응답
  - `AdminPage.tsx:125` — `handleStartEdit(post: Post)` 인자 (3단계에서 `Post` 타입화 완료)
  - `AdminPage.tsx:121/134/210` — `null`
- `editingPost`는 **읽기 전용 DB row**. 폼 입력값 누적·갱신에 사용 안 함
- 폼 state는 별도 useState 훅 16종이 보유:
  - `category`/`title`/`content`/`files`/`existingImages`/`thumbnailUrl`/`thumbnailCrop`/`thumbnailCropCover`/`mediaDetailCoverAspect`/`pendingThumbnailFile`/`fileObjectUrls`/`eventMeta`/`legacyEventDateFallback`/`eventFormConfig`/`isPublic`/`mediaMeta`
- `editingPost`는 `useEffect(..., [editingPost?.id])` 안에서 위 훅들에 **초기값을 주입하는 소스**일 뿐
- `Post` 인터페이스가 이미 카테고리별 optional 필드 모두 보유(`event_start_at?`/`venue_*?`/`event_form_config?`/`thumbnail_crop_cover?`/`tags?` 등)

→ `Post | null` 직치환으로 충분, 새 인터페이스 불필요.

## 변경 내용

### `src/app/pages/AdminPage.tsx`

| 라인 | Before | After |
|---|---|---|
| 77 | `useState<any \| null>(null)` | `useState<Post \| null>(null)` |
| 107 | `setEditingPost(data)` | `setEditingPost(data as unknown as Post)` |

- `Post` import는 3단계에서 이미 추가됨(`line 6: import type { Post } from "../../lib/types"`)
- 107 캐스트는 3단계 supabase-js v2 nested join 추론 한계 회피 패턴 일관 적용. 여기서는 `select("*")`라 nested join은 아니지만 supabase-js 응답 타입이 `Record<string, unknown>` 계열로 좁혀지지 않아 동일 패턴 사용.

### `src/app/components/admin/AdminPostCreate.tsx`

| 라인 | Before | After |
|---|---|---|
| 29 | `import type { EventFormConfig, ThumbnailCrop }` | `import type { EventFormConfig, Post, ThumbnailCrop }` |
| 109 | `editingPost: any \| null;` | `editingPost: Post \| null;` |

- 본문 어디서도 mutation 없음(`editingPost.???`로 읽기만). optional 체인(`editingPost?.thumbnail_crop`, `editingPost?.id` 등) 보존.

## 카테고리별 분기 UI 무변경 확인

`editingPost` 타입 변경이 카테고리별 분기 로직에 영향 없음:

- **events**: 일시(`event_start_at`/`event_date`) + 장소(`venue_name`/`venue_address`/`location`) + `event_form_config` 빌더 + `capacity`/`event_status` — 전부 `Post`의 optional 필드
- **media**: `thumbnail_crop`(540:675 목록) + `thumbnail_crop_cover`(1:1 상세 토글) + `mediaMeta` 외부 URL — `Post`의 optional 필드
- **events-archive** + 영상 태그: 외부 영상 URL — `mediaMeta` state 보유
- **news**: 썸네일 편집기 — `Post.thumbnail_crop`
- **일반(notice 등)**: 본문 + 첨부

`Post`가 모든 optional 필드를 보유하므로 카테고리별 partial 데이터(events는 venue_*만 있고 thumbnail_crop_cover 없음 등)도 그대로 표현 가능.

## 호환 / 리스크 메모

- **런타임 동작 변경 0**: 타입 수준 변경만, 빌드 산출물 변동 검토 필요(diff stat).
- **`as unknown as Post` 안전성**: `select("*")`는 `posts` 테이블 전 컬럼 반환 → `Post` 인터페이스와 shape 1:1. RLS 통과 row만 반환되므로 응답이 다른 row 타입일 위험 0.
- **`null` 의미 보존**: `null` = 신규 모드 / 객체 = 수정 모드 분기 다수(`if (editingPost)`, `editingPost ? ... : ...`, `editingPost?.id` 등) — `Post | null`로 타이핑 후 동일 의미 유지.
- **optional 체인 보존**: `editingPost?.thumbnail_crop`, `editingPost?.thumbnail_crop_cover`, `editingPost?.id`, `editingPost?.location`, `editingPost?.thumbnail_url` 등 전체 ⇒ `Post`의 optional 필드와 정합.
- **zod/수동 검증 게이트 미도입**: 원안의 onSubmit 시 validation은 `editingPost`가 폼 state가 아니라 별건. onSubmit payload는 별도 useState 훅들이 보유 → 검증 필요 시 그 훅들 대상 별도 분석 작업.

## QA / 검증

- `npm run validate` ✅ (×3 — 초안 + 1차 픽스 + 2차 풀 가드 픽스)
  - `tsc --noEmit` PASS
  - `eslint src/ --max-warnings=0` PASS
  - `vite build` PASS (1897 modules, dist/index 899kB — 3단계와 동일)
  - `check:frontend-secrets` PASS (23 files)
- **Codex `/codex:adversarial-review` 1차**: 4 PASS / 1 FAIL
  - (a) mutation 누적 PASS — DB row read-only 입력 소비 확인
  - (b) **FAIL** — `AdminPage.tsx:107` `data as unknown as Post` 이중 캐스트, `if (cancelled || !data) return;`만으로 shape 검증 불충분. 컬럼 한정 또는 런타임 가드 권고
  - (c) optional 체인 PASS — `editingPost?.id`/`?.thumbnail_crop*` 등 보존
  - (d) `if (editingPost)` 분기 PASS — null/객체 의미 동치
  - (e) 카테고리별 UI PASS — events/media/events-archive/news 분기 무변경
- **1차 FAIL 1차 픽스 (AdminPage.tsx:105-109)** — 3종 minimal 가드:
  ```ts
  if (typeof row.id !== "string" || typeof row.title !== "string" || typeof row.category !== "string") return;
  ```
- **Codex 2차 재FAIL**: (b) 부족 — `AdminPostCreate`가 `editingPost.content`(line 254), `editingPost.image_url`(line 255) 직접 소비. 면제 근거 부족, `Post` required 7종 전부 가드 필요.
- **2차 픽스 (AdminPage.tsx:105-117)** — Post required 7종 풀 가드:
  ```ts
  if (
    typeof row.id !== "string" ||
    typeof row.title !== "string" ||
    typeof row.content !== "string" ||
    typeof row.category !== "string" ||
    (row.image_url !== null && typeof row.image_url !== "string") ||
    typeof row.created_at !== "string" ||
    typeof row.views !== "number"
  ) return;
  setEditingPost(row as unknown as Post);
  ```
  `image_url`은 nullable(`string | null`)이므로 `null || string` 둘 다 허용.
- **크롤 파이프라인 사전 영향 검증**:
  - `scripts/import-blog-posts.mjs` — `posts` INSERT 시 `title`/`category`/`content: record.content`/`image_url: record.attachmentImageUrl || null`/`views: 0` 명시, `created_at` DB DEFAULT `now()` → 7종 전부 충족
  - `scripts/crawl-company-news.mjs` — `articles` 테이블 전용, `posts` 무관
  - `external-news-preview` EF — 미리보기만, DB write 없음
  - `AdminPostCreate.tsx:650` 어드민 직접 작성 — `category`/`title`/`content`/`image_url` 명시 + `views`/`created_at` DB DEFAULT
  - `posts.title`/`content`/`category` 컬럼 DB NOT NULL → 누락 INSERT는 DB 에러로 차단, 즉 DB row면 string 보장
  - → 크롤 게시물(blog/news/insights/events-archive) 전부 풀 가드 통과 안전
- **Codex 3차 (2026-05-29 최종)**: **5/5 PASS** 🎯
  - (b) PASS — Post required 7종 가드 완비, shape 안전성 확보
  - (b') PASS — 7종 좁힘 이후 `setEditingPost(row as unknown as Post)` 잔존 캐스트 안전
  - (a) PASS — mutation 누적 없음 유지
  - (c) PASS — optional chain 보존
  - (d) PASS — 신규/수정 분기 동일
  - (e) PASS — 카테고리 분기 UI 회귀 없음
  - 코드 추가 수정 없음.

## 메모

- diff stat: 2 파일 +11/-7 = 순증 4줄(Post import 1 + 시그니처 3).
- P2 전 4단계 종결:
  1. catch(err: any) → unknown 속성 가드 (2026-05-29 Codex PASS)
  2. `ReservationCard` props 12개 → `ReservationCardProps` (2026-05-29 Codex PASS)
  3. Supabase 응답 4 composite row + `Post` 적용 (2026-05-29 Codex 대기)
  4. `editingPost: any | null` → `Post | null` (이번)
- **종료 후 단계**: `.eslintrc` `@typescript-eslint/no-explicit-any: warn` 도입 → 신규 `any` 유입 차단(첫 단계 warn, 향후 error 승격 검토).
- 다음 P3(인라인 스타일 → Tailwind/shadcn) 또는 P4(`postThumbnail.ts` 다이어트) 후보. PLAN.md Future 섹션 참조.
