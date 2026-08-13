-- 사용자 화면 노출 여부는 모집 마감(is_open)과 별개로 관리한다.
-- 기본값 true로 기존 2026년 6~12월 모집 월과 과거 신청의 조회 정보를 유지한다.
ALTER TABLE public.office_hour_months
  ADD COLUMN IF NOT EXISTS is_visible boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.office_hour_months.is_visible IS
  'Whether the month is shown to users. Hidden months retain existing applications but reject new user applications.';

-- UI 우회 INSERT도 차단한다. 관리자는 기존처럼 신청 자체가 불가하고,
-- 일반 사용자/participant는 노출·모집 중인 월에만 신규 신청할 수 있다.
CREATE OR REPLACE FUNCTION public.enforce_office_hour_capacity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_capacity integer;
  v_is_open boolean;
  v_is_visible boolean;
  v_count integer;
BEGIN
  -- 동시 신청 직렬화를 위해 월 row를 잠근다.
  SELECT capacity, is_open, is_visible
  INTO v_capacity, v_is_open, v_is_visible
  FROM public.office_hour_months
  WHERE id = NEW.month_id
  FOR UPDATE;

  IF v_capacity IS NULL THEN
    RAISE EXCEPTION 'invalid office hour month';
  END IF;

  -- 관리자 계정은 오피스아워를 신청할 수 없다. (매칭은 UPDATE 경로만 사용)
  IF public.is_admin() THEN
    RAISE EXCEPTION 'admins cannot apply for office hours';
  END IF;

  IF NOT v_is_visible THEN
    RAISE EXCEPTION 'office hour month is not visible';
  END IF;

  IF NOT v_is_open THEN
    RAISE EXCEPTION 'office hour month is closed';
  END IF;

  SELECT count(*) INTO v_count
  FROM public.office_hour_applications
  WHERE month_id = NEW.month_id
    AND status NOT IN ('cancelled', 'rejected');

  IF v_count >= v_capacity THEN
    RAISE EXCEPTION 'office hour month is full';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_office_hour_capacity() FROM PUBLIC;
