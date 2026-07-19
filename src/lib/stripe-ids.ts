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

/** Pro monthly — GBP Stripe Price (legacy STRIPE_PRICE_PRO_MONTHLY / STRIPE_PRICE_PRO_GBP accepted). */
export function stripeProMonthlyPriceId(): string {
  return envValue(
    process.env.STRIPE_PRICE_PRO_GBP ||
      process.env.STRIPE_PRICE_PRO ||
      process.env.STRIPE_PRICE_PRO_MONTHLY,
  );
}

/** Pro annual — GBP Stripe Price. */
export function stripeProAnnualPriceId(): string {
  return envValue(
    process.env.STRIPE_PRICE_PRO_GBP_ANNUAL || process.env.STRIPE_PRICE_PRO_ANNUAL,
  );
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

/** Lifetime one-time — GBP Stripe Price. */
export function stripeLifetimePriceId(): string {
  return envValue(
    process.env.STRIPE_PRICE_LIFETIME_GBP || process.env.STRIPE_PRICE_LIFETIME,
  );
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
