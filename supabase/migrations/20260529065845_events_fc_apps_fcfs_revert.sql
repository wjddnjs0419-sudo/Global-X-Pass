-- Partial rollback of 20260529025958_revert_to_approval_model.
-- Events + FC participation applications return to FCFS (auto-confirm on submission).
-- FC session registration remains admin-approved (separate migration 20260527013726).
-- Consulting reservations remain admin-approved (unchanged).
-- Cancellation vocabulary (cancelled_by_user / cancelled_by_admin / rejected) preserved
-- so admins can still reject/cancel and analytics keep the same status set.

-- ── event_applications ───────────────────────────────────────────
ALTER TABLE public.event_applications ALTER COLUMN status SET DEFAULT 'accepted';

UPDATE public.event_applications
SET status = 'accepted'
WHERE status = 'pending';

DROP POLICY IF EXISTS "event_applications_insert_own" ON public.event_applications;
CREATE POLICY "event_applications_insert_own"
  ON public.event_applications FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND status = 'accepted'
    AND public.can_apply_to_event(post_id)
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

  IF OLD.status <> 'accepted' OR NEW.status <> 'cancelled_by_user' THEN
    RAISE EXCEPTION 'users can only cancel accepted event applications';
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

-- ── founders_club_applications ──────────────────────────────────
ALTER TABLE public.founders_club_applications ALTER COLUMN status SET DEFAULT 'accepted';

UPDATE public.founders_club_applications
SET status = 'accepted'
WHERE status = 'pending';

DROP POLICY IF EXISTS "fc_applications_insert_own" ON public.founders_club_applications;
CREATE POLICY "fc_applications_insert_own"
  ON public.founders_club_applications FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND status = 'accepted'
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

  IF OLD.status <> 'accepted' OR NEW.status <> 'cancelled_by_user' THEN
    RAISE EXCEPTION 'users can only cancel accepted Founder''s Club applications';
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
