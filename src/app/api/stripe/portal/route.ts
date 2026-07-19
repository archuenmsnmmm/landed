import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { resolveBillingOrigin } from "@/lib/billing-api-base";
import { normalizeBillingReturnUrl } from "@/lib/billing-return-urls";
import { requireAuthForUser } from "@/lib/require-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      userId?: string;
      returnUrl?: string;
    };

    if (!body.userId?.trim()) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const auth = await requireAuthForUser(request, body.userId);
    if (auth instanceof NextResponse) return auth;

    const stripe = getStripe();
    const supabase = getSupabaseAdmin();
    if (!stripe || !supabase) {
      return NextResponse.json(
        { error: "Billing portal is not configured" },
        { status: 503 },
      );
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", body.userId)
      .maybeSingle();

    const customerId = error ? null : profile?.stripe_customer_id?.trim() || null;
    if (!customerId) {
      return NextResponse.json(
        { error: "No active subscription found for this account" },
        { status: 404 },
      );
    }

    const origin = resolveBillingOrigin(request);

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: normalizeBillingReturnUrl(body.returnUrl, origin, { to: "billing" }),
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[stripe] portal error:", err);
    return NextResponse.json({ error: "Portal failed" }, { status: 500 });
  }
}
