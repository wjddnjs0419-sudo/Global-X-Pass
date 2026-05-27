-- 사용자가 종료된(취소/반려) 본인 오피스아워 신청 내역을 삭제할 수 있게 한다.
-- consulting_reservations / founders_club_applications의 *_delete_own_terminal 정책과 동일한 패턴.
DROP POLICY IF EXISTS "office_hour_applications_delete_own_terminal" ON public.office_hour_applications;
CREATE POLICY "office_hour_applications_delete_own_terminal"
  ON public.office_hour_applications FOR DELETE TO authenticated
  USING (auth.uid() = user_id AND status = ANY (ARRAY['cancelled', 'rejected']));
