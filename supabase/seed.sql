-- ============================================================================
-- LOCAL DEV SEED — supabase db reset 시 자동 적용 (로컬 전용, 프로덕션 무관)
-- 로그인: admin@test.com / admin123456  (로컬 MFA bypass 활성)
-- 모두 멱등(ON CONFLICT / NOT EXISTS) — 반복 reset 안전.
-- ============================================================================

-- 고정 UUID (로컬 전용 식별자) -------------------------------------------------
--   admin user      a0000000-0000-0000-0000-000000000001
--   consultant      a0000000-0000-0000-0000-000000000010
--   consulting slot a0000000-0000-0000-0000-000000000011
--   fc session      a0000000-0000-0000-0000-000000000020
--   event post      a0000000-0000-0000-0000-000000000030

-- 1) 어드민 auth 유저 (handle_new_user 트리거가 profiles 행 자동 생성) ----------
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data, is_super_admin
)
SELECT
  '00000000-0000-0000-0000-000000000000',
  'a0000000-0000-0000-0000-000000000001',
  'authenticated', 'authenticated', 'admin@test.com',
  extensions.crypt('admin123456', extensions.gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"name":"로컬 관리자"}'::jsonb,
  false
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users WHERE id = 'a0000000-0000-0000-0000-000000000001'
);

-- 이메일 로그인용 identity
INSERT INTO auth.identities (
  id, user_id, identity_data, provider, provider_id,
  last_sign_in_at, created_at, updated_at
)
SELECT
  gen_random_uuid(),
  'a0000000-0000-0000-0000-000000000001',
  '{"sub":"a0000000-0000-0000-0000-000000000001","email":"admin@test.com","email_verified":true}'::jsonb,
  'email', 'a0000000-0000-0000-0000-000000000001',
  now(), now(), now()
WHERE NOT EXISTS (
  SELECT 1 FROM auth.identities
  WHERE provider = 'email' AND provider_id = 'a0000000-0000-0000-0000-000000000001'
);

-- 트리거가 만든 profiles 행을 admin/approved 로 승격
UPDATE public.profiles
SET role = 'admin', status = 'approved', name = COALESCE(name, '로컬 관리자')
WHERE id = 'a0000000-0000-0000-0000-000000000001';

-- 2) 로컬 MFA bypass 활성 (싱글톤 id=true) — 로컬서 admin 게이트 통과용 ----------
INSERT INTO public.admin_mfa_bypass (id, enabled, expires_at, reason, updated_at)
VALUES (true, true, now() + interval '365 days', 'local dev seed', now())
ON CONFLICT (id) DO UPDATE
SET enabled = true,
    expires_at = now() + interval '365 days',
    reason = 'local dev seed',
    updated_at = now();

-- 3) 샘플 컨설턴트 + 컨설팅 슬롯 ----------------------------------------------
INSERT INTO public.consultants (id, name, category, bio, is_active, display_order)
VALUES (
  'a0000000-0000-0000-0000-000000000010',
  '샘플 컨설턴트', 'global', '로컬 테스트용 글로벌 진출 컨설턴트', true, 1
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.consulting_slots (id, consultant_id, slot_date, slot_time, duration_minutes, status)
VALUES (
  'a0000000-0000-0000-0000-000000000011',
  'a0000000-0000-0000-0000-000000000010',
  (now() + interval '7 days')::date, '14:00', 60, 'available'
)
ON CONFLICT (id) DO NOTHING;

-- 4) 샘플 Founder's Club 세션 (모집중) ----------------------------------------
INSERT INTO public.founders_club_sessions (id, theme, description, max_participants, session_date, session_time, status, created_by)
VALUES (
  'a0000000-0000-0000-0000-000000000020',
  '로컬 테스트 세션', '로컬 개발용 Founder''s Club 세션', 6,
  (now() + interval '21 days')::date, '19:00', 'recruiting',
  'a0000000-0000-0000-0000-000000000001'
)
ON CONFLICT (id) DO NOTHING;

-- 5) 샘플 행사 게시물 (events 카테고리, 선착순 정원 30) ------------------------
INSERT INTO public.posts (id, title, content, author_id, category, status, is_public, event_date, location, capacity, slots_remaining, max_spots)
VALUES (
  'a0000000-0000-0000-0000-000000000030',
  '로컬 테스트 행사', '로컬 개발용 샘플 행사 공지입니다.',
  'a0000000-0000-0000-0000-000000000001',
  'events', 'published', true,
  (now() + interval '10 days')::date, '온라인', 30, 30, 30
)
ON CONFLICT (id) DO NOTHING;
