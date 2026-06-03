import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { isSuperAdminUid } from "../_shared/superAdmin.ts";
import { captureEfError } from "../_shared/errorLogger.ts";
import { computeBypassActive } from "./computeBypassActive.ts";

// 현재 MFA 우회 상태 + caller가 super admin인지 응답.
// 프론트 토글 UI 노출 여부 + 활성 배너 렌더에 사용.
// AAL2 강제 X — 일반 어드민도 자기 권한이 어떻게 풀려있는지 알 수 있어야 함.

function json(body: unknown, status: number, headers: HeadersInit) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  const cors = corsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  if (req.method !== "GET" && req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405, cors);
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Unauthorized" }, 401, cors);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !anonKey || !serviceKey) {
      return json({ error: "서버 환경 변수가 설정되지 않았습니다." }, 500, cors);
    }

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await callerClient.auth.getUser();
    if (userError || !user) {
      return json({ error: "Unauthorized" }, 401, cors);
    }

    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 어드민 여부 확인 (role만 체크 — 우회 상태 알아야 하니 is_admin RPC는 쓰지 않음)
    const { data: profile, error: profileError } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      throw profileError;
    }
    if (!profile || profile.role !== "admin") {
      return json({ error: "Forbidden" }, 403, cors);
    }

    const { data: state, error: stateError } = await adminClient
      .from("admin_mfa_bypass")
      .select("enabled, expires_at, enabled_by, enabled_at, reason, updated_at")
      .eq("id", true)
      .maybeSingle();

    if (stateError) {
      throw stateError;
    }

    const isActive = computeBypassActive(
      state?.enabled ?? false,
      state?.expires_at ?? null,
      Date.now(),
    );

    let enabledByEmail: string | null = null;
    if (state?.enabled_by) {
      const { data: enabler } = await adminClient.auth.admin.getUserById(state.enabled_by);
      enabledByEmail = enabler?.user?.email ?? null;
    }

    return json(
      {
        is_super_admin: isSuperAdminUid(user.id),
        bypass: {
          enabled: state?.enabled ?? false,
          is_active: isActive,
          expires_at: state?.expires_at ?? null,
          enabled_at: state?.enabled_at ?? null,
          enabled_by: state?.enabled_by ?? null,
          enabled_by_email: enabledByEmail,
          reason: state?.reason ?? null,
          updated_at: state?.updated_at ?? null,
        },
      },
      200,
      cors,
    );
  } catch (err) {
    console.error("[get-admin-mfa-bypass-state]", err);
    await captureEfError("ef-get-mfa-bypass-state", err, { req, severity: "low" });
    const message = err instanceof Error ? err.message : "Internal server error";
    return json({ error: message }, 500, cors);
  }
});
