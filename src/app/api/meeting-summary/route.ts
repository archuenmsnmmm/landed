import { NextResponse } from "next/server";
import { verifyAuthenticatedRequest } from "@/lib/api-auth";
import { apiErrorResponse } from "@/lib/api-errors";
import { rateLimit } from "@/lib/api-rate-limit";
import {
  checkAiEntitlement,
  entitlementDeniedResponse,
} from "@/lib/entitlements";
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
      scope: `ai:summary:${auth.userId}`,
      limit: 10,
      windowMs: 10 * 60_000,
    });
    if (limited) return limited;

    const body = (await request.json()) as {
      transcript?: TranscriptLine[];
      systemPrompt?: string;
      outputLanguage?: string;
    };

    const transcript = body.transcript ?? [];
    const fullTranscript = truncateTranscriptForPrompt(transcript);
    const system =
      body.systemPrompt?.trim() ||
      "You are Landed, an AI screen assistant. Produce a clean, structured session summary.";

    const langHint =
      body.outputLanguage && body.outputLanguage !== "English"
        ? `- Write all text in ${body.outputLanguage}`
        : "";

    const userPrompt = `Analyze this Landed session and return a structured summary.

Return ONLY valid JSON with this exact shape:
{
  "title": "Short descriptive session title",
  "company": "Topic or context if mentioned, otherwise 'Landed Session'",
  "sections": [
    { "heading": "What worked", "items": ["specific point 1", "specific point 2"] },
    { "heading": "Gaps", "items": ["specific gap 1", "specific gap 2"] },
    { "heading": "Key Moments", "items": ["moment 1", "moment 2"] }
  ],
  "nextSteps": ["follow-up action 1", "follow-up action 2"],
  "objections": ["open questions or blockers that came up"],
  "dealScore": 75
}

Rules:
- Use 2-4 sections with clear headings
- Each section has 2-6 concise bullet items
- Be specific to what was actually discussed
- nextSteps: 2-4 concrete follow-up actions
- objections: open questions or blockers (empty array if none)
- dealScore: 0-100 usefulness score
${langHint}

Transcript:
${fullTranscript || "(empty)"}`;

    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: OPENAI_MODELS.summary,
      messages: [
        { role: "system", content: system },
        { role: "user", content: userPrompt },
      ],
      max_tokens: OPENAI_LIMITS.summaryMaxTokens,
      temperature: 0.35,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content?.trim();
    if (!raw) {
      return NextResponse.json({ error: "Empty model response" }, { status: 502 });
    }

    return NextResponse.json(JSON.parse(raw));
  } catch (err) {
    const { message, status } = apiErrorResponse(err, "Summary failed");
    return NextResponse.json({ error: message }, { status });
  }
}
