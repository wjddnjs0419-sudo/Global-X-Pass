ALTER TABLE public.event_applications
  ADD COLUMN IF NOT EXISTS answers jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.event_applications.answers
  IS 'Additional event application answers keyed by event_form_config.customQuestions id.';

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
    NEW.answers,
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
    OLD.answers,
    OLD.created_at
  ) THEN
    RAISE EXCEPTION 'users can only change event application status to cancelled';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.guard_event_application_user_cancel() FROM PUBLIC;
