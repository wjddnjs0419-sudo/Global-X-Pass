-- ================================================================
-- POLICY CLEANUP & DATABASE DOCUMENTATION
-- Global X Pass — 2026-04-29
-- 목적: 팀 가독성을 위한 정책 명명 통일 및 테이블 설명 추가
-- 기능 변경 없음 — 로직 동일, 이름 및 주석만 정리
--
-- 명명 규칙: {테이블}_{operation}_{대상}
--   operation : select / insert / update / delete / all
--   대상      : admin / user_own / public / auth
-- ================================================================


-- ================================================================
-- SECTION 1. 테이블 & 컬럼 설명 추가 (Table Editor에 표시됨)
-- ================================================================

COMMENT ON TABLE public.posts
  IS '게시물 테이블. category: notice(공지) / news(뉴스) / events(행사) / blog(블로그) / expenses(사업비자료실)';
COMMENT ON COLUMN public.posts.category
  IS 'notice | news | events | blog | expenses';
COMMENT ON COLUMN public.posts.event_status
  IS '접수예정 | 접수중 | 마감임박 | 마감 (events 카테고리 전용)';
COMMENT ON COLUMN public.posts.tags
  IS '단일 태그 (예: 네트워킹). 구버전 데이터는 콤마 구분 가능';
COMMENT ON COLUMN public.posts.is_featured
  IS 'BlogPage 히어로 배너 표시 여부. 카테고리당 1개만 true 권장';

COMMENT ON TABLE public.profiles
  IS '사용자 프로필. role: admin(관리자) / participant(참여사 담당자) / user(일반)';
COMMENT ON COLUMN public.profiles.role
  IS 'admin | participant | user';
COMMENT ON COLUMN public.profiles.user_type
  IS '회원가입 시 입력한 유형 (예: startup, investor 등)';

COMMENT ON TABLE public.consultants
  IS '1:1 컨설팅 전문가. category: legal(법률) / global(글로벌) / tech(기술)';
COMMENT ON TABLE public.consulting_slots
  IS '컨설팅 가능 시간 슬롯. status: available / booked / cancelled';
COMMENT ON TABLE public.consulting_reservations
  IS '컨설팅 예약 요청. slot_id UNIQUE → 슬롯당 1건만 허용. status: pending / confirmed / rejected';

COMMENT ON TABLE public.founders_club_sessions
  IS 'Founder''s Club 소규모 네트워킹 세션. status: recruiting / closed / completed';
COMMENT ON TABLE public.founders_club_applications
  IS 'Founder''s Club 참가 신청. (session_id, user_id) UNIQUE → 중복 신청 방지';

COMMENT ON TABLE public.activity_logs
  IS '관리자용 게시물 활동 로그 (INSERT / UPDATE / DELETE 자동 기록)';
COMMENT ON TABLE public.page_views
  IS '페이지 조회 수 분석. 동일 경로 30분 이내 중복 기록 방지는 프론트에서 처리';


-- ================================================================
-- SECTION 2. posts 정책 정리
-- ================================================================

DROP POLICY IF EXISTS "posts_select_role_based"       ON public.posts;
DROP POLICY IF EXISTS "관리자만 쓰기 가능"              ON public.posts;
DROP POLICY IF EXISTS "관리자만 게시물 수정 가능"        ON public.posts;
DROP POLICY IF EXISTS "Enable delete for admins only"  ON public.posts;

-- 읽기: expenses는 admin/participant만, 나머지는 로그인 유저 전체
CREATE POLICY "posts_select_auth"
  ON public.posts FOR SELECT TO authenticated
  USING (
    category <> 'expenses'
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role = ANY(ARRAY['admin', 'participant'])
    )
  );

-- 작성: admin만
CREATE POLICY "posts_insert_admin"
  ON public.posts FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

-- 수정: admin만
CREATE POLICY "posts_update_admin"
  ON public.posts FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 삭제: admin만
CREATE POLICY "posts_delete_admin"
  ON public.posts FOR DELETE TO authenticated
  USING (public.is_admin());


-- ================================================================
-- SECTION 3. profiles 정책 정리
-- ================================================================

DROP POLICY IF EXISTS "Users can read own profile"      ON public.profiles;
DROP POLICY IF EXISTS "Admin can read all profiles"     ON public.profiles;
DROP POLICY IF EXISTS "관리자 회원 권한 수정 가능"          ON public.profiles;
DROP POLICY IF EXISTS "관리자 회원 삭제 가능"              ON public.profiles;
DROP POLICY IF EXISTS "관리자 회원 추가(CSV) 가능"         ON public.profiles;

-- 읽기: 본인 프로필
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid());

-- 읽기: admin은 전체 조회
CREATE POLICY "profiles_select_admin"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.is_admin());

-- 추가: admin만 (CSV 임포트)
CREATE POLICY "profiles_insert_admin"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

-- 수정: admin만
CREATE POLICY "profiles_update_admin"
  ON public.profiles FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 삭제: admin만
CREATE POLICY "profiles_delete_admin"
  ON public.profiles FOR DELETE TO authenticated
  USING (public.is_admin());


