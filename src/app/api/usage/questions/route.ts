import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/require-auth";
import { FREE_QUESTION_LIMIT } from "@/lib/entitlements";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const body = (await request.json()) as { questionsUsed?: number };
    const questionsUsed = Math.floor(Number(body.questionsUsed));
    if (!Number.isFinite(questionsUsed) || questionsUsed < 0) {
      return NextResponse.json({ error: "Invalid questionsUsed" }, { status: 400 });
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
      .select("free_questions_used, free_overlay_seconds_used")
      .eq("id", auth.userId)
      .maybeSingle();

    if (loadError || !profile) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const current = Math.max(0, profile.free_questions_used ?? 0);
    const next = Math.min(FREE_QUESTION_LIMIT, Math.max(current, questionsUsed));

    if (next === current) {
      return NextResponse.json({
        freeQuestionsUsed: current,
        limitReached: current >= FREE_QUESTION_LIMIT,
      });
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        free_questions_used: next,
        updated_at: new Date().toISOString(),
      })
      .eq("id", auth.userId);

    if (updateError) {
      console.error("[usage] questions sync failed:", updateError);
      return NextResponse.json({ error: "Could not sync usage" }, { status: 500 });
    }

    return NextResponse.json({
      freeQuestionsUsed: next,
      limitReached: next >= FREE_QUESTION_LIMIT,
    });
  } catch (err) {
    console.error("[usage] questions error:", err);
    return NextResponse.json({ error: "Usage sync failed" }, { status: 500 });
  }
}
