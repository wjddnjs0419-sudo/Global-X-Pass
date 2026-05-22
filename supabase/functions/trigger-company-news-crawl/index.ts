import { corsHeaders } from "../_shared/cors.ts";
import { requireVerifiedAdmin } from "../_shared/adminAuth.ts";
import { captureEfError } from "../_shared/errorLogger.ts";

const GITHUB_REPO = "wjddnjs0419-sudo/Global-X-Pass";
const GITHUB_WORKFLOW = "company-news-crawl.yml";
const GITHUB_REF = "main";

type CrawlRequestBody = {
  batchSize?: number;
  resultsPerCompany?: number;
  delayMs?: number;
  maxStoredArticles?: number;
  minRelevanceScore?: number;
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

function clampInteger(value: unknown, fallback: number, min: number, max: number): number {
  const parsed = typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(parsed)));
}

async function dispatchGitHubWorkflow(inputs: Record<string, string>) {
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
          inputs,
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
    const adminCheck = await requireVerifiedAdmin(req.headers.get("Authorization"));
    if (!adminCheck.ok) {
      return jsonResponse({ error: adminCheck.message }, adminCheck.status, cors);
    }

    const body = (await req.json().catch(() => ({}))) as CrawlRequestBody;
    const batchSize = clampInteger(body.batchSize, 25, 1, 100);
    const resultsPerCompany = clampInteger(body.resultsPerCompany, 5, 1, 20);
    const delayMs = clampInteger(body.delayMs, 300, 100, 2000);
    const maxStoredArticles = clampInteger(body.maxStoredArticles, 300, 50, 1000);
    const minRelevanceScore = clampInteger(body.minRelevanceScore, 3, 1, 10);

    const inputs = {
      batch_size: String(batchSize),
      results_per_company: String(resultsPerCompany),
      delay_ms: String(delayMs),
      max_stored_articles: String(maxStoredArticles),
      min_relevance_score: String(minRelevanceScore),
    };

    const { dispatched, error } = await dispatchGitHubWorkflow(inputs);

    return jsonResponse({
      success: dispatched,
      dispatched,
      dispatchError: error,
      inputs,
    }, dispatched ? 200 : 400, cors);
  } catch (err: unknown) {
    await captureEfError("ef-company-news-crawl", err, { req, severity: "medium" });
    const message = err instanceof Error ? err.message : String(err);
    return jsonResponse({ error: message }, 400, cors);
  }
});
