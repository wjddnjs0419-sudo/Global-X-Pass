# PLAN.md

완료된 계획은 `RESULT.md`에 세부 구현 내용과 검증 결과가 기록되어 있으므로, 이 파일에는 활성/예정 작업만 유지합니다. 완료 항목은 `[Done]` 한 줄로 축약하고, 10개를 넘으면 가장 오래된 완료 항목부터 삭제합니다.

## Pending Approval

---

- [Done] 네이버 블로그 자동 동기화 1차 구현 - `blog_import_runs`/`blog_import_queue` migration, `sync-naver-blog` Edge Function, importer `--process-queue` worker 모드, `blog:worker` npm script, GitHub Actions schedule을 추가했고 원격 migration push/function deploy/worker 실검증까지 완료했다. queue 집계는 events-archive 27건 + news 5건 모두 imported.
- [Done] Supabase 기반 네이버 블로그 자동 동기화 설계 - 공식 문서 기준 `pg_cron` + `pg_net` + Vault + Edge Function 호출 구조를 확인하고, 현재 Node importer의 Deno/시간 제한 부적합성을 정리한 뒤 Supabase는 큐잉·델타 확인, 긴 크롤링/이미지 미러링은 외부 worker 또는 수동 스크립트로 분리하는 권장안을 `RESULT.md`와 `GEMINI.md`에 기록했다.
- [Done] 네이버 블로그 importer 후속 버그 수정 — `tagParam` 기반 정확 파싱(27+5건), PostList 카드 날짜 추출, `--crawl`/`--mirror-images` 플래그, `pubDateOverride` 지원, update 페이로드 `created_at` 포함, 전체 32건(events-archive 27 + news 5) Supabase 이관 + 이미지 미러링 완료, `npm run validate` 통과
- [Done] 게시판 태그 추천 목록 localStorage → Supabase 이관 - `board_tag_presets` 테이블(board_id, tag, is_hidden, is_default, sort_order) + RLS + 5개 게시판 시드, `categoryStore.ts` 순수 상수로 재설계, `useBoardTagPresets` 훅 추출, `AdminPostCreate`·`PostDetailPage` 훅으로 전환 후 `npm run validate` 통과 및 `supabase db push` 완료
- [Done] 미디어 카테고리 표시명 localStorage → Supabase 이관 - `media_category_labels` 테이블 + RLS + 시드, `mediaCategories.ts` 순수 헬퍼로 재설계(`buildMediaCategories` 추가), `MediaPage.tsx` / `AdminPostCreate.tsx` Realtime 구독 + Supabase upsert 저장 후 `npm run validate` 통과
- [Done] 네이버 블로그 Around X 게시물 반자동 이관 1차 - `scripts/blog-import-manifest.mjs`와 `scripts/import-blog-posts.mjs`를 추가해 RSS 후보 추출, PostView 본문/썸네일 파싱, 수동 태그 manifest, `GXP_BLOG_IMPORT_META` 기반 중복 감지, dry-run/write 경로를 구현했고 `news` 2건과 `events-archive` 5건 총 7건을 실제 이관한 뒤 `npm run validate`를 통과했다.
- [Done] 1:1 컨설팅 카테고리 동적화 - `consulting_categories` Supabase 테이블 + RLS + 기본 데이터 마이그레이션, `consultingCategories.ts` 순수 헬퍼로 재설계, `ConsultingPage.tsx` Realtime 구독 + isMounted Race Condition 수정, `AdminConsultingManagement.tsx` Supabase CRUD + Realtime + 슬롯 fetch Race Condition 수정 후 `npm run validate` 통과
- [Done] 카테고리 태그 저장소 게시판별 분리 - `categoryStore.ts`에 `boardId` 파라미터 추가해 localStorage 키를 게시판별로 분리하고, 게시판별 기본 프리셋 정의 후 `AdminPostCreate.tsx`, `PostDetailPage.tsx` 호출부 업데이트, `npm run validate` 통과
- [Done] 뉴스 페이지 카드 레이아웃 전면 개편 - 썸네일을 flush 배치(overflow-hidden)로 변경하고, 콘텐츠 구역을 `flex-col gap-2`로 분리하며, 제목/요약에 `line-clamp-2` 적용하고 태그를 제목 왼쪽 인라인 배치해 카드 높이를 균일화한 뒤 `npm run validate`를 통과했다.
- [Done] 관리자 회원 role 변경 실패 조사 및 복구 - `AdminUserManagement`가 `update-user-role` 실패 본문을 직접 파싱해 generic non-2xx 대신 실제 서버 메시지를 표시하도록 바꾸고, `requireVerifiedAdmin()` / `update-user-role`의 MFA·환경 변수·대상 행 검증을 보강한 뒤 `npm run validate`를 통과했다.