-- ================================================================
-- SECTION 4. consultants 정책 정리
-- ================================================================

DROP POLICY IF EXISTS "Admin full access on consultants"      ON public.consultants;
DROP POLICY IF EXISTS "Public can view active consultants"    ON public.consultants;

-- 읽기: 활성화된 전문가는 비로그인 포함 전체 공개
CREATE POLICY "consultants_select_public"
  ON public.consultants FOR SELECT TO anon, authenticated
  USING (is_active = true);

-- 등록/수정/삭제: admin만
CREATE POLICY "consultants_all_admin"
  ON public.consultants TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ================================================================
-- SECTION 5. consulting_slots 정책 정리
-- ================================================================

DROP POLICY IF EXISTS "Admin full access on consulting_slots"     ON public.consulting_slots;
DROP POLICY IF EXISTS "Public can view available slots"           ON public.consulting_slots;
DROP POLICY IF EXISTS "Users can update slot status on booking"   ON public.consulting_slots;

-- 읽기: 비로그인 포함 전체 공개
CREATE POLICY "consulting_slots_select_public"
  ON public.consulting_slots FOR SELECT TO anon, authenticated
  USING (true);

-- 예약: 로그인 유저가 available → booked 로만 변경 가능
CREATE POLICY "consulting_slots_update_booking"
  ON public.consulting_slots FOR UPDATE TO authenticated
  USING (status = 'available')
  WITH CHECK (status = 'booked');

-- 슬롯 관리 전체: admin만
CREATE POLICY "consulting_slots_all_admin"
  ON public.consulting_slots TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ================================================================
-- SECTION 6. consulting_reservations 정책 정리
-- ================================================================

DROP POLICY IF EXISTS "Admin full access on consulting_reservations"  ON public.consulting_reservations;
DROP POLICY IF EXISTS "Users can create reservations"                 ON public.consulting_reservations;
DROP POLICY IF EXISTS "Users can view own reservations"               ON public.consulting_reservations;

-- 읽기: 본인 예약만
CREATE POLICY "consulting_reservations_select_own"
  ON public.consulting_reservations FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- 신청: 본인 명의로만 가능
CREATE POLICY "consulting_reservations_insert_own"
  ON public.consulting_reservations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 전체 관리: admin만 (수락/거절 등)
CREATE POLICY "consulting_reservations_all_admin"
  ON public.consulting_reservations TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ================================================================
-- SECTION 7. founders_club_sessions 정책 정리
-- ================================================================

DROP POLICY IF EXISTS "Admin full access on founders_club_sessions"  ON public.founders_club_sessions;
DROP POLICY IF EXISTS "Anyone can view founders club sessions"        ON public.founders_club_sessions;

-- 읽기: 비로그인 포함 전체 공개
CREATE POLICY "fc_sessions_select_public"
  ON public.founders_club_sessions FOR SELECT TO anon, authenticated
  USING (true);

-- 세션 관리 전체: admin만
CREATE POLICY "fc_sessions_all_admin"
  ON public.founders_club_sessions TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ================================================================
-- SECTION 8. founders_club_applications 정책 정리
-- ================================================================

DROP POLICY IF EXISTS "Admin full access on founders_club_applications"       ON public.founders_club_applications;
DROP POLICY IF EXISTS "Users can insert own founders club applications"        ON public.founders_club_applications;
DROP POLICY IF EXISTS "Users can view own founders club applications"          ON public.founders_club_applications;

-- 읽기: 본인 신청만
CREATE POLICY "fc_applications_select_own"
  ON public.founders_club_applications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- 신청: 본인 명의로만 가능
CREATE POLICY "fc_applications_insert_own"
  ON public.founders_club_applications FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 전체 관리: admin만 (수락/거절 등)
CREATE POLICY "fc_applications_all_admin"
  ON public.founders_club_applications TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ================================================================
-- SECTION 9. activity_logs / page_views 정책 정리
-- ================================================================

DROP POLICY IF EXISTS "Admin can read activity logs"  ON public.activity_logs;
DROP POLICY IF EXISTS "Admin can read page views"     ON public.page_views;
DROP POLICY IF EXISTS "Anyone can insert page views"  ON public.page_views;

CREATE POLICY "activity_logs_select_admin"
  ON public.activity_logs FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY "page_views_select_admin"
  ON public.page_views FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY "page_views_insert_public"
  ON public.page_views FOR INSERT TO anon, authenticated
  WITH CHECK (true);


-- ================================================================
-- SECTION 10. storage 정책 정리
-- ================================================================

DROP POLICY IF EXISTS "누구나 사진 보기 가능"              ON storage.objects;
DROP POLICY IF EXISTS "인증된 사용자만 사진 올리기 가능"     ON storage.objects;

-- 읽기: 비로그인 포함 전체 공개
CREATE POLICY "storage_images_select_public"
  ON storage.objects AS PERMISSIVE
  FOR SELECT TO public
  USING (bucket_id = 'images');

-- 업로드: 로그인 유저만
CREATE POLICY "storage_images_insert_auth"
  ON storage.objects AS PERMISSIVE
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'images');
