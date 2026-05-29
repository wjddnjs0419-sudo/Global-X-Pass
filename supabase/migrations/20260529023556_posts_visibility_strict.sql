-- 게시물 비공개(is_public=false) 의미 강화: B 정의 = 임시 숨김(어드민만 열람).
-- 변경 전: posts_select_auth(authenticated) USING (category <> 'expenses' OR admin/participant)
--          → 로그인 유저는 is_public 무관 모두 노출. UI 라벨("로그인 유저만 열람")과 일치하지만
--            사용자 의도(임시 숨김)와 불일치.
-- 변경 후: 어드민 OR (expenses+participant) OR (expenses 외 + is_public=true)
-- anon 정책(posts_select_public_by_flag) 무변경: 이미 is_public=true 강제.

DROP POLICY IF EXISTS "posts_select_auth" ON public.posts;

CREATE POLICY "posts_select_auth"
  ON public.posts FOR SELECT TO authenticated
  USING (
    -- 1) 어드민은 모든 게시물 노출(관리 위해 필수)
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role = 'admin'
    )
    -- 2) expenses는 participant도 노출(기존 로직 유지, is_public 무관)
    OR (
      category = 'expenses'
      AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
          AND role = 'participant'
      )
    )
    -- 3) expenses 외: 공개 게시물(is_public=true)만 노출
    OR (
      category <> 'expenses'
      AND is_public = true
    )
  );

COMMENT ON POLICY "posts_select_auth" ON public.posts IS
  '로그인 유저 SELECT: 어드민(모든 글), expenses+participant(기존), 그 외 is_public=true. 비공개 게시물은 어드민만 열람.';
