import { NextResponse } from "next/server";
import { verifyAuthenticatedRequest } from "@/lib/api-auth";
import { apiErrorResponse } from "@/lib/api-errors";
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

    // Assist responses are metered — consume one free question up front.
    const entitlement = await consumeAiEntitlement(auth.userId);
    if (!entitlement.ok) return entitlementDeniedResponse(entitlement);

    const limited = rateLimit(request, {
      scope: `ai:assist:${auth.userId}`,
      limit: 60,
      windowMs: 60_000,
    });
    if (limited) return limited;

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

    const detail: ImageDetail =
      body.imageDetail === "low" ||
      body.imageDetail === "auto" ||
      body.imageDetail === "high"
        ? body.imageDetail
        : entitlement.paid
          ? "high"
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

    const model =
      mode === "coding" && entitlement.paid
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

    return NextResponse.json({
      text,
      viewedScreen: Boolean(imageBase64),
    });
  } catch (err) {
    const { message, status } = apiErrorResponse(err, "Assist failed");
    return NextResponse.json({ error: message }, { status });
  }
}
