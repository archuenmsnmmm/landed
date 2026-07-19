export type BillingCurrency = "usd" | "gbp" | "eur" | "aud" | "cad";

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

/** Pro plan amounts per currency (local pricing, ~30% annual discount).
 * Display amounts must match Stripe Price IDs in env.
 * Anchor: £24.99 / $24.99 / €24.99 monthly. */
export const REGIONAL_PRO_PRICING: Record<BillingCurrency, RegionalPlanPricing> = {
  usd: { monthly: 24.99, annualYearly: 209.92 },
  gbp: { monthly: 24.99, annualYearly: 209.92 },
  eur: { monthly: 24.99, annualYearly: 209.92 },
  aud: { monthly: 39.99, annualYearly: 335.92 },
  cad: { monthly: 34.99, annualYearly: 293.92 },
};

/** Lifetime one-time amounts. Anchor: £797 (was £1598). */
export const REGIONAL_LIFETIME_PRICING: Record<BillingCurrency, RegionalLifetimePricing> = {
  usd: { current: 797, original: 1598 },
  gbp: { current: 797, original: 1598 },
  eur: { current: 797, original: 1598 },
  aud: { current: 1275, original: 2557 },
  cad: { current: 1116, original: 2237 },
};

/** ISO 3166-1 alpha-2 country → billing currency. */
const COUNTRY_TO_CURRENCY: Record<string, BillingCurrency> = {
  US: "usd",
  GB: "gbp",
  AT: "eur",
  BE: "eur",
  BG: "eur",
  HR: "eur",
  CY: "eur",
  CZ: "eur",
  DK: "eur",
  EE: "eur",
  FI: "eur",
  FR: "eur",
  DE: "eur",
  GR: "eur",
  HU: "eur",
  IE: "eur",
  IT: "eur",
  LV: "eur",
  LT: "eur",
  LU: "eur",
  MT: "eur",
  NL: "eur",
  PL: "eur",
  PT: "eur",
  RO: "eur",
  SK: "eur",
  SI: "eur",
  ES: "eur",
  SE: "eur",
  NO: "eur",
  CH: "eur",
  AU: "aud",
  NZ: "aud",
  CA: "cad",
};

const LOCALE_CURRENCY_HINTS: Record<string, BillingCurrency> = {
  "en-us": "usd",
  "en-gb": "gbp",
  "en-au": "aud",
  "en-ca": "cad",
  "fr": "eur",
  "fr-fr": "eur",
  "de": "eur",
  "de-de": "eur",
  "es": "eur",
  "es-es": "eur",
  "it": "eur",
  "it-it": "eur",
  "nl": "eur",
  "nl-nl": "eur",
  "pt": "eur",
  "pt-pt": "eur",
};

/** Launch standard — all display + checkout use GBP until regional pricing is re-enabled. */
export const DEFAULT_CURRENCY: BillingCurrency = "gbp";

/** Temporary: paywalls / pricing / checkout are GBP-only. Set true to restore regional currencies. */
export const REGIONAL_PRICING_ENABLED = false;

export function isBillingCurrency(value: string): value is BillingCurrency {
  return value in REGIONAL_PRO_PRICING;
}

export function currencyFromCountry(countryCode: string | null | undefined): BillingCurrency {
  if (!REGIONAL_PRICING_ENABLED) return DEFAULT_CURRENCY;
  if (!countryCode) return DEFAULT_CURRENCY;
  return COUNTRY_TO_CURRENCY[countryCode.trim().toUpperCase()] ?? DEFAULT_CURRENCY;
}

export function currencyFromLocale(locale: string | null | undefined): BillingCurrency {
  if (!REGIONAL_PRICING_ENABLED) return DEFAULT_CURRENCY;
  if (!locale) return DEFAULT_CURRENCY;
  const normalized = locale.trim().toLowerCase().replace("_", "-");
  if (LOCALE_CURRENCY_HINTS[normalized]) return LOCALE_CURRENCY_HINTS[normalized];
  const lang = normalized.split("-")[0];
  if (LOCALE_CURRENCY_HINTS[lang]) return LOCALE_CURRENCY_HINTS[lang];
  const region = normalized.split("-")[1]?.toUpperCase();
  return currencyFromCountry(region);
}

export function localeForCurrency(currency: BillingCurrency): string {
  switch (currency) {
    case "gbp":
      return "en-GB";
    case "eur":
      return "de-DE";
    case "aud":
      return "en-AU";
    case "cad":
      return "en-CA";
    default:
      return "en-US";
  }
}

export function formatRegionalPrice(
  amount: number,
  currency: BillingCurrency = DEFAULT_CURRENCY,
): string {
  const formatted = new Intl.NumberFormat(localeForCurrency(currency), {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return formatted;
}

export function annualDiscountPercent(currency: BillingCurrency): number {
  const pricing = REGIONAL_PRO_PRICING[currency];
  return Math.round(
    (1 - pricing.annualYearly / (pricing.monthly * 12)) * 100,
  );
}

export function lifetimePricing(currency: BillingCurrency): RegionalLifetimePricing {
  return REGIONAL_LIFETIME_PRICING[currency];
}

export function lifetimeDiscountPercent(currency: BillingCurrency): number {
  const pricing = REGIONAL_LIFETIME_PRICING[currency];
  if (pricing.original <= 0) return 0;
  return Math.round((1 - pricing.current / pricing.original) * 100);
}

export function regionalPricingSnapshot(currency: BillingCurrency) {
  const pricing = REGIONAL_PRO_PRICING[currency];
  const lifetime = REGIONAL_LIFETIME_PRICING[currency];
  return {
    currency,
    monthly: pricing.monthly,
    annualYearly: pricing.annualYearly,
    annualDiscountPercent: annualDiscountPercent(currency),
    lifetimeCurrent: lifetime.current,
    lifetimeOriginal: lifetime.original,
    lifetimeDiscountPercent: lifetimeDiscountPercent(currency),
    locale: localeForCurrency(currency),
  };
}
