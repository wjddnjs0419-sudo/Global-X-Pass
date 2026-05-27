-- External news items: 뉴스레터와 분리되는 언론보도/외부 기사 저장소
-- 공개는 published 상태만 허용하고, 관리자는 전체 CRUD 가능

CREATE TABLE IF NOT EXISTS public.external_news_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  summary text,
  source_name text NOT NULL,
  external_url text NOT NULL,
  published_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'published'
    CHECK (status IN ('draft', 'published')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT external_news_items_external_url_key UNIQUE (external_url)
);

COMMENT ON TABLE public.external_news_items
  IS '언론보도 및 외부 기사 링크. 뉴스레터와 분리된 기사형 콘텐츠 저장소';
COMMENT ON COLUMN public.external_news_items.summary
  IS '언론보도 요약 문구(선택)';
COMMENT ON COLUMN public.external_news_items.source_name
  IS '기사 출처(예: 매체명)';
COMMENT ON COLUMN public.external_news_items.external_url
  IS '원문 링크';
COMMENT ON COLUMN public.external_news_items.published_at
  IS '기사 발행일';
COMMENT ON COLUMN public.external_news_items.status
  IS 'draft | published';

CREATE INDEX IF NOT EXISTS external_news_items_status_published_at_idx
  ON public.external_news_items (status, published_at DESC);

DROP TRIGGER IF EXISTS external_news_items_updated_at ON public.external_news_items;
CREATE TRIGGER external_news_items_updated_at
  BEFORE UPDATE ON public.external_news_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.external_news_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "external_news_items_select_public_published" ON public.external_news_items;
CREATE POLICY "external_news_items_select_public_published"
  ON public.external_news_items
  FOR SELECT
  TO public
  USING (status = 'published');

DROP POLICY IF EXISTS "external_news_items_select_admin" ON public.external_news_items;
CREATE POLICY "external_news_items_select_admin"
  ON public.external_news_items
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "external_news_items_insert_admin" ON public.external_news_items;
CREATE POLICY "external_news_items_insert_admin"
  ON public.external_news_items
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "external_news_items_update_admin" ON public.external_news_items;
CREATE POLICY "external_news_items_update_admin"
  ON public.external_news_items
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "external_news_items_delete_admin" ON public.external_news_items;
CREATE POLICY "external_news_items_delete_admin"
  ON public.external_news_items
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

GRANT SELECT ON TABLE public.external_news_items TO anon, authenticated, service_role;
GRANT INSERT, UPDATE, DELETE ON TABLE public.external_news_items TO authenticated, service_role;
