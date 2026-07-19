import type { PurchaseReturnTo } from "../lib/billing-return";
import {
  billingPortalReturnWebUrl,
  billingSuccessWebUrl,
} from "../lib/billing-return";
import { authHeaders } from "../lib/api-auth";
import { clearApiBaseCache, DEFAULT_API_BASE, resolveApiBase } from "../lib/billing-api-base";
import type { Plan } from "../store/types";
import type { BillingInterval, PricingTierId } from "../lib/pricing";
import { pricingTierToPlan } from "../lib/pricing";
import { isPaidPlan } from "../store/types";
import { syncPlanLimitsToMain, useAppStore } from "../store/useAppStore";

const PAID: Plan[] = ["pro", "solo", "undetectable", "lifetime"];
const KNOWN_PLANS: Plan[] = ["free", "solo", "pro", "undetectable", "lifetime"];

async function parseBillingJsonResponse(
  res: Response,
): Promise<{ data: { url?: string; error?: string }; error?: string }> {
  const raw = await res.text();
  let data: { url?: string; error?: string } = {};
  try {
    data = JSON.parse(raw) as { url?: string; error?: string };
  } catch {
    if (raw.includes("DEPLOYMENT_NOT_FOUND") || res.status === 404) {
      return {
        data: {},
        error:
          "Billing server unavailable. Update VITE_API_BASE_URL in desktop/.env and restart the app.",
      };
    }
  }
  return { data };
}

async function openCheckoutUrl(url: string): Promise<void> {
  if (window.landed?.openExternal) {
    await window.landed.openExternal(url);
    return;
  }
  window.open(url, "_blank", "noopener,noreferrer");
}

export type CheckoutResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

/** Open Stripe Checkout for a paid plan (GBP only). */
export async function startStripeCheckout(
  plan: Plan,
  userId: string,
  email: string,
  interval: BillingInterval = "monthly",
  returnTo: PurchaseReturnTo = "dashboard",
): Promise<CheckoutResult> {
  if (!PAID.includes(plan)) {
    return { ok: false, error: "Invalid plan" };
  }

  let base = await resolveApiBase();
  const bodyFor = (apiBase: string) =>
    JSON.stringify({
      plan,
      interval,
      userId,
      email,
      successUrl: billingSuccessWebUrl(apiBase, plan, returnTo),
      cancelUrl: `${apiBase}/billing/cancel`,
    });

  let res: Response;
  try {
    res = await fetch(`${base}/api/stripe/checkout`, {
      method: "POST",
      headers: await authHeaders(),
      body: bodyFor(base),
    });
  } catch (err) {
    // Localhost / stale base: clear cache and retry once against production.
    console.warn("[billing] checkout fetch failed, retrying production API:", err);
    clearApiBaseCache();
    base = DEFAULT_API_BASE;
    try {
      res = await fetch(`${base}/api/stripe/checkout`, {
        method: "POST",
        headers: await authHeaders(),
        body: bodyFor(base),
      });
    } catch (retryErr) {
      console.warn("[billing] checkout retry failed:", retryErr);
      return {
        ok: false,
        error: `Billing server unreachable. Check your connection and try again. (API: ${base})`,
      };
    }
  }

  const parsed = await parseBillingJsonResponse(res);
  if (parsed.error) {
    return { ok: false, error: parsed.error };
  }
  const { data } = parsed;
  if (!res.ok) {
    if (res.status === 401) {
      return {
        ok: false,
        error: "Session expired. Sign out and sign in again, then retry checkout.",
      };
    }
    return {
      ok: false,
      error: data.error ?? "Could not start checkout. Try again.",
    };
  }
  if (!data.url) {
    return { ok: false, error: "Checkout session did not return a URL." };
  }

  await openCheckoutUrl(data.url);
  return { ok: true, url: data.url };
}

export type PortalResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

