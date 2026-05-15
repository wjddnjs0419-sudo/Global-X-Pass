import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { requireVerifiedAdmin } from "../_shared/adminAuth.ts";
import { captureEfError } from "../_shared/errorLogger.ts";

const ENC_PREFIX = "enc:v1:";

// ── Crypto helpers ─────────────────────────────────────────────────────────

async function deriveKey(secret: string): Promise<CryptoKey> {
  const rawKey = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(secret)
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

async function encrypt(plaintext: string | null, key: CryptoKey): Promise<string | null> {
  if (!plaintext || plaintext.startsWith(ENC_PREFIX)) return plaintext;

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);

  // Web Crypto AES-GCM returns ciphertext + authTag concatenated (last 16 bytes = authTag)
  const encrypted = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv, tagLength: 128 }, key, encoded)
  );

  const ciphertext = encrypted.slice(0, encrypted.length - 16);
  const authTag    = encrypted.slice(encrypted.length - 16);

  return `${ENC_PREFIX}${bytesToHex(iv)}:${bytesToHex(ciphertext)}:${bytesToHex(authTag)}`;
}

// ── Handler ────────────────────────────────────────────────────────────────

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

    const { userId } = await req.json();
    if (!userId) {
      return new Response("userId is required", { status: 400, headers: CORS });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const encSecret   = Deno.env.get("ENCRYPTION_SECRET_KEY");

    if (!encSecret) {
      throw new Error("ENCRYPTION_SECRET_KEY is not configured");
    }

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await callerClient.auth.getUser();

    if (userError || !user) {
      return new Response("Unauthorized", { status: 401, headers: CORS });
    }

    if (user.id !== userId) {
      const adminCheck = await requireVerifiedAdmin(authHeader, { requireAal2: true });
      if (!adminCheck.ok) {
        return new Response(adminCheck.message, { status: adminCheck.status, headers: CORS });
      }
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const key = await deriveKey(encSecret);

    const { data: profile, error: fetchErr } = await supabase
      .from("profiles")
      .select("id, name, email, phone")
      .eq("id", userId)
      .single();

    if (fetchErr || !profile) {
      return new Response("Profile not found", { status: 404, headers: CORS });
    }

    // Skip if already fully encrypted
    const allEncrypted =
      (!profile.name  || profile.name.startsWith(ENC_PREFIX))  &&
      (!profile.email || profile.email.startsWith(ENC_PREFIX)) &&
      (!profile.phone || profile.phone.startsWith(ENC_PREFIX));

    if (allEncrypted) {
      return new Response(JSON.stringify({ skipped: true }), {
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const { error: updateErr } = await supabase
      .from("profiles")
      .update({
        name:  await encrypt(profile.name, key),
        email: await encrypt(profile.email, key),
        phone: await encrypt(profile.phone, key),
      })
      .eq("id", userId);

    if (updateErr) throw updateErr;

    return new Response(JSON.stringify({ encrypted: true }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[encrypt-profile]", err);
    await captureEfError("ef-encrypt", err, { req, severity: "high" });
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
