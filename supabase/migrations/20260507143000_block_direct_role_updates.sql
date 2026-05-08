-- ================================================================
-- BLOCK DIRECT ROLE UPDATES OUTSIDE SERVER-MANAGED PATH
-- Global X Pass — 2026-05-07
-- 목적:
-- - authenticated 관리자 세션이 직접 public.profiles.role을 수정하는 우회 경로 차단
-- - role 변경은 service_role 기반의 서버 관리 경로(update-user-role 등)로만 허용
-- ================================================================

CREATE OR REPLACE FUNCTION public.guard_profile_role_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role AND auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'profiles.role can only be changed via the server-managed role update path';
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.guard_profile_role_changes() IS
  'public.profiles.role 직접 변경 차단. role 변경은 service_role 기반 서버 경로만 허용.';

DROP TRIGGER IF EXISTS profiles_guard_role_changes ON public.profiles;

CREATE TRIGGER profiles_guard_role_changes
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.guard_profile_role_changes();
