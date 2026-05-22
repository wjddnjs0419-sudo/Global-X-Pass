-- Participation company directory base schema
-- Creates the companies table used by the public directory and admin CRUD UI.

CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  industry TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  website_url TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'published'
    CHECK (status IN ('published', 'draft')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT companies_slug_key UNIQUE (slug)
);

CREATE INDEX IF NOT EXISTS companies_status_name_idx
  ON public.companies (status, name);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "companies_select_public_published" ON public.companies;
CREATE POLICY "companies_select_public_published"
  ON public.companies
  FOR SELECT
  TO authenticated
  USING (status = 'published');

DROP POLICY IF EXISTS "companies_select_admin" ON public.companies;
CREATE POLICY "companies_select_admin"
  ON public.companies
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "companies_insert_admin" ON public.companies;
CREATE POLICY "companies_insert_admin"
  ON public.companies
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "companies_update_admin" ON public.companies;
CREATE POLICY "companies_update_admin"
  ON public.companies
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "companies_delete_admin" ON public.companies;
CREATE POLICY "companies_delete_admin"
  ON public.companies
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.companies TO authenticated;
GRANT ALL ON TABLE public.companies TO service_role;

DROP TRIGGER IF EXISTS companies_updated_at ON public.companies;
CREATE TRIGGER companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
