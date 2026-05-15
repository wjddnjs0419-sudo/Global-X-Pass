ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS application_deadline timestamptz;

COMMENT ON COLUMN public.posts.application_deadline
  IS 'Events-only application deadline. If set and past, public event applications are closed.';

DROP FUNCTION IF EXISTS public.list_public_post_previews(text, integer);
CREATE FUNCTION public.list_public_post_previews(p_category text DEFAULT NULL, p_limit integer DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  title text,
  content text,
  created_at timestamptz,
  category text,
  image_url text,
  event_date text,
  location text,
  views integer,
  is_featured boolean,
  capacity integer,
  slots_remaining integer,
  tags text,
  event_status text,
  application_deadline timestamptz,
  updated_at timestamptz,
  thumbnail_url text,
  thumbnail_crop jsonb
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.title,
    left(
      regexp_replace(
        regexp_replace(coalesce(p.content, ''), '<[^>]+>', ' ', 'g'),
        '\s+',
        ' ',
        'g'
      ),
      500
    ) AS content,
    p.created_at,
    p.category,
    p.image_url,
    p.event_date,
    p.location,
    p.views,
    p.is_featured,
    p.capacity,
    p.slots_remaining,
    p.tags,
    p.event_status,
    p.application_deadline,
    p.updated_at,
    p.thumbnail_url,
    p.thumbnail_crop
  FROM public.posts p
  WHERE p.category = ANY (ARRAY['notice', 'events', 'news', 'faq', 'events-archive'])
    AND (p_category IS NULL OR p.category = p_category)
  ORDER BY p.created_at DESC
  LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION public.list_public_post_previews(text, integer) TO anon, authenticated;

ALTER TABLE public.event_applications
  DROP CONSTRAINT IF EXISTS event_applications_unique_user_post;

DROP INDEX IF EXISTS public.unique_active_event_application_per_user_post;
CREATE UNIQUE INDEX unique_active_event_application_per_user_post
  ON public.event_applications (post_id, user_id)
  WHERE status NOT IN ('cancelled', 'rejected');

ALTER TABLE public.founders_club_applications
  DROP CONSTRAINT IF EXISTS founders_club_applications_session_id_user_id_key;

DROP INDEX IF EXISTS public.unique_active_fc_application_per_user_session;
CREATE UNIQUE INDEX unique_active_fc_application_per_user_session
  ON public.founders_club_applications (session_id, user_id)
  WHERE status NOT IN ('cancelled', 'rejected');

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

DROP POLICY IF EXISTS "event_applications_insert_own" ON public.event_applications;
CREATE POLICY "event_applications_insert_own"
  ON public.event_applications FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND public.can_apply_to_event(post_id)
  );

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

DROP TRIGGER IF EXISTS posts_apply_event_status_fields ON public.posts;
CREATE TRIGGER posts_apply_event_status_fields
BEFORE INSERT OR UPDATE OF category, capacity, application_deadline, event_status ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.apply_event_post_status_fields();

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

CREATE OR REPLACE FUNCTION public.check_fcfs_capacity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  accepted_count integer;
  max_count integer;
  current_status text;
BEGIN
  SELECT max_participants, status
    INTO max_count, current_status
  FROM public.founders_club_sessions
  WHERE id = NEW.session_id
  FOR UPDATE;

  SELECT count(*)::integer INTO accepted_count
  FROM public.founders_club_applications
  WHERE session_id = NEW.session_id
    AND status = 'accepted';

  IF NEW.status = 'accepted' AND accepted_count > max_count THEN
    RAISE EXCEPTION 'founders club capacity reached';
  END IF;

  UPDATE public.founders_club_sessions
  SET status = CASE
    WHEN accepted_count >= max_count THEN 'closed'
    WHEN current_status = 'completed' THEN 'completed'
    WHEN current_status = 'closed' THEN 'recruiting'
    ELSE current_status
  END
  WHERE id = NEW.session_id;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.can_apply_to_event(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_apply_to_event(uuid) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.apply_event_post_status_fields() FROM PUBLIC;
GRANT SELECT, UPDATE ON TABLE public.posts TO authenticated, service_role;
