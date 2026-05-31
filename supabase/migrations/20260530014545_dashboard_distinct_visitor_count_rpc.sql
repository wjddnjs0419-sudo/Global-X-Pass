-- 대시보드 누적 방문자 집계: page_views 전체 행(6천+) 클라 전송 대신 서버 distinct count.
-- SECURITY INVOKER(기본) → page_views_select_admin RLS 그대로 적용(어드민만 집계, 그 외 0).
CREATE OR REPLACE FUNCTION public.count_distinct_visitors()
RETURNS integer
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $function$
  SELECT count(DISTINCT visitor_id)::integer FROM public.page_views;
$function$;

REVOKE ALL ON FUNCTION public.count_distinct_visitors() FROM public;
GRANT EXECUTE ON FUNCTION public.count_distinct_visitors() TO authenticated;
