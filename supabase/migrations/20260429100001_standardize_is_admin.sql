-- posts INSERT 정책을 is_admin() 함수로 통일
DROP POLICY IF EXISTS "관리자만 쓰기 가능" ON public.posts;
CREATE POLICY "관리자만 쓰기 가능" ON public.posts
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());
