import { currencyFromCountry, currencyFromLocale, type BillingCurrency } from "./regional-pricing";

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

export function currencyFromRequestHeaders(headers: Headers): BillingCurrency {
  const country = countryFromRequestHeaders(headers);
  if (country) return currencyFromCountry(country);
  const acceptLanguage = headers.get("accept-language");
  if (acceptLanguage) {
    const primary = acceptLanguage.split(",")[0]?.trim();
    if (primary) return currencyFromLocale(primary);
  }
  return "usd";
}
