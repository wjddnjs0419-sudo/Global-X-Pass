-- Codex 리뷰 반영: gated 게시판 본문이 anon 직접 API 로 노출되지 않도록 RLS 를 access_level 기반으로 강화.
-- anon 은 access_level='public' 게시판의 게시물만 본문까지 SELECT 할 수 있다.
-- (gated 는 page 전용이며 board 에는 허용하지 않지만, 만약 board 가 gated 가 되어도 본문은 차단된다.)
DROP POLICY IF EXISTS posts_select_public_by_flag ON public.posts;
CREATE POLICY posts_select_public_by_flag ON public.posts
  FOR SELECT TO anon
  USING (
    is_public = true
    AND category <> 'expenses'
    AND EXISTS (
      SELECT 1 FROM public.post_categories pc
      WHERE pc.id = posts.category AND pc.access_level = 'public'
    )
  );

-- companies 는 gated 페이지: 비로그인도 published 회사 목록을 열람할 수 있게 한다.
-- (회사명/분야/소개/웹사이트 등 공개 정보만 보유. 상세 모달은 클라이언트 로그인 유도 게이트로 처리.)
DROP POLICY IF EXISTS companies_select_public ON public.companies;
CREATE POLICY companies_select_public ON public.companies
  FOR SELECT TO anon
  USING (status = 'published');
