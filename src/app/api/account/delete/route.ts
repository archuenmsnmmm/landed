import { NextResponse } from "next/server";
import { cancelUserStripeSubscriptions } from "@/lib/cancel-user-subscriptions";
import { requireAuth } from "@/lib/require-auth";
import { getStripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

/**
 * Permanently delete the authenticated user's auth account and profile data.
 * Cancels active Stripe subscriptions before deletion.
 */
export async function POST(request: Request) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json(
        { error: "Account deletion is not configured" },
        { status: 503 },
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id, stripe_subscription_id")
      .eq("id", auth.userId)
      .maybeSingle();

    const subscriptionId = profile?.stripe_subscription_id?.trim() || null;
    const customerId = profile?.stripe_customer_id?.trim() || null;

    if (subscriptionId || customerId) {
      const stripe = getStripe();
      if (!stripe) {
        return NextResponse.json(
          {
            error:
              "Could not cancel billing before deletion. Contact support to delete your account.",
          },
          { status: 503 },
        );
      }

      const cancelResult = await cancelUserStripeSubscriptions(stripe, {
        subscriptionId,
        customerId,
      });
      if (!cancelResult.ok) {
        console.error("[account/delete] stripe cancel failed:", cancelResult.failedIds);
        return NextResponse.json({ error: cancelResult.error }, { status: 502 });
      }
    }

    const { error } = await supabase.auth.admin.deleteUser(auth.userId);
    if (error) {
      console.error("[account/delete] deleteUser failed:", error);
      return NextResponse.json(
        { error: error.message || "Could not delete account" },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[account/delete] error:", err);
    return NextResponse.json(
      { error: "Could not delete account" },
      { status: 500 },
    );
  }
}
