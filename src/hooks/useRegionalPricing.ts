"use client";

import { useEffect, useState } from "react";
import {
  currencyFromLocale,
  REGIONAL_PRICING_ENABLED,
  type BillingCurrency,
} from "@/lib/regional-pricing";

function detectClientCurrency(): BillingCurrency {
  if (!REGIONAL_PRICING_ENABLED) return "usd";
  if (typeof navigator === "undefined") return "usd";
  const locales = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const locale of locales) {
    const currency = currencyFromLocale(locale);
    if (currency !== "usd") return currency;
  }
  return currencyFromLocale(navigator.language);
}

export function useRegionalPricing() {
  const fallbackCurrency = detectClientCurrency();
  const [currency, setCurrency] = useState<BillingCurrency>(fallbackCurrency);

  useEffect(() => {
    if (!REGIONAL_PRICING_ENABLED) {
      setCurrency("usd");
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/pricing", {
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
        if (!cancelled) setCurrency(detectClientCurrency());
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return currency;
}
