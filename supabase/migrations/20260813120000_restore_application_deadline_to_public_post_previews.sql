-- Public post preview RPC에 행사 신청 마감 시각을 다시 노출한다.
-- RETURNS TABLE 구조 변경이므로 기존 함수를 명시적으로 재생성한다.
DROP FUNCTION IF EXISTS public.list_public_post_previews(text, integer);

CREATE FUNCTION public.list_public_post_previews(p_category text DEFAULT NULL, p_limit integer DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  title text,
  content text,
  created_at timestamptz,
  category text,
  image_url text,
  event_start_at timestamptz,
  event_date text,
  venue_name text,
  venue_address text,
  location text,
  views integer,
  is_featured boolean,
  capacity integer,
  slots_remaining integer,
  application_deadline timestamptz,
  tags text,
  event_status text,
  updated_at timestamptz,
  thumbnail_url text,
  thumbnail_crop jsonb,
  thumbnail_crop_cover jsonb,
  is_public boolean
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO public
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
    p.event_start_at,
    p.event_date,
    p.venue_name,
    p.venue_address,
    p.location,
    p.views,
    p.is_featured,
    p.capacity,
    p.slots_remaining,
    p.application_deadline,
    p.tags,
    p.event_status,
    p.updated_at,
    p.thumbnail_url,
    p.thumbnail_crop,
    p.thumbnail_crop_cover,
    p.is_public
  FROM public.posts p
  WHERE p.category <> 'expenses'
    AND (
      auth.uid() IS NOT NULL
      OR (
        p.is_public = true
        AND EXISTS (
          SELECT 1 FROM public.post_categories pc
          WHERE pc.id = p.category AND pc.is_public = true
        )
      )
    )
    AND (p_category IS NULL OR p.category = p_category)
  ORDER BY p.created_at DESC
  LIMIT CASE WHEN p_limit IS NULL THEN NULL ELSE least(greatest(p_limit, 1), 200) END;
$$;

ALTER FUNCTION public.list_public_post_previews(text, integer) OWNER TO postgres;

GRANT EXECUTE ON FUNCTION public.list_public_post_previews(text, integer) TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_public_post_previews(text, integer) TO anon, authenticated, service_role;
