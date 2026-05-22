-- Remove company news thumbnail storage.
-- Company news now stores and renders text metadata only.

ALTER TABLE public.articles
  DROP COLUMN IF EXISTS thumbnail_url;
