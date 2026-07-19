import { useEffect, useState } from "react";
import {
  currencyFromLocale,
  detectClientCurrency,
  REGIONAL_PRICING_ENABLED,
  type BillingCurrency,
} from "../lib/regional-pricing";
import { resolveApiBase } from "../lib/billing-api-base";

export function useRegionalPricing() {
  const fallbackCurrency = detectClientCurrency();
  const [currency, setCurrency] = useState<BillingCurrency>(fallbackCurrency);

  useEffect(() => {
    if (!REGIONAL_PRICING_ENABLED) {
      setCurrency("gbp");
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        const base = await resolveApiBase();
        const res = await fetch(`${base}/api/pricing`, {
          headers: {
            "Accept-Language": navigator.language,
          },
        });
        if (!res.ok) return;
        const data = (await res.json()) as { currency?: string };
        const next = data.currency?.trim().toLowerCase();
        if (!cancelled && next && next in { usd: 1, gbp: 1, eur: 1, aud: 1, cad: 1 }) {
          setCurrency(next as BillingCurrency);
        }
      } catch {
        const localeCurrency = currencyFromLocale(navigator.language);
        if (!cancelled) setCurrency(localeCurrency);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return currency;
}
