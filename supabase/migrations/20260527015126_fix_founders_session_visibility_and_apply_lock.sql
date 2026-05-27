-- ================================================================
-- FIX: Founder's Club 세션 가시성 정책 + 신청 가드 동시성
-- Global X Pass — 2026-05-27
-- 목적:
-- - 20260512150000에서 만든 stale 정책 fc_sessions_select_auth(USING true)가
--   남아 있어, 직전 마이그레이션이 만든 제한 정책이 OR 평가로 무효화되고
--   pending/rejected 세션이 모든 로그인 사용자에게 노출되던 문제 수정.
-- - 세션 가시성은 로그인 사용자 한정(realign 결정) 유지하되, pending/rejected는
--   작성자 본인·admin에게만 노출.
-- - 신청 차단 가드에 FOR UPDATE 행 잠금 추가(상태 변경 경쟁 조건 제거).
-- ================================================================

-- 1) stale/중복 SELECT 정책 제거 후 단일 가시성 정책 재정의 (authenticated 한정)
DROP POLICY IF EXISTS "fc_sessions_select_auth" ON public.founders_club_sessions;
DROP POLICY IF EXISTS "fc_sessions_select_public" ON public.founders_club_sessions;

CREATE POLICY "fc_sessions_select_auth"
  ON public.founders_club_sessions FOR SELECT TO authenticated
  USING (
    status = ANY (ARRAY['recruiting'::text, 'closed'::text, 'completed'::text])
    OR public.is_admin()
    OR auth.uid() = created_by
  );

-- 2) 신청 차단 가드: 세션 상태 조회 시 행 잠금으로 경쟁 조건 제거
CREATE OR REPLACE FUNCTION public.guard_fc_application_session_open()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status text;
BEGIN
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  SELECT status INTO v_status
  FROM public.founders_club_sessions
  WHERE id = NEW.session_id
  FOR UPDATE;

  IF v_status IS NULL OR v_status = ANY (ARRAY['pending'::text, 'rejected'::text]) THEN
    RAISE EXCEPTION 'cannot apply to a Founder''s Club session that is not open for applications';
  END IF;

  RETURN NEW;
END;
$$;
