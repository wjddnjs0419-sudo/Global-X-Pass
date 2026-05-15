import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export type EfNodeId =
  | "ef-admin-auth"
  | "ef-signup"
  | "ef-encrypt"
  | "ef-decrypt"
  | "ef-decrypt-own"
  | "ef-delete"
  | "ef-update-role"
  | "ef-bulk"
  | "ef-consulting"
  | "ef-founders"
  | "ef-blog-sync"
  | "ef-change-password";

export type Severity = "low" | "medium" | "high" | "critical";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

let _adminClient: ReturnType<typeof createClient> | null = null;
const getAdminClient = () => {
  if (!_adminClient) {
    _adminClient = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return _adminClient;
};

type CaptureOptions = {
  req?: Request;
  userId?: string | null;
  severity?: Severity;
  context?: Record<string, unknown>;
};

/**
 * Edge Function의 catch 블록에서 호출. error_logs RPC로 1건 전송한다.
 * - log_client_error RPC가 fingerprint 기반 60초 dedup을 수행하므로
 *   같은 에러가 짧은 시간에 폭주해도 1건만 기록된다.
 * - 환경변수 누락 등으로 RPC 호출 자체가 실패해도 silent (원 핸들러 응답 흐름 방해 금지).
 */
export async function captureEfError(
  source: EfNodeId,
  err: unknown,
  options: CaptureOptions = {},
): Promise<void> {
  try {
    if (!SUPABASE_URL || !SERVICE_KEY) return;

    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? (err.stack ?? null) : null;
    const path = options.req ? new URL(options.req.url).pathname : null;

    const context: Record<string, unknown> = { ...(options.context ?? {}) };
    if (options.userId) context.user_id = options.userId;

    await getAdminClient().rpc("log_client_error", {
      p_source: source,
      p_message: (message || "Unknown EF error").slice(0, 2000),
      p_severity: options.severity ?? "medium",
      p_stack: stack ? stack.slice(0, 4000) : null,
      p_path: path,
      p_context: Object.keys(context).length > 0 ? context : null,
    });
  } catch {
    // silent
  }
}

/**
 * Deno.serve 핸들러를 감싸 처리되지 않은 throw를 자동 캡처한다.
 * 새 EF나 try/catch 없이 작성한 핸들러에 사용.
 * 기존 EF처럼 자체 try/catch가 있다면 catch 안에서 captureEfError를 직접 호출하면 된다.
 */
export function withErrorLogging<TArgs extends unknown[]>(
  source: EfNodeId,
  handler: (req: Request, ...rest: TArgs) => Promise<Response>,
): (req: Request, ...rest: TArgs) => Promise<Response> {
  return async (req, ...rest) => {
    try {
      return await handler(req, ...rest);
    } catch (err) {
      await captureEfError(source, err, { req, severity: "high" });
      const message = err instanceof Error ? err.message : String(err);
      return new Response(JSON.stringify({ error: message }), {
        headers: { "Content-Type": "application/json" },
        status: 500,
      });
    }
  };
}
