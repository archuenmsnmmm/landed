import {
  DEFAULT_OBJECTIONS,
  DEFAULT_PRODUCT,
  suggestSystemPrompt,
} from "../lib/prompts";
import { OPENAI_LIMITS, OPENAI_MODELS } from "../lib/openai-config";
import {
  formatScreenContextBlock,
  getScreenContext,
} from "./screen-context";
import { getOpenAIKey } from "./whisper";
import { isDirectQuestion } from "./transcript";

export interface LandedSuggestion {
  suggestion: string;
  health: number;
  talkRatio: number;
  missing: {
    budget: boolean;
    decisionMaker: boolean;
    timeline: boolean;
    nextStep: boolean;
  };
}

interface SuggestTranscriptLine {
  speaker: "You" | "Prospect" | "Other";
  text: string;
  timestamp?: number;
}

const TRANSCRIPT_WINDOW_SEC = 90;

function formatRecentTranscript(
  transcript: SuggestTranscriptLine[],
  limit = 6,
): string {
  return transcript
    .slice(-limit)
    .map((t) => `${t.speaker}: ${t.text}`)
    .join("\n");
}

function formatTranscriptWindow(
  transcript: SuggestTranscriptLine[],
  windowSec = TRANSCRIPT_WINDOW_SEC,
): string {
  if (!transcript.length) return "(Conversation just started)";

  const latestTs =
    transcript[transcript.length - 1]?.timestamp ??
    transcript.length;
  const cutoff = typeof latestTs === "number" && latestTs > 1000
    ? latestTs - windowSec
    : -Infinity;

  const windowed = transcript.filter((line) => {
    if (line.timestamp == null) return true;
    if (line.timestamp <= 10000) return line.timestamp >= latestTs - windowSec;
    return line.timestamp >= cutoff;
  });

  const lines = windowed.length ? windowed : transcript.slice(-12);
  return lines.map((t) => `${t.speaker}: ${t.text}`).join("\n");
}

function computeTalkRatio(transcript: SuggestTranscriptLine[]): number {
  const you = transcript.filter((t) => t.speaker === "You").length;
  const total = transcript.length || 1;
  return Math.round((you / total) * 100);
}

function estimateDealHealth(transcript: SuggestTranscriptLine[]): number {
  const you = transcript.filter((t) => t.speaker === "You").length;
  const prospect = transcript.filter((t) => t.speaker === "Prospect").length;
  const total = you + prospect || 1;
  const youRatio = you / total;
  const balance = 1 - Math.abs(youRatio - 0.45) * 2;
  return Math.round(Math.max(35, Math.min(92, 50 + balance * 40)));
}

function parseSuggestionJson(raw: string): LandedSuggestion | null {
  try {
    const clean = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean) as Partial<LandedSuggestion>;
    if (!parsed.suggestion?.trim()) return null;
    return {
      suggestion: parsed.suggestion.trim(),
      health: Math.max(0, Math.min(100, parsed.health ?? 50)),
      talkRatio: Math.max(0, Math.min(100, parsed.talkRatio ?? 50)),
      missing: {
        budget: parsed.missing?.budget ?? false,
        decisionMaker: parsed.missing?.decisionMaker ?? false,
        timeline: parsed.missing?.timeline ?? false,
        nextStep: parsed.missing?.nextStep ?? false,
      },
    };
  } catch {
    return null;
  }
}

function parseStreamChunk(line: string): string | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith("data: ")) return null;
  const payload = trimmed.slice(6);
  if (payload === "[DONE]") return null;
  try {
    const json = JSON.parse(payload) as {
      choices?: Array<{ delta?: { content?: string } }>;
    };
    return json.choices?.[0]?.delta?.content ?? null;
  } catch {
    return null;
  }
}

function appendCoachingContext(base: string, coachingContext?: string): string {
  if (!coachingContext?.trim()) return base;
  const context = coachingContext.trim();
  const usesUploads = context.includes("UPLOADED PLAYBOOKS");
  const uploadHint = usesUploads
    ? " Ground answers in UPLOADED PLAYBOOKS when role, stack, or company facts are needed."
    : "";
  return `${base}${uploadHint}\n\n${context}`;
}

function buildSystemPrompt(
  product: string,
  objections: string,
  coachingContext?: string,
): string {
  const base = suggestSystemPrompt(product, objections);
  return appendCoachingContext(base, coachingContext);
}

function buildStreamSystemPrompt(
  product: string,
  objections: string,
  coachingContext: string | undefined,
  fast: boolean,
  isQuestion: boolean,
): string {
  if (isQuestion) {
    return appendCoachingContext(
      `Screen assistant. Product: ${product}. Answer the user's question using screen context when available. Be direct — under 40 words when possible. No preamble.`,
      coachingContext,
    );
  }

  if (fast) {
    return appendCoachingContext(
      `Screen assistant. Product: ${product}. Give a short, practical answer about what’s on screen (under 40 words). No preamble.`,
      coachingContext,
    );
  }

  return appendCoachingContext(
    `You are Landed, a technical interview assistant in a desktop overlay.
Product context: ${product}
Common friction: ${objections}

Answer using what’s on the user’s screen in a coding or system-design interview. Be practical and concise.
No preamble, no bullet lists unless needed, no JSON.`,
    coachingContext,
  );
}

