import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

/** Free tier hard cap on AI questions / responses. */
export const FREE_QUESTION_LIMIT = 15;

/** Legacy overlay-minute cap — used only to migrate exhausted free trials. */
export const FREE_OVERLAY_LIMIT_SECONDS = 10 * 60;

export type EntitlementProfile = {
  plan: string | null;
  stripe_subscription_id: string | null;
  free_overlay_seconds_used: number | null;
  free_questions_used: number | null;
};

export type EntitlementResult =
  | {
      ok: true;
      plan: string;
      paid: boolean;
      freeQuestionsUsed: number;
      freeOverlaySecondsUsed: number;
    }
  | { ok: false; status: number; error: string };

function isLifetimePlan(plan: string | null | undefined): boolean {
  return plan === "lifetime";
}

/** Paid plan from an active Stripe subscription, or a completed lifetime purchase. */
export function resolveEffectivePlan(profile: {
  plan?: string | null;
  stripe_subscription_id?: string | null;
}): string {
  const plan = profile.plan ?? "free";
  if (isLifetimePlan(plan)) return "lifetime";
  if (plan !== "free" && !profile.stripe_subscription_id) return "free";
  return plan;
}

export function resolveFreeQuestionsUsed(
  freeQuestionsUsed: number | null | undefined,
  freeOverlaySecondsUsed: number | null | undefined,
): number {
  const questions = Math.max(0, freeQuestionsUsed ?? 0);
  if (questions > 0) {
    return Math.min(FREE_QUESTION_LIMIT, questions);
  }
  if ((freeOverlaySecondsUsed ?? 0) >= FREE_OVERLAY_LIMIT_SECONDS) {
    return FREE_QUESTION_LIMIT;
  }
  return 0;
}

export async function loadEntitlementProfile(
  userId: string,
): Promise<EntitlementProfile | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "plan, stripe_subscription_id, free_overlay_seconds_used, free_questions_used",
    )
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return data as EntitlementProfile;
}

export function isPaidEntitlement(profile: EntitlementProfile): boolean {
  const plan = resolveEffectivePlan(profile);
  if (isLifetimePlan(plan)) return true;
  return Boolean(profile.stripe_subscription_id) && plan !== "free";
}

async function ensureEntitlementProfile(
  userId: string,
): Promise<EntitlementProfile | null> {
  const existing = await loadEntitlementProfile(userId);
  if (existing) return existing;

  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  // Signup trigger normally creates this row; recover if it was skipped.
  const { data: authData } = await supabase.auth.admin.getUserById(userId);
  const email = authData.user?.email?.trim() || `${userId}@users.local`;
  const name =
    (authData.user?.user_metadata?.full_name as string | undefined)?.trim() ||
    email.split("@")[0] ||
    "User";

  await supabase.from("profiles").upsert(
    {
      id: userId,
      email,
      name,
      plan: "free",
      free_questions_used: 0,
      free_overlay_seconds_used: 0,
    },
    { onConflict: "id", ignoreDuplicates: true },
  );

  return loadEntitlementProfile(userId);
}

export async function checkAiEntitlement(userId: string): Promise<EntitlementResult> {
  const profile = await ensureEntitlementProfile(userId);
  if (!profile) {
    return {
      ok: false,
      status: 503,
      error: "Billing database is not configured",
    };
  }

  const plan = resolveEffectivePlan(profile);
  const paid = isPaidEntitlement(profile);
  const freeOverlaySecondsUsed = Math.max(
    0,
    profile.free_overlay_seconds_used ?? 0,
  );
  const freeQuestionsUsed = resolveFreeQuestionsUsed(
    profile.free_questions_used,
    freeOverlaySecondsUsed,
  );

  if (paid) {
    return {
      ok: true,
      plan,
      paid: true,
      freeQuestionsUsed,
      freeOverlaySecondsUsed,
    };
  }

  if (freeQuestionsUsed < FREE_QUESTION_LIMIT) {
    return {
      ok: true,
      plan,
      paid: false,
      freeQuestionsUsed,
      freeOverlaySecondsUsed,
    };
  }

  return {
    ok: false,
    status: 402,
    error: "Free question limit reached. Upgrade to continue.",
  };
}

