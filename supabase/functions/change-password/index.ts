import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  const cors = corsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("인증 헤더가 없습니다.");

    // 1. JWT로 현재 유저 확인
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) throw new Error("인증된 사용자가 아닙니다.");

    const { oldPassword, newPassword } = await req.json();
    if (!oldPassword || !newPassword) throw new Error("비밀번호 값이 필요합니다.");
    if (newPassword.length < 8) throw new Error("새 비밀번호는 8자 이상이어야 합니다.");

    // 2. 기존 비밀번호 서버 사이드 재검증
    const verifyClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    const { error: signInErr } = await verifyClient.auth.signInWithPassword({
      email: user.email ?? "",
      password: oldPassword,
    });
    if (signInErr) throw new Error("현재 비밀번호가 올바르지 않습니다.");

    // 3. 서비스 롤로 비밀번호 변경 (AAL2 제한 없음)
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    const { error: updateErr } = await adminClient.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );
    if (updateErr) throw updateErr;

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
