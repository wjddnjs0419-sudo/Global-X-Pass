import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { requireVerifiedAdmin } from "../_shared/adminAuth.ts";

const ENC_PREFIX = "enc:v1:";

// ── Crypto helpers (Web Crypto API — Deno runtime) ─────────────────────────

async function deriveKey(secret: string): Promise<CryptoKey> {
  const rawKey = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(secret)
  );
  return crypto.subtle.importKey("raw", rawKey, { name: "AES-GCM" }, false, [
    "decrypt",
  ]);
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

async function decrypt(
  value: string | null,
  key: CryptoKey
): Promise<string | null> {
  if (!value || !value.startsWith(ENC_PREFIX)) return value;

  const parts = value.slice(ENC_PREFIX.length).split(":");
  if (parts.length !== 3) return value; // malformed — return as-is

  const [ivHex, ciphertextHex, authTagHex] = parts;
  const iv = hexToBytes(ivHex);
  const ciphertext = hexToBytes(ciphertextHex);
  const authTag = hexToBytes(authTagHex);

  // Web Crypto AES-GCM expects ciphertext + authTag concatenated
  const ciphertextWithTag = new Uint8Array(ciphertext.length + authTag.length);
  ciphertextWithTag.set(ciphertext);
  ciphertextWithTag.set(authTag, ciphertext.length);

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv, tagLength: 128 },
    key,
    ciphertextWithTag
  );

  return new TextDecoder().decode(decrypted);
}

// ── Handler ────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  const CORS = corsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS });
  }

  try {
    // 1. Verify the caller using the same MFA-aware DB gate as RLS.
    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const adminCheck = await requireVerifiedAdmin(authHeader);
    if (!adminCheck.ok) {
      return new Response(adminCheck.message, { status: adminCheck.status, headers: CORS });
    }

    // Use service role only after the caller passes the MFA-aware admin gate.
    const adminClient = createClient(supabaseUrl, serviceKey);

    // 2. Decrypt and return all profiles
    const encSecret = Deno.env.get("ENCRYPTION_SECRET_KEY");
    if (!encSecret) {
      throw new Error("ENCRYPTION_SECRET_KEY is not configured as a Supabase secret");
    }

    const key = await deriveKey(encSecret);

    const { data: profiles, error: fetchErr } = await adminClient
      .from("profiles")
      .select("id, name, email, phone, company, user_type, role, created_at")
      .order("created_at", { ascending: false });

    if (fetchErr) throw fetchErr;

    const decryptedProfiles = await Promise.all(
      (profiles ?? []).map(async (p) => ({
        ...p,
        name: await decrypt(p.name, key),
        email: await decrypt(p.email, key),
        phone: await decrypt(p.phone, key),
      }))
    );

    return new Response(JSON.stringify(decryptedProfiles), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[decrypt-profiles]", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      {
        status: 500,
        headers: { ...CORS, "Content-Type": "application/json" },
      }
    );
  }
});
