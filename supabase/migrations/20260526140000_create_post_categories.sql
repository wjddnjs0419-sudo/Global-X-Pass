-- post_categories: 게시판(카테고리) 단위 공개/비공개 접근 권한을 동적으로 관리
-- is_public=false 게시판은 anon 접근 차단(로그인 필요), is_locked=true는 잠금(설정 변경 불가)
-- expenses는 항상 is_locked=true, is_public=false (글 단위 트리거와 함께 이중 잠금)

-- ─────────────────────────────────────────────────────────────
-- 1) post_categories 테이블
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.post_categories (
  id text PRIMARY KEY,
  label text NOT NULL,
  description text,
  is_public boolean NOT NULL DEFAULT true,
  is_locked boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.touch_post_categories_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS touch_post_categories_updated_at_trigger ON public.post_categories;
CREATE TRIGGER touch_post_categories_updated_at_trigger
  BEFORE UPDATE ON public.post_categories
  FOR EACH ROW EXECUTE FUNCTION public.touch_post_categories_updated_at();

-- ─────────────────────────────────────────────────────────────
-- 2) Seed: 기존 카테고리 초기 상태 (이전 routes.tsx AuthRoute 동작과 정렬)
--    공개(anon 접근): notice, news, events, events-archive, faq
--    비공개(로그인 필요): resources, media(=insights), blog
--    잠금: expenses (영구 비공개)
-- ─────────────────────────────────────────────────────────────

INSERT INTO public.post_categories (id, label, description, is_public, is_locked, sort_order) VALUES
  ('notice',         '공지사항',     '프로그램 운영 공지',           true,  false, 10),
  ('news',           '뉴스',         '창구 프로그램 관련 뉴스',       true,  false, 20),
  ('events',         '이벤트',       '진행 예정/진행 중 행사',         true,  false, 30),
  ('events-archive', '이벤트 아카이브','종료된 행사 기록',             true,  false, 40),
  ('faq',            'FAQ',          '자주 묻는 질문',                 true,  false, 50),
  ('resources',      '자료실',       '참여사 전용 자료',               false, false, 60),
  ('media',          '인사이트',     '미디어/인사이트 콘텐츠',         false, false, 70),
  ('blog',           '블로그',       '운영팀 블로그',                  false, false, 80),
  ('expenses',       '비용 정산',    '참여사 비용 정산 안내(잠금)',    false, true,  90)
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- 3) expenses 카테고리 잠금 강제 트리거
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.enforce_post_category_lock()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- 잠긴 카테고리는 is_public/is_locked 변경 금지
  IF OLD.is_locked = true THEN
    IF NEW.is_public IS DISTINCT FROM OLD.is_public
       OR NEW.is_locked IS DISTINCT FROM OLD.is_locked THEN
      RAISE EXCEPTION '카테고리 % 는 잠겨 있어 공개/잠금 설정을 변경할 수 없습니다.', OLD.id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_post_category_lock_trigger ON public.post_categories;
CREATE TRIGGER enforce_post_category_lock_trigger
  BEFORE UPDATE ON public.post_categories
  FOR EACH ROW EXECUTE FUNCTION public.enforce_post_category_lock();

-- ─────────────────────────────────────────────────────────────
-- 4) RLS
--    anon/authenticated: SELECT 전체 (게시판 메타데이터는 누구나 조회)
--    admin: UPDATE 가능 (라벨/설명/공개여부)
--    INSERT/DELETE: service_role 또는 admin (마이그레이션으로만 추가)
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.post_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "post_categories_select_all" ON public.post_categories;
CREATE POLICY "post_categories_select_all"
  ON public.post_categories FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "post_categories_update_admin" ON public.post_categories;
CREATE POLICY "post_categories_update_admin"
  ON public.post_categories FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles pr
      WHERE pr.id = auth.uid() AND pr.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles pr
      WHERE pr.id = auth.uid() AND pr.role = 'admin'
    )
  );

GRANT SELECT ON public.post_categories TO anon, authenticated;
GRANT UPDATE ON public.post_categories TO authenticated;

-- ─────────────────────────────────────────────────────────────
-- 5) anon RLS on posts: board is_public 이중 체크
-- ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "posts_select_public_by_flag" ON public.posts;

CREATE POLICY "posts_select_public_by_flag"
  ON public.posts FOR SELECT TO anon
  USING (
    is_public = true
    AND category <> 'expenses'
    AND EXISTS (
      SELECT 1 FROM public.post_categories pc
      WHERE pc.id = posts.category AND pc.is_public = true
    )
  );

-- ─────────────────────────────────────────────────────────────
-- 6) list_public_post_previews: board is_public 체크 추가
-- ─────────────────────────────────────────────────────────────

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
  WHERE p.category <> 'expenses'
    AND (
      -- 로그인 유저: 비공개 게시판/글도 모두 열람 (단, expenses 제외)
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

-- ─────────────────────────────────────────────────────────────
-- 7) get_post_access_info: board is_public 가 false면 requires_auth=true
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
    (
      p.category = 'expenses'
      OR NOT p.is_public
      OR NOT COALESCE(pc.is_public, false)
    ) AS requires_auth,
    (p.category = 'expenses') AS requires_participant_role
  FROM public.posts p
  LEFT JOIN public.post_categories pc ON pc.id = p.category
  WHERE p.id = $1;
$$;

GRANT EXECUTE ON FUNCTION public.get_post_access_info(uuid) TO anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- 8) increment_view_count: board is_public 가 false면 anon 우회 차단
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
    LEFT JOIN public.post_categories pc ON pc.id = p.category
    WHERE p.id = v_post_id
      AND (
        (
          p.is_public = true
          AND p.category <> 'expenses'
          AND COALESCE(pc.is_public, false) = true
        )
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
