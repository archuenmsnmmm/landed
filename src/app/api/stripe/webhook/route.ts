import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { subscriptionIdFromInvoice } from "@/lib/stripe-invoice";
import { planFromStripePriceId } from "@/lib/stripe-plans";
import {
  subscriptionCustomerId,
  subscriptionGrantsPaidAccess,
} from "@/lib/stripe-subscription-access";
import {
  recordCheckoutSessionPayment,
  recordInvoicePayment,
  recordPaymentEvent,
} from "@/lib/payment-events";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

async function getProfilePlan(userId: string): Promise<string | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;
  const { data } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", userId)
    .maybeSingle();
  return data?.plan ?? null;
}

/**
 * Persist plan + Stripe ids.
 * Always keep `stripe_customer_id` when known so canceled users can still open the portal.
 * Clear `stripe_subscription_id` when the sub no longer grants paid access → free limits.
 */
async function setUserPlan(
  userId: string,
  plan: string,
  stripeCustomerId?: string | null,
  stripeSubscriptionId?: string | null,
) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    console.error("[stripe] Supabase admin not configured");
    return;
  }

  const patch: {
    plan: string;
    stripe_subscription_id: string | null;
    updated_at: string;
    stripe_customer_id?: string | null;
  } = {
    plan,
    stripe_subscription_id: stripeSubscriptionId ?? null,
    updated_at: new Date().toISOString(),
  };

  // Only write customer id when we have one — never wipe it on downgrade.
  if (stripeCustomerId) {
    patch.stripe_customer_id = stripeCustomerId;
  }

  const { error } = await supabase.from("profiles").update(patch).eq("id", userId);

  if (error) console.error("[stripe] profile update failed:", error);
}

function userIdFromMeta(meta: Stripe.Metadata | null | undefined): string | null {
  const id = meta?.userId?.trim();
  return id || null;
}

async function userIdFromCustomerId(
  customerId: string | null,
): Promise<string | null> {
  if (!customerId) return null;
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  return data?.id ?? null;
}

async function resolveSubscriptionUserId(
  sub: Stripe.Subscription,
): Promise<string | null> {
  return (
    userIdFromMeta(sub.metadata) ??
    (await userIdFromCustomerId(subscriptionCustomerId(sub)))
  );
}

/**
 * Sync profile from Stripe subscription state.
 *
 * Cancel-at-period-end: status stays `active` until period end → keep Pro.
 * After period end / hard cancel: status no longer grants access → free limits.
 */
async function syncSubscriptionPlan(_stripe: Stripe, sub: Stripe.Subscription) {
  const userId = await resolveSubscriptionUserId(sub);
  if (!userId) {
    console.warn(
      "[stripe] subscription sync skipped — no userId metadata or customer match",
      sub.id,
    );
    return;
  }

  const customerId = subscriptionCustomerId(sub);

  if (subscriptionGrantsPaidAccess(sub)) {
    const priceId = sub.items.data[0]?.price?.id ?? "";
    const plan = planFromStripePriceId(priceId);
    await setUserPlan(
      userId,
      plan === "free" ? sub.metadata?.plan ?? "pro" : plan,
      customerId,
      sub.id,
    );
    return;
  }

  // Lifetime is a one-time purchase — never wipe it when a subscription ends.
  const existing = await getProfilePlan(userId);
  if (existing === "lifetime") {
    await setUserPlan(userId, "lifetime", customerId, null);
    return;
  }

  // Billing period over / canceled / unpaid → free plan limits.
  await setUserPlan(userId, "free", customerId, null);
}

export async function POST(request: Request) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: "Stripe webhook not configured" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const body = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("[stripe] webhook signature error:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId =
          userIdFromMeta(session.metadata) ?? session.client_reference_id ?? null;
        const plan =
          session.metadata?.plan === "lifetime"
            ? "lifetime"
            : session.metadata?.plan ?? "pro";
        await recordCheckoutSessionPayment(session, event.type, event.id, stripe);
        if (userId) {
          const customerId =
            typeof session.customer === "string"
              ? session.customer
              : session.customer?.id;
          const subscriptionId =
            typeof session.subscription === "string"
              ? session.subscription
              : session.subscription?.id;

          if (plan === "lifetime") {
            await setUserPlan(userId, "lifetime", customerId, null);
          } else {
            await setUserPlan(userId, plan, customerId, subscriptionId);
          }
        }
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await syncSubscriptionPlan(stripe, sub);
        break;
      }
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = subscriptionIdFromInvoice(invoice);
        if (!subscriptionId) break;
        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        const userId = await resolveSubscriptionUserId(sub);
        const planMeta = sub.metadata?.plan ?? "pro";
        await recordInvoicePayment(invoice, event.type, event.id, userId, planMeta);
        await syncSubscriptionPlan(stripe, sub);
        break;
      }
      case "charge.succeeded": {
        const charge = event.data.object as Stripe.Charge;
        const amountCents = Math.max(charge.amount - (charge.amount_refunded ?? 0), 0);
        if (amountCents <= 0) break;
        await recordPaymentEvent({
          idempotencyKey: `charge:${charge.id}`,
          userId: charge.metadata?.userId ?? null,
          plan: charge.metadata?.plan ?? null,
          amountCents,
          currency: charge.currency ?? "gbp",
          paidAt: new Date(charge.created * 1000),
          source: event.type,
          stripeEventId: event.id,
          stripeChargeId: charge.id,
        });
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = subscriptionIdFromInvoice(invoice);
        if (!subscriptionId) break;
        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        // Keep Pro during past_due / active / trialing. Only drop to free when
        // Stripe has fully ended entitlement (canceled, unpaid, etc.).
        if (!subscriptionGrantsPaidAccess(sub)) {
          await syncSubscriptionPlan(stripe, sub);
        }
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error("[stripe] webhook handler error:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
