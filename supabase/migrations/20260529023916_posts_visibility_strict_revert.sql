-- 게시물 비공개 B 정의 변경(20260529023556) 원복.
-- posts_select_auth를 변경 직전 정의(category <> 'expenses' OR admin/participant)로 복구.

DROP POLICY IF EXISTS "posts_select_auth" ON public.posts;

CREATE POLICY "posts_select_auth"
  ON public.posts FOR SELECT TO authenticated
  USING (
    category <> 'expenses'
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role = ANY(ARRAY['admin', 'participant'])
    )
  );

COMMENT ON POLICY "posts_select_auth" ON public.posts IS
  '읽기: expenses는 admin/participant만, 나머지는 로그인 유저 전체. (2026-05-29 strict 원복)';
