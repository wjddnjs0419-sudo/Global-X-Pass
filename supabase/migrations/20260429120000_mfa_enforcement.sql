-- ================================================================
-- MFA ENFORCEMENT MIGRATION
-- Global X Pass — 2026-04-29
-- 목적: 관리자 계정에 MFA(2단계 인증)가 설정된 경우 AAL2(2단계 인증 완료)를 강제함
-- ================================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
      AND (
        -- 1. MFA가 설정되지 않은 경우 기존처럼 허용
        NOT EXISTS (
          SELECT 1 FROM auth.mfa_factors
          WHERE user_id = auth.uid()
            AND status = 'verified'
        )
        OR
        -- 2. MFA가 설정된 경우 반드시 aal2(2단계 인증 완료)여야 함
        (auth.jwt() ->> 'aal') = 'aal2'
      )
  );
END;
$$;

COMMENT ON FUNCTION public.is_admin() IS '관리자 여부 확인. MFA 설정 시 aal2 필수 체크 포함.';
