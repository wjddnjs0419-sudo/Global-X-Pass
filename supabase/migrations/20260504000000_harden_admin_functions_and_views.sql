-- ================================================================
-- ADMIN FUNCTION + VIEW COUNT HARDENING
-- Global X Pass — 2026-05-04
-- 목적:
-- 1. Edge Functions now use public.is_admin() for MFA-aware admin checks.
-- 2. Post view increments are constrained by visitor/post cooldown.
-- ================================================================

CREATE TABLE IF NOT EXISTS public.post_view_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  visitor_id uuid NOT NULL,
  viewed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.post_view_events ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_post_view_events_post_visitor_recent
  ON public.post_view_events (post_id, visitor_id, viewed_at DESC);

COMMENT ON TABLE public.post_view_events
  IS 'Internal cooldown log for post view increments. Written only by increment_view_count().';

DROP FUNCTION IF EXISTS public.increment_view_count(text);

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
        p.category <> 'expenses'
        OR EXISTS (
          SELECT 1
          FROM public.profiles pr
          WHERE pr.id = auth.uid()
            AND pr.role = ANY(ARRAY['admin', 'participant'])
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

REVOKE ALL ON TABLE public.post_view_events FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_view_count(text, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_view_count(text, uuid) TO service_role;
