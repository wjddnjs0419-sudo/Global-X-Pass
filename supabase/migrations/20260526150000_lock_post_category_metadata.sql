-- 잠금 카테고리는 공개 여부뿐 아니라 라벨/설명도 수정할 수 없도록 강화

CREATE OR REPLACE FUNCTION public.enforce_post_category_lock()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.is_locked = true THEN
    IF NEW.is_public IS DISTINCT FROM OLD.is_public
       OR NEW.is_locked IS DISTINCT FROM OLD.is_locked
       OR NEW.label IS DISTINCT FROM OLD.label
       OR NEW.description IS DISTINCT FROM OLD.description THEN
      RAISE EXCEPTION '카테고리 % 는 잠겨 있어 설정을 변경할 수 없습니다.', OLD.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
