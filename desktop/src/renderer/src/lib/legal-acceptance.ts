import { getSupabase } from "./supabase";

/** Keep in sync with src/content/legal/config.ts */
export const TERMS_VERSION = "2026-06-18";

export function termsAcceptanceMetadata() {
  const acceptedAt = new Date().toISOString();
  return {
    terms_accepted_at: acceptedAt,
    terms_version: TERMS_VERSION,
    privacy_accepted_at: acceptedAt,
  };
}

export async function recordTermsAcceptance(userId: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  const meta = termsAcceptanceMetadata();
  const { error } = await supabase
    .from("profiles")
    .update({
      terms_accepted_at: meta.terms_accepted_at,
      terms_version: meta.terms_version,
      privacy_accepted_at: meta.privacy_accepted_at,
      updated_at: meta.terms_accepted_at,
    })
    .eq("id", userId);

  if (error) {
    console.warn("[landed] Could not record terms acceptance:", error.message);
  }
}
