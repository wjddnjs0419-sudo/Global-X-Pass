import { supabase } from "./supabaseClient";

/**
 * 아키텍처 맵 노드 ID. 새 노드가 추가되면 여기에도 등록해야 한다.
 * 추후 architectureMapData.ts에서 자동 추출하도록 변경 예정.
 */
export type NodeId =
  // entry / layout
  | "main" | "app" | "routes" | "root-layout" | "theme-ctx" | "lang-ctx"
  | "auth-route" | "admin-route" | "error-boundary"
  // pages
  | "home-page" | "events-page" | "notice-page" | "post-detail"
  | "login-page" | "signup-page" | "event-apply" | "consulting-page"
  | "founders-club" | "mypage" | "admin-page"
  // services / hooks / utils
  | "header-section" | "page-shell" | "consulting-modal"
  | "use-admin" | "use-tracker" | "use-idle"
  | "supabase-client" | "types" | "event-utils" | "html-security"
  | "admin-events-mgmt" | "admin-consulting-mgmt" | "admin-founders-mgmt"
  // edge functions
  | "ef-admin-auth" | "ef-signup" | "ef-encrypt"
  | "ef-decrypt" | "ef-decrypt-own" | "ef-delete"
  | "ef-update-role" | "ef-bulk" | "ef-consulting"
  | "ef-founders" | "ef-blog-sync" | "ef-change-password"
  // external
  | "ext-auth" | "ext-db" | "ext-storage" | "ext-realtime" | "ext-naver"
  // catch-all for source 매핑 실패 케이스
  | "unknown";

export type Severity = "low" | "medium" | "high" | "critical";

type LogOptions = {
  severity?: Severity;
  context?: Record<string, unknown>;
};

// 전송 전 context에서 PII 키 값을 *** 로 치환한다 (클라이언트측 1차 방어).
const PII_KEY_PATTERNS = [
  /email/i, /phone/i, /password/i, /passwd/i, /\bpwd\b/i,
  /\bname\b/i, /address/i, /birth/i, /\bssn\b/i,
  /이메일/i, /전화/i, /비밀번호/i, /성명/i, /주민/i, /핸드폰/i, /휴대폰/i,
];

function maskPii(obj: Record<string, unknown>, depth = 0): Record<string, unknown> {
  if (depth > 4) return obj;
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => {
      if (PII_KEY_PATTERNS.some((p) => p.test(k))) return [k, "***"];
      if (v !== null && typeof v === "object" && !Array.isArray(v))
        return [k, maskPii(v as Record<string, unknown>, depth + 1)];
      return [k, v];
    }),
  );
}

export const APP_BUILD_ID = __GXP_BUILD_ID__;

const THROTTLE_MS = 60 * 1000;
const THROTTLE_PREFIX = "gxp_err_";

const safeStorage = (): Storage | null => {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
};

const hashKey = (source: string, message: string): string => {
  const trimmed = `${source}|${message.slice(0, 120)}`;
  let hash = 5381;
  for (let i = 0; i < trimmed.length; i++) {
    hash = ((hash << 5) + hash) ^ trimmed.charCodeAt(i);
  }
  return THROTTLE_PREFIX + (hash >>> 0).toString(36);
};

const shouldThrottle = (source: string, message: string): boolean => {
  const store = safeStorage();
  if (!store) return false;
  const key = hashKey(source, message);
  const last = store.getItem(key);
  const now = Date.now();
  if (last && now - parseInt(last, 10) < THROTTLE_MS) return true;
  store.setItem(key, now.toString());
  return false;
};

const extractMessageAndStack = (error: unknown): { message: string; stack?: string } => {
  if (error instanceof Error) {
    return { message: error.message || error.name || "Unknown Error", stack: error.stack };
  }
  if (typeof error === "string") return { message: error };
  try {
    return { message: JSON.stringify(error) };
  } catch {
    return { message: String(error) };
  }
};

