-- 관리자 대시보드 일별 트래픽 집계.
-- page_views 원시 created_at 전체를 클라이언트로 보내지 않고, 서버에서 일별 count + 누적 시작값을 계산한다.
-- 앱 기준 일자는 한국 운영 시간대(Asia/Seoul)로 맞춘다.
CREATE OR REPLACE FUNCTION public.admin_dashboard_page_view_series(p_days integer DEFAULT 7)
RETURNS TABLE (
  view_date date,
  view_count integer,
  cumulative_before integer
)
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $function$
  WITH bounds AS (
    SELECT
      LEAST(GREATEST(COALESCE(p_days, 7), 1), 365)::integer AS days,
      timezone('Asia/Seoul', now())::date AS today
  ),
  series AS (
    SELECT generate_series(
      bounds.today - (bounds.days - 1),
      bounds.today,
      interval '1 day'
    )::date AS view_date
    FROM bounds
  ),
  grouped AS (
    SELECT
      timezone('Asia/Seoul', pv.created_at)::date AS view_date,
      count(*)::integer AS view_count
    FROM public.page_views AS pv
    CROSS JOIN bounds
    WHERE timezone('Asia/Seoul', pv.created_at)::date >= bounds.today - (bounds.days - 1)
    GROUP BY 1
  ),
  before_count AS (
    SELECT count(*)::integer AS total
    FROM public.page_views AS pv
    CROSS JOIN bounds
    WHERE timezone('Asia/Seoul', pv.created_at)::date < bounds.today - (bounds.days - 1)
  )
  SELECT
    series.view_date,
    COALESCE(grouped.view_count, 0) AS view_count,
    before_count.total AS cumulative_before
  FROM series
  LEFT JOIN grouped USING (view_date)
  CROSS JOIN before_count
  ORDER BY series.view_date;
$function$;

REVOKE ALL ON FUNCTION public.admin_dashboard_page_view_series(integer) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_dashboard_page_view_series(integer) TO authenticated;
