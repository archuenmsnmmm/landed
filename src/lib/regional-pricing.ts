/** All catalog prices and Stripe checkouts are GBP (£) only. */
export type BillingCurrency = "gbp";

export interface RegionalPlanPricing {
  monthly: number;
  /** Total billed once per year on annual plans. */
  annualYearly: number;
}

export interface RegionalLifetimePricing {
  /** One-time purchase price. */
  current: number;
  /** Struck-through compare-at price. */
  original: number;
}

/** Pro plan amounts — must match GBP Stripe Price IDs in env. */
export const REGIONAL_PRO_PRICING: Record<BillingCurrency, RegionalPlanPricing> = {
  gbp: { monthly: 24.99, annualYearly: 209.92 },
};

/** Lifetime one-time amounts. */
export const REGIONAL_LIFETIME_PRICING: Record<BillingCurrency, RegionalLifetimePricing> = {
  gbp: { current: 797, original: 1598 },
};

export const DEFAULT_CURRENCY: BillingCurrency = "gbp";

export function isBillingCurrency(value: string): value is BillingCurrency {
  return value === "gbp";
}

/** Always GBP — kept for callers that previously resolved by country. */
export function currencyFromCountry(_countryCode?: string | null): BillingCurrency {
  return DEFAULT_CURRENCY;
}

/** Always GBP — kept for callers that previously resolved by locale. */
export function currencyFromLocale(_locale?: string | null): BillingCurrency {
  return DEFAULT_CURRENCY;
}

export function localeForCurrency(_currency: BillingCurrency = DEFAULT_CURRENCY): string {
  return "en-GB";
}

export function resolveBillingCurrency(_currency?: BillingCurrency): BillingCurrency {
  return DEFAULT_CURRENCY;
}

export function formatRegionalPrice(
  amount: number,
  _currency: BillingCurrency = DEFAULT_CURRENCY,
): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function annualDiscountPercent(
  currency: BillingCurrency = DEFAULT_CURRENCY,
): number {
  const pricing = REGIONAL_PRO_PRICING[currency];
  return Math.round(
    (1 - pricing.annualYearly / (pricing.monthly * 12)) * 100,
  );
}

export function lifetimePricing(
  currency: BillingCurrency = DEFAULT_CURRENCY,
): RegionalLifetimePricing {
  return REGIONAL_LIFETIME_PRICING[currency];
}

export function lifetimeDiscountPercent(
  currency: BillingCurrency = DEFAULT_CURRENCY,
): number {
  const pricing = REGIONAL_LIFETIME_PRICING[currency];
  if (pricing.original <= 0) return 0;
  return Math.round((1 - pricing.current / pricing.original) * 100);
}

export function regionalPricingSnapshot(
  _currency: BillingCurrency = DEFAULT_CURRENCY,
) {
  const pricing = REGIONAL_PRO_PRICING.gbp;
  const lifetime = REGIONAL_LIFETIME_PRICING.gbp;
  return {
    currency: DEFAULT_CURRENCY,
    monthly: pricing.monthly,
    annualYearly: pricing.annualYearly,
    annualDiscountPercent: annualDiscountPercent(),
    lifetimeCurrent: lifetime.current,
    lifetimeOriginal: lifetime.original,
    lifetimeDiscountPercent: lifetimeDiscountPercent(),
    locale: localeForCurrency(),
  };
}
