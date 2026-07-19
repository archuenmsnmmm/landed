import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import {
  isMissingBillingColumnError,
  persistBillingSync,
  syncUserBilling,
} from "@/lib/stripe-sync";
import { recordSubscriptionInvoicePayments } from "@/lib/payment-events";
import { requireAuthForUser } from "@/lib/require-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { userId?: string };
    const userId = body.userId?.trim();
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const auth = await requireAuthForUser(request, userId);
    if (auth instanceof NextResponse) return auth;

    const stripe = getStripe();
    const supabase = getSupabaseAdmin();
    if (!stripe || !supabase) {
      return NextResponse.json(
        { error: "Billing sync is not configured on the server" },
        { status: 503 },
      );
    }

    let billingResult;
    try {
      billingResult = await syncUserBilling(stripe, userId);
    } catch (err) {
      console.error("[stripe] sync profile load error:", err);
      return NextResponse.json({ error: "Could not load profile" }, { status: 500 });
    }

    const { synced, billingColumnsReady, profilePlan } = billingResult;

    if (!synced) {
      return NextResponse.json({ plan: profilePlan ?? "free", synced: false });
    }

    if (!billingColumnsReady) {
      return NextResponse.json({ plan: synced.plan, synced: false, persisted: false });
    }

    try {
      const { persisted } = await persistBillingSync(userId, synced);
      if (synced.subscriptionId) {
        await recordSubscriptionInvoicePayments(
          stripe,
          synced.subscriptionId,
          userId,
          synced.plan,
        );
      }
      if (!persisted) {
        return NextResponse.json({ plan: synced.plan, synced: false, persisted: false });
      }
    } catch (err) {
      if (isMissingBillingColumnError(err as { code?: string; message?: string })) {
        return NextResponse.json({ plan: synced.plan, synced: false, persisted: false });
      }
      console.error("[stripe] sync profile update error:", err);
      return NextResponse.json({ error: "Could not update profile" }, { status: 500 });
    }

    return NextResponse.json({ plan: synced.plan, synced: true });
  } catch (err) {
    console.error("[stripe] sync error:", err);
    return NextResponse.json({ error: "Billing sync failed" }, { status: 500 });
  }
}
