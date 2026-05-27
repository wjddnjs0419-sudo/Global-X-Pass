# RESULT: 게시판 gated 일관 적용 + 자동 반영 수정 (2026-05-27)

## 현재 상태

- **증상**: 비로그인 방문자가 행사·인사이트·자료실·온라인 이머젼·파운더스 목록을 못 봄. 어드민 "게시판 관리"에서 접근 권한을 바꿔도 공개 사이트에 즉시 반영 안 됨.
- **결과**: 자료실/행사/이머젼은 "목록 공개 + 상세·신청 로그인"으로 정상화. 어드민 변경은 realtime으로 라이브 반영. 인사이트/파운더스는 데이터 0개(사용자 삭제)라 빈 화면이 정상.

## 근본 원인 → 수정 (4가지)

| # | 원인 | 수정 |
|---|---|---|
| 1 | `post_categories`가 `supabase_realtime` publication에 없음 → `useBoardAccess`·`BoardCategoriesContext`의 `postgres_changes` 구독 콜백이 영영 안 불림 → 어드민 변경이 새로고침 전까지 미반영 | publication에 `post_categories` 추가 (마이그) |
| 2 | events=gated(OK)지만 resources=public·media=private로 의도와 어긋남 + 어드민 UI가 board의 gated 선택을 막음 | events/resources/media → `access_level=gated` 통일(마이그), `AdminBoardManagement` `gatedBlocked` 가드 제거 |
| 3 | gated board 목록을 직접 `posts.select()`하던 홈 섹션이 RLS(`posts_select_public_by_flag`=public만)에 막혀 빈 목록 | Media/Resource/NoticeResource/Community 섹션을 `fetchPublicPostPreviews` RPC로 전환 |
| 4 | 온라인 이머젼 `consultants`·`consulting_categories`에 anon SELECT 정책 부재 → 비로그인 전혀 못 봄 | `consultants_select_public`(is_active=true)·`consulting_categories_select_public` 추가 (마이그) |

## 변경 내용

| 대상 | 변경 |
|---|---|
| `supabase/migrations/20260527101555_post_categories_realtime_and_access_fix.sql` | realtime publication 추가(idempotent) + events/resources/media `access_level='gated'` UPDATE(잠금 제외, sync 트리거가 is_public 동기화) |
| `supabase/migrations/20260527102620_consulting_immersion_public_read.sql` | consultants(anon, is_active=true)·consulting_categories(anon) SELECT 정책 추가 |
| `src/app/components/admin/AdminBoardManagement.tsx` | board의 `gated`('상세 로그인') 금지 가드 제거 + 주석 갱신 |
| `src/app/components/MediaSection.tsx` | `posts.select` → `fetchPublicPostPreviews("media",16)`, supabase import 제거 |
| `src/app/components/ResourceSection.tsx` | `posts.select` → `fetchPublicPostPreviews("resources",4)`, supabase import 제거 |
| `src/app/components/NoticeResourceSection.tsx` | resources 직접 select → `fetchPublicPostPreviews("resources",4)`, supabase import 제거 |
| `src/app/components/CommunitySection.tsx` | 비로그인 fallback 직접 select → `fetchPublicPostPreviews(activeTab, POSTS_PER_TAB)` |

## gated board 동작 (3중 게이트, 기존 인프라 재사용)

- **목록**: `list_public_post_previews` RPC (SECURITY DEFINER, anon, `is_public=true`만, 본문 500자 strip) → gated 목록 노출.
- **본문 직접**: `posts_select_public_by_flag` RLS = `access_level='public'`만 anon → gated 본문 직접 차단.
- **상세**: `get_post_access_info` = `access_level≠'public'` → requires_auth → 로그인 리다이렉트.

## 검증 결과

- `npm run validate` ✅ (tsc + eslint --max-warnings=0 + vite build + 프론트 시크릿 스캔 23개)
- DB 확인: events/media/resources = `gated`·is_public=true, `post_categories` publication 포함, consultants 9개(active)·consulting_categories 3개 anon 정책 적용
- migration sync ✅: 원격 last `20260527102620_consulting_immersion_public_read` = 로컬 마지막 파일 일치
- 데이터 사실: posts에 media 카테고리 0개, founders_club_sessions 0개 → 사용자 전량 삭제로 인한 정상 빈 화면

## 미실행 / 후속

- **비로그인 브라우저 smoke 미실행** — /events·/resources·/insights·/consulting(이머젼)·/founders-club 목록 + 상세 로그인 게이트 육안 확인 권장.
- **Codex 재리뷰 미실행** — 미커밋 diff(컴포넌트 4 + admin UI + 마이그 2). PLAN.md Pending Approval 참고.
