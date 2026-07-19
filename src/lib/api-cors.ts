const ALLOWED_ORIGIN =
  /^https?:\/\/(localhost|127\.0\.0\.1|landed-ai\.com|www\.landed-ai\.com|landed-archuenmsnmmms-projects\.vercel\.app)(:\d+)?$/;

/**
 * CORS for desktop (Electron file:// → Origin "null") and local Vite.
 * Packaged app loads from file://, so billing/AI POSTs need ACAO: null.
 */
export function corsHeaders(request: Request): Headers {
  const headers = new Headers();
  const origin = request.headers.get("origin");

  if (origin === "null") {
    headers.set("Access-Control-Allow-Origin", "null");
    headers.set("Vary", "Origin");
  } else if (origin && ALLOWED_ORIGIN.test(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Vary", "Origin");
  }

  headers.set("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept-Language");
  headers.set("Access-Control-Max-Age", "86400");
  return headers;
}

export function jsonWithCors(
  request: Request,
  body: unknown,
  init?: ResponseInit,
): Response {
  const headers = corsHeaders(request);
  const responseHeaders = new Headers(init?.headers);
  headers.forEach((value, key) => responseHeaders.set(key, value));
  return Response.json(body, { ...init, headers: responseHeaders });
}

export function optionsResponse(request: Request): Response {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

/** True when Origin is missing (non-browser), Electron null, or allowlisted. */
export function isAllowedCorsOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin || origin === "null") return true;
  return ALLOWED_ORIGIN.test(origin);
}
