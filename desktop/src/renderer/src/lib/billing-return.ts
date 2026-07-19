import type { NavigateFunction } from "react-router-dom";
import { syncBillingState } from "../services/billing";
import { syncPlanLimitsToMain, useAppStore } from "../store/useAppStore";

export type PurchaseReturnTo = "dashboard" | "billing";

/** HTTPS URL Stripe redirects to after checkout; opens the desktop app via /billing/success. */
export function billingSuccessWebUrl(
  apiBase: string,
  plan: string,
  returnTo: PurchaseReturnTo = "dashboard",
): string {
  const base = apiBase.replace(/\/$/, "");
  const params = new URLSearchParams({
    plan,
    to: returnTo,
    session_id: "{CHECKOUT_SESSION_ID}",
  });
  return `${base}/billing/success?${params}`;
}

/** HTTPS URL Stripe redirects to after the billing portal. */
export function billingPortalReturnWebUrl(
  apiBase: string,
  returnTo: PurchaseReturnTo = "billing",
): string {
  const base = apiBase.replace(/\/$/, "");
  const params = new URLSearchParams({ to: returnTo });
  return `${base}/billing/success?${params}`;
}

export function billingDeepLink(
  plan: string,
  returnTo: PurchaseReturnTo = "dashboard",
): string {
  const params = new URLSearchParams({ plan, to: returnTo });
  return `landed://billing/success?${params}`;
}

export function billingPortalDeepLink(
  returnTo: PurchaseReturnTo = "billing",
): string {
  const params = new URLSearchParams({ to: returnTo });
  return `landed://billing/success?${params}`;
}

export function parseBillingCallbackUrl(url: string): {
  plan: string | null;
  returnTo: PurchaseReturnTo;
  sessionId: string | null;
} {
  try {
    const parsed = new URL(url.replace(/^landed:/, "https:"));
    return {
      plan: parsed.searchParams.get("plan"),
      returnTo:
        parsed.searchParams.get("to") === "billing" ? "billing" : "dashboard",
      sessionId: parsed.searchParams.get("session_id"),
    };
  } catch {
    return { plan: null, returnTo: "dashboard", sessionId: null };
  }
}

/** Sync plan after Stripe checkout and route back into the app. */
export async function completePurchaseReturn(
  userId: string,
  returnTo: PurchaseReturnTo,
  navigate: NavigateFunction,
  sessionId?: string | null,
): Promise<void> {
  if (sessionId?.startsWith("cs_")) {
    const { apiFetch } = await import("../lib/api-client");
    const res = await apiFetch(
      `/api/stripe/sync-from-session?session_id=${encodeURIComponent(sessionId)}`,
    ).catch(() => null);

    if (res?.ok) {
      const data = (await res.json().catch(() => ({}))) as { plan?: string };
      if (data.plan === "pro" || data.plan === "lifetime") {
        const store = useAppStore.getState();
        store.setPlan(data.plan);
        if (!store.paywallComplete) store.completePaywall();
        await syncPlanLimitsToMain();
      }
    }
  }

  await syncBillingState(userId);

  navigate("/", { replace: true });

  if (returnTo === "billing") {
    useAppStore.getState().requestSettingsOpen("billing");
  }
}
