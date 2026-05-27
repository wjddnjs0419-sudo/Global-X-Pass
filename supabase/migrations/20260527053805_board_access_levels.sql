-- 게시판 3단계 접근 모델: access_level(public|gated|private) + kind(board|page)
-- public  = 목록+상세 공개
-- gated   = 목록 공개, 상세/신청 클릭 시 로그인
-- private = 페이지 진입 자체 로그인
-- is_public 은 RLS(posts_select_public_by_flag) 호환 위해 유지하되 access_level 과 트리거 동기화

-- 1) 컬럼 추가
ALTER TABLE public.post_categories
  ADD COLUMN IF NOT EXISTS access_level text NOT NULL DEFAULT 'gated',
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'board';

ALTER TABLE public.post_categories DROP CONSTRAINT IF EXISTS post_categories_access_level_check;
ALTER TABLE public.post_categories
  ADD CONSTRAINT post_categories_access_level_check CHECK (access_level IN ('public','gated','private'));

ALTER TABLE public.post_categories DROP CONSTRAINT IF EXISTS post_categories_kind_check;
ALTER TABLE public.post_categories
  ADD CONSTRAINT post_categories_kind_check CHECK (kind IN ('board','page'));

-- 2) 기존 게시판 매핑 (현 동작 보존: sync 트리거/lock access_level 체크 도입 전이라 잠금 회피)
UPDATE public.post_categories SET access_level = 'public'
  WHERE id IN ('notice','news','events','events-archive','faq');
UPDATE public.post_categories SET access_level = 'private'
  WHERE id IN ('resources','media','expenses');

-- 3) 특수 페이지 가상 게시판 (실제 posts 게시물 없음, kind=page)
INSERT INTO public.post_categories (id, label, description, is_public, is_locked, sort_order, access_level, kind)
VALUES
  ('companies',     '참여 기업',       NULL, true, false, 100, 'gated', 'page'),
  ('consulting',    '1:1 컨설팅',      NULL, true, false, 110, 'gated', 'page'),
  ('founders-club', 'Founder''s Club', NULL, true, false, 120, 'gated', 'page')
ON CONFLICT (id) DO NOTHING;

-- 4) access_level -> is_public 동기화 (목록 진입 가능 = private 아님)
CREATE OR REPLACE FUNCTION public.sync_post_category_access()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.is_public := (NEW.access_level <> 'private');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_post_category_access_trigger ON public.post_categories;
CREATE TRIGGER sync_post_category_access_trigger
  BEFORE INSERT OR UPDATE ON public.post_categories
  FOR EACH ROW EXECUTE FUNCTION public.sync_post_category_access();

-- 5) 잠금 트리거에 access_level 보호 추가 (expenses 등 잠긴 카테고리 변경 차단)
CREATE OR REPLACE FUNCTION public.enforce_post_category_lock()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.is_locked = true THEN
    IF NEW.is_public IS DISTINCT FROM OLD.is_public
       OR NEW.access_level IS DISTINCT FROM OLD.access_level
       OR NEW.is_locked IS DISTINCT FROM OLD.is_locked
       OR NEW.label IS DISTINCT FROM OLD.label
       OR NEW.description IS DISTINCT FROM OLD.description THEN
      RAISE EXCEPTION '카테고리 % 는 잠겨 있어 설정을 변경할 수 없습니다.', OLD.id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- 6) 상세 접근 RPC: 게시판 access_level 기반으로 상세 로그인 필요 여부 판단
CREATE OR REPLACE FUNCTION public.get_post_access_info(post_id uuid)
RETURNS TABLE(category text, requires_auth boolean, requires_participant_role boolean)
LANGUAGE sql SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT
    p.category,
    (
      p.category = 'expenses'
      OR NOT p.is_public
      OR COALESCE(pc.access_level, 'private') <> 'public'
    ) AS requires_auth,
    (p.category = 'expenses') AS requires_participant_role
  FROM public.posts p
  LEFT JOIN public.post_categories pc ON pc.id = p.category
  WHERE p.id = $1;
$function$;
