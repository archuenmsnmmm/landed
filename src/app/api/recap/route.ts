import { NextResponse } from "next/server";
import { recapSystemPrompt } from "@/lib/prompts";
import { verifyAuthenticatedRequest } from "@/lib/api-auth";
import { apiErrorResponse } from "@/lib/api-errors";
import {
  checkAiEntitlement,
  entitlementDeniedResponse,
} from "@/lib/entitlements";
import { rateLimit } from "@/lib/api-rate-limit";
import { getOpenAIClient } from "@/lib/openai";
import {
  OPENAI_LIMITS,
  OPENAI_MODELS,
  truncateTranscriptForPrompt,
} from "@/lib/openai-config";
import type { TranscriptLine } from "@/types/landed";

export async function POST(request: Request) {
  try {
    const auth = await verifyAuthenticatedRequest(request);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const entitlement = await checkAiEntitlement(auth.userId);
    if (!entitlement.ok) return entitlementDeniedResponse(entitlement);

    const limited = rateLimit(request, {
      scope: `ai:recap:${auth.userId}`,
      limit: 10,
      windowMs: 10 * 60_000,
    });
    if (limited) return limited;

    const body = (await request.json()) as { transcript?: TranscriptLine[] };
    const transcript = body.transcript ?? [];
    const formatted = truncateTranscriptForPrompt(transcript);

    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: OPENAI_MODELS.chat,
      max_tokens: OPENAI_LIMITS.recapMaxTokens,
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: recapSystemPrompt() },
        {
          role: "user",
          content: `Full call transcript:\n${formatted || "(empty)"}`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content?.trim();
    if (!raw) {
      return NextResponse.json({ error: "Empty model response" }, { status: 502 });
    }

    const parsed = JSON.parse(raw) as {
      bullets?: string[];
      email?: string;
      score?: number;
    };

    return NextResponse.json({
      bullets: (parsed.bullets ?? []).slice(0, 3),
      email: parsed.email ?? "",
      score: Math.max(0, Math.min(100, parsed.score ?? 0)),
    });
  } catch (err) {
    const { message, status } = apiErrorResponse(err, "Recap failed");
    return NextResponse.json({ error: message }, { status });
  }
}
