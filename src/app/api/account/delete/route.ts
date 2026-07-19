import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/require-auth";
import { getStripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

/**
 * Permanently delete the authenticated user's auth account and profile data.
 * Cancels an active Stripe subscription when one exists (best effort).
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
      .select("stripe_subscription_id")
      .eq("id", auth.userId)
      .maybeSingle();

    const subscriptionId = profile?.stripe_subscription_id?.trim() || null;
    if (subscriptionId) {
      const stripe = getStripe();
      if (stripe) {
        try {
          await stripe.subscriptions.cancel(subscriptionId);
        } catch (err) {
          // Subscription may already be canceled or missing — continue deleting.
          console.warn("[account/delete] stripe cancel skipped:", err);
        }
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
