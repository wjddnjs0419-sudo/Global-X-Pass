import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { requireVerifiedAdmin } from "../_shared/adminAuth.ts";
import { captureEfError } from "../_shared/errorLogger.ts";
import { clearUserMfaFactors } from "../_shared/mfa.ts";

const ALLOWED_ROLES = new Set(["admin", "participant", "user"]);

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

    const { userId, newRole, currentPassword } = await req.json();
    if (!userId || typeof userId !== "string") {
      return json({ error: "userId가 필요합니다." }, 400, cors);
    }
    if (!newRole || typeof newRole !== "string" || !ALLOWED_ROLES.has(newRole)) {
      return json({ error: "허용되지 않은 역할입니다." }, 400, cors);
    }
    if (!currentPassword || typeof currentPassword !== "string") {
      return json({ error: "현재 비밀번호가 필요합니다." }, 400, cors);
    }
    if (userId === adminCheck.user.id) {
      return json({ error: "본인 계정의 권한은 변경할 수 없습니다." }, 400, cors);
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
    const { data: currentProfile, error: currentProfileError } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    if (currentProfileError) {
      throw currentProfileError;
    }
    if (!currentProfile) {
      return json({ error: "역할을 변경할 회원을 찾지 못했습니다." }, 404, cors);
    }

    const { data: updatedProfile, error: updateError } = await adminClient
      .from("profiles")
      .update({ role: newRole })
      .eq("id", userId)
      .select("id, role")
      .maybeSingle();

    if (updateError) {
      throw updateError;
    }
    if (!updatedProfile) {
      return json({ error: "역할을 변경할 회원을 찾지 못했습니다." }, 404, cors);
    }

    let clearedFactorCount = 0;
    if (currentProfile.role === "admin" && newRole !== "admin") {
      clearedFactorCount = await clearUserMfaFactors(adminClient, userId);
    }

    return json({ success: true, role: updatedProfile.role, clearedFactorCount }, 200, cors);
  } catch (err) {
    console.error("[update-user-role]", err);
    await captureEfError("ef-update-role", err, { req, severity: "high" });
    const message = err instanceof Error ? err.message : "Internal server error";
    return json({ error: message }, 500, cors);
  }
});
