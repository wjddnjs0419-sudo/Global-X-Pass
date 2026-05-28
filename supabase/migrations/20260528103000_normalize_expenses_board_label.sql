-- Normalize the locked expenses board label to the product-facing name.
-- The category is locked, so temporarily bypass only the lock trigger for this data correction.

ALTER TABLE public.post_categories DISABLE TRIGGER enforce_post_category_lock_trigger;

UPDATE public.post_categories
SET
  label = '사업비 자료실',
  description = '프로그램 참여 기업 전용 사업비 관련 자료'
WHERE id = 'expenses'
  AND (
    label IS DISTINCT FROM '사업비 자료실'
    OR description IS DISTINCT FROM '프로그램 참여 기업 전용 사업비 관련 자료'
  );

ALTER TABLE public.post_categories ENABLE TRIGGER enforce_post_category_lock_trigger;
