-- founders-club 은 gated 페이지: 비로그인도 공개 상태 세션 목록을 열람할 수 있게 하되,
-- 신청(INSERT)은 기존 정책으로 로그인 사용자만 가능하다(목록 공개 + 신청 시 로그인).
DROP POLICY IF EXISTS fc_sessions_select_public ON public.founders_club_sessions;
CREATE POLICY fc_sessions_select_public ON public.founders_club_sessions
  FOR SELECT TO anon
  USING (status IN ('recruiting', 'closed', 'completed'));
