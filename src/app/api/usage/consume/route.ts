import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/require-auth";
import {
  FREE_QUESTION_LIMIT,
  consumeAiEntitlement,
  entitlementDeniedResponse,
} from "@/lib/entitlements";

/**
 * Atomically consume one free-tier AI question.
 * Paid users are a no-op success. Free users past the cap get 402.
 */
export async function POST(request: Request) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    let reportedUsed: number | undefined;
    try {
      const body = (await request.json()) as { questionsUsed?: number };
      const n = Math.floor(Number(body.questionsUsed));
      if (Number.isFinite(n) && n >= 0) reportedUsed = n;
    } catch {
      // Empty body is fine — consume without a client floor.
    }

    const entitlement = await consumeAiEntitlement(auth.userId, reportedUsed);
    if (!entitlement.ok) return entitlementDeniedResponse(entitlement);

    return NextResponse.json({
      freeQuestionsUsed: entitlement.freeQuestionsUsed,
      limitReached:
        !entitlement.paid &&
        entitlement.freeQuestionsUsed >= FREE_QUESTION_LIMIT,
      paid: entitlement.paid,
      plan: entitlement.plan,
    });
  } catch (err) {
    console.error("[usage] consume error:", err);
    return NextResponse.json({ error: "Usage consume failed" }, { status: 500 });
  }
}
