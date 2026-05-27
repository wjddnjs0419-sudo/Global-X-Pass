-- ================================================================
-- FOUNDER'S CLUB — MEMBER-SUBMITTED SESSIONS WITH ADMIN APPROVAL
-- Global X Pass — 2026-05-27
-- 목적:
-- - participant(참여사 담당자)가 세션을 직접 등록(status='pending')하고,
--   admin(운영사)이 최종 승인(recruiting) 또는 반려(rejected)한다.
-- - 허위 등록 방지: 등록은 participant/admin만 가능, 자기 승인 우회 차단(RLS).
-- ================================================================

-- 1) 등록자 추적 컬럼 (profile 삭제 시 세션은 보존, 작성자만 NULL)
ALTER TABLE public.founders_club_sessions
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.founders_club_sessions.created_by IS
  '세션 등록자(profiles.id). participant 등록 세션 추적용. admin 직접 등록 시 NULL 허용.';

-- 2) 상태에 pending(승인대기)/rejected(반려) 추가
ALTER TABLE public.founders_club_sessions
  DROP CONSTRAINT IF EXISTS founders_club_sessions_status_check;

ALTER TABLE public.founders_club_sessions
  ADD CONSTRAINT founders_club_sessions_status_check
  CHECK (status = ANY (ARRAY['pending'::text, 'recruiting'::text, 'closed'::text, 'completed'::text, 'rejected'::text]));

-- 3) 세션 등록 권한 헬퍼 (participant 또는 admin). RLS 재귀 방지 위해 SECURITY DEFINER.
CREATE OR REPLACE FUNCTION public.is_founders_session_host()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role = ANY (ARRAY['participant'::text, 'admin'::text])
  );
$$;

COMMENT ON FUNCTION public.is_founders_session_host() IS
  'auth.uid()의 역할이 participant 또는 admin인지 여부. Founder''s Club 세션 등록 권한 게이트.';

GRANT EXECUTE ON FUNCTION public.is_founders_session_host() TO anon, authenticated, service_role;

-- 4) SELECT 정책 재정의: pending/rejected 세션은 작성자 본인·admin에게만 노출
DROP POLICY IF EXISTS "fc_sessions_select_public" ON public.founders_club_sessions;
CREATE POLICY "fc_sessions_select_public"
  ON public.founders_club_sessions FOR SELECT TO anon, authenticated
  USING (
    status = ANY (ARRAY['recruiting'::text, 'closed'::text, 'completed'::text])
    OR public.is_admin()
    OR auth.uid() = created_by
  );

-- 5) participant 등록 정책: 본인 명의 + pending 상태로만 INSERT 허용.
--    (admin 직접 등록/전체 관리는 기존 fc_sessions_all_admin 정책이 담당)
DROP POLICY IF EXISTS "fc_sessions_insert_host" ON public.founders_club_sessions;
CREATE POLICY "fc_sessions_insert_host"
  ON public.founders_club_sessions FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = created_by
    AND status = 'pending'
    AND public.is_founders_session_host()
  );

-- 6) 미승인(pending)·반려(rejected) 세션에는 신청 불가 (admin 예외).
--    pending 세션은 작성자/admin만 조회 가능하나, session_id 추측 신청까지 차단.
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
  WHERE id = NEW.session_id;

  IF v_status IS NULL OR v_status = ANY (ARRAY['pending'::text, 'rejected'::text]) THEN
    RAISE EXCEPTION 'cannot apply to a Founder''s Club session that is not open for applications';
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.guard_fc_application_session_open() IS
  '승인 전(pending)·반려(rejected) Founder''s Club 세션 신청 차단. admin은 예외.';

DROP TRIGGER IF EXISTS fc_applications_guard_session_open ON public.founders_club_applications;
CREATE TRIGGER fc_applications_guard_session_open
BEFORE INSERT ON public.founders_club_applications
FOR EACH ROW EXECUTE FUNCTION public.guard_fc_application_session_open();

REVOKE ALL ON FUNCTION public.guard_fc_application_session_open() FROM PUBLIC;
