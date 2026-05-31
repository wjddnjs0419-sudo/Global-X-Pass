-- RLS 성능 최적화: auth_rls_initplan(29) + multiple_permissive_policies(33) 해소
-- (1) is_admin / is_founders_session_host VOLATILE -> STABLE (InitPlan 캐싱 전제)
-- (2) 정책 내 auth.uid()/is_admin()/is_founders_session_host() 를 (select ...) 로 래핑 → 쿼리당 1회 평가
-- (3) admin ALL/SELECT 와 own/public 정책 중복(permissive) 을 단일 정책으로 통합
-- date_planner_* 테이블은 별도 앱(0행)이라 범위 외.
-- 의미 동등성: admin 은 통합 정책의 (select is_admin()) OR ... 로 기존 전권 유지.

-- ============================================================
-- (1) 헬퍼 함수 STABLE 전환 (읽기 전용, SECURITY DEFINER 유지)
-- ============================================================
ALTER FUNCTION public.is_admin() STABLE;
ALTER FUNCTION public.is_founders_session_host() STABLE;

-- ============================================================
-- (2) 래핑 전용 (구조 동일, 함수 호출만 (select ...) 화)
-- ============================================================

-- activity_logs
DROP POLICY IF EXISTS activity_logs_select_admin ON public.activity_logs;
CREATE POLICY activity_logs_select_admin ON public.activity_logs FOR SELECT TO authenticated
  USING ((select public.is_admin()));

-- articles  (SELECT 중복 통합: admin + public_approved -> auth / anon 분리)
DROP POLICY IF EXISTS articles_select_admin ON public.articles;
DROP POLICY IF EXISTS articles_select_public_approved ON public.articles;
DROP POLICY IF EXISTS articles_delete_admin ON public.articles;
DROP POLICY IF EXISTS articles_insert_admin ON public.articles;
DROP POLICY IF EXISTS articles_update_admin ON public.articles;
DROP POLICY IF EXISTS articles_select_auth ON public.articles;
DROP POLICY IF EXISTS articles_select_anon ON public.articles;
CREATE POLICY articles_select_auth ON public.articles FOR SELECT TO authenticated
  USING ((select public.is_admin()) OR (status = 'approved'));
CREATE POLICY articles_select_anon ON public.articles FOR SELECT TO anon
  USING (status = 'approved');
CREATE POLICY articles_delete_admin ON public.articles FOR DELETE TO authenticated
  USING ((select public.is_admin()));
CREATE POLICY articles_insert_admin ON public.articles FOR INSERT TO authenticated
  WITH CHECK ((select public.is_admin()));
CREATE POLICY articles_update_admin ON public.articles FOR UPDATE TO authenticated
  USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));

-- blog_import_queue (role public 보존)
DROP POLICY IF EXISTS blog_import_queue_delete_admin ON public.blog_import_queue;
DROP POLICY IF EXISTS blog_import_queue_insert_admin ON public.blog_import_queue;
DROP POLICY IF EXISTS blog_import_queue_select_admin ON public.blog_import_queue;
DROP POLICY IF EXISTS blog_import_queue_update_admin ON public.blog_import_queue;
CREATE POLICY blog_import_queue_delete_admin ON public.blog_import_queue FOR DELETE TO public
  USING ((select public.is_admin()));
CREATE POLICY blog_import_queue_insert_admin ON public.blog_import_queue FOR INSERT TO public
  WITH CHECK ((select public.is_admin()));
CREATE POLICY blog_import_queue_select_admin ON public.blog_import_queue FOR SELECT TO public
  USING ((select public.is_admin()));
CREATE POLICY blog_import_queue_update_admin ON public.blog_import_queue FOR UPDATE TO public
  USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));

-- blog_import_runs (role public 보존)
DROP POLICY IF EXISTS blog_import_runs_delete_admin ON public.blog_import_runs;
DROP POLICY IF EXISTS blog_import_runs_insert_admin ON public.blog_import_runs;
DROP POLICY IF EXISTS blog_import_runs_select_admin ON public.blog_import_runs;
DROP POLICY IF EXISTS blog_import_runs_update_admin ON public.blog_import_runs;
CREATE POLICY blog_import_runs_delete_admin ON public.blog_import_runs FOR DELETE TO public
  USING ((select public.is_admin()));
