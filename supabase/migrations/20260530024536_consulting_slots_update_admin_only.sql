-- Codex high: 비관리자 consulting_slots 직접 UPDATE(available->booked) 가 예약 row 없이
-- slot 날짜/시간/consultant 변조 + phantom booking 우회로. 예약 booked 전환은 SECURITY
-- DEFINER 트리거(book/release_consulting_slot_on_reservation)가 수행하므로 비관리자 UPDATE
-- 정책 제거, admin 전용으로만 직접 UPDATE 허용.
-- 선행 마이그 20260530013843 도 동일 정의로 수정됨(중간 배포 취약 구간 제거). 본 마이그는
-- 이미 약한 정의가 적용된 환경을 수렴시키는 멱등 보정.
DROP POLICY IF EXISTS consulting_slots_update ON public.consulting_slots;
DROP POLICY IF EXISTS consulting_slots_update_booking ON public.consulting_slots;
DROP POLICY IF EXISTS consulting_slots_update_admin ON public.consulting_slots;
CREATE POLICY consulting_slots_update_admin ON public.consulting_slots FOR UPDATE TO authenticated
  USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));
