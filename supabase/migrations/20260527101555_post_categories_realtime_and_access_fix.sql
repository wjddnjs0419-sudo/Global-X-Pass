-- 1) post_categories 를 realtime publication 에 추가 (admin UI 변경의 라이브 자동 반영)
--    누락 시 useBoardAccess / BoardCategoriesContext 의 postgres_changes 구독이 이벤트를 못 받아
--    공개 사이트가 새로고침 전까지 옛 access_level/라벨을 보여줌.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'post_categories'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.post_categories;
  END IF;
END $$;

-- 2) access_level 교정: events/resources/media 를 gated(목록 공개 + 상세 로그인)로 통일.
--    sync_post_category_access 트리거가 is_public(=access_level<>'private') 자동 동기화.
--    잠긴 카테고리(expenses)는 제외.
UPDATE public.post_categories
SET access_level = 'gated'
WHERE id IN ('events', 'resources', 'media')
  AND is_locked = false;
