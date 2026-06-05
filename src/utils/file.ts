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
  ".hwpx",
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
  "application/haansoft-hwp",
  "application/vnd.hancom.hwp",
  "application/hwp+zip",
  "application/vnd.hancom.hwpx",
];

// 확장자 → 정규 MIME. HWP/HWPX는 브라우저가 file.type을 빈 문자열/octet-stream으로
// 주는 경우가 많아 업로드 시 contentType를 명시해야 버킷 MIME 검증을 통과한다.
const DOCUMENT_EXTENSION_MIME: Record<string, string> = {
  ".pdf": "application/pdf",
  ".zip": "application/zip",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".ppt": "application/vnd.ms-powerpoint",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".hwp": "application/x-hwp",
  ".hwpx": "application/hwp+zip",
};

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
  ".hwpx",
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

// 첨부파일 다운로드용 URL. Supabase 공개 URL에 `?download=<원본파일명>`을 붙이면
// 스토리지가 Content-Disposition: attachment; filename=<원본.ext>로 응답한다.
// (download HTML 속성은 교차 출처에서 무시되므로 확장자 보존에는 이 쿼리가 필요)
export function getDownloadUrl(url: string): string {
  if (!url) return url;
  const name = getFileNameFromUrl(url);
  if (!name) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}download=${encodeURIComponent(name)}`;
}

export function isImage(url: string): boolean {
  const fileName = getFileNameFromUrl(url);
  if (IMAGE_EXTENSIONS.test(fileName)) return true;
  if (IMAGE_EXTENSIONS.test(url.split("?")[0])) return true;
  if (IMAGE_DOMAINS.some((domain) => url.includes(domain))) return true;
  return false;
}

export function isPdf(url: string): boolean {
  const fileName = getFileNameFromUrl(url);
  if (fileName.toLowerCase().endsWith(".pdf")) return true;
  return url.split("?")[0].toLowerCase().endsWith(".pdf");
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

// 문서 버킷 업로드용 Content-Type. 확장자 기준 정규 MIME을 우선 사용하고,
// (HWP/HWPX는 file.type이 비거나 octet-stream인 경우가 많아 신뢰 불가)
// 매핑이 없으면 브라우저가 준 file.type, 그래도 없으면 octet-stream으로 폴백한다.
export function getDocumentContentType(file: File): string {
  const lowerName = file.name.toLowerCase();
  const ext = Object.keys(DOCUMENT_EXTENSION_MIME).find((e) => lowerName.endsWith(e));
  if (ext) return DOCUMENT_EXTENSION_MIME[ext];
  return file.type || "application/octet-stream";
}
