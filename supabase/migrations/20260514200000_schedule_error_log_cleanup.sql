-- error_logs 장기 적재 방지: 매일 새벽 03:20 UTC에 30일 초과 로그 정리

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM cron.job
    WHERE jobname = 'cleanup-old-error-logs'
  ) THEN
    PERFORM cron.unschedule('cleanup-old-error-logs');
  END IF;
END;
$$;

SELECT cron.schedule(
  'cleanup-old-error-logs',
  '20 3 * * *',
  $$SELECT public.cleanup_old_error_logs(30);$$
);
