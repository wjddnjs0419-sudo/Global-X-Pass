-- Revert program applications from first-come auto-confirm back to admin-approval flow.
-- Users INSERT as 'pending'; admin promotes to 'accepted'/'confirmed' or 'rejected'.
-- Cancellation splits into 'cancelled_by_user' (self) and 'cancelled_by_admin' (admin).
-- Capacity counts pending+accepted to guarantee a slot upon submission.
-- Legacy 'cancelled' rows are backfilled to 'cancelled_by_user'.

-- ── event_applications ───────────────────────────────────────────
ALTER TABLE public.event_applications ALTER COLUMN status SET DEFAULT 'pending';

UPDATE public.event_applications
SET status = 'cancelled_by_user'
WHERE status = 'cancelled';

ALTER TABLE public.event_applications
  DROP CONSTRAINT IF EXISTS event_applications_status_check;

ALTER TABLE public.event_applications
  ADD CONSTRAINT event_applications_status_check
  CHECK (status = ANY (ARRAY['pending', 'accepted', 'rejected', 'cancelled_by_user', 'cancelled_by_admin']));

DROP INDEX IF EXISTS public.unique_active_event_application_per_user_post;
CREATE UNIQUE INDEX unique_active_event_application_per_user_post
  ON public.event_applications (post_id, user_id)
  WHERE status IN ('pending', 'accepted');

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
            AND ea.status IN ('pending', 'accepted')
        ) < p.capacity
      )
  );
$$;

DROP POLICY IF EXISTS "event_applications_insert_own" ON public.event_applications;
CREATE POLICY "event_applications_insert_own"
  ON public.event_applications FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND status = 'pending'
    AND public.can_apply_to_event(post_id)
  );

DROP POLICY IF EXISTS "event_applications_cancel_own" ON public.event_applications;
CREATE POLICY "event_applications_cancel_own"
  ON public.event_applications FOR UPDATE TO authenticated
  USING (
    auth.uid() = user_id
    AND status = ANY (ARRAY['pending', 'accepted'])
  )
  WITH CHECK (
    auth.uid() = user_id
    AND status = 'cancelled_by_user'
  );

DROP POLICY IF EXISTS "event_applications_delete_own_terminal" ON public.event_applications;
CREATE POLICY "event_applications_delete_own_terminal"
  ON public.event_applications FOR DELETE TO authenticated
  USING (
    auth.uid() = user_id
    AND status IN ('cancelled_by_user', 'cancelled_by_admin', 'rejected')
  );

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

  IF (
    NEW.id, NEW.post_id, NEW.user_id, NEW.company_tech, NEW.applicant_name,
    NEW.position, NEW.email, NEW.phone, NEW.expectation, NEW.interests,
    NEW.speaker_question, NEW.privacy_consent, NEW.admin_note, NEW.created_at
  ) IS DISTINCT FROM (
    OLD.id, OLD.post_id, OLD.user_id, OLD.company_tech, OLD.applicant_name,
    OLD.position, OLD.email, OLD.phone, OLD.expectation, OLD.interests,
    OLD.speaker_question, OLD.privacy_consent, OLD.admin_note, OLD.created_at
  ) THEN
    RAISE EXCEPTION 'users can only change event application status to cancelled_by_user';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_event_slots_remaining(target_post_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  active_count integer;
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

  SELECT count(*)::integer INTO active_count
  FROM public.event_applications
  WHERE post_id = target_post_id
    AND status IN ('pending', 'accepted');

  remaining_count := CASE
    WHEN event_capacity IS NULL THEN NULL
    ELSE GREATEST(event_capacity - active_count, 0)
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

CREATE OR REPLACE FUNCTION public.apply_event_post_status_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  active_count integer;
  remaining_count integer;
BEGIN
  IF NEW.category <> 'events' THEN
    RETURN NEW;
  END IF;

  SELECT count(*)::integer INTO active_count
  FROM public.event_applications
  WHERE post_id = NEW.id
    AND status IN ('pending', 'accepted');

  remaining_count := CASE
    WHEN NEW.capacity IS NULL THEN NULL
    ELSE GREATEST(NEW.capacity - active_count, 0)
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

CREATE OR REPLACE FUNCTION public.sync_event_application_counts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_post_id uuid;
  active_count integer;
  event_capacity integer;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_post_id := OLD.post_id;
  ELSE
    target_post_id := NEW.post_id;
  END IF;

  IF TG_OP IN ('INSERT', 'UPDATE') AND NEW.status IN ('pending', 'accepted') THEN
    SELECT capacity INTO event_capacity
    FROM public.posts
    WHERE id = NEW.post_id
      AND category = 'events'
    FOR UPDATE;

    IF event_capacity IS NOT NULL THEN
      SELECT count(*)::integer INTO active_count
      FROM public.event_applications
      WHERE post_id = NEW.post_id
        AND status IN ('pending', 'accepted')
        AND id <> NEW.id;

      IF active_count >= event_capacity THEN
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

-- ── founders_club_applications ──────────────────────────────────
ALTER TABLE public.founders_club_applications ALTER COLUMN status SET DEFAULT 'pending';

UPDATE public.founders_club_applications
SET status = 'cancelled_by_user'
WHERE status = 'cancelled';

ALTER TABLE public.founders_club_applications
  DROP CONSTRAINT IF EXISTS founders_club_applications_status_check;

ALTER TABLE public.founders_club_applications
  ADD CONSTRAINT founders_club_applications_status_check
  CHECK (status = ANY (ARRAY['pending', 'accepted', 'rejected', 'cancelled_by_user', 'cancelled_by_admin']));

DROP INDEX IF EXISTS public.unique_active_fc_application_per_user_session;
CREATE UNIQUE INDEX unique_active_fc_application_per_user_session
  ON public.founders_club_applications (session_id, user_id)
  WHERE status IN ('pending', 'accepted');

DROP POLICY IF EXISTS "fc_applications_insert_own" ON public.founders_club_applications;
CREATE POLICY "fc_applications_insert_own"
  ON public.founders_club_applications FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND status = 'pending'
    AND EXISTS (
      SELECT 1
      FROM public.founders_club_sessions s
      WHERE s.id = session_id
        AND s.status = 'recruiting'
        AND (
          SELECT count(*)::integer
          FROM public.founders_club_applications fca
          WHERE fca.session_id = s.id
            AND fca.status IN ('pending', 'accepted')
        ) < s.max_participants
    )
  );

