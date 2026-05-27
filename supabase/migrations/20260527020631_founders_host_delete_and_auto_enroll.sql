-- ================================================================
-- FOUNDER'S CLUB — 호스트 세션 삭제 + 승인 시 등록자 자동 참여
-- Global X Pass — 2026-05-27
-- 목적:
-- - 세션 등록자(created_by)가 본인 세션을 삭제 가능 (수정 = 삭제 후 재등록)
-- - 참여사 등록 세션이 승인(pending→recruiting)될 때 등록자를 자동 참가 처리
-- ================================================================

-- 1) 세션 등록자 본인 세션 삭제 정책 (application은 FK ON DELETE CASCADE)
DROP POLICY IF EXISTS "fc_sessions_delete_host" ON public.founders_club_sessions;
CREATE POLICY "fc_sessions_delete_host"
  ON public.founders_club_sessions FOR DELETE TO authenticated
  USING (auth.uid() = created_by);

-- 2) 승인(pending→recruiting) 시 등록자 자동 참가 신청(accepted)
CREATE OR REPLACE FUNCTION public.auto_enroll_founders_session_host()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'recruiting'
     AND OLD.status = 'pending'
     AND NEW.created_by IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM public.founders_club_applications
       WHERE session_id = NEW.id
         AND user_id = NEW.created_by
         AND status <> ALL (ARRAY['cancelled'::text, 'rejected'::text])
     )
  THEN
    INSERT INTO public.founders_club_applications (session_id, user_id, status, message)
    VALUES (NEW.id, NEW.created_by, 'accepted', '세션 등록자 자동 참여');
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.auto_enroll_founders_session_host() IS
  '참여사 등록 세션이 승인(recruiting)될 때 등록자를 자동으로 accepted 참여 처리.';

DROP TRIGGER IF EXISTS fc_sessions_auto_enroll_host ON public.founders_club_sessions;
CREATE TRIGGER fc_sessions_auto_enroll_host
AFTER UPDATE ON public.founders_club_sessions
FOR EACH ROW EXECUTE FUNCTION public.auto_enroll_founders_session_host();

REVOKE ALL ON FUNCTION public.auto_enroll_founders_session_host() FROM PUBLIC;
