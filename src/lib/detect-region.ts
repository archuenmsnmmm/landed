import { DEFAULT_CURRENCY, type BillingCurrency } from "./regional-pricing";

/** Extract ISO country from common CDN / edge headers. */
export function countryFromRequestHeaders(headers: Headers): string | null {
  const candidates = [
    headers.get("x-vercel-ip-country"),
    headers.get("cf-ipcountry"),
    headers.get("x-country-code"),
  ];
  for (const value of candidates) {
    const code = value?.trim();
    if (code && code !== "XX" && code !== "T1") return code.toUpperCase();
  }
  return null;
}

/** Always GBP — catalog and Stripe are pounds-only. */
export function currencyFromRequestHeaders(_headers: Headers): BillingCurrency {
  return DEFAULT_CURRENCY;
}