DROP POLICY IF EXISTS "fc_applications_cancel_own" ON public.founders_club_applications;
CREATE POLICY "fc_applications_cancel_own"
  ON public.founders_club_applications FOR UPDATE TO authenticated
  USING (
    auth.uid() = user_id
    AND status = ANY (ARRAY['pending', 'accepted'])
  )
  WITH CHECK (
    auth.uid() = user_id
    AND status = 'cancelled_by_user'
  );

DROP POLICY IF EXISTS "fc_applications_delete_own_terminal" ON public.founders_club_applications;
CREATE POLICY "fc_applications_delete_own_terminal"
  ON public.founders_club_applications FOR DELETE TO authenticated
  USING (
    auth.uid() = user_id
    AND status IN ('cancelled_by_user', 'cancelled_by_admin', 'rejected')
  );

CREATE OR REPLACE FUNCTION public.guard_fc_application_user_cancel()
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
    RAISE EXCEPTION 'cannot update another user Founder''s Club application';
  END IF;

  IF NOT (OLD.status = ANY (ARRAY['pending', 'accepted'])) OR NEW.status <> 'cancelled_by_user' THEN
    RAISE EXCEPTION 'users can only cancel pending or accepted Founder''s Club applications';
  END IF;

  IF (
    NEW.id, NEW.session_id, NEW.user_id, NEW.message, NEW.created_at
  ) IS DISTINCT FROM (
    OLD.id, OLD.session_id, OLD.user_id, OLD.message, OLD.created_at
  ) THEN
    RAISE EXCEPTION 'users can only change Founder''s Club application status to cancelled_by_user';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_fcfs_capacity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  active_count integer;
  max_count integer;
  current_status text;
BEGIN
  SELECT max_participants, status
    INTO max_count, current_status
  FROM public.founders_club_sessions
  WHERE id = NEW.session_id
  FOR UPDATE;

  SELECT count(*)::integer INTO active_count
  FROM public.founders_club_applications
  WHERE session_id = NEW.session_id
    AND status IN ('pending', 'accepted');

  IF NEW.status IN ('pending', 'accepted') AND active_count > max_count THEN
    RAISE EXCEPTION 'founders club capacity reached';
  END IF;

  UPDATE public.founders_club_sessions
  SET status = CASE
    WHEN active_count >= max_count THEN 'closed'
    WHEN current_status = 'completed' THEN 'completed'
    WHEN current_status = 'closed' THEN 'recruiting'
    ELSE current_status
  END
  WHERE id = NEW.session_id;

  RETURN NEW;
END;
$$;

-- ── consulting_reservations ─────────────────────────────────────
ALTER TABLE public.consulting_reservations ALTER COLUMN status SET DEFAULT 'pending';

