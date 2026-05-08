-- ================================================================
-- ENFORCE ADMIN MFA + SERVER-SIDE ROLE CHANGE PATH
-- Global X Pass — 2026-05-07
-- 목적:
-- 1. 관리자 계정은 검증된 MFA factor가 있어야만 admin 권한으로 인정
-- 2. role 변경은 별도 Edge Function 경로에서 재인증 후 처리
-- ================================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
      AND EXISTS (
        SELECT 1
        FROM auth.mfa_factors
        WHERE user_id = auth.uid()
          AND status = 'verified'
      )
      AND (auth.jwt() ->> 'aal') = 'aal2'
  );
END;
$$;

COMMENT ON FUNCTION public.is_admin() IS '관리자 여부 확인. 검증된 MFA factor 존재 + aal2 세션이 모두 필요.';
