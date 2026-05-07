import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { requireVerifiedAdmin } from "../_shared/adminAuth.ts";

const ALLOWED_TRIGGER_SOURCES = new Set(["manual", "cron", "worker", "github_actions"]);

type SyncRequestBody = {
  triggerSource?: string;
  dryRun?: boolean;
};

function jsonResponse(
  body: Record<string, unknown>,
  status: number,
  headers: Record<string, string>,
) {
  return new Response(JSON.stringify(body), {
    headers: { ...headers, "Content-Type": "application/json" },
    status,
  });
}

Deno.serve(async (req: Request) => {
  const cors = corsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405, cors);
  }

  try {
    const syncSecret = Deno.env.get("BLOG_SYNC_SECRET")?.trim();
    const providedSecret = req.headers.get("x-blog-sync-secret")?.trim();
    const authHeader = req.headers.get("Authorization");
    let requestedBy: string | null = null;
    let defaultTriggerSource = "manual";

    if (syncSecret && providedSecret === syncSecret) {
      defaultTriggerSource = "cron";
    } else {
      const adminCheck = await requireVerifiedAdmin(authHeader);
      if (!adminCheck.ok) {
        return jsonResponse({ error: adminCheck.message }, adminCheck.status, cors);
      }
      requestedBy = adminCheck.user.id;
    }

    const body = (await req.json().catch(() => ({}))) as SyncRequestBody;
    const triggerSource = body.triggerSource && ALLOWED_TRIGGER_SOURCES.has(body.triggerSource)
      ? body.triggerSource
      : defaultTriggerSource;

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const { data, error } = await adminClient
      .from("blog_import_runs")
      .insert({
        trigger_source: triggerSource,
        status: "queued",
        requested_by: requestedBy,
        dry_run: Boolean(body.dryRun),
      })
      .select("id, status, trigger_source, dry_run, created_at")
      .single();

    if (error) throw error;

    return jsonResponse({ success: true, run: data }, 200, cors);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return jsonResponse({ error: message }, 400, cors);
  }
});
