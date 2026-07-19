import { NextResponse } from "next/server";
import { DEFAULT_PRODUCT, followUpSystemPrompt } from "@/lib/prompts";
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
      scope: `ai:followups:${auth.userId}`,
      limit: 30,
      windowMs: 60_000,
    });
    if (limited) return limited;

    const body = (await request.json()) as {
      transcript?: TranscriptLine[];
      product?: string;
    };

    const transcript = body.transcript ?? [];
    const product = body.product ?? DEFAULT_PRODUCT;
    const formatted = truncateTranscriptForPrompt(transcript);

    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: OPENAI_MODELS.chat,
      max_tokens: OPENAI_LIMITS.followUpMaxTokens,
      temperature: 0.5,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: followUpSystemPrompt(product) },
        {
          role: "user",
          content: `Conversation so far:\n${formatted || "(empty)"}\n\nReturn JSON: { "questions": ["q1", "q2", "q3"] }`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content?.trim();
    if (!raw) {
      return NextResponse.json({ error: "Empty model response" }, { status: 502 });
    }

    const parsed = JSON.parse(raw) as { questions?: string[] };
    const questions = (parsed.questions ?? []).filter(Boolean).slice(0, 3);

    return NextResponse.json({ questions });
  } catch (err) {
    const { message, status } = apiErrorResponse(err, "Follow-ups failed");
    return NextResponse.json({ error: message }, { status });
  }
}
