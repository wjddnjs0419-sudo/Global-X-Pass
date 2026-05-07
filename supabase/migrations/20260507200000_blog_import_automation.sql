-- Blog import automation state
-- Supabase stores queue/run state; the long-running importer stays in a Node worker.

CREATE TABLE public.blog_import_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_source TEXT NOT NULL DEFAULT 'manual'
    CHECK (trigger_source IN ('manual', 'cron', 'worker', 'github_actions')),
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'running', 'success', 'failed', 'cancelled')),
  requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  dry_run BOOLEAN NOT NULL DEFAULT false,
  discovered_count INT NOT NULL DEFAULT 0,
  queued_count INT NOT NULL DEFAULT 0,
  inserted_count INT NOT NULL DEFAULT 0,
  updated_count INT NOT NULL DEFAULT 0,
  skipped_count INT NOT NULL DEFAULT 0,
  failed_count INT NOT NULL DEFAULT 0,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

CREATE TABLE public.blog_import_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID REFERENCES public.blog_import_runs(id) ON DELETE SET NULL,
  source_url TEXT NOT NULL UNIQUE,
  source_log_no TEXT,
  source_board TEXT,
  target_category TEXT NOT NULL CHECK (target_category IN ('news', 'events-archive')),
  suggested_title TEXT,
  suggested_date TIMESTAMPTZ,
  suggested_tag TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'imported', 'skipped', 'failed')),
  existing_post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ,
  imported_at TIMESTAMPTZ
);

CREATE INDEX blog_import_runs_status_created_at_idx
  ON public.blog_import_runs (status, created_at);

CREATE INDEX blog_import_queue_status_updated_at_idx
  ON public.blog_import_queue (status, updated_at);

CREATE INDEX blog_import_queue_run_id_idx
  ON public.blog_import_queue (run_id);

ALTER TABLE public.blog_import_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_import_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "blog_import_runs_select_admin"
  ON public.blog_import_runs FOR SELECT
  USING (public.is_admin());

CREATE POLICY "blog_import_runs_insert_admin"
  ON public.blog_import_runs FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "blog_import_runs_update_admin"
  ON public.blog_import_runs FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "blog_import_runs_delete_admin"
  ON public.blog_import_runs FOR DELETE
  USING (public.is_admin());

CREATE POLICY "blog_import_queue_select_admin"
  ON public.blog_import_queue FOR SELECT
  USING (public.is_admin());

CREATE POLICY "blog_import_queue_insert_admin"
  ON public.blog_import_queue FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "blog_import_queue_update_admin"
  ON public.blog_import_queue FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "blog_import_queue_delete_admin"
  ON public.blog_import_queue FOR DELETE
  USING (public.is_admin());

CREATE TRIGGER blog_import_runs_updated_at
  BEFORE UPDATE ON public.blog_import_runs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER blog_import_queue_updated_at
  BEFORE UPDATE ON public.blog_import_queue
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
