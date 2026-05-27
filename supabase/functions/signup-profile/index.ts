import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { captureEfError } from "../_shared/errorLogger.ts";

const ENC_PREFIX = "enc:v1:";

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10분

type SignupPayload = {
  name?: string;
  phone?: string;
  email?: string;
  password?: string;
  company?: string;
  userType?: string;
};

async function deriveKey(secret: string): Promise<CryptoKey> {
  const rawKey = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  return crypto.subtle.importKey("raw", rawKey, { name: "AES-GCM" }, false, ["encrypt"]);
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function encrypt(plaintext: string | null, key: CryptoKey): Promise<string | null> {
  if (!plaintext || plaintext.startsWith(ENC_PREFIX)) return plaintext;

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const encrypted = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv, tagLength: 128 }, key, encoded)
  );

  const ciphertext = encrypted.slice(0, encrypted.length - 16);
  const authTag = encrypted.slice(encrypted.length - 16);
  return `${ENC_PREFIX}${bytesToHex(iv)}:${bytesToHex(ciphertext)}:${bytesToHex(authTag)}`;
}

function json(body: unknown, status: number, headers: HeadersInit) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });
}

function cleanText(value?: string) {
  return value?.trim() ?? "";
}

async function waitForProfile(adminClient: ReturnType<typeof createClient>, userId: string) {
  // handle_new_user 트리거가 정상이어도 반영 지연이 생길 수 있어
  // 짧은 고정 대기 대신 약 5초까지 단계적으로 재시도한다.
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const { data, error } = await adminClient
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (data) return data;
    if (error) throw error;
    await new Promise((resolve) => setTimeout(resolve, Math.min(500, 150 * (attempt + 1))));
  }
  return null;
}

function extractIp(req: Request): string {
  return (
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

Deno.serve(async (req: Request) => {
  const CORS = corsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405, CORS);
  }

  let createdUserId: string | null = null;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const encSecret = Deno.env.get("ENCRYPTION_SECRET_KEY");

    if (!encSecret) {
      throw new Error("ENCRYPTION_SECRET_KEY is not configured");
    }

    const payload = await req.json() as SignupPayload;
    const email = cleanText(payload.email).toLowerCase();
    const password = payload.password ?? "";
    const name = cleanText(payload.name);
    const phone = cleanText(payload.phone);
    const company = cleanText(payload.company);
    const userType = cleanText(payload.userType);

    if (!email || !password || !name || !phone || !company) {
      return json({ error: "필수 입력값이 누락되었습니다." }, 400, CORS);
    }

    if (password.length < 8) {
      return json({ error: "비밀번호는 최소 8자 이상이어야 합니다." }, 400, CORS);
    }

    const anonClient = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // IP 기반 rate limit 확인 (atomic: DB 함수가 락·검사·기록을 한 번에 처리)
    // IP를 특정할 수 없는 환경(로컬 개발 등)은 건너뜀
    const ip = extractIp(req);
    if (ip !== "unknown") {
      const { data: allowed, error: rlError } = await adminClient.rpc(
        "check_and_record_signup_attempt",
        { p_ip: ip, p_max: RATE_LIMIT_MAX, p_window_ms: RATE_LIMIT_WINDOW_MS },
      );

      if (rlError) throw rlError;
      if (!allowed) {
        return json({ error: "잠시 후 다시 시도해 주세요." }, 429, CORS);
      }
    }

    const { data: signupData, error: signupError } = await anonClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          pii_encryption_pending: true,
          company,
          user_type: userType,
        },
      },
    });

    if (signupError) {
      return json({ error: signupError.message }, 400, CORS);
    }

    const user = signupData.user;
    if (!user) {
      return json({ error: "회원가입을 완료하지 못했습니다." }, 400, CORS);
    }

    if (Array.isArray(user.identities) && user.identities.length === 0) {
      return json({ error: "이미 가입된 이메일 주소입니다." }, 409, CORS);
    }

    createdUserId = user.id;

    const profile = await waitForProfile(adminClient, user.id);
    if (!profile) {
      throw new Error("Profile was not created by handle_new_user");
    }

    // 가입 승인제: 자가가입 계정은 status='pending'(컬럼 기본값)으로 두고, auth 레벨에서
    // 즉시 ban 처리해 관리자 승인 전까지 로그인 자체를 서버에서 차단한다. (승인 시 update-user-status 가 해제)
    // PII 암호화 이전에 가장 먼저 ban 을 적용하고, 실패 시 throw → 아래 cleanup 으로 계정 제거.
    const { error: banError } = await adminClient.auth.admin.updateUserById(user.id, {
      ban_duration: "876000h",
    });
    if (banError) {
      throw banError;
    }

    const key = await deriveKey(encSecret);
    const { error: updateError } = await adminClient
      .from("profiles")
      .update({
        name: await encrypt(name, key),
        email: await encrypt(email, key),
        phone: await encrypt(phone, key),
        company,
        user_type: userType || null,
        role: "user",
      })
      .eq("id", user.id);

    if (updateError) {
      throw updateError;
    }

    return json({
      success: true,
      needsApproval: true,
      needsEmailConfirmation: !signupData.session,
    }, 200, CORS);
  } catch (err) {
    console.error("[signup-profile]", err);
    await captureEfError("ef-signup", err, { req, severity: "high" });

    if (createdUserId) {
      try {
        const adminClient = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
          { auth: { autoRefreshToken: false, persistSession: false } },
        );
        await adminClient.from("profiles").delete().eq("id", createdUserId);
        await adminClient.auth.admin.deleteUser(createdUserId);
      } catch (cleanupErr) {
        console.error("[signup-profile cleanup]", cleanupErr);
      }
    }

    return json({ error: "회원가입 처리 중 오류가 발생했습니다." }, 500, CORS);
  }
});
