const IMAGE_EXTENSIONS = /\.(jpeg|jpg|gif|png|webp|avif|svg|jfif|pjpeg|pjp|bmp|heic|heif)$/i;
const IMAGE_DOMAINS = ["unsplash.com", "picsum.photos", "placeholder.com", "pstatic.net"];
const DOCUMENT_EXTENSIONS = [
  ".pdf",
  ".zip",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".hwp",
];

export const ALLOWED_DOCUMENT_MIME_TYPES = [
  "application/pdf",
  "application/zip",
  "application/x-zip-compressed",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/x-hwp",
];

export const DOCUMENT_UPLOAD_ACCEPT = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/avif",
  "image/bmp",
  "image/heic",
  "image/heif",
  ".pdf",
  ".zip",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".hwp",
].join(",");

export const PUBLIC_DOCUMENT_UPLOAD_WARNING =
  "문서 첨부는 public documents 버킷에 공개 URL로 저장됩니다.\n공개 가능한 파일만 업로드하시겠습니까?";

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

export function isBrowserSafeImageFile(file: File): boolean {
  return file.type.startsWith("image/") && file.type !== "image/svg+xml";
}

export function isAllowedDocumentFile(file: File): boolean {
  const lowerName = file.name.toLowerCase();
  return (
    ALLOWED_DOCUMENT_MIME_TYPES.includes(file.type) ||
    DOCUMENT_EXTENSIONS.some((ext) => lowerName.endsWith(ext))
  );
}

export function isAllowedUploadFile(file: File): boolean {
  return isBrowserSafeImageFile(file) || isAllowedDocumentFile(file);
}

export function containsDocumentFile(files: File[]): boolean {
  return files.some((file) => isAllowedDocumentFile(file));
}
