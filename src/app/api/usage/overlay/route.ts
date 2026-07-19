import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/require-auth";
import { FREE_OVERLAY_LIMIT_SECONDS } from "@/lib/entitlements";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const body = (await request.json()) as { secondsUsed?: number };
    const secondsUsed = Math.floor(Number(body.secondsUsed));
    if (!Number.isFinite(secondsUsed) || secondsUsed < 0) {
      return NextResponse.json({ error: "Invalid secondsUsed" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json(
        { error: "Usage sync is not configured" },
        { status: 503 },
      );
    }

    const { data: profile, error: loadError } = await supabase
      .from("profiles")
      .select("free_overlay_seconds_used")
      .eq("id", auth.userId)
      .maybeSingle();

    if (loadError || !profile) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const current = Math.max(0, profile.free_overlay_seconds_used ?? 0);
    const next = Math.min(
      FREE_OVERLAY_LIMIT_SECONDS,
      Math.max(current, secondsUsed),
    );

    if (next === current) {
      return NextResponse.json({
        freeOverlaySecondsUsed: current,
        limitReached: current >= FREE_OVERLAY_LIMIT_SECONDS,
      });
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        free_overlay_seconds_used: next,
        updated_at: new Date().toISOString(),
      })
      .eq("id", auth.userId);

    if (updateError) {
      console.error("[usage] overlay sync failed:", updateError);
      return NextResponse.json({ error: "Could not sync usage" }, { status: 500 });
    }

    return NextResponse.json({
      freeOverlaySecondsUsed: next,
      limitReached: next >= FREE_OVERLAY_LIMIT_SECONDS,
    });
  } catch (err) {
    console.error("[usage] overlay error:", err);
    return NextResponse.json({ error: "Usage sync failed" }, { status: 500 });
  }
}
