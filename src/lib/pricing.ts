import {
  annualDiscountPercent,
  formatRegionalPrice,
  lifetimeDiscountPercent,
  lifetimePricing,
  regionalPricingSnapshot,
  type BillingCurrency,
  REGIONAL_PRO_PRICING,
} from "./regional-pricing";

export type { BillingCurrency } from "./regional-pricing";

export type BillingInterval = "monthly" | "annual";

export interface PaidPlanPricing {
  monthly: number;
  /** Total billed once per year on annual plans. */
  annualYearly: number;
}

export const DEFAULT_BILLING_CURRENCY: BillingCurrency = "usd";

export function paidPlanPricing(currency: BillingCurrency = DEFAULT_BILLING_CURRENCY): PaidPlanPricing {
  return REGIONAL_PRO_PRICING[currency];
}

/** @deprecated Use paidPlanPricing(currency) for regional amounts. */
export const PAID_PLAN_PRICING: Record<"pro", PaidPlanPricing> = {
  pro: REGIONAL_PRO_PRICING.usd,
};

export function getAnnualDiscountPercent(currency: BillingCurrency = DEFAULT_BILLING_CURRENCY): number {
  return annualDiscountPercent(currency);
}

/** @deprecated Use getAnnualDiscountPercent(currency). */
export const ANNUAL_DISCOUNT_PERCENT = getAnnualDiscountPercent("usd");

export function formatPrice(
  amount: number,
  currency: BillingCurrency = DEFAULT_BILLING_CURRENCY,
): string {
  return formatRegionalPrice(amount, currency);
}

export function priceForInterval(
  plan: "pro",
  interval: BillingInterval,
  currency: BillingCurrency = DEFAULT_BILLING_CURRENCY,
): { current: string; original?: string } {
  const pricing = paidPlanPricing(currency);
  if (interval === "annual") {
    return {
      current: formatPrice(pricing.annualYearly / 12, currency),
      original: formatPrice(pricing.monthly, currency),
    };
  }
  return { current: formatPrice(pricing.monthly, currency) };
}

export function priceForLifetime(
  currency: BillingCurrency = DEFAULT_BILLING_CURRENCY,
): { current: string; original: string; discountPercent: number } {
  const pricing = lifetimePricing(currency);
  return {
    current: formatPrice(pricing.current, currency),
    original: formatPrice(pricing.original, currency),
    discountPercent: lifetimeDiscountPercent(currency),
  };
}

export { regionalPricingSnapshot, lifetimePricing, lifetimeDiscountPercent };
