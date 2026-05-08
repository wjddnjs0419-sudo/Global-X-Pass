import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const ENC_PREFIX = "enc:v1:";

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

async function decrypt(value: string | null, key: CryptoKey): Promise<string | null> {
  if (!value || !value.startsWith(ENC_PREFIX)) return value;

  const parts = value.slice(ENC_PREFIX.length).split(":");
  if (parts.length !== 3) return value;

  const [ivHex, ciphertextHex, authTagHex] = parts;
  const iv = hexToBytes(ivHex);
  const ciphertext = hexToBytes(ciphertextHex);
  const authTag = hexToBytes(authTagHex);

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

Deno.serve(async (req: Request) => {
  const CORS = corsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response("Unauthorized", { status: 401, headers: CORS });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Resolve caller identity from their JWT
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await callerClient.auth.getUser();
    if (userErr || !user) {
      return new Response("Unauthorized", { status: 401, headers: CORS });
    }

    const encSecret = Deno.env.get("ENCRYPTION_SECRET_KEY");
    if (!encSecret) {
      throw new Error("ENCRYPTION_SECRET_KEY is not configured as a Supabase secret");
    }

    const key = await deriveKey(encSecret);

    // Fetch only the caller's own profile row (service role to bypass RLS safely)
    const adminClient = createClient(supabaseUrl, serviceKey);
    const { data: profile, error: fetchErr } = await adminClient
      .from("profiles")
      .select("id, name, email, phone, company, user_type, role, created_at")
      .eq("id", user.id)
      .single();

    if (fetchErr) throw fetchErr;
    if (!profile) {
      return new Response("Not Found", { status: 404, headers: CORS });
    }

    const decrypted = {
      ...profile,
      name: await decrypt(profile.name, key),
      email: await decrypt(profile.email, key),
      phone: await decrypt(profile.phone, key),
    };

    return new Response(JSON.stringify(decrypted), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[decrypt-own-profile]", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } }
    );
  }
});
