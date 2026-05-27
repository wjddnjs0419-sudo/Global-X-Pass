-- 보안/정책: 관리자 계정은 오피스아워에 "신청"할 수 없다.
-- 기존 트리거는 관리자에게 정원/마감 검사를 면제(=신청 허용)했으나,
-- 관리자의 역할은 매칭(UPDATE)뿐이며 신청(INSERT) 경로가 없으므로
-- 관리자 INSERT 자체를 차단한다. (프론트 가드와 이중 방어)
CREATE OR REPLACE FUNCTION public.enforce_office_hour_capacity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_capacity integer;
  v_is_open boolean;
  v_count integer;
BEGIN
  -- 동시 신청 직렬화를 위해 월 row를 잠근다.
  SELECT capacity, is_open INTO v_capacity, v_is_open
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
