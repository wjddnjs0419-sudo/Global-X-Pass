-- Local Supabase only: verifies the Office Hour visibility invariant as an authenticated user.
-- Run with:
-- docker exec -i supabase_db_Global_X_Pass psql -v ON_ERROR_STOP=1 -U postgres -d postgres < scripts/test-office-hour-visibility-local.sql
BEGIN;

INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'b0000000-0000-0000-0000-000000000001',
  'authenticated', 'authenticated', 'office-hour-visibility@test.local', '', now(),
  '{"provider":"email","providers":["email"]}', '{"name":"Office Hour Test"}', now(), now()
);

INSERT INTO public.office_hour_months (period_month, capacity, is_open, is_visible, display_order)
VALUES
  ('2099-01-01', 5, true, false, 9990),
  ('2099-02-01', 5, false, true, 9991),
  ('2099-03-01', 5, true, true, 9992);

-- Existing application was created before the month became hidden.
UPDATE public.office_hour_months SET is_visible = true WHERE period_month = '2099-01-01';
INSERT INTO public.office_hour_applications (month_id, user_id, topic, status)
SELECT id, 'b0000000-0000-0000-0000-000000000001', '숨김 전 기존 신청', 'pending'
FROM public.office_hour_months WHERE period_month = '2099-01-01';
UPDATE public.office_hour_months SET is_visible = false WHERE period_month = '2099-01-01';

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', 'b0000000-0000-0000-0000-000000000001', true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);

DO $$
DECLARE
  v_user_id uuid := 'b0000000-0000-0000-0000-000000000001';
  v_hidden_month_id uuid;
  v_closed_month_id uuid;
  v_open_month_id uuid;
BEGIN
  SELECT id INTO v_hidden_month_id FROM public.office_hour_months WHERE period_month = '2099-01-01';
  SELECT id INTO v_closed_month_id FROM public.office_hour_months WHERE period_month = '2099-02-01';
  SELECT id INTO v_open_month_id FROM public.office_hour_months WHERE period_month = '2099-03-01';

  BEGIN
    INSERT INTO public.office_hour_applications (month_id, user_id, topic, status)
    VALUES (v_hidden_month_id, v_user_id, '숨김 월 직접 신청', 'pending');
    RAISE EXCEPTION 'hidden month insert unexpectedly succeeded';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM <> 'office hour month is not visible' THEN RAISE; END IF;
  END;

  BEGIN
    INSERT INTO public.office_hour_applications (month_id, user_id, topic, status)
    VALUES (v_closed_month_id, v_user_id, '마감 월 직접 신청', 'pending');
    RAISE EXCEPTION 'closed month insert unexpectedly succeeded';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM <> 'office hour month is closed' THEN RAISE; END IF;
  END;

  INSERT INTO public.office_hour_applications (month_id, user_id, topic, status)
  VALUES (v_open_month_id, v_user_id, '노출 월 정상 신청', 'pending');

  -- MyPage's own-application query must retain the hidden month's period metadata.
  IF NOT EXISTS (
    SELECT 1
    FROM public.office_hour_applications a
    JOIN public.office_hour_months m ON m.id = a.month_id
    WHERE a.user_id = v_user_id
      AND a.topic = '숨김 전 기존 신청'
      AND m.period_month = '2099-01-01'
      AND m.is_visible = false
  ) THEN
    RAISE EXCEPTION 'hidden month existing application or period metadata is unavailable';
  END IF;
END;
$$;

RESET ROLE;

-- The admin Edge Function uses service-role access; this query confirms its month join still includes hidden months.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.office_hour_applications a
    JOIN public.office_hour_months m ON m.id = a.month_id
    WHERE a.user_id = 'b0000000-0000-0000-0000-000000000001'
      AND a.topic = '숨김 전 기존 신청'
      AND m.period_month = '2099-01-01'
      AND m.is_visible = false
  ) THEN
    RAISE EXCEPTION 'admin hidden-month application query lost data';
  END IF;
END;
$$;

ROLLBACK;