/** Open Stripe Customer Portal to manage subscription & payment method. */
export async function openStripeBillingPortal(userId: string): Promise<PortalResult> {
  let base = await resolveApiBase();
  const bodyFor = (apiBase: string) =>
    JSON.stringify({
      userId,
      returnUrl: billingPortalReturnWebUrl(apiBase, "billing"),
    });

  let res: Response;
  try {
    res = await fetch(`${base}/api/stripe/portal`, {
      method: "POST",
      headers: await authHeaders(),
      body: bodyFor(base),
    });
  } catch (err) {
    console.warn("[billing] portal fetch failed, retrying production API:", err);
    clearApiBaseCache();
    base = DEFAULT_API_BASE;
    try {
      res = await fetch(`${base}/api/stripe/portal`, {
        method: "POST",
        headers: await authHeaders(),
        body: bodyFor(base),
      });
    } catch (retryErr) {
      console.warn("[billing] portal retry failed:", retryErr);
      return {
        ok: false,
        error: `Billing server unreachable. Check your connection and try again. (API: ${base})`,
      };
    }
  }

  const parsed = await parseBillingJsonResponse(res);
  if (parsed.error) {
    return { ok: false, error: parsed.error };
  }
  const { data } = parsed;
  if (!res.ok) {
    if (res.status === 401) {
      return {
        ok: false,
        error: "Session expired. Sign out and sign in again, then retry.",
      };
    }
    if (res.status === 404) {
      return {
        ok: false,
        error:
          data.error ??
          "No Stripe billing account found for this login. Upgrade once, then you can manage billing here.",
      };
    }
    return {
      ok: false,
      error: data.error ?? "Could not open billing portal. Try again.",
    };
  }
  if (!data.url) {
    return { ok: false, error: "Billing portal did not return a URL." };
  }

  await openCheckoutUrl(data.url);
  return { ok: true, url: data.url };
}

/** Start checkout for a public pricing tier (GBP only). */
export async function startPricingCheckout(
  tier: PricingTierId,
  userId: string,
  email: string,
  interval: BillingInterval = "monthly",
  returnTo: PurchaseReturnTo = "dashboard",
): Promise<CheckoutResult> {
  return startStripeCheckout(
    pricingTierToPlan(tier),
    userId,
    email,
    interval,
    returnTo,
  );
}

export async function syncPlanFromProfile(userId: string): Promise<Plan | null> {
  const { getSupabase } = await import("../lib/supabase");
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "plan, stripe_subscription_id, free_overlay_seconds_used, free_questions_used",
    )
    .eq("id", userId)
    .maybeSingle();

  if (error || !data?.plan) return null;

  const hasStripeSub = Boolean(data.stripe_subscription_id);

  const serverOverlayUsed = Math.max(
    0,
    Number(data.free_overlay_seconds_used) || 0,
  );
  const serverQuestionsUsed = Math.max(
    0,
    Number(data.free_questions_used) || 0,
  );
  const patch: {
    freeOverlaySecondsUsed?: number;
    freeQuestionsUsed?: number;
  } = {};
  if (serverOverlayUsed > useAppStore.getState().freeOverlaySecondsUsed) {
    patch.freeOverlaySecondsUsed = serverOverlayUsed;
  }
  if (serverQuestionsUsed > useAppStore.getState().freeQuestionsUsed) {
    patch.freeQuestionsUsed = serverQuestionsUsed;
  }
  if (Object.keys(patch).length > 0) {
    useAppStore.setState(patch);
  }

  const plan = data.plan as Plan;
  if (plan === "lifetime") return "lifetime";
  if (plan === "pro" && !hasStripeSub) return "free";
  if (KNOWN_PLANS.includes(plan)) {
    return hasStripeSub || plan === "free" ? plan : "free";
  }
  return null;
}

async function syncPlanFromStripeApi(userId: string): Promise<Plan | null> {
  const base = await resolveApiBase();
  const res = await fetch(`${base}/api/stripe/sync`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ userId }),
  });

  if (!res.ok) return null;

  const data = (await res.json().catch(() => ({}))) as { plan?: string };
  const plan = data.plan as Plan | undefined;
  if (plan && KNOWN_PLANS.includes(plan)) {
    return plan;
  }
  return null;
}

/** Read plan from Supabase, falling back to a server-side Stripe sync when needed. */
export async function resolvePlanForUser(userId: string): Promise<Plan | null> {
  const localPlan = await syncPlanFromProfile(userId);
  if (localPlan && localPlan !== "free") return localPlan;
  return (await syncPlanFromStripeApi(userId)) ?? localPlan;
}

/** Pull plan from Supabase and apply it locally (also unlocks dashboard for paid users). */
export async function syncBillingState(userId: string): Promise<Plan | null> {
  const store = useAppStore.getState();
  const remotePlan = await resolvePlanForUser(userId);
  if (!remotePlan) return null;

  store.setPlan(remotePlan);
  if (isPaidPlan(remotePlan) && !store.paywallComplete) {
    store.completePaywall();
  }
  syncPlanLimitsToMain();

  return remotePlan;
}
