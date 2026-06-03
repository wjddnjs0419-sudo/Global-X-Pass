-- MFA 우회 무기한 옵션 지원.
-- 기존: enabled=true AND expires_at IS NOT NULL AND expires_at > now()
-- 변경: enabled=true AND (expires_at IS NULL[무기한] OR expires_at > now())
-- 해제 행은 enabled=false 로 게이트되므로 expires_at NULL 이어도 활성으로 새지 않는다.
CREATE OR REPLACE FUNCTION public.is_admin_mfa_bypassed()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_mfa_bypass
    WHERE enabled = true
      AND (expires_at IS NULL OR expires_at > now())
  );
$$;

COMMENT ON FUNCTION public.is_admin_mfa_bypassed() IS 'MFA 우회 활성 여부. expires_at NULL=무기한, 그 외엔 만료 지나면 자동 false.';
