import { DEFAULT_CURRENCY, type BillingCurrency } from "../lib/regional-pricing";

/** Catalog is GBP (£) only. */
export function useRegionalPricing(): BillingCurrency {
  return DEFAULT_CURRENCY;
}
