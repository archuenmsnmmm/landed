import { getSupabase, toAppUser } from "./supabase";
import { recordTermsAcceptance } from "./legal-acceptance";
import { hasLocalAccountProfile } from "../services/account-sync";
import {
  ensureLegacyOnboardingSkipped,
  funnelStateFromStore,
  getOnboardingFunnelRoute,
} from "./onboarding-flow";
import { useAppStore } from "../store/useAppStore";

export type OAuthCallbackResult =
  | { ok: true; route: string }
  | { ok: false; error: string };

/** Exchange a landed://auth/callback deep link for a Supabase session and app login. */
export async function completeOAuthCallback(url: string): Promise<OAuthCallbackResult> {
  const supabase = getSupabase();
  if (!supabase) {
    return { ok: false, error: "Sign-in is not configured." };
  }

  try {
    const parsed = new URL(url);
    const oauthError =
      parsed.searchParams.get("error_description") ?? parsed.searchParams.get("error");
    if (oauthError) {
      return {
        ok: false,
        error: decodeURIComponent(oauthError.replace(/\+/g, " ")),
      };
    }

    const code = parsed.searchParams.get("code");
    if (code) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (error || !data.user) {
        return { ok: false, error: error?.message ?? "OAuth callback failed" };
      }

      const u = toAppUser(data.user);
      const oauthLooksNew = data.user.created_at === data.user.last_sign_in_at;
      const isNew = oauthLooksNew && !hasLocalAccountProfile(u.id);
      if (isNew) {
        await recordTermsAcceptance(u.id);
      }

      useAppStore.getState().login(u.email, u.name, u.id, u.avatar, isNew);
      if (u.id) {
        try {
          const { syncAccountData } = await import("../services/account-sync");
          await syncAccountData(u.id);
        } catch {
          // Local profile still works offline.
        }
        try {
          const { syncBillingState } = await import("../services/billing");
          await syncBillingState(u.id);
        } catch {
          // Billing sync also runs inside the app, so callbacks can continue.
        }
      }

      ensureLegacyOnboardingSkipped();

      const route = getOnboardingFunnelRoute(funnelStateFromStore()) ?? "/";
      return { ok: true, route };
    }

    const hashParams = new URLSearchParams(url.split("#")[1] ?? "");
    const accessToken = hashParams.get("access_token");
    const refreshToken = hashParams.get("refresh_token");
    if (!accessToken) {
      return { ok: false, error: "OAuth callback failed" };
    }

    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken ?? "",
    });
    if (error || !data.user) {
      return { ok: false, error: error?.message ?? "OAuth callback failed" };
    }

    const u = toAppUser(data.user);
    useAppStore.getState().login(u.email, u.name, u.id, u.avatar, false);
    if (u.id) {
      try {
        const { syncAccountData } = await import("../services/account-sync");
        await syncAccountData(u.id);
      } catch {
        // Local profile still works offline.
      }
      try {
        const { syncBillingState } = await import("../services/billing");
        await syncBillingState(u.id);
      } catch {
        // Billing sync also runs inside the app, so callbacks can continue.
      }
    }

    ensureLegacyOnboardingSkipped();

    const route = getOnboardingFunnelRoute(funnelStateFromStore()) ?? "/";
    return { ok: true, route };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "OAuth callback failed",
    };
  }
}
