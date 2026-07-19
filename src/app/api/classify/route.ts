import { NextResponse } from "next/server";
import { verifyAuthenticatedRequest } from "@/lib/api-auth";
import { apiErrorResponse } from "@/lib/api-errors";
import { rateLimit } from "@/lib/api-rate-limit";
import {
  classifyUtterance,
  computeRepTalkRatio,
  heuristicClassify,
} from "@/lib/utterance-classifier";
import { formatRecentTranscript } from "@/lib/openai-config";
import type { TranscriptLine } from "@/types/landed";

export async function POST(request: Request) {
  try {
    const auth = await verifyAuthenticatedRequest(request);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const limited = rateLimit(request, {
      scope: `ai:classify:${auth.userId}`,
      limit: 120,
      windowMs: 60_000,
    });
    if (limited) return limited;

    const body = (await request.json()) as {
      text?: string;
      transcript?: TranscriptLine[];
      speaker?: string;
      micOnly?: boolean;
    };

    const text = body.text?.trim();
    if (!text) {
      return NextResponse.json({ error: "text is required" }, { status: 400 });
    }

    const transcript = body.transcript ?? [];
    const micOnly = Boolean(body.micOnly);
    const repTalkRatio = computeRepTalkRatio(transcript);
    const recentContext = formatRecentTranscript(transcript);

    const heuristic = heuristicClassify(text, {
      speaker: body.speaker,
      repTalkRatio,
      micOnly,
    });
    if (heuristic && heuristic.confidence >= 0.85) {
      return NextResponse.json(heuristic);
    }

    const result = await classifyUtterance(text, recentContext, {
      speaker: body.speaker,
      repTalkRatio,
      micOnly,
    });

    // Mic-only: prospect speech is labeled "You" — prefer coaching over silence.
    if (!result.trigger && micOnly && text.length >= 12) {
      return NextResponse.json({
        class: result.class === "rep_monologue" ? "general" : result.class,
        confidence: Math.max(result.confidence, 0.55),
        trigger: true,
      } satisfies typeof result);
    }

    return NextResponse.json(result);
  } catch (err) {
    const { message, status } = apiErrorResponse(err, "Classify failed");
    return NextResponse.json({ error: message }, { status });
  }
}