CREATE POLICY blog_import_runs_insert_admin ON public.blog_import_runs FOR INSERT TO public
  WITH CHECK ((select public.is_admin()));
CREATE POLICY blog_import_runs_select_admin ON public.blog_import_runs FOR SELECT TO public
  USING ((select public.is_admin()));
CREATE POLICY blog_import_runs_update_admin ON public.blog_import_runs FOR UPDATE TO public
  USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));

-- board_tag_presets (admin write 만 래핑, public read 유지)
DROP POLICY IF EXISTS "Admins can delete board tag presets" ON public.board_tag_presets;
DROP POLICY IF EXISTS "Admins can insert board tag presets" ON public.board_tag_presets;
DROP POLICY IF EXISTS "Admins can update board tag presets" ON public.board_tag_presets;
CREATE POLICY "Admins can delete board tag presets" ON public.board_tag_presets FOR DELETE TO public
  USING ((select public.is_admin()));
CREATE POLICY "Admins can insert board tag presets" ON public.board_tag_presets FOR INSERT TO public
  WITH CHECK ((select public.is_admin()));
CREATE POLICY "Admins can update board tag presets" ON public.board_tag_presets FOR UPDATE TO public
  USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));

-- consulting_categories (admin write 만 래핑)
DROP POLICY IF EXISTS consulting_categories_admin_delete ON public.consulting_categories;
DROP POLICY IF EXISTS consulting_categories_admin_insert ON public.consulting_categories;
DROP POLICY IF EXISTS consulting_categories_admin_update ON public.consulting_categories;
CREATE POLICY consulting_categories_admin_delete ON public.consulting_categories FOR DELETE TO public
  USING ((select public.is_admin()));
CREATE POLICY consulting_categories_admin_insert ON public.consulting_categories FOR INSERT TO public
  WITH CHECK ((select public.is_admin()));
CREATE POLICY consulting_categories_admin_update ON public.consulting_categories FOR UPDATE TO public
  USING ((select public.is_admin()));

-- error_issues
DROP POLICY IF EXISTS error_issues_select_admin ON public.error_issues;
CREATE POLICY error_issues_select_admin ON public.error_issues FOR SELECT TO authenticated
  USING ((select public.is_admin()));

-- error_logs
DROP POLICY IF EXISTS error_logs_delete_admin ON public.error_logs;
DROP POLICY IF EXISTS error_logs_select_admin ON public.error_logs;
CREATE POLICY error_logs_delete_admin ON public.error_logs FOR DELETE TO authenticated
  USING ((select public.is_admin()));
CREATE POLICY error_logs_select_admin ON public.error_logs FOR SELECT TO authenticated
  USING ((select public.is_admin()));

-- media_category_labels (admin write 만 래핑)
DROP POLICY IF EXISTS "Admins can delete media category labels" ON public.media_category_labels;
DROP POLICY IF EXISTS "Admins can insert media category labels" ON public.media_category_labels;
DROP POLICY IF EXISTS "Admins can update media category labels" ON public.media_category_labels;
CREATE POLICY "Admins can delete media category labels" ON public.media_category_labels FOR DELETE TO public
  USING ((select public.is_admin()));
CREATE POLICY "Admins can insert media category labels" ON public.media_category_labels FOR INSERT TO public
  WITH CHECK ((select public.is_admin()));
CREATE POLICY "Admins can update media category labels" ON public.media_category_labels FOR UPDATE TO public
  USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));

-- page_views (admin select 만 래핑, public insert 유지)
DROP POLICY IF EXISTS page_views_select_admin ON public.page_views;
CREATE POLICY page_views_select_admin ON public.page_views FOR SELECT TO authenticated
  USING ((select public.is_admin()));

-- post_categories: 기존 raw role 검사(profiles.role='admin')는 is_admin() 의 MFA/AAL2
-- 게이트를 우회하므로, 이 마이그 안에서 곧바로 is_admin() 기반으로 교체(중간 배포 취약 구간 제거).
DROP POLICY IF EXISTS post_categories_update_admin ON public.post_categories;
CREATE POLICY post_categories_update_admin ON public.post_categories FOR UPDATE TO authenticated
  USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));