function buildPipelineUserPrompt(
  prospectText: string,
  transcript: SuggestTranscriptLine[],
  screenContent: string,
  micOnly = false,
): string {
  const transcriptBlock = formatTranscriptWindow(transcript);
  const screenBlock = formatScreenContextBlock(screenContent);
  const speakerLabel = micOnly ? "Speaker just said" : "Interviewer just said";

  return `TRANSCRIPT (last 2 minutes):
${transcriptBlock}

${screenBlock}

${speakerLabel}: "${prospectText}"

TASK: Suggest what the candidate should say or do next in this technical interview. Under 20 words. Give exact words they can use. No preamble.`;
}

export async function getLandedSuggestion(
  prospectText: string,
  transcript: SuggestTranscriptLine[],
  options: {
    product?: string;
    objections?: string;
    coachingContext?: string;
    screenContent?: string;
    micOnly?: boolean;
    signal?: AbortSignal;
  } = {},
): Promise<LandedSuggestion | null> {
  const apiKey = await getOpenAIKey();
  if (!apiKey) {
    console.error("[landed] OpenAI API key is missing — cannot fetch suggestions.");
    return null;
  }

  const product = options.product ?? DEFAULT_PRODUCT;
  const objections = options.objections ?? DEFAULT_OBJECTIONS;
  const screenContent =
    options.screenContent ?? (await getScreenContext());

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      signal: options.signal,
      body: JSON.stringify({
        model: OPENAI_MODELS.chat,
        max_tokens: OPENAI_LIMITS.suggestStreamMaxTokens,
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: buildSystemPrompt(product, objections, options.coachingContext),
          },
          {
            role: "user",
            content: buildPipelineUserPrompt(
              prospectText,
              transcript,
              screenContent,
              options.micOnly,
            ),
          },
        ],
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("[landed] Suggest API failed:", res.status, detail);
      return null;
    }

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content?.trim();
    if (!raw) {
      console.error("[landed] Suggest API returned empty content.");
      return null;
    }

    const parsed = parseSuggestionJson(raw);
    if (!parsed) {
      console.error("[landed] Suggest API returned invalid JSON:", raw);
      return null;
    }

    if (!parsed.talkRatio) {
      parsed.talkRatio = computeTalkRatio(transcript);
    }

    return parsed;
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    console.error("[landed] Suggest API error:", err);
    return null;
  }
}

/** Streaming GPT-4o suggestion for live overlay display. */
export async function streamLandedSuggestion(
  prospectText: string,
  transcript: SuggestTranscriptLine[],
  options: {
    product?: string;
    objections?: string;
    coachingContext?: string;
    screenContent?: string;
    onChunk?: (text: string) => void;
    micOnly?: boolean;
    fast?: boolean;
    isQuestion?: boolean;
    signal?: AbortSignal;
  } = {},
): Promise<LandedSuggestion | null> {
  const apiKey = await getOpenAIKey();
  if (!apiKey) {
    console.error("[landed] OpenAI API key is missing — cannot fetch suggestions.");
    return null;
  }

  const product = options.product ?? DEFAULT_PRODUCT;
  const objections = options.objections ?? DEFAULT_OBJECTIONS;
  const fast = options.fast ?? false;
  const isQuestion = options.isQuestion ?? isDirectQuestion(prospectText);
  const screenContent = fast
    ? ""
    : (options.screenContent ?? (await getScreenContext()));

  const system = buildStreamSystemPrompt(
    product,
    objections,
    options.coachingContext,
    fast,
    isQuestion,
  );

  const userContent = isQuestion
    ? `QUESTION: "${prospectText}"\n\nGive the exact answer the candidate should say right now. One short sentence they can use.`
    : fast
      ? `They just said: "${prospectText}"\n\nWhat should the candidate say or do next?`
      : buildPipelineUserPrompt(prospectText, transcript, screenContent, options.micOnly);

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      signal: options.signal,
      body: JSON.stringify({
        model: OPENAI_MODELS.chat,
        max_tokens: fast
          ? OPENAI_LIMITS.suggestMaxTokens
          : OPENAI_LIMITS.suggestStreamMaxTokens,
        temperature: fast ? 0.25 : 0.35,
        stream: true,
        messages: [
          { role: "system", content: system },
          { role: "user", content: userContent },
        ],
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("[landed] Stream suggest failed:", res.status, detail);
      return null;
    }

    if (!res.body) return null;

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let full = "";
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const chunk = parseStreamChunk(line);
        if (chunk) {
          full += chunk;
          options.onChunk?.(full.trim());
        }
      }
    }

    const suggestion = full.trim();
    if (!suggestion) return null;

    return {
      suggestion,
      health: estimateDealHealth(transcript),
      talkRatio: computeTalkRatio(transcript),
      missing: {
        budget: false,
        decisionMaker: false,
        timeline: false,
        nextStep: false,
      },
    };
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    console.error("[landed] Stream suggest error:", err);
    return null;
  }
}

export { formatRecentTranscript, formatTranscriptWindow, computeTalkRatio };
