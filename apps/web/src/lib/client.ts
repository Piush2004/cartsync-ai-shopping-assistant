// apps/web/lib/api/client.ts

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

export class ApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * FastAPI's `detail` field is a plain string for handwritten HTTPExceptions
 * (e.g. "Incorrect email or password"), but for a 422 validation error it's
 * an ARRAY of Pydantic error objects (`[{ msg, loc, type, ... }, ...]`) --
 * see apps/api/main.py's RequestValidationError handler. The old code did
 * `errorData?.detail || ...` and passed that straight to `new Error(...)`,
 * whose constructor coerces a non-string argument with `String()`; for an
 * array of plain objects that produces the literal text "[object Object]"
 * with no indication of what was actually wrong -- a real, reproduced bug
 * (registering with a short password showed exactly that instead of
 * "String should have at least 8 characters").
 */
export function extractErrorMessage(errorData: unknown, status: number): string {
  const detail = (errorData as { detail?: unknown } | null)?.detail;
  if (typeof detail === "string") {
    return detail;
  }
  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => (item && typeof item === "object" && "msg" in item ? String((item as { msg: unknown }).msg) : null))
      .filter((msg): msg is string => Boolean(msg));
    if (messages.length > 0) {
      return messages.join(" ");
    }
  }
  return `Error ${status}`;
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers || {});

  // We'll rely on Next.js server actions/cookies to inject the token if running on server,
  // or fetch via a proxy API route if on client, to keep JWT out of localStorage.

  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (networkErr) {
    // fetch() itself rejected -- backend unreachable, DNS failure, CORS
    // block, offline, etc. No HTTP response exists at all, so `status` is
    // left undefined. Callers can check `e.status === undefined` to show an
    // honest "can't reach the server" message instead of lumping this in
    // with a real HTTP error response (which does have a status).
    throw new ApiError(
      networkErr instanceof Error ? networkErr.message : "Network request failed",
      undefined
    );
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new ApiError(extractErrorMessage(errorData, response.status), response.status);
  }

  // A 2xx response with an empty or non-JSON body (e.g. a 204, or a proxy
  // returning 200 with no body) would otherwise throw an unguarded
  // SyntaxError here -- a real bug found in this session's investigation:
  // that error bypassed every `instanceof ApiError` check callers use to
  // tell "no data yet" apart from "something is actually wrong", always
  // landing in the most generic error path regardless of the caller's
  // handling.
  try {
    return await response.json();
  } catch {
    throw new ApiError("Received an invalid response from the server", response.status);
  }
}
