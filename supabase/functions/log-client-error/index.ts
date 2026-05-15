import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const ENC_PREFIX = "enc:v1:";

// ── PII 마스킹 (클라이언트 1차 마스킹의 서버측 2차 방어) ─────────────────────

const PII_KEY_PATTERNS = [
  /email/i, /phone/i, /password/i, /passwd/i, /\bpwd\b/i,
  /\bname\b/i, /address/i, /birth/i, /\bssn\b/i,
  /이메일/i, /전화/i, /비밀번호/i, /성명/i, /주민/i, /핸드폰/i, /휴대폰/i,
];

function maskPii(
  obj: Record<string, unknown>,
  depth = 0,
): Record<string, unknown> {
  if (depth > 4) return obj;
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => {
      if (PII_KEY_PATTERNS.some((p) => p.test(k))) return [k, "***"];
      if (v !== null && typeof v === "object" && !Array.isArray(v))
        return [k, maskPii(v as Record<string, unknown>, depth + 1)];
      return [k, v];
    }),
  );
}

// ── AES-256-GCM (encrypt-profile와 동일한 enc:v1 포맷) ────────────────────────

async function deriveKey(secret: string): Promise<CryptoKey> {
  const rawKey = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(secret),
  );
  return crypto.subtle.importKey("raw", rawKey, { name: "AES-GCM" }, false, [
    "encrypt",
  ]);
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function encryptValue(plaintext: string, key: CryptoKey): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const encrypted = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv, tagLength: 128 }, key, encoded),
  );
  const ciphertext = encrypted.slice(0, encrypted.length - 16);
  const authTag = encrypted.slice(encrypted.length - 16);
  return `${ENC_PREFIX}${bytesToHex(iv)}:${bytesToHex(ciphertext)}:${bytesToHex(authTag)}`;
}

// ── Handler ────────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  const CORS = corsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const encSecret = Deno.env.get("ENCRYPTION_SECRET_KEY");

    const body = await req.json() as {
      source?: string;
      message?: string;
      severity?: string;
      stack?: string | null;
      path?: string | null;
      context?: Record<string, unknown> | null;
    };

    const { source, message, severity, stack, path, context: rawContext } = body;

    if (!source || !message) {
      return new Response(JSON.stringify({ error: "source and message are required" }), {
        status: 400,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    // 2차 마스킹 (클라이언트측 마스킹 실패 시 방어)
    const maskedContext = rawContext ? maskPii(rawContext) : null;

    // build_id, source_location은 평문 유지 (log_client_error RPC 추출 로직 보존)
    const buildId = maskedContext?.build_id;
    const sourceLocation = maskedContext?.source_location;

    // 나머지 user-provided 키 수집 → 암호화 대상
    const userContext: Record<string, unknown> = {};
    if (maskedContext) {
      for (const [k, v] of Object.entries(maskedContext)) {
        if (k !== "build_id" && k !== "source_location") {
          userContext[k] = v;
        }
      }
    }

    // 최종 context 구성: {build_id?, source_location?, _enc?: "enc:v1:..."}
    let storedContext: Record<string, unknown> | null = null;
    const hasPlain = buildId !== undefined || sourceLocation !== undefined;
    const hasUser = Object.keys(userContext).length > 0;

    if (hasPlain || hasUser) {
      storedContext = {};
      if (buildId !== undefined) storedContext.build_id = buildId;
      if (sourceLocation !== undefined) storedContext.source_location = sourceLocation;

      if (hasUser) {
        if (encSecret) {
          const key = await deriveKey(encSecret);
          storedContext._enc = await encryptValue(JSON.stringify(userContext), key);
        } else {
          // 암호화 키 미설정 시 마스킹된 값 평문 저장 (PII는 이미 제거됨)
          Object.assign(storedContext, userContext);
        }
      }
    }

    // 사용자 JWT 포워딩 → log_client_error RPC의 rate-limit/dedup(auth.uid() 기반) 보존
    const authHeader = req.headers.get("Authorization");
    const callerClient = createClient(supabaseUrl, anonKey, {
      ...(authHeader ? { global: { headers: { Authorization: authHeader } } } : {}),
    });

    const { error: rpcError } = await callerClient.rpc("log_client_error", {
      p_source: source,
      p_message: message,
      p_severity: severity ?? "medium",
      p_stack: stack ?? null,
      p_path: path ?? null,
      p_context: storedContext,
    });

    if (rpcError) {
      return new Response(JSON.stringify({ error: rpcError.message }), {
        status: 500,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
