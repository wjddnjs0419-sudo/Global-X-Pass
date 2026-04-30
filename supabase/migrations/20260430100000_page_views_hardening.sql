-- ================================================================
-- PAGE VIEWS HARDENING MIGRATION
-- Global X Pass — 2026-04-30
-- 목적: page_views 테이블에 대한 무분별한 데이터 삽입(DoS) 방지
-- ================================================================

-- 1. 데이터 검증 강화 (정책 수정)
DROP POLICY IF EXISTS "page_views_insert_public" ON public.page_views;

CREATE POLICY "page_views_insert_public"
  ON public.page_views FOR INSERT TO anon, authenticated
  WITH CHECK (
    -- URL 경로 길이 제한
    length(page_path) < 512 
    AND 
    -- 비정상적인 경로 차단 (최소 / 로 시작)
    page_path ~ '^/'
    AND
    -- User Agent 길이 제한
    (user_agent IS NULL OR length(user_agent) < 1000)
  );

-- 2. Flood 방지 (Rate Limiting) 트리거 추가
CREATE OR REPLACE FUNCTION public.check_page_view_flood()
RETURNS TRIGGER AS $$
DECLARE
  recent_count INTEGER;
BEGIN
  -- 동일 visitor_id로 최근 1분간 10개 이상의 요청이 들어오면 차단
  SELECT count(*) INTO recent_count
  FROM public.page_views
  WHERE visitor_id = NEW.visitor_id
    AND created_at > now() - interval '1 minute';

  IF recent_count >= 10 THEN
    RAISE EXCEPTION 'Rate limit exceeded: Too many page view requests from this visitor.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS tr_check_page_view_flood ON public.page_views;
CREATE TRIGGER tr_check_page_view_flood
  BEFORE INSERT ON public.page_views
  FOR EACH ROW
  EXECUTE FUNCTION public.check_page_view_flood();

COMMENT ON FUNCTION public.check_page_view_flood() IS 'visitor_id 기준 1분당 최대 10건으로 페이지 뷰 기록 제한 (Flood 방지)';
