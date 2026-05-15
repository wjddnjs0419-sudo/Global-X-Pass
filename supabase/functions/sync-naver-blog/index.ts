import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { requireVerifiedAdmin } from "../_shared/adminAuth.ts";
import { captureEfError } from "../_shared/errorLogger.ts";

const ALLOWED_TRIGGER_SOURCES = new Set(["manual", "cron", "worker", "github_actions"]);
const GITHUB_REPO    = "wjddnjs0419-sudo/Global-X-Pass";
const GITHUB_WORKFLOW = "naver-blog-sync.yml";
const GITHUB_REF     = "main";

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

async function dispatchGitHubWorkflow(runId: string): Promise<{ dispatched: boolean; error: string | null }> {
  const pat = Deno.env.get("GITHUB_PAT")?.trim();
  if (!pat) {
    return { dispatched: false, error: "GITHUB_PAT secret이 설정되지 않았습니다." };
  }

  try {
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/actions/workflows/${GITHUB_WORKFLOW}/dispatches`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${pat}`,
          "Accept": "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ref: GITHUB_REF,
          inputs: { run_id: runId },
        }),
      },
    );

    if (res.status === 204) {
      return { dispatched: true, error: null };
    }

    const body = await res.text().catch(() => "(응답 없음)");
    return { dispatched: false, error: `GitHub API ${res.status}: ${body}` };
  } catch (err: unknown) {
    return { dispatched: false, error: err instanceof Error ? err.message : String(err) };
  }
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

    // run이 생성된 후 GitHub Actions workflow_dispatch 트리거
    const { dispatched, error: dispatchError } = await dispatchGitHubWorkflow(data.id);

    return jsonResponse({
      success: true,
      run: data,
      dispatched,
      dispatchError,
    }, 200, cors);
  } catch (err: unknown) {
    await captureEfError("ef-blog-sync", err, { req, severity: "medium" });
    const message = err instanceof Error ? err.message : String(err);
    return jsonResponse({ error: message }, 400, cors);
  }
});
