ALTER TABLE public.event_applications
  DROP CONSTRAINT IF EXISTS event_applications_status_check;

ALTER TABLE public.event_applications
  ADD CONSTRAINT event_applications_status_check
  CHECK (status = ANY (ARRAY['pending', 'accepted', 'rejected', 'cancelled']));

DROP POLICY IF EXISTS "event_applications_cancel_own" ON public.event_applications;

CREATE POLICY "event_applications_cancel_own"
  ON public.event_applications FOR UPDATE TO authenticated
  USING (
    auth.uid() = user_id
    AND status = ANY (ARRAY['pending', 'accepted'])
  )
  WITH CHECK (
    auth.uid() = user_id
    AND status = 'cancelled'
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

  IF NOT (OLD.status = ANY (ARRAY['pending', 'accepted'])) OR NEW.status <> 'cancelled' THEN
    RAISE EXCEPTION 'users can only cancel pending or accepted event applications';
  END IF;

  IF (
    NEW.id,
    NEW.post_id,
    NEW.user_id,
    NEW.company_tech,
    NEW.applicant_name,
    NEW.position,
    NEW.email,
    NEW.phone,
    NEW.expectation,
    NEW.interests,
    NEW.speaker_question,
    NEW.privacy_consent,
    NEW.admin_note,
    NEW.created_at
  ) IS DISTINCT FROM (
    OLD.id,
    OLD.post_id,
    OLD.user_id,
    OLD.company_tech,
    OLD.applicant_name,
    OLD.position,
    OLD.email,
    OLD.phone,
    OLD.expectation,
    OLD.interests,
    OLD.speaker_question,
    OLD.privacy_consent,
    OLD.admin_note,
    OLD.created_at
  ) THEN
    RAISE EXCEPTION 'users can only change event application status to cancelled';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS event_applications_guard_user_cancel ON public.event_applications;
CREATE TRIGGER event_applications_guard_user_cancel
BEFORE UPDATE ON public.event_applications
FOR EACH ROW EXECUTE FUNCTION public.guard_event_application_user_cancel();

REVOKE ALL ON FUNCTION public.guard_event_application_user_cancel() FROM PUBLIC;
