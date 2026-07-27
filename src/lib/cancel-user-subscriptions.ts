import type Stripe from "stripe";
import { subscriptionGrantsPaidAccess } from "@/lib/stripe-subscription-access";

export type CancelUserSubscriptionsResult =
  | { ok: true; canceledIds: string[] }
  | { ok: false; error: string; failedIds: string[] };

async function entitledSubscriptionIds(
  stripe: Stripe,
  customerId: string,
): Promise<string[]> {
  const subs = await stripe.subscriptions.list({
    customer: customerId,
    status: "all",
    limit: 20,
  });
  return subs.data.filter((sub) => subscriptionGrantsPaidAccess(sub)).map((sub) => sub.id);
}

/**
 * Cancel every subscription that still grants paid access for this user.
 * Uses both the stored subscription id and a live Stripe customer lookup so
 * stale profile data cannot leave a billing subscription running after deletion.
 */
export async function cancelUserStripeSubscriptions(
  stripe: Stripe,
  opts: {
    subscriptionId?: string | null;
    customerId?: string | null;
  },
): Promise<CancelUserSubscriptionsResult> {
  const idsToCancel = new Set<string>();

  const subscriptionId = opts.subscriptionId?.trim();
  if (subscriptionId) idsToCancel.add(subscriptionId);

  const customerId = opts.customerId?.trim();
  if (customerId) {
    for (const id of await entitledSubscriptionIds(stripe, customerId)) {
      idsToCancel.add(id);
    }
  }

  const canceledIds: string[] = [];
  const failedIds: string[] = [];

  for (const id of idsToCancel) {
    try {
      const sub = await stripe.subscriptions.cancel(id);
      canceledIds.push(sub.id);
      continue;
    } catch (err) {
      console.warn("[cancel-user-subscriptions] cancel failed:", id, err);
    }

    try {
      const sub = await stripe.subscriptions.retrieve(id);
      if (subscriptionGrantsPaidAccess(sub)) {
        failedIds.push(id);
      } else {
        canceledIds.push(id);
      }
    } catch {
      // Subscription is missing or already fully canceled.
      canceledIds.push(id);
    }
  }

  if (customerId) {
    const remaining = await entitledSubscriptionIds(stripe, customerId);
    if (remaining.length > 0) {
      return {
        ok: false,
        error:
          "Could not cancel your active subscription. Try again or contact support.",
        failedIds: [...new Set([...failedIds, ...remaining])],
      };
    }
  }

  if (failedIds.length > 0) {
    return {
      ok: false,
      error:
        "Could not cancel your active subscription. Try again or contact support.",
      failedIds,
    };
  }

  return { ok: true, canceledIds };
}
