-- error_logs는 원본 이벤트 기록으로 유지하고,
-- error_issues가 fingerprint별 현재 운영 상태를 대표한다.

ALTER TABLE public.error_logs
  ADD COLUMN IF NOT EXISTS build_id TEXT,
  ADD COLUMN IF NOT EXISTS source_location TEXT;

CREATE INDEX IF NOT EXISTS idx_error_logs_build_id
  ON public.error_logs (build_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.error_issues (
  fingerprint     TEXT PRIMARY KEY,
  source          TEXT NOT NULL,
  severity        TEXT NOT NULL CHECK (severity IN ('low','medium','high','critical')),
  status          TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','monitoring','resolved','reopened','ignored')),
  message         TEXT NOT NULL,
  stack           TEXT,
  path            TEXT,
  context         JSONB,
  source_location TEXT,
  first_seen_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_build_id   TEXT,
  last_log_id     UUID REFERENCES public.error_logs(id) ON DELETE SET NULL,
  occurrence_count INT NOT NULL DEFAULT 1,
  monitoring_at   TIMESTAMPTZ,
  resolved_at     TIMESTAMPTZ,
  ignored_at      TIMESTAMPTZ,
  reopened_at     TIMESTAMPTZ,
  resolved_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_note   TEXT,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_error_issues_status_source
  ON public.error_issues (status, source, last_seen_at DESC);

CREATE INDEX IF NOT EXISTS idx_error_issues_last_build
  ON public.error_issues (last_build_id, status, last_seen_at DESC);

ALTER TABLE public.error_issues ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS error_issues_select_admin ON public.error_issues;
CREATE POLICY error_issues_select_admin ON public.error_issues
  FOR SELECT TO authenticated USING (public.is_admin());

GRANT SELECT ON TABLE public.error_issues TO authenticated, service_role;
GRANT ALL    ON TABLE public.error_issues TO service_role;

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
  v_build_id    TEXT;
  v_location    TEXT;
  v_inserted    BOOLEAN := FALSE;
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

  p_message := LEFT(p_message, 2000);
  IF p_stack IS NOT NULL THEN
    p_stack := LEFT(p_stack, 4000);
  END IF;

  v_build_id := NULLIF(LEFT(TRIM(COALESCE(p_context ->> 'build_id', '')), 120), '');
  v_location := NULLIF(LEFT(TRIM(COALESCE(
    p_context ->> 'source_location',
    substring(COALESCE(p_stack, '') FROM '(src/[^[:space:])]+:[0-9]+:[0-9]+)'),
    substring(COALESCE(p_stack, '') FROM '(src/[^[:space:])]+:[0-9]+)')
  )), 240), '');

  v_fingerprint := encode(
    extensions.digest(p_source || ':' || LEFT(p_message, 120) || ':' || COALESCE(v_location, ''), 'sha256'),
    'hex'
  );

  SELECT id INTO v_recent
  FROM public.error_logs
  WHERE fingerprint = v_fingerprint
    AND created_at > NOW() - INTERVAL '60 seconds'
  LIMIT 1;

  IF v_recent IS NOT NULL THEN
    v_id := v_recent;
  ELSE
    IF (
      SELECT COUNT(*)
      FROM public.error_logs
      WHERE created_at > NOW() - INTERVAL '60 seconds'
        AND user_id IS NOT DISTINCT FROM auth.uid()
    ) >= 30 THEN
      RETURN NULL;
    END IF;

    INSERT INTO public.error_logs (
      source, severity, message, stack, path, context, user_id, fingerprint, build_id, source_location
    )
    VALUES (
      p_source, v_severity, p_message, p_stack, p_path, p_context, auth.uid(), v_fingerprint, v_build_id, v_location
    )
    RETURNING id INTO v_id;

    v_inserted := TRUE;
  END IF;

  INSERT INTO public.error_issues (
    fingerprint, source, severity, status, message, stack, path, context,
    source_location, first_seen_at, last_seen_at, last_build_id, last_log_id, occurrence_count, updated_at
  )
  VALUES (
    v_fingerprint, p_source, v_severity, 'open', p_message, p_stack, p_path, p_context,
    v_location, NOW(), NOW(), v_build_id, v_id, 1, NOW()
  )
  ON CONFLICT (fingerprint) DO UPDATE SET
    source = EXCLUDED.source,
    severity = CASE
      WHEN CASE EXCLUDED.severity
        WHEN 'critical' THEN 4 WHEN 'high' THEN 3 WHEN 'medium' THEN 2 ELSE 1 END
      > CASE public.error_issues.severity
        WHEN 'critical' THEN 4 WHEN 'high' THEN 3 WHEN 'medium' THEN 2 ELSE 1 END
      THEN EXCLUDED.severity
      ELSE public.error_issues.severity
    END,
    status = CASE
      WHEN public.error_issues.status = 'ignored' THEN 'ignored'
      WHEN public.error_issues.status IN ('monitoring','resolved') THEN 'reopened'
      ELSE public.error_issues.status
    END,
    message = EXCLUDED.message,
    stack = EXCLUDED.stack,
    path = EXCLUDED.path,
    context = EXCLUDED.context,
    source_location = COALESCE(EXCLUDED.source_location, public.error_issues.source_location),
    last_seen_at = NOW(),
    last_build_id = COALESCE(EXCLUDED.last_build_id, public.error_issues.last_build_id),
    last_log_id = EXCLUDED.last_log_id,
    occurrence_count = public.error_issues.occurrence_count + 1,
    reopened_at = CASE
      WHEN public.error_issues.status IN ('monitoring','resolved') THEN NOW()
      ELSE public.error_issues.reopened_at
    END,
    updated_at = NOW();

  IF v_inserted AND random() < 0.002 THEN
    DELETE FROM public.error_logs WHERE created_at < NOW() - INTERVAL '30 days';
  END IF;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.log_client_error(TEXT, TEXT, TEXT, TEXT, TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_client_error(TEXT, TEXT, TEXT, TEXT, TEXT, JSONB)
  TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.mark_error_issue_monitoring(
  p_fingerprint TEXT,
  p_note TEXT DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin privileges required';
  END IF;

  UPDATE public.error_issues
     SET status = 'monitoring',
         monitoring_at = NOW(),
         resolved_at = NULL,
         ignored_at = NULL,
         resolved_by = auth.uid(),
         resolved_note = NULLIF(LEFT(TRIM(COALESCE(p_note, '')), 500), ''),
         updated_at = NOW()
   WHERE fingerprint = p_fingerprint;
END;
$$;

CREATE OR REPLACE FUNCTION public.resolve_error_issue(
  p_fingerprint TEXT,
  p_note TEXT DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin privileges required';
  END IF;

  UPDATE public.error_issues
     SET status = 'resolved',
         resolved_at = NOW(),
         monitoring_at = COALESCE(monitoring_at, NOW()),
         ignored_at = NULL,
         resolved_by = auth.uid(),
         resolved_note = NULLIF(LEFT(TRIM(COALESCE(p_note, '')), 500), ''),
         updated_at = NOW()
   WHERE fingerprint = p_fingerprint;
END;
$$;

CREATE OR REPLACE FUNCTION public.ignore_error_issue(
  p_fingerprint TEXT,
  p_note TEXT DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin privileges required';
  END IF;

  UPDATE public.error_issues
     SET status = 'ignored',
         ignored_at = NOW(),
         resolved_by = auth.uid(),
         resolved_note = NULLIF(LEFT(TRIM(COALESCE(p_note, '')), 500), ''),
         updated_at = NOW()
   WHERE fingerprint = p_fingerprint;
END;
$$;

REVOKE ALL ON FUNCTION public.mark_error_issue_monitoring(TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.resolve_error_issue(TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.ignore_error_issue(TEXT, TEXT) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.mark_error_issue_monitoring(TEXT, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.resolve_error_issue(TEXT, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.ignore_error_issue(TEXT, TEXT) TO authenticated, service_role;

WITH latest AS (
  SELECT DISTINCT ON (fingerprint)
    fingerprint,
    source,
    severity,
    message,
    stack,
    path,
    context,
    source_location,
    build_id,
    id,
    created_at
  FROM public.error_logs
  ORDER BY fingerprint, created_at DESC
),
stats AS (
  SELECT fingerprint, MIN(created_at) AS first_seen_at, MAX(created_at) AS last_seen_at, COUNT(*)::INT AS occurrence_count
  FROM public.error_logs
  GROUP BY fingerprint
)
INSERT INTO public.error_issues (
  fingerprint, source, severity, status, message, stack, path, context,
  source_location, first_seen_at, last_seen_at, last_build_id, last_log_id, occurrence_count, updated_at
)
SELECT
  latest.fingerprint,
  latest.source,
  latest.severity,
  'open',
  latest.message,
  latest.stack,
  latest.path,
  latest.context,
  latest.source_location,
  stats.first_seen_at,
  stats.last_seen_at,
  latest.build_id,
  latest.id,
  stats.occurrence_count,
  NOW()
FROM latest
JOIN stats USING (fingerprint)
ON CONFLICT (fingerprint) DO NOTHING;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.error_issues;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
