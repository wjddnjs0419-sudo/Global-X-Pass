-- Company news crawl support
-- Adds keyword/crawl tracking to companies and a metadata-only articles table.

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS search_keywords text,
  ADD COLUMN IF NOT EXISTS last_crawled_at timestamptz;

COMMENT ON COLUMN public.companies.search_keywords
  IS 'Optional crawler keywords for company news discovery. Comma/newline-separated values are supported by the crawler.';

COMMENT ON COLUMN public.companies.last_crawled_at
  IS 'Timestamp of the most recent news crawl attempt for this company.';

CREATE INDEX IF NOT EXISTS companies_last_crawled_at_idx
  ON public.companies (last_crawled_at);

CREATE TABLE IF NOT EXISTS public.articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  link TEXT NOT NULL,
  originallink TEXT,
  source TEXT,
  thumbnail_url TEXT,
  published_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  url_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT articles_url_hash_key UNIQUE (url_hash)
);

CREATE INDEX IF NOT EXISTS articles_company_id_published_at_idx
  ON public.articles (company_id, published_at DESC);

CREATE INDEX IF NOT EXISTS articles_status_published_at_idx
  ON public.articles (status, published_at DESC);

ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "articles_select_public_approved" ON public.articles;
CREATE POLICY "articles_select_public_approved"
  ON public.articles
  FOR SELECT
  TO public
  USING (status = 'approved');

DROP POLICY IF EXISTS "articles_select_admin" ON public.articles;
CREATE POLICY "articles_select_admin"
  ON public.articles
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "articles_insert_admin" ON public.articles;
CREATE POLICY "articles_insert_admin"
  ON public.articles
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "articles_update_admin" ON public.articles;
CREATE POLICY "articles_update_admin"
  ON public.articles
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "articles_delete_admin" ON public.articles;
CREATE POLICY "articles_delete_admin"
  ON public.articles
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.articles TO authenticated;
GRANT ALL ON TABLE public.articles TO service_role;

DROP TRIGGER IF EXISTS articles_updated_at ON public.articles;
CREATE TRIGGER articles_updated_at
  BEFORE UPDATE ON public.articles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
