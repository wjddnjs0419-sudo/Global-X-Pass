import { supabaseUrl } from "../lib/supabaseClient";

const PUBLIC_STORAGE_PREFIXES = [
  "/storage/v1/object/public/images/",
  "/storage/v1/object/public/documents/",
];

const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);

const getSupabaseHost = () => {
  try {
    return new URL(supabaseUrl).host;
  } catch {
    return "";
  }
};

export function normalizePublicStorageUrl(value?: string | null): string {
  const raw = value?.trim();
  if (!raw) return "";

  try {
    const url = new URL(raw);
    const supabaseHost = getSupabaseHost();
    if (!ALLOWED_PROTOCOLS.has(url.protocol)) return "";
    if (!supabaseHost || url.host !== supabaseHost) return "";
    if (!PUBLIC_STORAGE_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))) return "";
    return url.toString();
  } catch {
    return "";
  }
}