-- posts (admin write 래핑 + select_auth auth.uid() 래핑, anon public 정책 유지)
DROP POLICY IF EXISTS posts_delete_admin ON public.posts;
DROP POLICY IF EXISTS posts_insert_admin ON public.posts;
DROP POLICY IF EXISTS posts_update_admin ON public.posts;
DROP POLICY IF EXISTS posts_select_auth ON public.posts;
CREATE POLICY posts_delete_admin ON public.posts FOR DELETE TO authenticated
  USING ((select public.is_admin()));
CREATE POLICY posts_insert_admin ON public.posts FOR INSERT TO authenticated
  WITH CHECK ((select public.is_admin()));
CREATE POLICY posts_update_admin ON public.posts FOR UPDATE TO authenticated
  USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));
CREATE POLICY posts_select_auth ON public.posts FOR SELECT TO authenticated
  USING (
    (category <> 'expenses')
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid())
               AND profiles.role = ANY (ARRAY['admin','participant']))
  );

-- external_news_items (SELECT 중복 통합 + admin write 래핑)
DROP POLICY IF EXISTS external_news_items_select_admin ON public.external_news_items;
DROP POLICY IF EXISTS external_news_items_select_public_published ON public.external_news_items;
DROP POLICY IF EXISTS external_news_items_delete_admin ON public.external_news_items;
DROP POLICY IF EXISTS external_news_items_insert_admin ON public.external_news_items;
DROP POLICY IF EXISTS external_news_items_update_admin ON public.external_news_items;
DROP POLICY IF EXISTS external_news_items_select_auth ON public.external_news_items;
DROP POLICY IF EXISTS external_news_items_select_anon ON public.external_news_items;
CREATE POLICY external_news_items_select_auth ON public.external_news_items FOR SELECT TO authenticated
  USING ((select public.is_admin()) OR (status = 'published'));
CREATE POLICY external_news_items_select_anon ON public.external_news_items FOR SELECT TO anon
  USING (status = 'published');
CREATE POLICY external_news_items_delete_admin ON public.external_news_items FOR DELETE TO authenticated
  USING ((select public.is_admin()));
CREATE POLICY external_news_items_insert_admin ON public.external_news_items FOR INSERT TO authenticated
  WITH CHECK ((select public.is_admin()));
CREATE POLICY external_news_items_update_admin ON public.external_news_items FOR UPDATE TO authenticated
  USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));

-- ============================================================
-- (3) 중복 permissive 통합 (admin ALL/SELECT 흡수)
-- ============================================================

-- profiles: select_admin + select_own -> 단일 select
DROP POLICY IF EXISTS profiles_select_admin ON public.profiles;
DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
DROP POLICY IF EXISTS profiles_delete_admin ON public.profiles;
DROP POLICY IF EXISTS profiles_insert_admin ON public.profiles;
DROP POLICY IF EXISTS profiles_update_admin ON public.profiles;
DROP POLICY IF EXISTS profiles_select ON public.profiles;
CREATE POLICY profiles_select ON public.profiles FOR SELECT TO authenticated
  USING ((select public.is_admin()) OR (id = (select auth.uid())));
CREATE POLICY profiles_delete_admin ON public.profiles FOR DELETE TO authenticated
  USING ((select public.is_admin()));
CREATE POLICY profiles_insert_admin ON public.profiles FOR INSERT TO authenticated
  WITH CHECK ((select public.is_admin()));
CREATE POLICY profiles_update_admin ON public.profiles FOR UPDATE TO authenticated
  USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));

-- companies: admin_read_all 흡수 -> authenticated_read 통합
DROP POLICY IF EXISTS companies_admin_read_all ON public.companies;
DROP POLICY IF EXISTS companies_authenticated_read ON public.companies;
DROP POLICY IF EXISTS companies_admin_delete ON public.companies;
DROP POLICY IF EXISTS companies_admin_insert ON public.companies;
DROP POLICY IF EXISTS companies_admin_update ON public.companies;
CREATE POLICY companies_authenticated_read ON public.companies FOR SELECT TO authenticated
  USING ((select public.is_admin()) OR (status = 'published'));
CREATE POLICY companies_admin_delete ON public.companies FOR DELETE TO public
  USING ((select public.is_admin()));
CREATE POLICY companies_admin_insert ON public.companies FOR INSERT TO public
  WITH CHECK ((select public.is_admin()));
