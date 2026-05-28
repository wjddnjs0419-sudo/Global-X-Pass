import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type RequireVerifiedAdminOptions = {
  requireAal2?: boolean;
  // true면 MFA 우회 토글 활성 상태여도 AAL2를 강제. bypass 자체를 변경하는 EF에서만 사용.
  noBypass?: boolean;
};

function getJwtAal(authHeader: string | null): string | null {
  const token = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1];
  const payload = token?.split(".")[1];
  if (!payload) return null;

  try {
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const parsed = JSON.parse(atob(padded)) as { aal?: string };
    return parsed.aal ?? null;
  } catch {
    return null;
  }
}

export async function requireVerifiedAdmin(
  authHeader: string | null,
  options: RequireVerifiedAdminOptions = {},
) {
  if (!authHeader) {
    return { ok: false, status: 401, message: "Unauthorized" } as const;
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
    error: userError,
  } = await callerClient.auth.getUser();

  if (userError || !user) {
    return { ok: false, status: 401, message: "Unauthorized" } as const;
  }

  if (options.requireAal2 && getJwtAal(authHeader) !== "aal2") {
    // noBypass=true면 bypass 토글과 무관하게 AAL2 강제 (bypass 토글 변경 EF 등).
    // 그 외엔 is_admin_mfa_bypassed()=true(활성+미만료)면 AAL2 가드 통과.
    let bypassed = false;
    if (!options.noBypass) {
      const { data, error: bypassError } = await callerClient.rpc(
        "is_admin_mfa_bypassed",
      );
      if (!bypassError && data === true) {
        bypassed = true;
      }
    }
    if (!bypassed) {
      return {
        ok: false,
        status: 403,
        message: "관리자 MFA 인증이 필요합니다. 다시 로그인해 주세요.",
      } as const;
    }
  }

  const { data: isAdmin, error: adminError } = await callerClient.rpc("is_admin");
  if (adminError || !isAdmin) {
    return { ok: false, status: 403, message: "Forbidden" } as const;
  }

  return { ok: true, user } as const;
}
