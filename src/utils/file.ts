const IMAGE_EXTENSIONS = /\.(jpeg|jpg|gif|png|webp|avif|svg|jfif|pjpeg|pjp|bmp|heic|heif)$/i;
const IMAGE_DOMAINS = ["unsplash.com", "picsum.photos", "placeholder.com"];

export function encodeFilename(name: string): string {
  // Extract only the filename if it's a path
  const baseName = name.split(/[\\\/]/).pop() || name;
  // Limit length to avoid too long URLs after b64 encoding
  const truncated = baseName.length > 100 ? baseName.substring(0, 100) : baseName;
  const b64 = btoa(encodeURIComponent(truncated));
  return "b64-" + b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

export function decodeFilename(encoded: string): string {
  if (encoded.startsWith("b64-")) {
    try {
      let b64 = encoded.substring(4).replace(/-/g, "+").replace(/_/g, "/");
      while (b64.length % 4 !== 0) b64 += "=";
      return decodeURIComponent(atob(b64));
    } catch {
      return encoded;
    }
  }
  return decodeURIComponent(encoded);
}

export function getFileNameFromUrl(url: string, fallback = ""): string {
  if (!url) return fallback;
  try {
    const path = url.split("?")[0];
    let filename = path.split("/").pop() || fallback;
    if (filename.includes("---")) filename = filename.split("---").pop()!;
    else if (filename.match(/^\d+_[a-z0-9]+_/)) filename = filename.split("_").slice(2).join("_");
    return decodeFilename(filename);
  } catch {
    return fallback;
  }
}

export function isImage(url: string): boolean {
  const fileName = getFileNameFromUrl(url);
  if (IMAGE_EXTENSIONS.test(fileName)) return true;
  if (IMAGE_EXTENSIONS.test(url.split("?")[0])) return true;
  if (IMAGE_DOMAINS.some((domain) => url.includes(domain))) return true;
  return false;
}
