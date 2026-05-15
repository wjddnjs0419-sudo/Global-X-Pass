import { logError, type NodeId, type Severity } from "./errorLogger";

type FailureContext = Record<string, unknown>;

function normalizeError(error: unknown, fallback: string): Error {
  if (error instanceof Error) return error;
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = String((error as { message?: unknown }).message ?? fallback);
    const normalized = new Error(message);
    if ("code" in error) normalized.name = String((error as { code?: unknown }).code ?? "SupabaseError");
    return normalized;
  }
  if (typeof error === "string") return new Error(error);
  return new Error(fallback);
}

export function logSupabaseFailure(
  source: NodeId,
  operation: string,
  error: unknown,
  options: { severity?: Severity; context?: FailureContext } = {},
) {
  const normalized = normalizeError(error, `${operation} failed`);
  void logError(source, normalized, {
    severity: options.severity ?? "medium",
    context: {
      kind: "supabase-failure",
      operation,
      ...options.context,
    },
  });
}

export function logActionFailure(
  source: NodeId,
  action: string,
  reason: string,
  options: { severity?: Severity; context?: FailureContext } = {},
) {
  void logError(source, new Error(reason), {
    severity: options.severity ?? "medium",
    context: {
      kind: "action-failure",
      action,
      ...options.context,
    },
  });
}

export async function withActionTelemetry<T>(
  source: NodeId,
  action: string,
  run: () => Promise<T>,
  options: { severity?: Severity; timeoutMs?: number; context?: FailureContext } = {},
): Promise<T> {
  const timeoutMs = options.timeoutMs ?? 8000;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Action did not settle within ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([run(), timeout]);
  } catch (error) {
    logActionFailure(source, action, error instanceof Error ? error.message : String(error), {
      severity: options.severity ?? "medium",
      context: options.context,
    });
    throw error;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}
