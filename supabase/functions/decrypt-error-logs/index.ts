import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { requireVerifiedAdmin } from "../_shared/adminAuth.ts";

const ENC_PREFIX = "enc:v1:";

// ── AES-256-GCM (decrypt-profiles와 동일한 enc:v1 포맷) ──────────────────────

async function deriveKey(secret: string): Promise<CryptoKey> {
  const rawKey = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(secret),
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

async function decryptValue(value: string, key: CryptoKey): Promise<string | null> {
  if (!value.startsWith(ENC_PREFIX)) return value;

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
    ciphertextWithTag,
  );

  return new TextDecoder().decode(decrypted);
}

// ── context._enc 복호화 헬퍼 ─────────────────────────────────────────────────

async function decryptContext(
  context: Record<string, unknown> | null,
  key: CryptoKey,
): Promise<Record<string, unknown> | null> {
  if (!context || typeof context._enc !== "string") return context;
  try {
    const plaintext = await decryptValue(context._enc as string, key);
    if (!plaintext) return context;
    const decryptedFields = JSON.parse(plaintext) as Record<string, unknown>;
    const { _enc: _, ...rest } = context;
    return { ...rest, ...decryptedFields };
  } catch {
    // 복호화 실패 시 _enc 필드를 제거한 나머지만 반환 (부분 노출 방지)
    const { _enc: _, ...rest } = context;
    return rest;
  }
}

// ── Handler ────────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  const CORS = corsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS });
  }

  try {
    // AAL2 + admin 검증 — decrypt-profiles와 동일한 보안 허들
    const authHeader = req.headers.get("Authorization");
    const adminCheck = await requireVerifiedAdmin(authHeader, { requireAal2: true });
    if (!adminCheck.ok) {
      return new Response(JSON.stringify({ error: adminCheck.message }), {
        status: adminCheck.status,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const encSecret = Deno.env.get("ENCRYPTION_SECRET_KEY");

    const body = await req.json() as {
      type?: "logs" | "issues";
      statuses?: string[];
      since?: string;
      limit?: number;
    };

    const {
      type = "issues",
      statuses,
      since,
      limit = type === "issues" ? 300 : 500,
    } = body;

    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    let rows: Record<string, unknown>[] = [];

    if (type === "logs") {
      const query = adminClient
        .from("error_logs")
        .select(
          "id, source, severity, message, stack, path, context, fingerprint, build_id, source_location, created_at",
        )
        .order("created_at", { ascending: false })
        .limit(Math.min(limit, 500));

      if (since) query.gte("created_at", since);

      const { data, error } = await query;
      if (error) throw error;
      rows = (data ?? []) as Record<string, unknown>[];
    } else {
      const defaultStatuses = ["open", "reopened", "monitoring", "ignored"];
      const filter = Array.isArray(statuses) && statuses.length > 0
        ? statuses
        : defaultStatuses;

      const { data, error } = await adminClient
        .from("error_issues")
        .select(
          "fingerprint, source, severity, status, message, stack, path, context, source_location, first_seen_at, last_seen_at, last_build_id, last_log_id, occurrence_count, monitoring_at, resolved_at, ignored_at, reopened_at, resolved_note, updated_at",
        )
        .in("status", filter)
        .order("last_seen_at", { ascending: false })
        .limit(Math.min(limit, 300));

      if (error) throw error;
      rows = (data ?? []) as Record<string, unknown>[];
    }

    // _enc 복호화 (암호화 키가 있는 경우)
    let result = rows;
    if (encSecret) {
      const key = await deriveKey(encSecret);
      result = await Promise.all(
        rows.map(async (row) => {
          const context = row.context as Record<string, unknown> | null;
          if (!context?._enc) return row;
          return { ...row, context: await decryptContext(context, key) };
        }),
      );
    }

    return new Response(JSON.stringify({ data: result }), {
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
