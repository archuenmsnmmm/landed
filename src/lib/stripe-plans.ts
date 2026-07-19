import type { BillingCurrency } from "@/lib/regional-pricing";
import {
  stripeLifetimePriceId,
  stripeProAnnualPriceId,
  stripeProMonthlyPriceId,
} from "@/lib/stripe-ids";

export type StripePlanId = "pro" | "lifetime";
export type StripeBillingInterval = "monthly" | "annual" | "lifetime";

const CURRENCIES: BillingCurrency[] = ["usd", "gbp", "eur", "aud", "cad"];

function allProPriceIds(): string[] {
  const ids = new Set<string>();
  for (const currency of CURRENCIES) {
    const monthly = stripeProMonthlyPriceId(currency);
    const annual = stripeProAnnualPriceId(currency);
    if (monthly) ids.add(monthly);
    if (annual) ids.add(annual);
  }
  return [...ids];
}

function allLifetimePriceIds(): string[] {
  const ids = new Set<string>();
  for (const currency of CURRENCIES) {
    const lifetime = stripeLifetimePriceId(currency);
    if (lifetime) ids.add(lifetime);
  }
  return [...ids];
}

export function stripePriceIdForPlan(
  plan: StripePlanId,
  interval: StripeBillingInterval = "monthly",
  currency: BillingCurrency = "usd",
): string | undefined {
  if (plan === "lifetime" || interval === "lifetime") {
    const priceId = stripeLifetimePriceId(currency);
    if (priceId) return priceId;
    if (currency !== "usd") {
      return stripePriceIdForPlan("lifetime", "lifetime", "usd");
    }
    return undefined;
  }

  const map: Record<"pro", Record<"monthly" | "annual", string>> = {
    pro: {
      monthly: stripeProMonthlyPriceId(currency),
      annual: stripeProAnnualPriceId(currency),
    },
  };
  const priceId = map.pro[interval];
  if (priceId) return priceId;
  if (currency !== "usd") {
    return stripePriceIdForPlan(plan, interval, "usd");
  }
  return undefined;
}

export function planFromStripePriceId(priceId: string): StripePlanId | "free" {
  if (allLifetimePriceIds().includes(priceId)) return "lifetime";
  if (allProPriceIds().includes(priceId)) return "pro";
  return "free";
}
