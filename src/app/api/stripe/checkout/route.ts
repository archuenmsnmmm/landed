import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { resolveBillingOrigin } from "@/lib/billing-api-base";
import { normalizeBillingReturnUrl } from "@/lib/billing-return-urls";
import { currencyFromRequestHeaders } from "@/lib/detect-region";
import { requireAuth } from "@/lib/require-auth";
import { isBillingCurrency, REGIONAL_PRICING_ENABLED } from "@/lib/regional-pricing";
import {
  stripePriceIdForPlan,
  type StripeBillingInterval,
  type StripePlanId,
} from "@/lib/stripe-plans";

const PAID_PLANS = new Set<StripePlanId>(["pro", "lifetime"]);

export async function POST(request: Request) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const body = (await request.json()) as {
      plan?: string;
      interval?: string;
      currency?: string;
      userId?: string;
      email?: string;
      successUrl?: string;
      cancelUrl?: string;
    };

    const plan = body.plan as StripePlanId | undefined;
    if (!plan || !PAID_PLANS.has(plan)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const isLifetime = plan === "lifetime";
    const interval: StripeBillingInterval = isLifetime
      ? "lifetime"
      : body.interval === "annual"
        ? "annual"
        : "monthly";
    const requestedCurrency = body.currency?.trim().toLowerCase();
    const currency = !REGIONAL_PRICING_ENABLED
      ? "usd"
      : requestedCurrency && isBillingCurrency(requestedCurrency)
        ? requestedCurrency
        : currencyFromRequestHeaders(request.headers);

    const userId = body.userId?.trim() || auth.userId;
    if (userId !== auth.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const stripe = getStripe();
    const priceId = stripePriceIdForPlan(plan, interval, currency);
    if (!stripe || !priceId) {
      return NextResponse.json(
        { error: "Stripe is not configured on the server" },
        { status: 503 },
      );
    }

    const origin = resolveBillingOrigin(request);
    const email = body.email?.trim() || auth.email || undefined;
    const metadata = {
      userId,
      plan,
      interval,
      currency,
    };

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: isLifetime ? "payment" : "subscription",
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: normalizeBillingReturnUrl(body.successUrl, origin, {
        plan,
        to: "dashboard",
      }),
      cancel_url: body.cancelUrl?.trim() || `${origin}/billing/cancel`,
      client_reference_id: userId,
      metadata,
    };

    if (isLifetime) {
      // Payment-mode checkouts omit a customer by default; we need one so
      // sync-from-session / portal can persist Lifetime on the profile.
      sessionParams.customer_creation = "always";
    } else {
      sessionParams.subscription_data = { metadata };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    if (!session.url) {
      return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[stripe] checkout error:", err);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
