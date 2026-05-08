-- 20260508000000_add_github_run_id_to_blog_import.sql
ALTER TABLE "public"."blog_import_runs" ADD COLUMN "github_run_id" text;
