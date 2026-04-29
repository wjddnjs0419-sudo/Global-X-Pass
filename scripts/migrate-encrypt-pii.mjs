/**
 * One-time PII encryption migration for `profiles` table.
 * Encrypts: name, email, phone  →  AES-256-GCM
 * Format:   enc:v1:<iv_hex>:<ciphertext_hex>:<authtag_hex>
 *
 * Setup:
 *   cd scripts && npm install
 *   Add to root .env:
 *     ENCRYPTION_SECRET_KEY=<any long random string>
 *     SUPABASE_SERVICE_ROLE_KEY=<service_role key from Dashboard → Settings → API Keys>
 *
 * Run:
 *   node migrate-encrypt-pii.mjs --dry-run   ← preview only
 *   node migrate-encrypt-pii.mjs              ← apply
 *
 * Safe to re-run — already-encrypted rows are skipped automatically.
 */

import { createHash, randomBytes, createCipheriv } from "crypto";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

// ── Load .env ──────────────────────────────────────────────────────────────
function loadEnv() {
  const candidates = [
    resolve(process.cwd(), ".env"),
    resolve(dirname(fileURLToPath(import.meta.url)), "..", ".env"),
  ];
  for (const envPath of candidates) {
    if (!existsSync(envPath)) continue;
    const raw = readFileSync(envPath, "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
      if (!(key in process.env)) process.env[key] = val;
    }
    break;
  }
}

loadEnv();

// ── Config ─────────────────────────────────────────────────────────────────
const SECRET      = process.env.ENCRYPTION_SECRET_KEY;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BATCH_SIZE   = 100;
const DRY_RUN      = process.argv.includes("--dry-run");

if (!SECRET)       { console.error("❌ ENCRYPTION_SECRET_KEY is not set in .env"); process.exit(1); }
if (!SUPABASE_URL) { console.error("❌ VITE_SUPABASE_URL is not set in .env");     process.exit(1); }
if (!SERVICE_KEY)  { console.error("❌ SUPABASE_SERVICE_ROLE_KEY is not set in .env"); process.exit(1); }

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// Derive 32-byte AES key from the secret string via SHA-256
const KEY = createHash("sha256").update(SECRET).digest();

// ── Crypto helpers ─────────────────────────────────────────────────────────
const ENC_PREFIX = "enc:v1:";

function isEncrypted(value) {
  return typeof value === "string" && value.startsWith(ENC_PREFIX);
}

function encrypt(plaintext) {
  if (!plaintext) return plaintext;
  if (isEncrypted(plaintext)) return plaintext;

  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", KEY, iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return `${ENC_PREFIX}${iv.toString("hex")}:${ciphertext.toString("hex")}:${authTag.toString("hex")}`;
}

// ── Migration ──────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🔐 PII Encryption Migration${DRY_RUN ? " [DRY RUN — no changes will be written]" : ""}`);
  console.log("   Table: profiles | Columns: name, email, phone\n");

  // Count total
  const { count } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });
  console.log(`📊 Total profiles: ${count}`);

  let offset = 0;
  let updated = 0;
  let skipped = 0;
  let errors  = 0;

  while (true) {
    const { data: rows, error: fetchErr } = await supabase
      .from("profiles")
      .select("id, name, email, phone")
      .order("created_at", { ascending: true })
      .range(offset, offset + BATCH_SIZE - 1);

    if (fetchErr) {
      console.error("❌ Fetch error:", fetchErr.message);
      process.exit(1);
    }
    if (!rows || rows.length === 0) break;

    for (const row of rows) {
      const allEncrypted =
        (!row.name  || isEncrypted(row.name))  &&
        (!row.email || isEncrypted(row.email)) &&
        (!row.phone || isEncrypted(row.phone));

      if (allEncrypted) {
        skipped++;
        continue;
      }

      if (DRY_RUN) {
        console.log(`  [DRY RUN] id=${row.id}  name="${row.name}" → 암호화 예정`);
        updated++;
        continue;
      }

      const { error: updateErr } = await supabase
        .from("profiles")
        .update({
          name:  encrypt(row.name),
          email: encrypt(row.email),
          phone: encrypt(row.phone),
        })
        .eq("id", row.id);

      if (updateErr) {
        console.error(`  ❌ id=${row.id} 업데이트 실패:`, updateErr.message);
        errors++;
      } else {
        updated++;
      }
    }

    offset += rows.length;
    const pct = Math.round((offset / count) * 100);
    process.stdout.write(`\r  ⏳ Progress: ${offset}/${count} (${pct}%)`);

    if (rows.length < BATCH_SIZE) break;
  }

  console.log("\n");
  if (DRY_RUN) {
    console.log(`✅ 드라이런 완료 — 실제 변경 없음.`);
    console.log(`   암호화 예정: ${updated}개 rows`);
    console.log(`   스킵 (이미 암호화됨): ${skipped}개 rows`);
    console.log(`\n문제 없으면 --dry-run 없이 다시 실행하세요.`);
  } else {
    console.log(`✅ 마이그레이션 완료.`);
    console.log(`   암호화됨: ${updated}개 rows`);
    console.log(`   스킵 (이미 암호화됨): ${skipped}개 rows`);
    if (errors > 0) console.log(`   ⚠️  실패: ${errors}개`);
    console.log("\n⚠️  다음 단계:");
    console.log("   1. Supabase secret 등록:");
    console.log("      supabase secrets set ENCRYPTION_SECRET_KEY=<your-secret>");
    console.log("   2. Edge Function 배포:");
    console.log("      supabase functions deploy decrypt-profiles");
  }
}

main().catch((err) => {
  console.error("\n❌ Fatal error:", err.message);
  process.exit(1);
});
