import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";

let client: SupabaseClient | null = null;

export const isSupabaseConfigured = () =>
  Boolean(supabaseUrl.trim() && supabaseAnonKey.trim());

/** True when Supabase has the Google provider enabled for this project. */
export async function isGoogleAuthEnabled(): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const res = await fetch(`${supabaseUrl}/auth/v1/settings`, {
      headers: { apikey: supabaseAnonKey },
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { external?: { google?: boolean } };
    return data.external?.google === true;
  } catch {
    return false;
  }
}

/** Lazy client so packaged builds without .env don't crash on import. */
export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (!client) {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        flowType: "pkce",
      },
    });
  }
  return client;
}

export type SupabaseUser = {
  id: string;
  email: string;
  name: string;
  avatar: string;
};

export function toAppUser(user: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, string>;
}): SupabaseUser {
  const email = user.email ?? "";
  const name =
    user.user_metadata?.full_name ??
    user.user_metadata?.name ??
    email.split("@")[0] ??
    "User";
  const avatar =
    user.user_metadata?.avatar_url ??
    user.user_metadata?.picture ??
    name[0]?.toUpperCase() ??
    "G";
  return { id: user.id, email, name, avatar };
}
