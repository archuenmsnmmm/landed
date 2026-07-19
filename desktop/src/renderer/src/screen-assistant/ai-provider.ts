import { apiFetch, hasAuthenticatedApiAccess } from "../lib/api-client";
import { codingSystemPrompt } from "../lib/coding-answer";
import { OPENAI_LIMITS, OPENAI_MODELS } from "../lib/openai-config";
import { describeAiRouteFailure } from "../lib/openai-failures";
import { getOpenAIKey } from "../services/whisper";
import { useAppStore } from "../store/useAppStore";
import type { AIResponse, AnalyzeScreenInput } from "./types";

function resolveCodingSystemPrompt(): string {
  const codeLanguage = useAppStore.getState().settings.codeLanguage ?? "Auto";
  return codingSystemPrompt(codeLanguage);
}

export class ScreenAssistantError extends Error {
  constructor(
    message: string,
    readonly code:
      | "permission"
      | "capture"
      | "api_key"
      | "network"
      | "timeout"
      | "rate_limit"
      | "invalid_image"
      | "unknown" = "unknown",
  ) {
    super(message);
    this.name = "ScreenAssistantError";
  }
}

export interface AIProvider {
  analyze(input: AnalyzeScreenInput): Promise<AIResponse>;
}

async function analyzeViaApi(
  input: AnalyzeScreenInput,
): Promise<AIResponse> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60_000);
  const signal = input.signal ?? controller.signal;

  try {
    const res = await apiFetch("/api/assist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal,
      body: JSON.stringify({
        system: resolveCodingSystemPrompt(),
        prompt: input.question,
        maxTokens: OPENAI_LIMITS.codingMaxTokens,
        temperature: 0.2,
        mode: "coding",
        imageBase64: input.image,
        imageDetail: "high",
        stream: false,
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      if (res.status === 401 || res.status === 403) {
        throw new ScreenAssistantError(
          "Sign in to Landed so it can analyze your screen.",
          "api_key",
        );
      }
      if (res.status === 429) {
        throw new ScreenAssistantError(
          "Rate limited — wait a moment and try again.",
          "rate_limit",
        );
      }
      if (res.status === 413) {
        throw new ScreenAssistantError(
          "Screenshot is too large. Try again in a moment.",
          "invalid_image",
        );
      }
      throw new ScreenAssistantError(
        describeAiRouteFailure(res.status, detail),
        "network",
      );
    }

    const data = (await res.json()) as { text?: string; viewedScreen?: boolean };
    const text = data.text?.trim();
    if (!text) {
      throw new ScreenAssistantError("Empty model response", "unknown");
    }
    return { text, viewedScreen: Boolean(data.viewedScreen ?? true) };
  } catch (err) {
    if (err instanceof ScreenAssistantError) throw err;
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new ScreenAssistantError("Request timed out", "timeout");
    }
    throw new ScreenAssistantError(
      err instanceof Error ? err.message : "Network error",
      "network",
    );
  } finally {
    clearTimeout(timer);
  }
}

async function analyzeViaDirectOpenAI(
  input: AnalyzeScreenInput,
  apiKey: string,
): Promise<AIResponse> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60_000);

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      signal: input.signal ?? controller.signal,
      body: JSON.stringify({
        model: OPENAI_MODELS.coding,
        messages: [
          { role: "system", content: resolveCodingSystemPrompt() },
          {
            role: "user",
            content: [
              { type: "text", text: input.question },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${input.image}`,
                  detail: "high",
                },
              },
            ],
          },
        ],
        max_tokens: OPENAI_LIMITS.codingMaxTokens,
        temperature: 0.2,
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      if (res.status === 401) {
        throw new ScreenAssistantError("Invalid API key", "api_key");
      }
      if (res.status === 429) {
        throw new ScreenAssistantError("Rate limited", "rate_limit");
      }
      throw new ScreenAssistantError(
        detail.slice(0, 200) || `API error ${res.status}`,
        "network",
      );
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) throw new ScreenAssistantError("Empty model response", "unknown");
    return { text, viewedScreen: true };
  } catch (err) {
    if (err instanceof ScreenAssistantError) throw err;
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new ScreenAssistantError("Request timed out", "timeout");
    }
    throw new ScreenAssistantError(
      err instanceof Error ? err.message : "Network error",
      "network",
    );
  } finally {
    clearTimeout(timer);
  }
}

/** Vision path: authenticated /api/assist, else local OpenAI key. */
export class OpenAICompatibleProvider implements AIProvider {
  async analyze(input: AnalyzeScreenInput): Promise<AIResponse> {
    const question =
      input.question.trim() || "What is happening on this screen?";
    const image = input.image.trim();
    if (!image) {
      throw new ScreenAssistantError("No screenshot to analyze", "capture");
    }

    if (await hasAuthenticatedApiAccess()) {
      return analyzeViaApi({ ...input, question, image });
    }

    const apiKey = await getOpenAIKey();
    if (!apiKey) {
      throw new ScreenAssistantError(
        "Sign in to Landed or configure an API key to analyze your screen.",
        "api_key",
      );
    }

    return analyzeViaDirectOpenAI({ ...input, question, image }, apiKey);
  }
}

let defaultProvider: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (!defaultProvider) defaultProvider = new OpenAICompatibleProvider();
  return defaultProvider;
}

export function setAIProvider(provider: AIProvider): void {
  defaultProvider = provider;
}
