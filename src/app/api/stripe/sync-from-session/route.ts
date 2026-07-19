import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import {
  isMissingBillingColumnError,
  persistBillingSync,
  syncFromCheckoutSession,
} from "@/lib/stripe-sync";
import { recordSubscriptionInvoicePayments, recordCheckoutSessionPayment } from "@/lib/payment-events";
import { requireAuthForUser } from "@/lib/require-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: Request) {
  try {
    const sessionId = new URL(request.url).searchParams.get("session_id")?.trim();
    if (!sessionId?.startsWith("cs_")) {
      return NextResponse.json({ error: "session_id is required" }, { status: 400 });
    }

    const stripe = getStripe();
    const supabase = getSupabaseAdmin();
    if (!stripe || !supabase) {
      return NextResponse.json({ error: "Billing sync is not configured" }, { status: 503 });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const sessionUserId =
      session.metadata?.userId?.trim() ||
      session.client_reference_id?.trim() ||
      "";

    if (!sessionUserId) {
      return NextResponse.json({ error: "Checkout session has no user" }, { status: 400 });
    }

    const auth = await requireAuthForUser(request, sessionUserId);
    if (auth instanceof NextResponse) return auth;

    const synced = await syncFromCheckoutSession(stripe, sessionId);
    if (!synced) {
      return NextResponse.json({ synced: false });
    }

    if (synced.userId !== auth.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await recordCheckoutSessionPayment(session, "sync-from-session", undefined, stripe);

    if (synced.subscriptionId) {
      await recordSubscriptionInvoicePayments(
        stripe,
        synced.subscriptionId,
        synced.userId,
        synced.plan,
      );
    }

    try {
      const { persisted } = await persistBillingSync(synced.userId, synced);
      return NextResponse.json({
        synced: true,
        persisted,
        plan: synced.plan,
        userId: synced.userId,
      });
    } catch (err) {
      if (isMissingBillingColumnError(err as { code?: string; message?: string })) {
        return NextResponse.json({
          synced: true,
          persisted: false,
          plan: synced.plan,
          userId: synced.userId,
        });
      }
      console.error("[stripe] sync-from-session profile update error:", err);
      return NextResponse.json({ error: "Could not update profile" }, { status: 500 });
    }
  } catch (err) {
    console.error("[stripe] sync-from-session error:", err);
    return NextResponse.json({ error: "Billing sync failed" }, { status: 500 });
  }
}
