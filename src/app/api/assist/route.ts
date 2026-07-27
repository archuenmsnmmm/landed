import { NextResponse } from "next/server";
import { verifyAuthenticatedRequest } from "@/lib/api-auth";
import { apiErrorResponse } from "@/lib/api-errors";
import { AI_ASSIST_BURST_PER_MINUTE, API_RATE_LIMIT_WINDOW_MS } from "@/lib/ai-limits";
import { recordAiUsage } from "@/lib/ai-usage";
import { rateLimit } from "@/lib/api-rate-limit";
import { codingSystemPrompt } from "@/lib/coding-answer";
import {
  consumeAiEntitlement,
  entitlementDeniedResponse,
} from "@/lib/entitlements";
import { getOpenAIClient } from "@/lib/openai";
import { OPENAI_LIMITS, OPENAI_MODELS } from "@/lib/openai-config";
import type {
  ChatCompletionContentPart,
  ChatCompletionMessageParam,
} from "openai/resources/chat/completions";

type AssistMode = "text" | "vision" | "coding";
type ImageDetail = "low" | "auto" | "high";

export async function POST(request: Request) {
  try {
    const auth = await verifyAuthenticatedRequest(request);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const limited = await rateLimit({
      key: `ai:assist:${auth.userId}`,
      limit: AI_ASSIST_BURST_PER_MINUTE,
      windowMs: API_RATE_LIMIT_WINDOW_MS,
    });
    if (limited) return limited;

    // Meter usage — free cap, paid fair-use, and monthly hard cap.
    const entitlement = await consumeAiEntitlement(auth.userId);
    if (!entitlement.ok) return entitlementDeniedResponse(entitlement);

    const body = (await request.json()) as {
      system?: string;
      prompt?: string;
      maxTokens?: number;
      temperature?: number;
      stream?: boolean;
      imageBase64?: string;
      mode?: AssistMode;
      imageDetail?: ImageDetail;
    };

    const prompt = body.prompt?.trim();
    if (!prompt) {
      return NextResponse.json({ error: "prompt is required" }, { status: 400 });
    }

    const imageBase64 = body.imageBase64?.trim();
    if (imageBase64) {
      const byteLength = Math.ceil((imageBase64.length * 3) / 4);
      if (byteLength > OPENAI_LIMITS.assistMaxImageBytes) {
        return NextResponse.json({ error: "Image too large" }, { status: 413 });
      }
    }

    const mode: AssistMode =
      body.mode === "coding" || body.mode === "vision" || body.mode === "text"
        ? body.mode
        : imageBase64
          ? "vision"
          : "text";

    const system =
      mode === "coding"
        ? body.system?.trim() || codingSystemPrompt()
        : body.system?.trim() ||
          "You are a visual desktop assistant. Analyze the provided screen content carefully. Identify visible text, code, documents, diagrams, interfaces, and other relevant information. Answer the user's question based only on the available context. If information is unreadable or missing, say so clearly. Do not claim to see content that is not visible. Be concise by default, but provide detailed explanations when requested.";

    const visionSystem =
      mode === "vision"
        ? `${system}\nYou can see the user's screen via screenshot. Answer based on what is visibly on screen. Be specific about apps, windows, errors, and UI you observe. Never invent content that is not visible.`
        : system;

    const economyTier = Boolean(entitlement.throttled);
    const detail: ImageDetail = economyTier
      ? "auto"
      : body.imageDetail === "low" ||
          body.imageDetail === "auto" ||
          body.imageDetail === "high"
        ? body.imageDetail
        : "auto";

    let userContent: string | ChatCompletionContentPart[] = prompt;
    if (imageBase64 && (mode === "vision" || mode === "coding")) {
      userContent = [
        { type: "text", text: prompt },
        {
          type: "image_url",
          image_url: {
            url: `data:image/jpeg;base64,${imageBase64}`,
            detail,
          },
        },
      ];
    }

    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: visionSystem },
      { role: "user", content: userContent },
    ];

    const usePremiumCodingModel =
      mode === "coding" && entitlement.paid && !economyTier;

    const model =
      usePremiumCodingModel
        ? OPENAI_MODELS.coding
        : mode === "vision" || mode === "coding"
          ? OPENAI_MODELS.vision
          : OPENAI_MODELS.chat;

    const tokenCap =
      mode === "coding"
        ? OPENAI_LIMITS.codingMaxTokens
        : mode === "vision"
          ? OPENAI_LIMITS.assistMaxTokens
          : OPENAI_LIMITS.assistRecapMaxTokens;
    const maxTokens = Math.min(
      body.maxTokens ??
        (mode === "coding"
          ? OPENAI_LIMITS.codingMaxTokens
          : OPENAI_LIMITS.assistMaxTokens),
      tokenCap,
    );

    const openai = getOpenAIClient();
    const temperature = body.temperature ?? (mode === "coding" ? 0.2 : 0.35);

    if (body.stream) {
      const completion = await openai.chat.completions.create({
        model,
        messages,
        max_tokens: maxTokens,
        temperature,
        stream: true,
        stream_options: { include_usage: true },
      });

      const encoder = new TextEncoder();
      let usageRecorded = false;

      const stream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of completion) {
              const text = chunk.choices[0]?.delta?.content;
              if (text) controller.enqueue(encoder.encode(text));

              if (!usageRecorded && chunk.usage) {
                usageRecorded = true;
                void recordAiUsage({
                  userId: auth.userId,
                  model,
                  promptTokens: chunk.usage.prompt_tokens ?? 0,
                  completionTokens: chunk.usage.completion_tokens ?? 0,
                });
              }
            }
          } catch (err) {
            console.error("[assist] stream error:", err);
          } finally {
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-store",
          "X-Landed-Viewed-Screen": imageBase64 ? "1" : "0",
        },
      });
    }

    const completion = await openai.chat.completions.create({
      model,
      messages,
      max_tokens: maxTokens,
      temperature,
    });

    const text = completion.choices[0]?.message?.content?.trim() ?? "";
    if (!text) {
      return NextResponse.json({ error: "Empty model response" }, { status: 502 });
    }

    void recordAiUsage({
      userId: auth.userId,
      model,
      promptTokens: completion.usage?.prompt_tokens ?? 0,
      completionTokens: completion.usage?.completion_tokens ?? 0,
    });

    return NextResponse.json({
      text,
      viewedScreen: Boolean(imageBase64),
    });
  } catch (err) {
    const { message, status } = apiErrorResponse(err, "Assist failed");
    return NextResponse.json({ error: message }, { status });
  }
}
