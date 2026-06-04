-- date_planner_* 는 별도 앱 잔재(전부 0행, Global X Pass 코드 미참조, 외부 의존성 0).
-- prod 정리: 7개 테이블 제거. 내부 FK는 CASCADE로 함께 정리.
DROP TABLE IF EXISTS public.date_planner_ai_requests CASCADE;
DROP TABLE IF EXISTS public.date_planner_comments CASCADE;
DROP TABLE IF EXISTS public.date_planner_option_preferences CASCADE;
DROP TABLE IF EXISTS public.date_planner_options CASCADE;
DROP TABLE IF EXISTS public.date_planner_proposals CASCADE;
DROP TABLE IF EXISTS public.date_planner_couples CASCADE;
DROP TABLE IF EXISTS public.date_planner_profiles CASCADE;
