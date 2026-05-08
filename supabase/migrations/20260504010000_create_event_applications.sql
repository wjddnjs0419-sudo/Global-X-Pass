ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS event_form_config jsonb;

COMMENT ON COLUMN public.posts.event_form_config
  IS 'Events-only application form config. Stores editable question labels, interest options, and completion copy.';

CREATE TABLE IF NOT EXISTS public.event_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_tech text NOT NULL,
  applicant_name text NOT NULL,
  position text NOT NULL,
  email text NOT NULL,
  phone text,
  expectation text NOT NULL,
  interests text[] NOT NULL DEFAULT '{}',
  speaker_question text,
  privacy_consent boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'pending',
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT event_applications_status_check CHECK (status = ANY (ARRAY['pending', 'accepted', 'rejected'])),
  CONSTRAINT event_applications_privacy_check CHECK (privacy_consent = true),
  CONSTRAINT event_applications_unique_user_post UNIQUE (post_id, user_id)
);

ALTER TABLE public.event_applications ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_event_applications_post_status
  ON public.event_applications (post_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_event_applications_user
  ON public.event_applications (user_id, created_at DESC);

COMMENT ON TABLE public.event_applications
  IS 'Event application submissions linked to posts.category = events.';

DROP POLICY IF EXISTS "event_applications_select_own" ON public.event_applications;
DROP POLICY IF EXISTS "event_applications_insert_own" ON public.event_applications;
DROP POLICY IF EXISTS "event_applications_all_admin" ON public.event_applications;

CREATE POLICY "event_applications_select_own"
  ON public.event_applications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "event_applications_insert_own"
  ON public.event_applications FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM public.posts p
      WHERE p.id = post_id
        AND p.category = 'events'
        AND COALESCE(p.event_status, '접수중') <> '마감'
    )
  );

CREATE POLICY "event_applications_all_admin"
  ON public.event_applications TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE OR REPLACE FUNCTION public.refresh_event_slots_remaining(target_post_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  accepted_count integer;
  event_capacity integer;
BEGIN
  SELECT capacity INTO event_capacity
  FROM public.posts
  WHERE id = target_post_id
    AND category = 'events';

  IF event_capacity IS NULL THEN
    RETURN;
  END IF;

  SELECT count(*)::integer INTO accepted_count
  FROM public.event_applications
  WHERE post_id = target_post_id
    AND status = 'accepted';

  UPDATE public.posts
  SET slots_remaining = GREATEST(event_capacity - accepted_count, 0),
      event_status = CASE
        WHEN event_capacity - accepted_count <= 0 THEN '마감'
        WHEN event_status = '마감' THEN event_status
        ELSE event_status
      END,
      updated_at = now()
  WHERE id = target_post_id
    AND category = 'events';
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
      AND category = 'events';

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

DROP TRIGGER IF EXISTS event_applications_sync_counts ON public.event_applications;
CREATE TRIGGER event_applications_sync_counts
AFTER INSERT OR UPDATE OR DELETE ON public.event_applications
FOR EACH ROW EXECUTE FUNCTION public.sync_event_application_counts();

CREATE OR REPLACE FUNCTION public.get_event_application_counts()
RETURNS TABLE(post_id uuid, accepted_count integer, total_count integer)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ea.post_id,
    count(*) FILTER (WHERE ea.status = 'accepted')::integer AS accepted_count,
    count(*)::integer AS total_count
  FROM public.event_applications ea
  JOIN public.posts p ON p.id = ea.post_id
  WHERE p.category = 'events'
  GROUP BY ea.post_id;
$$;

REVOKE ALL ON FUNCTION public.refresh_event_slots_remaining(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sync_event_application_counts() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_event_application_counts() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.set_event_applications_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS event_applications_updated_at ON public.event_applications;
CREATE TRIGGER event_applications_updated_at
BEFORE UPDATE ON public.event_applications
FOR EACH ROW EXECUTE FUNCTION public.set_event_applications_updated_at();
