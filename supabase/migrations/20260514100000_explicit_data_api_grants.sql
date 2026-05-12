-- Supabase Data API (PostgREST) 보안 정책 변경 대응
-- 2026년 10월 30일 강제 적용되는 '기본 접근 권한 차단'에 대비하여 모든 기존 테이블에 명시적 GRANT 부여

-- 1. 공개 조회 가능 테이블 (anon, authenticated 모두 SELECT 허용)
GRANT SELECT ON TABLE public.posts TO anon, authenticated, service_role;
GRANT SELECT ON TABLE public.media_category_labels TO anon, authenticated, service_role;
GRANT SELECT ON TABLE public.board_tag_presets TO anon, authenticated, service_role;
GRANT SELECT ON TABLE public.consulting_categories TO anon, authenticated, service_role;

GRANT INSERT, UPDATE, DELETE ON TABLE public.posts TO authenticated, service_role;
GRANT INSERT, UPDATE, DELETE ON TABLE public.media_category_labels TO authenticated, service_role;
GRANT INSERT, UPDATE, DELETE ON TABLE public.board_tag_presets TO authenticated, service_role;
GRANT INSERT, UPDATE, DELETE ON TABLE public.consulting_categories TO authenticated, service_role;

-- 2. 회원 전용 또는 내부 관리용 테이블 (authenticated만 접근 허용, RLS로 상세 제어)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.profiles TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.event_applications TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.consulting_reservations TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.founders_club_applications TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.founders_club_sessions TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.consultants TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.consulting_slots TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.page_views TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.post_view_events TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.activity_logs TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.blog_import_runs TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.blog_import_queue TO authenticated, service_role;

-- 3. 모든 테이블에 대해 service_role은 전체 권한 유지 (Edge Functions 등 서버 사이드 연동용)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;
