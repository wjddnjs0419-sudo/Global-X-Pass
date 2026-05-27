-- Per-post public/private visibility control (admin-managed)
-- 공개(is_public=true): 비로그인 anon도 열람 가능
-- 비공개(is_public=false): 로그인한 authenticated 유저만 열람 가능

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT true;

-- 기존 데이터 초기값: 이전 하드코딩 정책과 동일하게 정렬
-- 공개 카테고리: news, faq, events-archive, notice, events
-- 비공개 카테고리: resources, media, blog, expenses
UPDATE public.posts
SET is_public = false
WHERE category IN ('resources', 'media', 'blog', 'expenses');

UPDATE public.posts
SET is_public = true
WHERE category IN ('news', 'faq', 'events-archive', 'notice', 'events');

-- ─────────────────────────────────────────────────────────────
-- RLS: anon은 is_public = true 인 글만 SELECT 가능
-- ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "posts_select_public_detail_categories" ON public.posts;

CREATE POLICY "posts_select_public_by_flag"
  ON public.posts FOR SELECT TO anon
  USING (is_public = true);

-- ─────────────────────────────────────────────────────────────
-- list_public_post_previews: is_public 플래그 기반으로 필터링
-- ─────────────────────────────────────────────────────────────

DROP FUNCTION IF EXISTS public.list_public_post_previews(text, integer);

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
  thumbnail_crop jsonb,
  is_public boolean
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
    p.thumbnail_crop,
    p.is_public
  FROM public.posts p
  WHERE p.is_public = true
    AND (p_category IS NULL OR p.category = p_category)
  ORDER BY p.created_at DESC
  LIMIT least(greatest(coalesce(p_limit, 50), 1), 100);
$$;

GRANT EXECUTE ON FUNCTION public.list_public_post_previews(text, integer) TO anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- get_post_access_info: requires_auth = NOT is_public
-- ─────────────────────────────────────────────────────────────

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
    (NOT p.is_public) AS requires_auth,
    (p.category = 'expenses') AS requires_participant_role
  FROM public.posts p
  WHERE p.id = $1;
$$;

GRANT EXECUTE ON FUNCTION public.get_post_access_info(uuid) TO anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- increment_view_count: is_public 플래그 기반으로 조회 권한 판정
-- ─────────────────────────────────────────────────────────────

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
        p.is_public = true
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
