-- 실시간 에러 모니터링 인프라
-- 프론트(window.onerror/ErrorBoundary)와 Edge Function에서 발생한 에러를
-- 동일한 테이블에 집계하여 /flow-map 실시간 대시보드에서 시각화한다.

-- ── 테이블 ──────────────────────────────────────────────────────────────────
CREATE TABLE public.error_logs (
  id          UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  source      TEXT NOT NULL,
  severity    TEXT NOT NULL CHECK (severity IN ('low','medium','high','critical')),
  message     TEXT NOT NULL,
  stack       TEXT,
  path        TEXT,
  context     JSONB,
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  fingerprint TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_error_logs_created_at  ON public.error_logs (created_at DESC);
CREATE INDEX idx_error_logs_source      ON public.error_logs (source, created_at DESC);
CREATE INDEX idx_error_logs_fingerprint ON public.error_logs (fingerprint, created_at DESC);

ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- 직접 INSERT 차단 (RPC 경유만 허용)
-- SELECT/DELETE는 관리자만
CREATE POLICY error_logs_select_admin ON public.error_logs
  FOR SELECT TO authenticated USING (public.is_admin());

CREATE POLICY error_logs_delete_admin ON public.error_logs
  FOR DELETE TO authenticated USING (public.is_admin());

-- Data API 정책(2026-10-30) 대비 명시 GRANT
GRANT SELECT, DELETE ON TABLE public.error_logs TO authenticated, service_role;
GRANT ALL          ON TABLE public.error_logs TO service_role;
-- anon/authenticated 직접 INSERT 권한 없음 → RPC log_client_error 만 사용 가능

-- ── 클라이언트용 RPC: dedup + lazy cleanup ──────────────────────────────────
CREATE OR REPLACE FUNCTION public.log_client_error(
  p_source    TEXT,
  p_message   TEXT,
  p_severity  TEXT     DEFAULT 'medium',
  p_stack     TEXT     DEFAULT NULL,
  p_path      TEXT     DEFAULT NULL,
  p_context   JSONB    DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_fingerprint TEXT;
  v_recent      UUID;
  v_id          UUID;
  v_severity    TEXT;
BEGIN
  p_source := LEFT(TRIM(COALESCE(p_source, 'unknown')), 80);
  p_message := TRIM(COALESCE(p_message, ''));

  IF p_source = '' OR p_message = '' THEN
    RETURN NULL;
  END IF;

  IF p_source !~ '^[a-z0-9][a-z0-9_-]{0,79}$' THEN
    p_source := 'unknown';
  END IF;

  v_severity := CASE
    WHEN p_severity IN ('low','medium','high','critical') THEN p_severity
    ELSE 'medium'
  END;

  -- 남용 방지: 메시지/스택 길이 상한
  p_message := LEFT(p_message, 2000);
  IF p_stack IS NOT NULL THEN
    p_stack := LEFT(p_stack, 4000);
  END IF;

  -- 같은 source + 메시지 앞 120자 조합은 60초 내 중복 INSERT 차단
  v_fingerprint := encode(
    extensions.digest(p_source || ':' || LEFT(p_message, 120), 'sha256'),
    'hex'
  );

  SELECT id INTO v_recent
  FROM public.error_logs
  WHERE fingerprint = v_fingerprint
    AND created_at > NOW() - INTERVAL '60 seconds'
  LIMIT 1;

  IF v_recent IS NOT NULL THEN
    RETURN v_recent;
  END IF;

  -- 공개 RPC 남용 방지: 익명/동일 사용자 기준 분당 30건까지만 기록
  IF (
    SELECT COUNT(*)
    FROM public.error_logs
    WHERE created_at > NOW() - INTERVAL '60 seconds'
      AND user_id IS NOT DISTINCT FROM auth.uid()
  ) >= 30 THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.error_logs (source, severity, message, stack, path, context, user_id, fingerprint)
  VALUES (p_source, v_severity, p_message, p_stack, p_path, p_context, auth.uid(), v_fingerprint)
  RETURNING id INTO v_id;

  -- 0.2% 확률로 만료 기록(30일 초과) 자동 정리 (pg_cron 미사용 환경 대비)
  IF random() < 0.002 THEN
    DELETE FROM public.error_logs WHERE created_at < NOW() - INTERVAL '30 days';
  END IF;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.log_client_error(TEXT, TEXT, TEXT, TEXT, TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_client_error(TEXT, TEXT, TEXT, TEXT, TEXT, JSONB)
  TO anon, authenticated, service_role;

-- ── 관리자/cron용 명시 정리 함수 ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.cleanup_old_error_logs(
  p_days INT DEFAULT 30
) RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INT;
BEGIN
  DELETE FROM public.error_logs
   WHERE created_at < NOW() - (p_days || ' days')::INTERVAL;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.cleanup_old_error_logs(INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cleanup_old_error_logs(INT) TO service_role;

-- ── Realtime publication 등록 ──────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.error_logs;