UPDATE public.consulting_reservations
SET status = 'cancelled_by_user'
WHERE status = 'cancelled';

ALTER TABLE public.consulting_reservations
  DROP CONSTRAINT IF EXISTS consulting_reservations_status_check;

ALTER TABLE public.consulting_reservations
  ADD CONSTRAINT consulting_reservations_status_check
  CHECK (status = ANY (ARRAY['pending', 'confirmed', 'rejected', 'cancelled_by_user', 'cancelled_by_admin']));

DROP POLICY IF EXISTS "consulting_reservations_insert_own" ON public.consulting_reservations;
CREATE POLICY "consulting_reservations_insert_own"
  ON public.consulting_reservations FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND status = 'pending'
    AND EXISTS (
      SELECT 1
      FROM public.consulting_slots s
      WHERE s.id = slot_id
        AND s.status = 'available'
        AND s.slot_date >= CURRENT_DATE
    )
  );

DROP POLICY IF EXISTS "consulting_reservations_cancel_own" ON public.consulting_reservations;
CREATE POLICY "consulting_reservations_cancel_own"
  ON public.consulting_reservations FOR UPDATE TO authenticated
  USING (
    auth.uid() = user_id
    AND status = ANY (ARRAY['pending', 'confirmed'])
  )
  WITH CHECK (
    auth.uid() = user_id
    AND status = 'cancelled_by_user'
  );

DROP POLICY IF EXISTS "consulting_reservations_delete_own_terminal" ON public.consulting_reservations;
CREATE POLICY "consulting_reservations_delete_own_terminal"
  ON public.consulting_reservations FOR DELETE TO authenticated
  USING (
    auth.uid() = user_id
    AND status IN ('cancelled_by_user', 'cancelled_by_admin', 'rejected')
  );

CREATE OR REPLACE FUNCTION public.guard_consulting_reservation_user_cancel()
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
    RAISE EXCEPTION 'cannot update another user consulting reservation';
  END IF;

  IF NOT (OLD.status = ANY (ARRAY['pending', 'confirmed'])) OR NEW.status <> 'cancelled_by_user' THEN
    RAISE EXCEPTION 'users can only cancel pending or confirmed consulting reservations';
  END IF;

  IF (
    NEW.id, NEW.slot_id, NEW.user_id, NEW.description, NEW.admin_note, NEW.created_at
  ) IS DISTINCT FROM (
    OLD.id, OLD.slot_id, OLD.user_id, OLD.description, OLD.admin_note, OLD.created_at
  ) THEN
    RAISE EXCEPTION 'users can only change consulting reservation status to cancelled_by_user';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.release_consulting_slot_on_reservation_cancel()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status
     AND NEW.status IN ('rejected', 'cancelled_by_user', 'cancelled_by_admin')
     AND NEW.slot_id IS NOT NULL THEN
    UPDATE public.consulting_slots
    SET status = 'available'
    WHERE id = NEW.slot_id
      AND status = 'booked'
      AND NOT EXISTS (
        SELECT 1
        FROM public.consulting_reservations r
        WHERE r.slot_id = NEW.slot_id
          AND r.id <> NEW.id
          AND r.status IN ('pending', 'confirmed')
      );
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.book_consulting_slot_on_reservation_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IN ('pending', 'confirmed') AND NEW.slot_id IS NOT NULL THEN
    UPDATE public.consulting_slots
    SET status = 'booked'
    WHERE id = NEW.slot_id
      AND status = 'available';
    IF NOT FOUND THEN
      RAISE EXCEPTION 'consulting slot is not available';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS consulting_reservations_book_slot ON public.consulting_reservations;
CREATE TRIGGER consulting_reservations_book_slot
AFTER INSERT ON public.consulting_reservations
FOR EACH ROW EXECUTE FUNCTION public.book_consulting_slot_on_reservation_insert();

REVOKE ALL ON FUNCTION public.book_consulting_slot_on_reservation_insert() FROM PUBLIC;

-- ── Comments ────────────────────────────────────────────────────
COMMENT ON TABLE public.consulting_reservations
  IS 'Admin-approval consulting reservations. INSERT books the slot as pending; admin promotes to confirmed or rejects. Cancellation splits into cancelled_by_user / cancelled_by_admin.';

COMMENT ON TABLE public.founders_club_applications
  IS 'Admin-approval Founder''s Club applications. Capacity counts pending+accepted to guarantee a slot upon submission.';

COMMENT ON TABLE public.event_applications
  IS 'Admin-approval event applications. Capacity counts pending+accepted.';
