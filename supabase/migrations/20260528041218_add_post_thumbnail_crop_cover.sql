-- 행사 신청 상단 cover 썸네일용 crop 좌표 컬럼.
-- 같은 thumbnail_url(원본 1장)을 공유하면서 목록 카드(thumbnail_crop)와
-- 신청 상단(thumbnail_crop_cover)의 cover 영역을 각각 따로 지정 가능.
-- NULL = 미지정 (렌더 시 thumbnail_crop fallback).
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS thumbnail_crop_cover jsonb;

-- list_public_post_previews RPC 재정의: thumbnail_crop_cover 컬럼 추가.
DROP FUNCTION IF EXISTS public.list_public_post_previews(text, integer);

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
  thumbnail_crop jsonb,
  thumbnail_crop_cover jsonb,
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

GRANT EXECUTE ON FUNCTION public.list_public_post_previews(text, integer) TO anon, authenticated;
