-- Company news retention support
-- Keeps pruning queries fast and makes public approved reads explicit.

CREATE INDEX IF NOT EXISTS articles_published_created_idx
  ON public.articles (published_at DESC, created_at DESC);

GRANT SELECT ON TABLE public.articles TO anon, authenticated, service_role;
GRANT INSERT, UPDATE, DELETE ON TABLE public.articles TO authenticated, service_role;
