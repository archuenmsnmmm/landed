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

/**
 * Active Stripe catalog — acct_1SvMzXGW6jtTa1tM (live, GBP).
 * Env vars override these when set; keep in sync with Vercel production.
 */
export const ACTIVE_STRIPE_CATALOG = {
  proMonthly: {
    productId: "prod_UwKUNAdYW4QkVA",
    priceId: "price_1TwRpkGW6jtTa1tMJOOHyOOP",
  },
  proAnnual: {
    productId: "prod_UwKUi76jvFtTQC",
    priceId: "price_1TwRphGW6jtTa1tMwcKkhXF4",
  },
  lifetime: {
    productId: "prod_UwKUADKBFnlld9",
    priceId: "price_1TwRplGW6jtTa1tMcHCivTEd",
  },
} as const;

/**
 * Archived Stripe Price IDs — no longer used for new checkout, but still
 * recognized so existing subscribers keep their plan on sync/webhooks.
 * Do not delete; add superseded IDs here when rotating the catalog.
 */
export const ARCHIVED_STRIPE_PRO_MONTHLY_PRICE_IDS = [
  "price_1Tv1uu2n3eKD6EW3WcSVIO6C",
] as const;

export const ARCHIVED_STRIPE_PRO_ANNUAL_PRICE_IDS = [
  "price_1Tv1vr2n3eKD6EW3rIWF1b9E",
] as const;

export const ARCHIVED_STRIPE_LIFETIME_PRICE_IDS = [
  "price_1Tv1yL2n3eKD6EW3QOq5p7nq",
] as const;

/** Archived product IDs (reference only — plan resolution uses price IDs). */
export const ARCHIVED_STRIPE_PRODUCTS = {
  proMonthly: "prod_UwKUNAdYW4QkVA",
  proAnnual: "prod_UwKUi76jvFtTQC",
  lifetime: "prod_UwKUADKBFnlld9",
  legacyProMonthly: "prod_UjdHAQ1ehL5fAk",
  legacyProAnnual: "prod_UjdKZ8yrbp1oFR",
  legacyLifetime: "prod_UtkEgarUGc5ki8",
} as const;

function envValue(value: string | undefined): string {
  return value?.trim() || "";
}

function envOrDefault(
  envValues: Array<string | undefined>,
  fallback: string,
): string {
  for (const value of envValues) {
    const trimmed = envValue(value);
    if (trimmed) return trimmed;
  }
  return fallback;
}

/** Pro monthly — GBP Stripe Price (legacy STRIPE_PRICE_PRO_MONTHLY / STRIPE_PRICE_PRO_GBP accepted). */
export function stripeProMonthlyPriceId(): string {
  return envOrDefault(
    [
      process.env.STRIPE_PRICE_PRO_GBP,
      process.env.STRIPE_PRICE_PRO,
      process.env.STRIPE_PRICE_PRO_MONTHLY,
    ],
    ACTIVE_STRIPE_CATALOG.proMonthly.priceId,
  );
}

/** Pro annual — GBP Stripe Price. */
export function stripeProAnnualPriceId(): string {
  return envOrDefault(
    [process.env.STRIPE_PRICE_PRO_GBP_ANNUAL, process.env.STRIPE_PRICE_PRO_ANNUAL],
    ACTIVE_STRIPE_CATALOG.proAnnual.priceId,
  );
}

/** Pro monthly product ID — accepts legacy STRIPE_PRODUCT_PRO. */
export function stripeProMonthlyProductId(): string {
  return envOrDefault(
    [process.env.STRIPE_PRODUCT_PRO_MONTHLY, process.env.STRIPE_PRODUCT_PRO],
    ACTIVE_STRIPE_CATALOG.proMonthly.productId,
  );
}

/** Pro annual product ID. */
export function stripeProAnnualProductId(): string {
  return envOrDefault(
    [process.env.STRIPE_PRODUCT_PRO_ANNUAL],
    ACTIVE_STRIPE_CATALOG.proAnnual.productId,
  );
}

/** Lifetime one-time — GBP Stripe Price. */
export function stripeLifetimePriceId(): string {
  return envOrDefault(
    [process.env.STRIPE_PRICE_LIFETIME_GBP, process.env.STRIPE_PRICE_LIFETIME],
    ACTIVE_STRIPE_CATALOG.lifetime.priceId,
  );
}

/** Lifetime product ID. */
export function stripeLifetimeProductId(): string {
  return envOrDefault(
    [process.env.STRIPE_PRODUCT_LIFETIME],
    ACTIVE_STRIPE_CATALOG.lifetime.productId,
  );
}

export function stripePublishableKey(): string | undefined {
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() || undefined;
}

export function stripeWebhookUrl(appUrl: string): string {
  const base = appUrl.replace(/\/$/, "");
  return `${base}${STRIPE_WEBHOOK_PATH}`;
}
