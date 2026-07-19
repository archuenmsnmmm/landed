import { verifyAuthenticatedRequest } from "@/lib/api-auth";
import { apiErrorResponse } from "@/lib/api-errors";
import { rateLimit } from "@/lib/api-rate-limit";
import {
  checkAiEntitlement,
  entitlementDeniedResponse,
} from "@/lib/entitlements";
import { getOpenAIClient } from "@/lib/openai";
import { OPENAI_LIMITS, OPENAI_MODELS } from "@/lib/openai-config";

export async function POST(request: Request) {
  try {
    const auth = await verifyAuthenticatedRequest(request);
    if (!auth.ok) {
      return new Response(JSON.stringify({ error: auth.error }), {
        status: auth.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const entitlement = await checkAiEntitlement(auth.userId);
    if (!entitlement.ok) {
      return new Response(JSON.stringify({ error: entitlement.error }), {
        status: entitlement.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const limited = rateLimit(request, {
      scope: `ai:suggest-stream:${auth.userId}`,
      limit: 60,
      windowMs: 60_000,
    });
    if (limited) return limited;

    const body = (await request.json()) as {
      system?: string;
      prompt?: string;
      maxTokens?: number;
      temperature?: number;
      ragBlock?: string;
      priorCallContext?: string;
      utteranceClass?: string;
    };

    const prompt = body.prompt?.trim();
    if (!prompt) {
      return new Response(JSON.stringify({ error: "prompt is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const system =
      body.system?.trim() ||
      "You are Landed, an AI assistant that can see the user's screen. Be concise and practical. Answer using screen context when provided. No preamble.";

    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: OPENAI_MODELS.chat,
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
      max_tokens: body.maxTokens ?? OPENAI_LIMITS.suggestStreamMaxTokens,
      temperature: body.temperature ?? 0.35,
      stream: true,
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of completion) {
            const text = chunk.choices[0]?.delta?.content;
            if (text) controller.enqueue(encoder.encode(text));
          }
        } catch (err) {
          console.error("[suggest-stream] error:", err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const { message, status } = apiErrorResponse(err, "Suggest stream failed");
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }
}
