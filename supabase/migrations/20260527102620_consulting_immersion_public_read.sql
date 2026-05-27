-- 온라인 이머젼(/consulting)은 gated page: 비로그인도 전문가·카테고리 목록을 열람할 수 있어야 한다.
-- (예약 신청은 클라이언트 useAuthGate.requireAuth 로 로그인 게이트 → INSERT 정책은 그대로 authenticated 유지)
-- 기존에는 anon SELECT 정책이 없어 비로그인이 목록을 전혀 못 봤다.

DROP POLICY IF EXISTS consultants_select_public ON public.consultants;
CREATE POLICY consultants_select_public ON public.consultants
  FOR SELECT TO anon
  USING (is_active = true);

DROP POLICY IF EXISTS consulting_categories_select_public ON public.consulting_categories;
CREATE POLICY consulting_categories_select_public ON public.consulting_categories
  FOR SELECT TO anon
  USING (true);