const APP_SOURCE_LOCATION_PATTERN = /\/?(src\/[^?\s)]+?\.(?:tsx?|jsx?|mjs|js))(?:\?[^:\s)]*)?(?::(\d+))?(?::(\d+))?/;

export function guessSourceLocationFromStack(stack: string | undefined): string | null {
  if (!stack) return null;
  const match = stack.match(APP_SOURCE_LOCATION_PATTERN);
  if (!match) return null;
  const [, file, line, col] = match;
  return [file, line, col].filter(Boolean).join(":");
}

/**
 * 프론트엔드에서 발생한 에러를 log-client-error Edge Function을 통해 전송한다.
 * - 클라이언트: maskPii()로 1차 마스킹 후 전송.
 * - 서버: EF에서 2차 마스킹 + AES-256-GCM 암호화 후 DB 저장.
 * - sessionStorage 기반 60초 throttle로 무한루프 폭주를 차단한다.
 */
export async function logError(
  source: NodeId,
  error: unknown,
  options: LogOptions = {},
): Promise<void> {
  const { message, stack } = extractMessageAndStack(error);
  if (!message) return;

  if (shouldThrottle(source, message)) return;

  const severity: Severity = options.severity ?? "medium";
  const path = typeof window !== "undefined" ? window.location.pathname : null;
  const sourceLocation = guessSourceLocationFromStack(stack);
  const maskedContext = maskPii(options.context ?? {});

  try {
    await supabase.functions.invoke("log-client-error", {
      body: {
        source,
        message,
        severity,
        stack: stack ?? null,
        path,
        context: {
          build_id: APP_BUILD_ID,
          ...(sourceLocation ? { source_location: sourceLocation } : {}),
          ...maskedContext,
        },
      },
    });
  } catch {
    // logError 실패는 silent. console 출력은 useTracker 패턴과 동일하게 무시.
  }
}

/**
 * Error.stack에서 첫 번째 파일명을 추출해 NodeId로 매핑한다.
 * 글로벌 핸들러(window.onerror, unhandledrejection)에서 source를 추정할 때 사용.
 * 매핑 실패 시 'unknown' 반환.
 */
const FILENAME_TO_NODE: Array<[RegExp, NodeId]> = [
  // hooks
  [/useAdmin\./,             "use-admin"],
  [/useTracker\./,           "use-tracker"],
  [/useIdleLogout\./,        "use-idle"],
  // pages
  [/EventApplicationPage\./, "event-apply"],
  [/EventsPage\./,           "events-page"],
  [/ConsultingPage\./,       "consulting-page"],
  [/FoundersClubPage\./,     "founders-club"],
  [/PostDetailPage\./,       "post-detail"],
  [/NoticePage\./,           "notice-page"],
  [/LoginPage\./,            "login-page"],
  [/SignupPage\./,           "signup-page"],
  [/MyPage\./,               "mypage"],
  [/AdminPage\./,            "admin-page"],
  [/HomePage\./,             "home-page"],
  // components
  [/ConsultingBookingModal\./, "consulting-modal"],
  [/HeaderSection\./,        "header-section"],
  [/PageShell\./,            "page-shell"],
  [/AdminEventManagement\./, "admin-events-mgmt"],
  [/AdminConsultingManagement\./, "admin-consulting-mgmt"],
  [/AdminFoundersClubManagement\./, "admin-founders-mgmt"],
  [/RootLayout\./,           "root-layout"],
  [/AuthRoute\./,            "auth-route"],
  [/AdminRoute\./,           "admin-route"],
  // utils / lib
  [/eventApplication\./,     "event-utils"],
  [/htmlSecurity\./,         "html-security"],
  [/supabaseClient\./,       "supabase-client"],
];

export function guessSourceFromStack(stack: string | undefined): NodeId {
  if (!stack) return "unknown";
  for (const [pattern, nodeId] of FILENAME_TO_NODE) {
    if (pattern.test(stack)) return nodeId;
  }
  return "unknown";
}
