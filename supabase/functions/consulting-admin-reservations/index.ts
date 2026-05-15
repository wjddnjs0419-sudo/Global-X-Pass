import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { requireVerifiedAdmin } from "../_shared/adminAuth.ts";
import { captureEfError } from "../_shared/errorLogger.ts";

const ENC_PREFIX = "enc:v1:";

type ReservationRow = {
  id: string;
  slot_id: string;
  user_id: string;
  description: string;
  status: "pending" | "confirmed" | "rejected" | "cancelled";
  admin_note: string | null;
  created_at: string;
  consulting_slots?: unknown;
};

type ProfileRow = {
  id: string;
  name: string | null;
  email: string | null;
  company: string | null;
};

async function deriveKey(secret: string): Promise<CryptoKey> {
  const rawKey = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  return crypto.subtle.importKey("raw", rawKey, { name: "AES-GCM" }, false, ["decrypt"]);
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
    ciphertextWithTag,
  );
  return new TextDecoder().decode(decrypted);
}

Deno.serve(async (req) => {
  const cors = corsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  try {
    const adminCheck = await requireVerifiedAdmin(req.headers.get("Authorization"));
    if (!adminCheck.ok) {
      return new Response(JSON.stringify({ error: adminCheck.message }), {
        headers: { ...cors, "Content-Type": "application/json" },
        status: adminCheck.status,
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const encSecret = Deno.env.get("ENCRYPTION_SECRET_KEY");
    if (!encSecret) throw new Error("ENCRYPTION_SECRET_KEY is not configured");

    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const key = await deriveKey(encSecret);

    const { data: reservations, error: reservationError } = await adminClient
      .from("consulting_reservations")
      .select("*, consulting_slots(slot_date, slot_time, location, consultants(name, category))")
      .order("created_at", { ascending: false });
    if (reservationError) throw reservationError;

    const rows = (reservations ?? []) as ReservationRow[];
    const userIds = [...new Set(rows.map((row) => row.user_id))];
    const { data: profiles, error: profileError } = userIds.length > 0
      ? await adminClient.from("profiles").select("id, name, email, company").in("id", userIds)
      : { data: [], error: null };
    if (profileError) throw profileError;

    const profileById = new Map<string, ProfileRow>(
      ((profiles as ProfileRow[] | null) ?? []).map((profile) => [profile.id, profile]),
    );

    const hydrated = await Promise.all(rows.map(async (reservation) => {
      const profile = profileById.get(reservation.user_id) ?? null;
      const name = await decrypt(profile?.name ?? null, key);
      const email = await decrypt(profile?.email ?? null, key);
      const company = profile?.company ?? null;

      return {
        ...reservation,
        profile: profile ? { id: profile.id, name, email, company } : null,
      };
    }));

    const staleIds = hydrated
      .filter((reservation) => !reservation.profile?.name?.trim())
      .map((reservation) => reservation.id);

    if (staleIds.length > 0) {
      const { error: cleanupError } = await adminClient
        .from("consulting_reservations")
        .delete()
        .in("id", staleIds);
      if (cleanupError) throw cleanupError;
    }

    const visibleReservations = hydrated.filter((reservation) => !staleIds.includes(reservation.id));

    return new Response(JSON.stringify({ reservations: visibleReservations, deleted: staleIds.length }), {
      headers: { ...cors, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err: unknown) {
    await captureEfError("ef-consulting", err, { req, severity: "medium" });
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...cors, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
