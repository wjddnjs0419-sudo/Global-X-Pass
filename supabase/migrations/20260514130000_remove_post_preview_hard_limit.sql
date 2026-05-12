-- list_public_post_previews: p_limit=NULL이면 제한 없이 전체 반환
-- (클라이언트 페이지네이션 페이지는 전체를 로드해야 하므로 hard cap 제거)
CREATE OR REPLACE FUNCTION public.list_public_post_previews(p_category text DEFAULT NULL, p_limit integer DEFAULT NULL)
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
  LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION public.list_public_post_previews(text, integer) TO anon, authenticated;
