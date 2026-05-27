import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { requireVerifiedAdmin } from "../_shared/adminAuth.ts";
import { captureEfError } from "../_shared/errorLogger.ts";

// 가입 승인제: 자가가입 계정의 승인 상태를 관리한다.
// approve → status='approved' + auth ban 해제(로그인 허용)
// reject  → status='rejected' + auth ban 유지(로그인 차단)
const ALLOWED_ACTIONS = new Set(["approve", "reject"]);
const BAN_DURATION = "876000h"; // 약 100년

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

    const { userId, action } = await req.json();
    if (!userId || typeof userId !== "string") {
      return json({ error: "userId가 필요합니다." }, 400, cors);
    }
    if (!action || typeof action !== "string" || !ALLOWED_ACTIONS.has(action)) {
      return json({ error: "허용되지 않은 작업입니다." }, 400, cors);
    }
    if (userId === adminCheck.user.id) {
      return json({ error: "본인 계정의 상태는 변경할 수 없습니다." }, 400, cors);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !serviceKey) {
      return json({ error: "서버 환경 변수가 설정되지 않았습니다." }, 500, cors);
    }

    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: currentProfile, error: currentProfileError } = await adminClient
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (currentProfileError) {
      throw currentProfileError;
    }
    if (!currentProfile) {
      return json({ error: "상태를 변경할 회원을 찾지 못했습니다." }, 404, cors);
    }

    // 부분 실패 시에도 "접근 권한이 잘못 열리는" 상태가 남지 않도록 순서를 분기한다.
    // - reject: 먼저 ban(접근 차단) → 이후 status 갱신. status 갱신이 실패해도 로그인은 이미 막혀 안전.
    // - approve: 먼저 status 갱신 → 마지막에 unban(접근 허용). unban이 실패해도 ban이 유지돼 안전.
    let nextStatus: string;

    if (action === "reject") {
      const { error: banError } = await adminClient.auth.admin.updateUserById(userId, {
        ban_duration: BAN_DURATION,
      });
      if (banError) {
        throw banError;
      }
      const { error: updateError } = await adminClient
        .from("profiles")
        .update({ status: "rejected" })
        .eq("id", userId);
      if (updateError) {
        throw updateError;
      }
      nextStatus = "rejected";
    } else {
      const { error: updateError } = await adminClient
        .from("profiles")
        .update({ status: "approved" })
        .eq("id", userId);
      if (updateError) {
        throw updateError;
      }
      const { error: unbanError } = await adminClient.auth.admin.updateUserById(userId, {
        ban_duration: "none",
      });
      if (unbanError) {
        throw unbanError;
      }
      nextStatus = "approved";
    }

    return json({ success: true, status: nextStatus }, 200, cors);
  } catch (err) {
    console.error("[update-user-status]", err);
    await captureEfError("ef-update-status", err, { req, severity: "high" });
    const message = err instanceof Error ? err.message : "Internal server error";
    return json({ error: message }, 500, cors);
  }
});