CREATE POLICY companies_admin_update ON public.companies FOR UPDATE TO public
  USING ((select public.is_admin()));
-- companies_select_public(anon, status='published') 무변경

-- consultants: all_admin -> insert/update/delete admin + select_auth 통합
DROP POLICY IF EXISTS consultants_all_admin ON public.consultants;
DROP POLICY IF EXISTS consultants_select_auth ON public.consultants;
DROP POLICY IF EXISTS consultants_insert_admin ON public.consultants;
DROP POLICY IF EXISTS consultants_update_admin ON public.consultants;
DROP POLICY IF EXISTS consultants_delete_admin ON public.consultants;
CREATE POLICY consultants_select_auth ON public.consultants FOR SELECT TO authenticated
  USING ((select public.is_admin()) OR (is_active = true));
CREATE POLICY consultants_insert_admin ON public.consultants FOR INSERT TO authenticated
  WITH CHECK ((select public.is_admin()));
CREATE POLICY consultants_update_admin ON public.consultants FOR UPDATE TO authenticated
  USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));
CREATE POLICY consultants_delete_admin ON public.consultants FOR DELETE TO authenticated
  USING ((select public.is_admin()));
-- consultants_select_public(anon, is_active) 무변경

-- consulting_slots: all_admin -> insert/delete/update admin (예약 booked 전환은 클라가 아니라
-- SECURITY DEFINER 트리거 book/release_consulting_slot_on_reservation 이 수행하므로 비관리자
-- 직접 UPDATE 정책은 불필요한 우회로 → 제거. 직접 UPDATE 는 admin 전용으로만 허용.
DROP POLICY IF EXISTS consulting_slots_all_admin ON public.consulting_slots;
DROP POLICY IF EXISTS consulting_slots_update_booking ON public.consulting_slots;
DROP POLICY IF EXISTS consulting_slots_update ON public.consulting_slots;
DROP POLICY IF EXISTS consulting_slots_insert_admin ON public.consulting_slots;
DROP POLICY IF EXISTS consulting_slots_delete_admin ON public.consulting_slots;
DROP POLICY IF EXISTS consulting_slots_update_admin ON public.consulting_slots;
CREATE POLICY consulting_slots_insert_admin ON public.consulting_slots FOR INSERT TO authenticated
  WITH CHECK ((select public.is_admin()));
CREATE POLICY consulting_slots_delete_admin ON public.consulting_slots FOR DELETE TO authenticated
  USING ((select public.is_admin()));
CREATE POLICY consulting_slots_update_admin ON public.consulting_slots FOR UPDATE TO authenticated
  USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));
-- consulting_slots_select_auth(authenticated, true) 무변경 (admin 포함)

-- consulting_reservations: all_admin 해체 -> own 정책에 admin 흡수
DROP POLICY IF EXISTS consulting_reservations_all_admin ON public.consulting_reservations;
DROP POLICY IF EXISTS consulting_reservations_select_own ON public.consulting_reservations;
DROP POLICY IF EXISTS consulting_reservations_insert_own ON public.consulting_reservations;
DROP POLICY IF EXISTS consulting_reservations_cancel_own ON public.consulting_reservations;
DROP POLICY IF EXISTS consulting_reservations_delete_own_terminal ON public.consulting_reservations;
CREATE POLICY consulting_reservations_select_own ON public.consulting_reservations FOR SELECT TO authenticated
  USING ((select public.is_admin()) OR ((select auth.uid()) = user_id));
CREATE POLICY consulting_reservations_insert_own ON public.consulting_reservations FOR INSERT TO authenticated
  WITH CHECK (
    (select public.is_admin())
    OR (
      ((select auth.uid()) = user_id) AND (status = 'pending')
      AND EXISTS (SELECT 1 FROM consulting_slots s
                  WHERE s.id = consulting_reservations.slot_id
                    AND s.status = 'available' AND s.slot_date >= CURRENT_DATE)
    )
  );
CREATE POLICY consulting_reservations_cancel_own ON public.consulting_reservations FOR UPDATE TO authenticated
  USING ((select public.is_admin()) OR (((select auth.uid()) = user_id) AND (status = ANY (ARRAY['pending','confirmed']))))
  WITH CHECK ((select public.is_admin()) OR (((select auth.uid()) = user_id) AND (status = 'cancelled_by_user')));
