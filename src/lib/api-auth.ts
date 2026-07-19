import { createClient } from "@supabase/supabase-js";

export type AuthResult =
  | { ok: true; userId: string; email: string | null }
  | { ok: false; status: number; error: string };

export async function verifyAuthenticatedRequest(
  request: Request,
): Promise<AuthResult> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? "";
  if (!url.trim() || !anonKey.trim()) {
    return { ok: false, status: 503, error: "Auth is not configured" };
  }

  const supabase = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user?.id) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  return { ok: true, userId: data.user.id, email: data.user.email ?? null };
}

export function assertMatchingUserId(
  auth: Extract<AuthResult, { ok: true }>,
  userId: string,
): AuthResult {
  if (auth.userId !== userId.trim()) {
    return { ok: false, status: 403, error: "Forbidden" };
  }
  return auth;
}
