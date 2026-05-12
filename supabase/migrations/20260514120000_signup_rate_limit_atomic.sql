-- 1. 비로그인 방문자 페이지뷰 기록 허용
--    useTracker()가 anon 세션에서도 INSERT하므로 권한 추가
GRANT INSERT ON TABLE public.page_views TO anon;

-- 2. 원자적 rate limit 함수
--    pg_advisory_xact_lock으로 같은 IP의 동시 요청을 직렬화하여
--    count → delete → insert 사이의 경쟁 조건을 제거한다.
CREATE OR REPLACE FUNCTION public.check_and_record_signup_attempt(
  p_ip       TEXT,
  p_max      INT,
  p_window_ms BIGINT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count        INT;
  v_window_start TIMESTAMPTZ;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(p_ip));

  v_window_start := NOW() - (p_window_ms || ' milliseconds')::INTERVAL;

  -- 전체 만료 기록 정리 (모든 IP의 오래된 행 제거)
  DELETE FROM signup_rate_limit WHERE attempted_at < v_window_start;


  SELECT COUNT(*) INTO v_count FROM signup_rate_limit WHERE ip = p_ip;

  IF v_count >= p_max THEN
    RETURN FALSE;
  END IF;

  INSERT INTO signup_rate_limit (ip) VALUES (p_ip);
  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.check_and_record_signup_attempt(TEXT, INT, BIGINT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_and_record_signup_attempt(TEXT, INT, BIGINT) TO service_role;
