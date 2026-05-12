-- Realign public/authenticated access boundaries for board and program pages.
-- Public detail access: news, faq, events-archive.
-- Public preview access: notice/events/news/faq/events-archive via limited RPC.

DROP POLICY IF EXISTS "posts_select_public_non_expenses" ON public.posts;
DROP POLICY IF EXISTS "posts_select_public_detail_categories" ON public.posts;

CREATE POLICY "posts_select_public_detail_categories"
  ON public.posts FOR SELECT TO anon
  USING (category = ANY (ARRAY['news', 'faq', 'events-archive']));

CREATE OR REPLACE FUNCTION public.list_public_post_previews(p_category text DEFAULT NULL, p_limit integer DEFAULT 50)
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
    p.updated_at,
    p.thumbnail_url,
    p.thumbnail_crop
  FROM public.posts p
  WHERE p.category = ANY (ARRAY['notice', 'events', 'news', 'faq', 'events-archive'])
    AND (p_category IS NULL OR p.category = p_category)
  ORDER BY p.created_at DESC
  LIMIT least(greatest(coalesce(p_limit, 50), 1), 100);
$$;

CREATE OR REPLACE FUNCTION public.get_post_access_info(post_id uuid)
RETURNS TABLE (
  category text,
  requires_auth boolean,
  requires_participant_role boolean
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.category,
    (p.category <> ALL (ARRAY['news', 'faq', 'events-archive'])) AS requires_auth,
    (p.category = 'expenses') AS requires_participant_role
  FROM public.posts p
  WHERE p.id = $1;
$$;

GRANT EXECUTE ON FUNCTION public.list_public_post_previews(text, integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_post_access_info(uuid) TO anon, authenticated;

DROP POLICY IF EXISTS "consultants_select_public" ON public.consultants;
DROP POLICY IF EXISTS "consultants_select_auth" ON public.consultants;
CREATE POLICY "consultants_select_auth"
  ON public.consultants FOR SELECT TO authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "consulting_slots_select_public" ON public.consulting_slots;
DROP POLICY IF EXISTS "consulting_slots_select_auth" ON public.consulting_slots;
CREATE POLICY "consulting_slots_select_auth"
  ON public.consulting_slots FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "fc_sessions_select_public" ON public.founders_club_sessions;
DROP POLICY IF EXISTS "fc_sessions_select_auth" ON public.founders_club_sessions;
CREATE POLICY "fc_sessions_select_auth"
  ON public.founders_club_sessions FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "consulting_categories_public_read" ON public.consulting_categories;
DROP POLICY IF EXISTS "consulting_categories_auth_read" ON public.consulting_categories;
CREATE POLICY "consulting_categories_auth_read"
  ON public.consulting_categories FOR SELECT TO authenticated
  USING (true);

CREATE OR REPLACE FUNCTION public.increment_view_count(row_id text, visitor_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_post_id uuid;
  v_visitor_id uuid;
  v_can_view boolean;
  v_recent_exists boolean;
BEGIN
  BEGIN
    v_post_id := row_id::uuid;
  EXCEPTION WHEN invalid_text_representation THEN
    RETURN false;
  END;

  v_visitor_id := COALESCE(visitor_id, gen_random_uuid());

  SELECT EXISTS (
    SELECT 1
    FROM public.posts p
    WHERE p.id = v_post_id
      AND (
        p.category = ANY (ARRAY['news', 'faq', 'events-archive'])
        OR (
          auth.uid() IS NOT NULL
          AND (
            p.category <> 'expenses'
            OR EXISTS (
              SELECT 1
              FROM public.profiles pr
              WHERE pr.id = auth.uid()
                AND pr.role = ANY (ARRAY['admin', 'participant'])
            )
          )
        )
      )
  )
  INTO v_can_view;

  IF NOT v_can_view THEN
    RETURN false;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.post_view_events e
    WHERE e.post_id = v_post_id
      AND e.visitor_id = v_visitor_id
      AND e.viewed_at > now() - interval '30 minutes'
  )
  INTO v_recent_exists;

  IF v_recent_exists THEN
    RETURN false;
  END IF;

  INSERT INTO public.post_view_events (post_id, visitor_id)
  VALUES (v_post_id, v_visitor_id);

  UPDATE public.posts
  SET views = COALESCE(views, 0) + 1
  WHERE id = v_post_id;

  DELETE FROM public.post_view_events
  WHERE viewed_at < now() - interval '14 days';

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_view_count(text, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_view_count(text, uuid) TO service_role;
