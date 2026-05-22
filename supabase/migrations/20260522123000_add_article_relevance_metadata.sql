-- Stores crawler relevance metadata so admin review can prioritize likely matches.

ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS relevance_score integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS matched_terms text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS relevance_reason text;

CREATE INDEX IF NOT EXISTS articles_pending_relevance_idx
  ON public.articles (relevance_score DESC, published_at DESC, created_at DESC)
  WHERE status = 'pending';

GRANT SELECT ON TABLE public.articles TO anon, authenticated, service_role;
GRANT INSERT, UPDATE, DELETE ON TABLE public.articles TO authenticated, service_role;
