import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { requireVerifiedAdmin } from "../_shared/adminAuth.ts";
import { isSuperAdminUid } from "../_shared/superAdmin.ts";
import { captureEfError } from "../_shared/errorLogger.ts";

// MFA 우회 토글 변경.
// - super admin(SUPER_ADMIN_UIDS)만 호출 가능
// - AAL2 강제(이 EF는 절대 우회되면 안 됨 — bypass 자체를 바꾸는 권한이므로)
// - duration_days: 0=즉시 해제, 1/3/7=해당 일수만큼 활성
const ALLOWED_DAYS = new Set([0, 1, 3, 7]);

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
    // bypass 토글 자체는 AAL2 절대 우회 X → 신규 옵션 noBypass로 명시
    const adminCheck = await requireVerifiedAdmin(authHeader, {
      requireAal2: true,
      noBypass: true,
    });
    if (!adminCheck.ok) {
      return json({ error: adminCheck.message }, adminCheck.status, cors);
    }

    if (!isSuperAdminUid(adminCheck.user.id)) {
      return json({ error: "이 작업은 super admin만 수행할 수 있습니다." }, 403, cors);
    }

    const body = await req.json().catch(() => ({}));
    const rawDuration = body?.duration_days;
    const reason = typeof body?.reason === "string" ? body.reason.trim().slice(0, 500) : null;

    if (
      typeof rawDuration !== "number" ||
      !Number.isInteger(rawDuration) ||
      !ALLOWED_DAYS.has(rawDuration)
    ) {
      return json({ error: "duration_days는 0, 1, 3, 7 중 정수여야 합니다." }, 400, cors);
    }
    const durationDays = rawDuration;

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !serviceKey) {
      return json({ error: "서버 환경 변수가 설정되지 않았습니다." }, 500, cors);
    }

    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const now = new Date();
    const enabled = durationDays > 0;
    const expiresAt = enabled
      ? new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000).toISOString()
      : now.toISOString(); // 0이면 즉시 만료

    const { data, error } = await adminClient
      .from("admin_mfa_bypass")
      .update({
        enabled,
        expires_at: expiresAt,
        enabled_by: adminCheck.user.id,
        enabled_at: enabled ? now.toISOString() : null,
        reason: enabled ? reason : null,
        updated_at: now.toISOString(),
      })
      .eq("id", true)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return json({ success: true, state: data }, 200, cors);
  } catch (err) {
    console.error("[toggle-admin-mfa-bypass]", err);
    await captureEfError("ef-toggle-mfa-bypass", err, { req, severity: "high" });
    const message = err instanceof Error ? err.message : "Internal server error";
    return json({ error: message }, 500, cors);
  }
});
