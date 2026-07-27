import {
  ARCHIVED_STRIPE_LIFETIME_PRICE_IDS,
  ARCHIVED_STRIPE_PRO_ANNUAL_PRICE_IDS,
  ARCHIVED_STRIPE_PRO_MONTHLY_PRICE_IDS,
  stripeLifetimePriceId,
  stripeProAnnualPriceId,
  stripeProMonthlyPriceId,
} from "@/lib/stripe-ids";

export type StripePlanId = "pro" | "lifetime";
export type StripeBillingInterval = "monthly" | "annual" | "lifetime";

function allProPriceIds(): string[] {
  const ids = new Set<string>();
  const monthly = stripeProMonthlyPriceId();
  const annual = stripeProAnnualPriceId();
  if (monthly) ids.add(monthly);
  if (annual) ids.add(annual);
  for (const id of ARCHIVED_STRIPE_PRO_MONTHLY_PRICE_IDS) ids.add(id);
  for (const id of ARCHIVED_STRIPE_PRO_ANNUAL_PRICE_IDS) ids.add(id);
  return [...ids];
}

function allLifetimePriceIds(): string[] {
  const ids = new Set<string>();
  const lifetime = stripeLifetimePriceId();
  if (lifetime) ids.add(lifetime);
  for (const id of ARCHIVED_STRIPE_LIFETIME_PRICE_IDS) ids.add(id);
  return [...ids];
}

/** Resolve the GBP Stripe Price ID for a plan. */
export function stripePriceIdForPlan(
  plan: StripePlanId,
  interval: StripeBillingInterval = "monthly",
): string | undefined {
  if (plan === "lifetime" || interval === "lifetime") {
    return stripeLifetimePriceId() || undefined;
  }

  if (interval === "annual") {
    return stripeProAnnualPriceId() || undefined;
  }

  return stripeProMonthlyPriceId() || undefined;
}

export function planFromStripePriceId(priceId: string): StripePlanId | "free" {
  if (allLifetimePriceIds().includes(priceId)) return "lifetime";
  if (allProPriceIds().includes(priceId)) return "pro";
  return "free";
}
