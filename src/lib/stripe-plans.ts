import {
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
  return [...ids];
}

function allLifetimePriceIds(): string[] {
  const lifetime = stripeLifetimePriceId();
  return lifetime ? [lifetime] : [];
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
