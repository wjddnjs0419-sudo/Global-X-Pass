-- ================================================================
-- SECURITY HARDENING MIGRATION
-- Global X Pass — 2026-04-29
-- Applied: Cloud Security (IAM/RBAC) + OWASP A01/A05 + Blue Team
-- ================================================================

-- ================================================================
-- [CRITICAL] 1. profiles UPDATE — 권한 상승 취약점 수정
-- 기존: USING (true) → 일반 유저가 자신의 role을 'admin'으로 변경 가능
-- ================================================================
DROP POLICY IF EXISTS "관리자 회원 권한 수정 가능" ON public.profiles;
CREATE POLICY "관리자 회원 권한 수정 가능" ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ================================================================
-- [CRITICAL] 2. profiles DELETE — 모든 인증 유저 삭제 가능 취약점 수정
-- 기존: USING (true) → 일반 유저가 타인 계정 삭제 가능
-- ================================================================
DROP POLICY IF EXISTS "관리자 회원 삭제 가능" ON public.profiles;
CREATE POLICY "관리자 회원 삭제 가능" ON public.profiles
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- ================================================================
-- [CRITICAL] 3. profiles INSERT — CSV 임포트 권한 제한
-- 기존: WITH CHECK (true) → 모든 인증 유저가 임의 프로필 삽입 가능
-- ================================================================
DROP POLICY IF EXISTS "관리자 회원 추가(CSV) 가능" ON public.profiles;
CREATE POLICY "관리자 회원 추가(CSV) 가능" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

-- ================================================================
-- [CRITICAL] 4. posts UPDATE — 하드코딩된 admin@test.com 백도어 제거
-- 기존: role = 'admin' OR email = 'admin@test.com' (테스트 계정 우회 가능)
-- 중복 정책 정리 + is_admin() 함수로 통일
-- ================================================================
DROP POLICY IF EXISTS "관리자만 게시물 수정 가능" ON public.posts;
DROP POLICY IF EXISTS "관리자만 게시물 삭제 가능" ON public.posts;
DROP POLICY IF EXISTS "admins can write posts" ON public.posts;

CREATE POLICY "관리자만 게시물 수정 가능" ON public.posts
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ================================================================
-- [CRITICAL] 5. posts DELETE — 일관된 is_admin() 사용으로 통일
-- 기존: 서브쿼리 방식 → is_admin() 함수로 교체
-- ================================================================
DROP POLICY IF EXISTS "Enable delete for admins only" ON public.posts;
CREATE POLICY "Enable delete for admins only" ON public.posts
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- ================================================================
-- [CRITICAL] 6. posts SELECT — expenses 카테고리 접근 제한 복구
-- 기존: "회원만 읽기 가능" (USING true)이 "Role-based expenses post access"를
--       OR 조건으로 무력화 → 일반 유저가 expenses 게시물 접근 가능
-- ================================================================
DROP POLICY IF EXISTS "회원만 읽기 가능" ON public.posts;
DROP POLICY IF EXISTS "Role-based expenses post access" ON public.posts;
CREATE POLICY "posts_select_role_based" ON public.posts
  FOR SELECT TO authenticated
  USING (
    category <> 'expenses' OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role = ANY(ARRAY['admin', 'participant'])
    )
  );

-- ================================================================
-- [HIGH] 7. consulting_slots UPDATE — 예약 외 슬롯 조작 차단
-- 기존: USING (true) → 모든 인증 유저가 임의 슬롯 상태 변경 가능
-- 수정: 'available' 슬롯만 'booked'로만 변경 허용
-- ================================================================
DROP POLICY IF EXISTS "Users can update slot status on booking" ON public.consulting_slots;
CREATE POLICY "Users can update slot status on booking" ON public.consulting_slots
  FOR UPDATE TO authenticated
  USING (status = 'available')
  WITH CHECK (status = 'booked');

-- ================================================================
-- [HIGH] 8. storage.objects — 비인증 유저 이미지 업로드 차단
-- 기존: TO public (anon 포함) → 미로그인 상태에서 무제한 업로드 가능
-- 수정: TO authenticated 만 허용
-- ================================================================
DROP POLICY IF EXISTS "누구나 사진 올리기 가능" ON storage.objects;
CREATE POLICY "인증된 사용자만 사진 올리기 가능" ON storage.objects
  AS PERMISSIVE
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'images');
