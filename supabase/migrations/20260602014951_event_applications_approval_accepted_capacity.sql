-- 행사 신청 승인제(선별제) — 정원 점유 = 확정(accepted)만, pending 무제한.
--
-- 배경: 20260529065845_events_fc_apps_fcfs_revert 가 events 를 다시 선착순(FCFS)으로
--   롤백하면서 INSERT 정책을 status='accepted' 강제로 되돌렸다(20260530013843 통합본도 동일).
--   그러나 프론트는 승인제로 전환되어 신청을 status='pending' 으로 INSERT 하므로
--   "new row violates row-level security policy for table event_applications" 가 발생했다.
--
-- 모델(승인 기준 선별제):
--   - 신청은 pending 으로 들어가며 정원을 점유하지 않는다(무제한 접수).
--   - 정원 점유 = accepted 수. accepted >= capacity 이면 신규 신청이 마감된다.
--   - 관리자가 pending → accepted 로 승인할 때만 정원 초과를 DB 가 차단한다.
--   - 거절/취소로 accepted 가 빠지면 여석이 복구된다.
--
-- 범위: event_applications 한정. Founder's Club / 컨설팅은 별도 작업으로 분리.

ALTER TABLE public.event_applications ALTER COLUMN status SET DEFAULT 'pending';

-- 마감 판정: accepted 기준(pending 제외) → pending 은 정원 넘겨도 계속 접수
CREATE OR REPLACE FUNCTION public.can_apply_to_event(target_post_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.posts p
    WHERE p.id = target_post_id
      AND p.category = 'events'
      AND p.event_status = ANY (ARRAY['접수중', '마감임박'])
      AND (p.application_deadline IS NULL OR p.application_deadline > now())
      AND (
        p.capacity IS NULL
        OR (
          SELECT count(*)::integer
          FROM public.event_applications ea
          WHERE ea.post_id = p.id
            AND ea.status = 'accepted'
        ) < p.capacity
      )
  );
$$;

-- INSERT 정책: 비어드민은 pending 으로만 신청 가능(승인 전 무제한 접수)
DROP POLICY IF EXISTS event_applications_insert_own ON public.event_applications;
CREATE POLICY event_applications_insert_own ON public.event_applications FOR INSERT TO authenticated
  WITH CHECK (
    (select public.is_admin())
    OR (((select auth.uid()) = user_id) AND (status = 'pending') AND public.can_apply_to_event(post_id))
  );

-- UPDATE 정책 재선언(순서 의존성 명시): 본인은 pending/accepted 를 cancelled_by_user 로만.
DROP POLICY IF EXISTS event_applications_cancel_own ON public.event_applications;
CREATE POLICY event_applications_cancel_own ON public.event_applications FOR UPDATE TO authenticated
  USING ((select public.is_admin()) OR (((select auth.uid()) = user_id) AND (status = ANY (ARRAY['pending','accepted']))))
  WITH CHECK ((select public.is_admin()) OR (((select auth.uid()) = user_id) AND (status = 'cancelled_by_user')));

-- 본인 취소: pending 또는 accepted 를 cancelled_by_user 로만 (pending 신청자도 자기 신청 취소 가능)
CREATE OR REPLACE FUNCTION public.guard_event_application_user_cancel()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication required';
  END IF;

  IF auth.uid() <> OLD.user_id OR auth.uid() <> NEW.user_id THEN
    RAISE EXCEPTION 'cannot update another user event application';
  END IF;

  IF NOT (OLD.status = ANY (ARRAY['pending', 'accepted'])) OR NEW.status <> 'cancelled_by_user' THEN
    RAISE EXCEPTION 'users can only cancel pending or accepted event applications';
  END IF;

  -- answers 포함(20260504040000): 취소 시 신청 내용 위변조 차단.
  IF (
    NEW.id, NEW.post_id, NEW.user_id, NEW.company_tech, NEW.applicant_name,
    NEW.position, NEW.email, NEW.phone, NEW.expectation, NEW.interests,
    NEW.speaker_question, NEW.privacy_consent, NEW.admin_note, NEW.answers, NEW.created_at
  ) IS DISTINCT FROM (
    OLD.id, OLD.post_id, OLD.user_id, OLD.company_tech, OLD.applicant_name,
    OLD.position, OLD.email, OLD.phone, OLD.expectation, OLD.interests,
    OLD.speaker_question, OLD.privacy_consent, OLD.admin_note, OLD.answers, OLD.created_at
  ) THEN
    RAISE EXCEPTION 'users can only change event application status to cancelled_by_user';
  END IF;

  RETURN NEW;
