-- 1:1 컨설팅을 온라인 이머젼(기존 전문가 선택형)과 오피스아워(월별 모집 + 관리자 매칭)로 분리.
-- 온라인 이머젼은 기존 consultants / consulting_slots / consulting_reservations를 그대로 사용한다.
-- 오피스아워는 전문가를 노출하지 않고 6~12월 월별로 모집하며, 관리자가 매칭한다.

-- ── 월별 모집 단위 ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.office_hour_months (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period_month date NOT NULL UNIQUE,
  capacity integer NOT NULL DEFAULT 5 CHECK (capacity >= 0),
  is_open boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.office_hour_months IS 'Office hour monthly recruitment units (e.g. 2026-06 ~ 2026-12).';
COMMENT ON COLUMN public.office_hour_months.period_month IS 'First day of the recruitment month, used as the month identifier.';
COMMENT ON COLUMN public.office_hour_months.capacity IS 'Maximum number of active applications accepted for the month.';

-- ── 신청 ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.office_hour_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month_id uuid NOT NULL REFERENCES public.office_hour_months(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  topic text NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status = ANY (ARRAY['pending', 'matched', 'completed', 'cancelled', 'rejected'])),
  matched_expert_name text,
  matched_date date,
  matched_time time,
  matched_location text,
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.office_hour_applications IS 'Office hour applications. Users apply per month; admins match an expert, date, time and location.';
COMMENT ON COLUMN public.office_hour_applications.topic IS 'Free-text consultation topic / area the applicant wants help with.';

CREATE INDEX IF NOT EXISTS idx_office_hour_applications_user ON public.office_hour_applications (user_id);
CREATE INDEX IF NOT EXISTS idx_office_hour_applications_month ON public.office_hour_applications (month_id);

-- 한 사용자는 한 월에 활성 신청 1건 (취소/거절 제외)
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_office_hour_application_per_month
  ON public.office_hour_applications (month_id, user_id)
  WHERE status NOT IN ('cancelled', 'rejected');

-- ── 정원·모집 마감 가드 (BEFORE INSERT) ───────────────────────────
CREATE OR REPLACE FUNCTION public.enforce_office_hour_capacity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_capacity integer;
  v_is_open boolean;
  v_count integer;
BEGIN
  -- 동시 신청 직렬화를 위해 월 row를 잠근다.
  SELECT capacity, is_open INTO v_capacity, v_is_open
  FROM public.office_hour_months
  WHERE id = NEW.month_id
  FOR UPDATE;

  IF v_capacity IS NULL THEN
    RAISE EXCEPTION 'invalid office hour month';
  END IF;

  -- 관리자는 마감/정원과 무관하게 등록 가능.
  IF NOT public.is_admin() THEN
    IF NOT v_is_open THEN
      RAISE EXCEPTION 'office hour month is closed';
    END IF;

    SELECT count(*) INTO v_count
    FROM public.office_hour_applications
    WHERE month_id = NEW.month_id
      AND status NOT IN ('cancelled', 'rejected');

    IF v_count >= v_capacity THEN
      RAISE EXCEPTION 'office hour month is full';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS office_hour_applications_enforce_capacity ON public.office_hour_applications;
CREATE TRIGGER office_hour_applications_enforce_capacity
BEFORE INSERT ON public.office_hour_applications
FOR EACH ROW EXECUTE FUNCTION public.enforce_office_hour_capacity();

-- ── 사용자 취소 가드 (BEFORE UPDATE) ──────────────────────────────
-- 사용자는 본인 신청을 pending/matched에서 cancelled로만 바꿀 수 있고, 다른 필드는 못 바꾼다.
CREATE OR REPLACE FUNCTION public.guard_office_hour_application_user_cancel()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication required';
  END IF;

  IF auth.uid() <> OLD.user_id OR auth.uid() <> NEW.user_id THEN
    RAISE EXCEPTION 'cannot update another user office hour application';
  END IF;

  IF NOT (OLD.status = ANY (ARRAY['pending', 'matched'])) OR NEW.status <> 'cancelled' THEN
    RAISE EXCEPTION 'users can only cancel pending or matched office hour applications';
  END IF;

  IF (
    NEW.id,
    NEW.month_id,
    NEW.user_id,
    NEW.topic,
    NEW.matched_expert_name,
    NEW.matched_date,
    NEW.matched_time,
    NEW.matched_location,
    NEW.admin_note,
    NEW.created_at
  ) IS DISTINCT FROM (
    OLD.id,
    OLD.month_id,
    OLD.user_id,
    OLD.topic,
    OLD.matched_expert_name,
    OLD.matched_date,
    OLD.matched_time,
    OLD.matched_location,
    OLD.admin_note,
    OLD.created_at
  ) THEN
    RAISE EXCEPTION 'users can only change office hour application status to cancelled';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS office_hour_applications_guard_user_cancel ON public.office_hour_applications;
CREATE TRIGGER office_hour_applications_guard_user_cancel
BEFORE UPDATE ON public.office_hour_applications
FOR EACH ROW EXECUTE FUNCTION public.guard_office_hour_application_user_cancel();

REVOKE ALL ON FUNCTION public.enforce_office_hour_capacity() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.guard_office_hour_application_user_cancel() FROM PUBLIC;

-- ── RLS ───────────────────────────────────────────────────────────
ALTER TABLE public.office_hour_months ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.office_hour_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "office_hour_months_read" ON public.office_hour_months;
CREATE POLICY "office_hour_months_read"
  ON public.office_hour_months FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "office_hour_months_admin_all" ON public.office_hour_months;
CREATE POLICY "office_hour_months_admin_all"
  ON public.office_hour_months FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "office_hour_applications_select_own" ON public.office_hour_applications;
CREATE POLICY "office_hour_applications_select_own"
  ON public.office_hour_applications FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "office_hour_applications_insert_own" ON public.office_hour_applications;
CREATE POLICY "office_hour_applications_insert_own"
  ON public.office_hour_applications FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "office_hour_applications_cancel_own" ON public.office_hour_applications;
CREATE POLICY "office_hour_applications_cancel_own"
  ON public.office_hour_applications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND status = ANY (ARRAY['pending', 'matched']))
  WITH CHECK (auth.uid() = user_id AND status = 'cancelled');

DROP POLICY IF EXISTS "office_hour_applications_admin_all" ON public.office_hour_applications;
CREATE POLICY "office_hour_applications_admin_all"
  ON public.office_hour_applications FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ── GRANT (행 단위 제어는 RLS가 담당) ─────────────────────────────
GRANT SELECT ON public.office_hour_months TO anon, authenticated;
GRANT ALL ON public.office_hour_months TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.office_hour_applications TO authenticated;
GRANT ALL ON public.office_hour_applications TO service_role;

-- ── 6~12월 모집 시드 ──────────────────────────────────────────────
INSERT INTO public.office_hour_months (period_month, capacity, is_open, display_order)
VALUES
  ('2026-06-01', 5, true, 0),
  ('2026-07-01', 5, true, 1),
  ('2026-08-01', 5, true, 2),
  ('2026-09-01', 5, true, 3),
  ('2026-10-01', 5, true, 4),
  ('2026-11-01', 5, true, 5),
  ('2026-12-01', 5, true, 6)
ON CONFLICT (period_month) DO NOTHING;