/**
 * Atomically consume one free AI question (no-op for paid).
 * Rejects with 402 when the hard free-tier cap is already reached.
 *
 * Optional `reportedUsed` raises the server counter to max(server, reported)
 * before consuming, so offline local usage cannot under-report forever.
 */
export async function consumeAiEntitlement(
  userId: string,
  reportedUsed?: number,
): Promise<EntitlementResult> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    console.error("[entitlements] getSupabaseAdmin() returned null", {
      hasUrl: Boolean(
        process.env.SUPABASE_URL?.trim() ||
          process.env.NEXT_PUBLIC_SUPABASE_URL?.trim(),
      ),
      hasServiceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()),
    });
    return {
      ok: false,
      status: 503,
      error: "Billing database is not configured",
    };
  }

  if (
    typeof reportedUsed === "number" &&
    Number.isFinite(reportedUsed) &&
    reportedUsed > 0
  ) {
    const floor = Math.min(
      FREE_QUESTION_LIMIT,
      Math.max(0, Math.floor(reportedUsed)),
    );
    const profile = await loadEntitlementProfile(userId);
    if (profile) {
      const current = resolveFreeQuestionsUsed(
        profile.free_questions_used,
        profile.free_overlay_seconds_used,
      );
      if (floor > current) {
        await supabase
          .from("profiles")
          .update({
            free_questions_used: floor,
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);
      }
    }
  }

  // Prefer DB RPC when available (row lock + single round-trip).
  const rpc = await supabase.rpc("consume_free_question", {
    p_user_id: userId,
  });
  if (!rpc.error && rpc.data && Array.isArray(rpc.data) && rpc.data[0]) {
    const row = rpc.data[0] as {
      ok: boolean;
      free_questions_used: number;
      paid: boolean;
      plan: string;
    };
    if (!row.ok) {
      return {
        ok: false,
        status: 402,
        error: "Free question limit reached. Upgrade to continue.",
      };
    }
    return {
      ok: true,
      plan: row.plan || "free",
      paid: Boolean(row.paid),
      freeQuestionsUsed: Math.min(
        FREE_QUESTION_LIMIT,
        Math.max(0, row.free_questions_used ?? 0),
      ),
      freeOverlaySecondsUsed: 0,
    };
  }

  const checked = await checkAiEntitlement(userId);
  if (!checked.ok) return checked;
  if (checked.paid) return checked;

  const nextUsed = checked.freeQuestionsUsed + 1;
  const { data, error } = await supabase
    .from("profiles")
    .update({
      free_questions_used: nextUsed,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .lt("free_questions_used", FREE_QUESTION_LIMIT)
    .select(
      "plan, stripe_subscription_id, free_overlay_seconds_used, free_questions_used",
    )
    .maybeSingle();

  if (error) {
    console.error("[entitlements] consume failed:", error);
    return { ok: false, status: 500, error: "Could not update usage" };
  }

  if (!data) {
    // Lost a race or already at the hard cap.
    return {
      ok: false,
      status: 402,
      error: "Free question limit reached. Upgrade to continue.",
    };
  }

  const freeOverlaySecondsUsed = Math.max(
    0,
    data.free_overlay_seconds_used ?? 0,
  );
  return {
    ok: true,
    plan: resolveEffectivePlan(data),
    paid: false,
    freeQuestionsUsed: resolveFreeQuestionsUsed(
      data.free_questions_used,
      freeOverlaySecondsUsed,
    ),
    freeOverlaySecondsUsed,
  };
}

export function entitlementDeniedResponse(
  result: Extract<EntitlementResult, { ok: false }>,
): NextResponse {
  return NextResponse.json({ error: result.error }, { status: result.status });
}
