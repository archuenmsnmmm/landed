import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { corsHeaders } from "@/lib/api-cors";

/**
 * 1) API CORS — packaged Electron loads file:// (Origin: null) and POSTs to
 *    /api/* with Authorization; without these headers checkout fails as a
 *    network error ("Billing server unreachable").
 * 2) OAuth — Supabase may land on `/` with code/error; forward to /auth/callback.
 */
export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    if (request.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 204,
        headers: corsHeaders(request),
      });
    }

    const response = NextResponse.next();
    corsHeaders(request).forEach((value, key) => {
      response.headers.set(key, value);
    });
    return response;
  }

  if (request.nextUrl.pathname.startsWith("/auth/callback")) {
    return NextResponse.next();
  }

  const code = request.nextUrl.searchParams.get("code");
  const error = request.nextUrl.searchParams.get("error");
  if (!code && !error) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = "/auth/callback";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/api/:path*",
    "/((?!_next/static|_next/image|favicon.ico|favicon-.*\\.png|icon-32\\.png|apple-touch-icon\\.png|apple-icon\\.png|downloads|assets).*)",
  ],
};
