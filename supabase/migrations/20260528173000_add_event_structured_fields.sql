-- 행사 게시물의 일시/장소를 구조 컬럼으로 점진 이행한다.
-- 기존 event_date/location 문자열은 레거시 호환용으로 유지하고,
-- 새 컬럼(event_start_at, venue_name, venue_address)을 source of truth 로 도입한다.

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS event_start_at timestamptz,
  ADD COLUMN IF NOT EXISTS venue_name text,
  ADD COLUMN IF NOT EXISTS venue_address text;

COMMENT ON COLUMN public.posts.event_start_at
  IS '행사 시작 일시 (Asia/Seoul 기준 입력을 timestamptz 로 저장). events 카테고리 전용 구조 컬럼.';

COMMENT ON COLUMN public.posts.venue_name
  IS '행사 장소명 (예: NCF 라운지). events 카테고리 전용 구조 컬럼.';

COMMENT ON COLUMN public.posts.venue_address
  IS '행사 주소 또는 링크. events 카테고리 전용 구조 컬럼.';

-- 기존 events.location 문자열을 venue_name / venue_address 로 최대한 복원한다.
UPDATE public.posts
SET
  venue_name = COALESCE(
    NULLIF(TRIM(venue_name), ''),
    NULLIF(TRIM(split_part(COALESCE(location, ''), '|', 1)), '')
  ),
  venue_address = COALESCE(
    NULLIF(TRIM(venue_address), ''),
    NULLIF(
      TRIM(
        CASE
          WHEN position('|' IN COALESCE(location, '')) > 0
            THEN substr(location, position('|' IN location) + 1)
          ELSE ''
        END
      ),
      ''
    )
  )
WHERE category = 'events';

-- 기존 events.event_date 문자열 중 규칙적인 값은 event_start_at 으로 backfill 한다.
WITH parsed AS (
  SELECT
    id,
    regexp_match(
      TRIM(COALESCE(event_date, '')),
      '(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})(?:\s*\([^)]+\))?(?:\s+(\d{1,2})(?::|시)\s*(\d{1,2})?)?'
    ) AS parts
  FROM public.posts
  WHERE category = 'events'
    AND event_start_at IS NULL
    AND NULLIF(TRIM(COALESCE(event_date, '')), '') IS NOT NULL
)
UPDATE public.posts p
SET event_start_at = make_timestamptz(
  (parsed.parts)[1]::integer,
  (parsed.parts)[2]::integer,
  (parsed.parts)[3]::integer,
  COALESCE(NULLIF((parsed.parts)[4], ''), '0')::integer,
  COALESCE(NULLIF((parsed.parts)[5], ''), '0')::integer,
  0,
  'Asia/Seoul'
)
FROM parsed
WHERE p.id = parsed.id
  AND parsed.parts IS NOT NULL
  AND (parsed.parts)[2]::integer BETWEEN 1 AND 12
  AND COALESCE(NULLIF((parsed.parts)[4], ''), '0')::integer BETWEEN 0 AND 23
  AND COALESCE(NULLIF((parsed.parts)[5], ''), '0')::integer BETWEEN 0 AND 59
  AND to_char(
    to_date(
      format(
        '%s-%s-%s',
        (parsed.parts)[1],
        lpad((parsed.parts)[2], 2, '0'),
        lpad((parsed.parts)[3], 2, '0')
      ),
      'YYYY-MM-DD'
    ),
    'YYYY-MM-DD'
  ) = format(
    '%s-%s-%s',
    (parsed.parts)[1],
    lpad((parsed.parts)[2], 2, '0'),
    lpad((parsed.parts)[3], 2, '0')
  );

-- 행사 preview RPC 에 구조 컬럼을 함께 노출한다.
DROP FUNCTION IF EXISTS public.list_public_post_previews(text, integer);

CREATE OR REPLACE FUNCTION public.list_public_post_previews(p_category text DEFAULT NULL, p_limit integer DEFAULT NULL)
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
    p.event_start_at,
    p.event_date,
    p.venue_name,
    p.venue_address,
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
