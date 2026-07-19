import { getSupabase } from "./supabase";

export async function getApiAccessToken(): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data: sessionData } = await supabase.auth.getSession();
  const session = sessionData.session;
  if (!session) return null;

  const expiresAtMs = (session.expires_at ?? 0) * 1000;
  if (expiresAtMs > Date.now() + 60_000) {
    return session.access_token;
  }

  const { data: refreshed } = await supabase.auth.refreshSession();
  return refreshed.session?.access_token ?? session.access_token;
}

export async function authHeaders(
  extra: Record<string, string> = {},
): Promise<HeadersInit> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...extra,
  };
  const token = await getApiAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}
