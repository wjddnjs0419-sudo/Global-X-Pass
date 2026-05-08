import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { requireVerifiedAdmin } from "../_shared/adminAuth.ts";

Deno.serve(async (req) => {
  const cors = corsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  try {
    const authHeader = req.headers.get("Authorization");

    const adminCheck = await requireVerifiedAdmin(authHeader);
    if (!adminCheck.ok) {
      return new Response(JSON.stringify({ error: adminCheck.message }), {
        headers: { ...cors, "Content-Type": "application/json" },
        status: adminCheck.status,
      });
    }

    // 삭제 대상 userId 추출
    const { userId } = await req.json();
    if (!userId) throw new Error("userId가 필요합니다.");
    if (userId === adminCheck.user.id) throw new Error("자기 자신은 삭제할 수 없습니다.");

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // profiles에 auth.users FK cascade가 없으므로 명시적으로 먼저 삭제
    await adminClient.from("profiles").delete().eq("id", userId);

    // auth.users 삭제 → 이후 동일 이메일로 재가입 가능
    const { error } = await adminClient.auth.admin.deleteUser(userId);
    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...cors, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...cors, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
