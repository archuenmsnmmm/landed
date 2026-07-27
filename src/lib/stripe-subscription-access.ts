import type Stripe from "stripe";

/**
 * Stripe statuses that still grant Pro plan limits.
 *
 * - `active` / `trialing`: normal paid access (includes cancel-at-period-end —
 *   Stripe keeps status `active` until `current_period_end`, then cancels).
 * - `past_due`: payment retry / dunning grace — keep Pro until Stripe ends the sub.
 */
const PAID_SUBSCRIPTION_STATUSES = new Set<Stripe.Subscription.Status>([
  "active",
  "trialing",
  "past_due",
]);

/**
 * Whether this subscription currently entitles the user to paid plan limits.
 * After the billing period ends (or Stripe fully cancels), returns false → free limits.
 */
export function subscriptionGrantsPaidAccess(
  sub: Pick<Stripe.Subscription, "status">,
): boolean {
  return PAID_SUBSCRIPTION_STATUSES.has(sub.status);
}

export function subscriptionCustomerId(
  sub: Pick<Stripe.Subscription, "customer">,
): string | null {
  return typeof sub.customer === "string"
    ? sub.customer
    : sub.customer?.id ?? null;
}
