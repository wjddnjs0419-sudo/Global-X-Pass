import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const ENC_PREFIX = "enc:v1:";

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
      needsEmailConfirmation: !signupData.session,
    }, 200, CORS);
  } catch (err) {
    console.error("[signup-profile]", err);

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
