-- post_categories_update_admin = is_admin() 기반 보장(멱등 재확인).
-- 선행 마이그 20260530013843 이 이미 is_admin() 으로 정의하도록 수정되어 본 마이그는
-- 중복이지만, 원격에 별도 버전으로 적용된 이력이 있어 로컬 sync 차원에서 보존한다.
-- (이전 raw role 정의가 남은 환경을 만나도 is_admin() 로 수렴시키는 안전망)
DROP POLICY IF EXISTS post_categories_update_admin ON public.post_categories;
CREATE POLICY post_categories_update_admin ON public.post_categories FOR UPDATE TO authenticated
  USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));
