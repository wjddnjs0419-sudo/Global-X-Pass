import fs from "node:fs";
import path from "node:path";

const DIST_DIR = path.resolve(process.cwd(), "dist");
const ENV_PATH = path.resolve(process.cwd(), ".env");

const SECRET_ENV_NAMES = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "ENCRYPTION_SECRET_KEY",
  "GITHUB_PAT",
  "BLOG_SYNC_SECRET",
  "OPENAI_API_KEY",
  "S3_SECRET_KEY",
  "SUPABASE_AUTH_SMS_TWILIO_AUTH_TOKEN",
  "SUPABASE_AUTH_EXTERNAL_APPLE_SECRET",
];

const TEXT_EXTENSIONS = new Set([
  ".css",
  ".html",
  ".js",
  ".json",
  ".map",
  ".mjs",
  ".svg",
  ".txt",
  ".webmanifest",
  "",
]);

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return new Map();

  const result = new Map();
  const content = fs.readFileSync(filePath, "utf8");

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;

    const [, key, rawValue] = match;
    const value = rawValue.trim().replace(/^(['"])(.*)\1$/, "$2");
    if (value) result.set(key, value);
  }

  return result;
}

function listTextFiles(dir) {
  if (!fs.existsSync(dir)) {
    throw new Error("dist directory does not exist. Run the production build first.");
  }

  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listTextFiles(fullPath));
      continue;
    }

    if (TEXT_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }

  return files;
}

function decodeJwtPayload(token) {
  const [, payload] = token.split(".");
  if (!payload) return null;

  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
    return JSON.parse(Buffer.from(padded, "base64").toString("utf8"));
  } catch {
    return null;
  }
}

const env = parseEnvFile(ENV_PATH);
const secretValues = SECRET_ENV_NAMES
  .map((name) => [name, env.get(name) ?? process.env[name]])
  .filter(([, value]) => typeof value === "string" && value.length >= 8);

const findings = [];
const files = listTextFiles(DIST_DIR);

for (const filePath of files) {
  const relativePath = path.relative(process.cwd(), filePath);
  const content = fs.readFileSync(filePath, "utf8");

  for (const [name, value] of secretValues) {
    if (content.includes(value)) {
      findings.push(`${relativePath}: contains the value of ${name}`);
    }
  }

  const jwtMatches = content.matchAll(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g);
  for (const match of jwtMatches) {
    const payload = decodeJwtPayload(match[0]);
    if (payload?.role === "service_role") {
      findings.push(`${relativePath}: contains a Supabase service_role JWT`);
    }
  }

  const riskyTokenPatterns = [
    ["GitHub token", /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{20,}\b/],
    ["GitHub fine-grained token", /\bgithub_pat_[A-Za-z0-9_]{20,}\b/],
    ["OpenAI API key", /\bsk-[A-Za-z0-9_-]{20,}\b/],
    ["AWS access key", /\bAKIA[0-9A-Z]{16}\b/],
    ["private key block", /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ];

  for (const [label, pattern] of riskyTokenPatterns) {
    if (pattern.test(content)) {
      findings.push(`${relativePath}: contains a ${label}`);
    }
  }
}

if (findings.length > 0) {
  console.error("Frontend secret scan failed:");
  for (const finding of findings) {
    console.error(`- ${finding}`);
  }
  process.exit(1);
}

console.log(`Frontend secret scan passed (${files.length} built text files checked).`);
