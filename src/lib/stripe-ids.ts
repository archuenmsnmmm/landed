/** Stripe webhook endpoint path (rewrites to /api/stripe/webhook in next.config.ts). */
export const STRIPE_WEBHOOK_PATH = "/api/webhooks/stripe";

/** Events configured on the Stripe webhook endpoint. */
export const STRIPE_WEBHOOK_EVENTS = [
  "checkout.session.completed",
  "invoice.paid",
  "invoice.payment_failed",
  "customer.subscription.updated",
  "customer.subscription.deleted",
] as const;

function envValue(value: string | undefined): string {
  return value?.trim() || "";
}

import type { BillingCurrency } from "@/lib/regional-pricing";

/** Pro monthly price ID — accepts legacy STRIPE_PRICE_PRO_MONTHLY. */
export function stripeProMonthlyPriceId(currency: BillingCurrency = "usd"): string {
  const byCurrency: Record<BillingCurrency, string | undefined> = {
    usd: process.env.STRIPE_PRICE_PRO ?? process.env.STRIPE_PRICE_PRO_MONTHLY,
    gbp: process.env.STRIPE_PRICE_PRO_GBP,
    eur: process.env.STRIPE_PRICE_PRO_EUR,
    aud: process.env.STRIPE_PRICE_PRO_AUD,
    cad: process.env.STRIPE_PRICE_PRO_CAD,
  };
  return envValue(byCurrency[currency] ?? byCurrency.usd);
}

/** Pro annual price ID. */
export function stripeProAnnualPriceId(currency: BillingCurrency = "usd"): string {
  const byCurrency: Record<BillingCurrency, string | undefined> = {
    usd: process.env.STRIPE_PRICE_PRO_ANNUAL,
    gbp: process.env.STRIPE_PRICE_PRO_GBP_ANNUAL,
    eur: process.env.STRIPE_PRICE_PRO_EUR_ANNUAL,
    aud: process.env.STRIPE_PRICE_PRO_AUD_ANNUAL,
    cad: process.env.STRIPE_PRICE_PRO_CAD_ANNUAL,
  };
  return envValue(byCurrency[currency] ?? byCurrency.usd);
}

/** Pro monthly product ID — accepts legacy STRIPE_PRODUCT_PRO. */
export function stripeProMonthlyProductId(): string {
  return envValue(
    process.env.STRIPE_PRODUCT_PRO_MONTHLY ?? process.env.STRIPE_PRODUCT_PRO,
  );
}

/** Pro annual product ID. */
export function stripeProAnnualProductId(): string {
  return envValue(process.env.STRIPE_PRODUCT_PRO_ANNUAL);
}

/** Lifetime one-time price ID. */
export function stripeLifetimePriceId(currency: BillingCurrency = "usd"): string {
  const byCurrency: Record<BillingCurrency, string | undefined> = {
    usd: process.env.STRIPE_PRICE_LIFETIME ?? process.env.STRIPE_PRICE_LIFETIME_USD,
    gbp: process.env.STRIPE_PRICE_LIFETIME_GBP,
    eur: process.env.STRIPE_PRICE_LIFETIME_EUR,
    aud: process.env.STRIPE_PRICE_LIFETIME_AUD,
    cad: process.env.STRIPE_PRICE_LIFETIME_CAD,
  };
  return envValue(byCurrency[currency] ?? byCurrency.usd);
}

/** Lifetime product ID. */
export function stripeLifetimeProductId(): string {
  return envValue(process.env.STRIPE_PRODUCT_LIFETIME);
}

export function stripePublishableKey(): string | undefined {
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() || undefined;
}

export function stripeWebhookUrl(appUrl: string): string {
  const base = appUrl.replace(/\/$/, "");
  return `${base}${STRIPE_WEBHOOK_PATH}`;
}