END;
$$;

-- 정원 가드: NEW.status='accepted' 일 때만 accepted 수 초과를 차단(pending 은 무제한)
CREATE OR REPLACE FUNCTION public.sync_event_application_counts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_post_id uuid;
  accepted_count integer;
  event_capacity integer;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_post_id := OLD.post_id;
  ELSE
    target_post_id := NEW.post_id;
  END IF;

  IF TG_OP IN ('INSERT', 'UPDATE') AND NEW.status = 'accepted' THEN
    SELECT capacity INTO event_capacity
    FROM public.posts
    WHERE id = NEW.post_id
      AND category = 'events'
    FOR UPDATE;

    IF event_capacity IS NOT NULL THEN
      SELECT count(*)::integer INTO accepted_count
      FROM public.event_applications
      WHERE post_id = NEW.post_id
        AND status = 'accepted'
        AND id <> NEW.id;

      IF accepted_count >= event_capacity THEN
        RAISE EXCEPTION 'event capacity reached';
      END IF;
    END IF;
  END IF;

  PERFORM public.refresh_event_slots_remaining(target_post_id);
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$;

-- 여석/상태 동기화: accepted 기준(pending 은 여석을 깎지 않음)
CREATE OR REPLACE FUNCTION public.refresh_event_slots_remaining(target_post_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  accepted_count integer;
  event_capacity integer;
  remaining_count integer;
  current_status text;
  deadline timestamptz;
  next_status text;
BEGIN
  SELECT p.capacity, p.event_status, p.application_deadline
    INTO event_capacity, current_status, deadline
  FROM public.posts p
  WHERE p.id = target_post_id
    AND p.category = 'events'
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  SELECT count(*)::integer INTO accepted_count
  FROM public.event_applications
  WHERE post_id = target_post_id
    AND status = 'accepted';

  remaining_count := CASE
    WHEN event_capacity IS NULL THEN NULL
    ELSE GREATEST(event_capacity - accepted_count, 0)
  END;

  next_status := CASE
    WHEN deadline IS NOT NULL AND deadline <= now() THEN '마감'
    WHEN remaining_count IS NOT NULL AND remaining_count <= 0 THEN '마감'
    WHEN current_status = '접수예정' THEN '접수예정'
    WHEN current_status = '마감' THEN '마감'
    WHEN deadline IS NOT NULL AND deadline <= now() + interval '3 days' THEN '마감임박'
    WHEN event_capacity IS NOT NULL
      AND event_capacity > 0
      AND remaining_count IS NOT NULL
      AND (remaining_count::numeric / event_capacity::numeric) <= 0.2 THEN '마감임박'
    ELSE '접수중'
  END;

  UPDATE public.posts
  SET slots_remaining = remaining_count,
      event_status = next_status,
      updated_at = now()
  WHERE id = target_post_id
    AND category = 'events';
END;
$$;

-- posts BEFORE 트리거: 정원/마감 필드 재계산도 accepted 기준
CREATE OR REPLACE FUNCTION public.apply_event_post_status_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  accepted_count integer;
  remaining_count integer;
BEGIN
  IF NEW.category <> 'events' THEN
    RETURN NEW;
  END IF;

  SELECT count(*)::integer INTO accepted_count
  FROM public.event_applications
  WHERE post_id = NEW.id
    AND status = 'accepted';

  remaining_count := CASE
    WHEN NEW.capacity IS NULL THEN NULL
    ELSE GREATEST(NEW.capacity - accepted_count, 0)
  END;

  NEW.slots_remaining := remaining_count;
  NEW.event_status := CASE
    WHEN NEW.application_deadline IS NOT NULL AND NEW.application_deadline <= now() THEN '마감'
    WHEN remaining_count IS NOT NULL AND remaining_count <= 0 THEN '마감'
    WHEN NEW.event_status = '접수예정' THEN '접수예정'
    WHEN NEW.event_status = '마감' THEN '마감'
    WHEN NEW.application_deadline IS NOT NULL AND NEW.application_deadline <= now() + interval '3 days' THEN '마감임박'
    WHEN NEW.capacity IS NOT NULL
      AND NEW.capacity > 0
      AND remaining_count IS NOT NULL
      AND (remaining_count::numeric / NEW.capacity::numeric) <= 0.2 THEN '마감임박'
    ELSE '접수중'
  END;

  RETURN NEW;
END;
$$;

COMMENT ON TABLE public.event_applications
  IS 'Admin-approval event applications. Capacity counts accepted only; pending is unlimited (waitlist) and does not occupy a slot.';
