-- expenses 카테고리는 공개/비공개 토글 대상에서 영구 제외.
-- is_public 값과 무관하게 항상 로그인 + participant/admin 권한 필요.

-- 1) 기존 expenses 글은 is_public = false 로 강제 (안전 기본값)
UPDATE public.posts
SET is_public = false
WHERE category = 'expenses';

-- 2) expenses 글의 is_public 변경 자체를 막는 트리거
CREATE OR REPLACE FUNCTION public.enforce_expenses_visibility()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.category = 'expenses' AND NEW.is_public IS DISTINCT FROM false THEN
    NEW.is_public := false;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_expenses_visibility_trigger ON public.posts;
CREATE TRIGGER enforce_expenses_visibility_trigger
  BEFORE INSERT OR UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.enforce_expenses_visibility();

-- 3) anon RLS 정책에 expenses 예외 추가
DROP POLICY IF EXISTS "posts_select_public_by_flag" ON public.posts;

CREATE POLICY "posts_select_public_by_flag"
  ON public.posts FOR SELECT TO anon
  USING (is_public = true AND category <> 'expenses');

-- 4) list_public_post_previews: expenses 영구 제외 + NULL limit = 무제한 동작 복구
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
    AND p.category <> 'expenses'
    AND (p_category IS NULL OR p.category = p_category)
  ORDER BY p.created_at DESC
  LIMIT CASE WHEN p_limit IS NULL THEN NULL ELSE least(greatest(p_limit, 1), 200) END;
$$;

GRANT EXECUTE ON FUNCTION public.list_public_post_previews(text, integer) TO anon, authenticated;

-- 5) get_post_access_info: expenses 는 항상 requires_auth = true
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
    (p.category = 'expenses' OR NOT p.is_public) AS requires_auth,
    (p.category = 'expenses') AS requires_participant_role
  FROM public.posts p
  WHERE p.id = $1;
$$;

GRANT EXECUTE ON FUNCTION public.get_post_access_info(uuid) TO anon, authenticated;

-- 6) increment_view_count: expenses 는 is_public 우회 차단
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
        (p.is_public = true AND p.category <> 'expenses')
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
