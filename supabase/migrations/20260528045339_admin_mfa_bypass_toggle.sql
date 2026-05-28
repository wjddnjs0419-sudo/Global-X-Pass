-- ================================================================
-- ADMIN MFA BYPASS TOGGLE (시한제)
-- Global X Pass — 2026-05-28
-- 목적: super admin이 일정 기간 동안 일반 어드민의 MFA(AAL2) 요구를
--       임시로 우회시킬 수 있게 하되, 만료 시각 지나면 자동 원복.
-- ================================================================

-- 1) 단일 row 강제 테이블
CREATE TABLE IF NOT EXISTS public.admin_mfa_bypass (
  id boolean PRIMARY KEY DEFAULT true CHECK (id = true),
  enabled boolean NOT NULL DEFAULT false,
  expires_at timestamptz,
  enabled_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  enabled_at timestamptz,
  reason text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.admin_mfa_bypass IS '관리자 MFA 우회 토글 상태 (단일 row, super admin EF만 변경)';

-- 시드 1 row (이후 UPDATE만)
INSERT INTO public.admin_mfa_bypass (id, enabled)
VALUES (true, false)
ON CONFLICT (id) DO NOTHING;

-- 2) RLS — authenticated SELECT만, INSERT/UPDATE/DELETE는 service_role만
ALTER TABLE public.admin_mfa_bypass ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_mfa_bypass_select_authenticated ON public.admin_mfa_bypass;
CREATE POLICY admin_mfa_bypass_select_authenticated
  ON public.admin_mfa_bypass
  FOR SELECT
  TO authenticated
  USING (true);

-- 3) is_admin_mfa_bypassed() — enabled AND expires_at > now()
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
      AND expires_at IS NOT NULL
      AND expires_at > now()
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin_mfa_bypassed() TO authenticated, anon;
COMMENT ON FUNCTION public.is_admin_mfa_bypassed() IS 'MFA 우회 토글 활성·미만료 여부. 만료 지나면 자동 false.';

-- 4) is_admin() 패치 — bypass OR (verified factor + aal2)
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
      AND (
        public.is_admin_mfa_bypassed()
        OR (
          EXISTS (
            SELECT 1
            FROM auth.mfa_factors
            WHERE user_id = auth.uid()
              AND status = 'verified'
          )
          AND (auth.jwt() ->> 'aal') = 'aal2'
        )
      )
  );
END;
$$;

COMMENT ON FUNCTION public.is_admin() IS '관리자 여부 확인. MFA 우회 활성 OR (검증된 MFA factor + aal2 세션).';