CREATE POLICY consulting_reservations_delete_own_terminal ON public.consulting_reservations FOR DELETE TO authenticated
  USING ((select public.is_admin()) OR (((select auth.uid()) = user_id) AND (status = ANY (ARRAY['cancelled_by_user','cancelled_by_admin','rejected']))));

-- event_applications: all_admin 해체 -> own 정책에 admin 흡수
DROP POLICY IF EXISTS event_applications_all_admin ON public.event_applications;
DROP POLICY IF EXISTS event_applications_select_own ON public.event_applications;
DROP POLICY IF EXISTS event_applications_insert_own ON public.event_applications;
DROP POLICY IF EXISTS event_applications_cancel_own ON public.event_applications;
DROP POLICY IF EXISTS event_applications_delete_own_terminal ON public.event_applications;
CREATE POLICY event_applications_select_own ON public.event_applications FOR SELECT TO authenticated
  USING ((select public.is_admin()) OR ((select auth.uid()) = user_id));
CREATE POLICY event_applications_insert_own ON public.event_applications FOR INSERT TO authenticated
  WITH CHECK (
    (select public.is_admin())
    OR (((select auth.uid()) = user_id) AND (status = 'accepted') AND public.can_apply_to_event(post_id))
  );
CREATE POLICY event_applications_cancel_own ON public.event_applications FOR UPDATE TO authenticated
  USING ((select public.is_admin()) OR (((select auth.uid()) = user_id) AND (status = ANY (ARRAY['pending','accepted']))))
  WITH CHECK ((select public.is_admin()) OR (((select auth.uid()) = user_id) AND (status = 'cancelled_by_user')));
CREATE POLICY event_applications_delete_own_terminal ON public.event_applications FOR DELETE TO authenticated
  USING ((select public.is_admin()) OR (((select auth.uid()) = user_id) AND (status = ANY (ARRAY['cancelled_by_user','cancelled_by_admin','rejected']))));

-- founders_club_applications: all_admin 해체 -> own 정책에 admin 흡수
DROP POLICY IF EXISTS fc_applications_all_admin ON public.founders_club_applications;
DROP POLICY IF EXISTS fc_applications_select_own ON public.founders_club_applications;
DROP POLICY IF EXISTS fc_applications_insert_own ON public.founders_club_applications;
DROP POLICY IF EXISTS fc_applications_cancel_own ON public.founders_club_applications;
DROP POLICY IF EXISTS fc_applications_delete_own_terminal ON public.founders_club_applications;
CREATE POLICY fc_applications_select_own ON public.founders_club_applications FOR SELECT TO authenticated
  USING ((select public.is_admin()) OR ((select auth.uid()) = user_id));
CREATE POLICY fc_applications_insert_own ON public.founders_club_applications FOR INSERT TO authenticated
  WITH CHECK (
    (select public.is_admin())
    OR (
      ((select auth.uid()) = user_id) AND (status = 'accepted')
      AND EXISTS (
        SELECT 1 FROM founders_club_sessions s
        WHERE s.id = founders_club_applications.session_id
          AND s.status = 'recruiting'
          AND (SELECT count(*)::integer FROM founders_club_applications fca
               WHERE fca.session_id = s.id
                 AND fca.status = ANY (ARRAY['pending','accepted'])) < s.max_participants
      )
    )
  );
CREATE POLICY fc_applications_cancel_own ON public.founders_club_applications FOR UPDATE TO authenticated
  USING ((select public.is_admin()) OR (((select auth.uid()) = user_id) AND (status = ANY (ARRAY['pending','accepted']))))
  WITH CHECK ((select public.is_admin()) OR (((select auth.uid()) = user_id) AND (status = 'cancelled_by_user')));
CREATE POLICY fc_applications_delete_own_terminal ON public.founders_club_applications FOR DELETE TO authenticated
  USING ((select public.is_admin()) OR (((select auth.uid()) = user_id) AND (status = ANY (ARRAY['cancelled_by_user','cancelled_by_admin','rejected']))));

