-- 오피스아워 월별 활성 신청 수 집계.
-- RLS상 일반 사용자는 본인 신청만 조회 가능하므로, 잔여 정원 표시를 위해
-- 개인정보 없이 월별 수치만 반환하는 SECURITY DEFINER 함수를 둔다.
CREATE OR REPLACE FUNCTION public.office_hour_month_counts()
RETURNS TABLE (month_id uuid, active_count bigint)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT month_id, count(*)::bigint
  FROM public.office_hour_applications
  WHERE status NOT IN ('cancelled', 'rejected')
  GROUP BY month_id;
$$;

REVOKE ALL ON FUNCTION public.office_hour_month_counts() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.office_hour_month_counts() TO anon, authenticated;
