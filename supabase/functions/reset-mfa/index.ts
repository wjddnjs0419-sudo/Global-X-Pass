import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { requireVerifiedAdmin } from "../_shared/adminAuth.ts";
import { captureEfError } from "../_shared/errorLogger.ts";
import { clearUserMfaFactors } from "../_shared/mfa.ts";

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

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405, cors);
  }

  try {
    const authHeader = req.headers.get("Authorization");
    const adminCheck = await requireVerifiedAdmin(authHeader, { requireAal2: true });
    if (!adminCheck.ok) {
      return json({ error: adminCheck.message }, adminCheck.status, cors);
    }

    const { userId, currentPassword } = await req.json();
    if (!userId || typeof userId !== "string") {
      return json({ error: "userId가 필요합니다." }, 400, cors);
    }
    if (!currentPassword || typeof currentPassword !== "string") {
      return json({ error: "현재 비밀번호가 필요합니다." }, 400, cors);
    }
    if (userId === adminCheck.user.id) {
      return json({ error: "본인 계정의 MFA는 이 경로로 초기화할 수 없습니다." }, 400, cors);
    }
    if (!adminCheck.user.email) {
      return json({ error: "관리자 이메일 정보를 확인할 수 없습니다." }, 400, cors);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !anonKey || !serviceKey) {
      return json({ error: "서버 환경 변수가 설정되지 않았습니다." }, 500, cors);
    }

    const verifyClient = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { error: authError } = await verifyClient.auth.signInWithPassword({
      email: adminCheck.user.email,
      password: currentPassword,
    });
    if (authError) {
      return json({ error: "비밀번호가 올바르지 않습니다." }, 401, cors);
    }

    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const clearedFactorCount = await clearUserMfaFactors(adminClient, userId);
    return json({ success: true, clearedFactorCount }, 200, cors);
  } catch (err) {
    console.error("[reset-mfa]", err);
    await captureEfError("ef-reset-mfa", err, { req, severity: "high" });
    const message = err instanceof Error ? err.message : "Internal server error";
    return json({ error: message }, 500, cors);
  }
});