-- office_hour_applications: admin_all 해체 -> own 정책에 admin 흡수
DROP POLICY IF EXISTS office_hour_applications_admin_all ON public.office_hour_applications;
DROP POLICY IF EXISTS office_hour_applications_select_own ON public.office_hour_applications;
DROP POLICY IF EXISTS office_hour_applications_insert_own ON public.office_hour_applications;
DROP POLICY IF EXISTS office_hour_applications_cancel_own ON public.office_hour_applications;
DROP POLICY IF EXISTS office_hour_applications_delete_own_terminal ON public.office_hour_applications;
CREATE POLICY office_hour_applications_select_own ON public.office_hour_applications FOR SELECT TO authenticated
  USING (((select auth.uid()) = user_id) OR (select public.is_admin()));
CREATE POLICY office_hour_applications_insert_own ON public.office_hour_applications FOR INSERT TO authenticated
  WITH CHECK (
    (select public.is_admin())
    OR (
      ((select auth.uid()) = user_id) AND (status = 'pending')
      AND (matched_expert_name IS NULL) AND (matched_date IS NULL) AND (matched_time IS NULL)
      AND (matched_location IS NULL) AND (admin_note IS NULL)
    )
  );
CREATE POLICY office_hour_applications_cancel_own ON public.office_hour_applications FOR UPDATE TO authenticated
  USING ((select public.is_admin()) OR (((select auth.uid()) = user_id) AND (status = ANY (ARRAY['pending','matched']))))
  WITH CHECK ((select public.is_admin()) OR (((select auth.uid()) = user_id) AND (status = 'cancelled')));
CREATE POLICY office_hour_applications_delete_own_terminal ON public.office_hour_applications FOR DELETE TO authenticated
  USING ((select public.is_admin()) OR (((select auth.uid()) = user_id) AND (status = ANY (ARRAY['cancelled','rejected']))));

-- office_hour_months: admin_all(ALL) -> insert/update/delete admin (SELECT 는 read(true) 가 커버)
DROP POLICY IF EXISTS office_hour_months_admin_all ON public.office_hour_months;
DROP POLICY IF EXISTS office_hour_months_insert_admin ON public.office_hour_months;
DROP POLICY IF EXISTS office_hour_months_update_admin ON public.office_hour_months;
DROP POLICY IF EXISTS office_hour_months_delete_admin ON public.office_hour_months;
CREATE POLICY office_hour_months_insert_admin ON public.office_hour_months FOR INSERT TO authenticated
  WITH CHECK ((select public.is_admin()));
CREATE POLICY office_hour_months_update_admin ON public.office_hour_months FOR UPDATE TO authenticated
  USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));
CREATE POLICY office_hour_months_delete_admin ON public.office_hour_months FOR DELETE TO authenticated
  USING ((select public.is_admin()));
-- office_hour_months_read(anon,authenticated true) 무변경

-- founders_club_sessions: all_admin 해체 -> host/select 정책에 admin 흡수 + admin UPDATE 신설
DROP POLICY IF EXISTS fc_sessions_all_admin ON public.founders_club_sessions;
DROP POLICY IF EXISTS fc_sessions_select_auth ON public.founders_club_sessions;
DROP POLICY IF EXISTS fc_sessions_insert_host ON public.founders_club_sessions;
DROP POLICY IF EXISTS fc_sessions_delete_host ON public.founders_club_sessions;
DROP POLICY IF EXISTS fc_sessions_update_admin ON public.founders_club_sessions;
CREATE POLICY fc_sessions_select_auth ON public.founders_club_sessions FOR SELECT TO authenticated
  USING (
    (status = ANY (ARRAY['recruiting','closed','completed']))
    OR (select public.is_admin())
    OR ((select auth.uid()) = created_by)
  );
CREATE POLICY fc_sessions_insert_host ON public.founders_club_sessions FOR INSERT TO authenticated
  WITH CHECK (
    (select public.is_admin())
    OR (((select auth.uid()) = created_by) AND (status = 'pending') AND (select public.is_founders_session_host()))
  );
CREATE POLICY fc_sessions_delete_host ON public.founders_club_sessions FOR DELETE TO authenticated
  USING ((select public.is_admin()) OR ((select auth.uid()) = created_by));
CREATE POLICY fc_sessions_update_admin ON public.founders_club_sessions FOR UPDATE TO authenticated
  USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));
-- fc_sessions_select_public(anon, status) 무변경
