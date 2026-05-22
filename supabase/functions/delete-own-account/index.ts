import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { captureEfError } from "../_shared/errorLogger.ts";

Deno.serve(async (req) => {
  const cors = corsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("인증 헤더가 없습니다.");

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) throw new Error("인증된 사용자가 아닙니다.");

    // 관리자 계정은 자체 탈퇴 불가
    const { data: isAdmin } = await userClient.rpc("is_admin");
    if (isAdmin) throw new Error("관리자 계정은 자체 탈퇴할 수 없습니다. 다른 관리자에게 문의해 주세요.");

    const { password } = await req.json();
    if (!password) throw new Error("비밀번호가 필요합니다.");

    // 비밀번호 서버 사이드 재검증
    const verifyClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    const { error: signInErr } = await verifyClient.auth.signInWithPassword({
      email: user.email ?? "",
      password,
    });
    if (signInErr) throw new Error("비밀번호가 올바르지 않습니다.");

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 프로그램 신청 내역 삭제 (auth.users cascade로도 처리되지만 명시적으로 선행)
    await Promise.all([
      adminClient.from("event_applications").delete().eq("user_id", user.id),
      adminClient.from("founders_club_applications").delete().eq("user_id", user.id),
      adminClient.from("consulting_reservations").delete().eq("user_id", user.id),
    ]);

    await adminClient.from("profiles").delete().eq("id", user.id);

    const { error: deleteErr } = await adminClient.auth.admin.deleteUser(user.id);
    if (deleteErr) throw deleteErr;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...cors, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err: unknown) {
    await captureEfError("ef-delete-own", err, { req, severity: "high" });
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...cors, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
