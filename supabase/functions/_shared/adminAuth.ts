import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type RequireVerifiedAdminOptions = {
  requireAal2?: boolean;
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
    return {
      ok: false,
      status: 403,
      message: "관리자 MFA 인증이 필요합니다. 다시 로그인해 주세요.",
    } as const;
  }

  const { data: isAdmin, error: adminError } = await callerClient.rpc("is_admin");
  if (adminError || !isAdmin) {
    return { ok: false, status: 403, message: "Forbidden" } as const;
  }

  return { ok: true, user } as const;
}
