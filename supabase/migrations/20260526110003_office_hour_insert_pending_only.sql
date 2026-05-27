-- 보안: 일반 사용자가 오피스아워 신청을 'pending' 외 상태나 매칭 정보가 채워진 채로
-- 직접 INSERT 하지 못하도록 막는다. (상태기계 우회 방지)
-- 관리자는 office_hour_applications_admin_all (FOR ALL) 정책으로 계속 자유롭게 INSERT 가능.
DROP POLICY IF EXISTS "office_hour_applications_insert_own" ON public.office_hour_applications;
CREATE POLICY "office_hour_applications_insert_own"
  ON public.office_hour_applications FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND status = 'pending'
    AND matched_expert_name IS NULL
    AND matched_date IS NULL
    AND matched_time IS NULL
    AND matched_location IS NULL
    AND admin_note IS NULL
  );
