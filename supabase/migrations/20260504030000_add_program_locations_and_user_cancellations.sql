ALTER TABLE public.consulting_slots
  ADD COLUMN IF NOT EXISTS location text;

ALTER TABLE public.founders_club_sessions
  ADD COLUMN IF NOT EXISTS location text;

COMMENT ON COLUMN public.consulting_slots.location
  IS 'Optional consulting meeting location, such as office, Zoom, Google Meet, or to be announced.';

COMMENT ON COLUMN public.founders_club_sessions.location
  IS 'Optional Founder''s Club session location, such as office, Zoom, Google Meet, or to be announced.';

ALTER TABLE public.consulting_reservations
  DROP CONSTRAINT IF EXISTS consulting_reservations_status_check;

ALTER TABLE public.consulting_reservations
  ADD CONSTRAINT consulting_reservations_status_check
  CHECK (status = ANY (ARRAY['pending', 'confirmed', 'rejected', 'cancelled']));

ALTER TABLE public.founders_club_applications
  DROP CONSTRAINT IF EXISTS founders_club_applications_status_check;

ALTER TABLE public.founders_club_applications
  ADD CONSTRAINT founders_club_applications_status_check
  CHECK (status = ANY (ARRAY['pending', 'accepted', 'rejected', 'cancelled']));

DROP POLICY IF EXISTS "consulting_reservations_cancel_own" ON public.consulting_reservations;
CREATE POLICY "consulting_reservations_cancel_own"
  ON public.consulting_reservations FOR UPDATE TO authenticated
  USING (
    auth.uid() = user_id
    AND status = ANY (ARRAY['pending', 'confirmed'])
  )
  WITH CHECK (
    auth.uid() = user_id
    AND status = 'cancelled'
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
    AND status = 'cancelled'
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

  IF NOT (OLD.status = ANY (ARRAY['pending', 'confirmed'])) OR NEW.status <> 'cancelled' THEN
    RAISE EXCEPTION 'users can only cancel pending or confirmed consulting reservations';
  END IF;

  IF (
    NEW.id,
    NEW.slot_id,
    NEW.user_id,
    NEW.description,
    NEW.admin_note,
    NEW.created_at
  ) IS DISTINCT FROM (
    OLD.id,
    OLD.slot_id,
    OLD.user_id,
    OLD.description,
    OLD.admin_note,
    OLD.created_at
  ) THEN
    RAISE EXCEPTION 'users can only change consulting reservation status to cancelled';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS consulting_reservations_guard_user_cancel ON public.consulting_reservations;
CREATE TRIGGER consulting_reservations_guard_user_cancel
BEFORE UPDATE ON public.consulting_reservations
FOR EACH ROW EXECUTE FUNCTION public.guard_consulting_reservation_user_cancel();

CREATE OR REPLACE FUNCTION public.release_consulting_slot_on_reservation_cancel()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status
     AND NEW.status = ANY (ARRAY['rejected', 'cancelled'])
     AND NEW.slot_id IS NOT NULL THEN
    UPDATE public.consulting_slots
    SET status = 'available'
    WHERE id = NEW.slot_id
      AND status = 'booked';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS consulting_reservations_release_slot ON public.consulting_reservations;
CREATE TRIGGER consulting_reservations_release_slot
AFTER UPDATE ON public.consulting_reservations
FOR EACH ROW EXECUTE FUNCTION public.release_consulting_slot_on_reservation_cancel();

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

  IF NOT (OLD.status = ANY (ARRAY['pending', 'accepted'])) OR NEW.status <> 'cancelled' THEN
    RAISE EXCEPTION 'users can only cancel pending or accepted Founder''s Club applications';
  END IF;

  IF (
    NEW.id,
    NEW.session_id,
    NEW.user_id,
    NEW.message,
    NEW.created_at
  ) IS DISTINCT FROM (
    OLD.id,
    OLD.session_id,
    OLD.user_id,
    OLD.message,
    OLD.created_at
  ) THEN
    RAISE EXCEPTION 'users can only change Founder''s Club application status to cancelled';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS fc_applications_guard_user_cancel ON public.founders_club_applications;
CREATE TRIGGER fc_applications_guard_user_cancel
BEFORE UPDATE ON public.founders_club_applications
FOR EACH ROW EXECUTE FUNCTION public.guard_fc_application_user_cancel();

REVOKE ALL ON FUNCTION public.guard_consulting_reservation_user_cancel() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.release_consulting_slot_on_reservation_cancel() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.guard_fc_application_user_cancel() FROM PUBLIC;
