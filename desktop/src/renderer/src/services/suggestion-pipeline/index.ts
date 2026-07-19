import { DEFAULT_OBJECTIONS, DEFAULT_PRODUCT } from "../../lib/prompts";
import { maxTokensForHint } from "../../lib/suggestion-types";
import { OPENAI_LIMITS, OPENAI_MODELS } from "../../lib/openai-config";
import { isDirectQuestion } from "../../lib/text-utils";
import type { LandedSuggestion } from "../landed-suggest";
import { getOpenAIKey } from "../whisper";
import { buildSuggestionContext } from "./context";
import { formatStructuredSuggestion } from "./format";
import { constructSuggestionPrompt } from "./prompt";
import { shouldSuppressSuggestion } from "./suppress";
import { decideTrigger } from "./trigger";
import type {
  PipelineGenerateInput,
  PipelineGenerateResult,
} from "./types";

function estimateDealHealth(
  transcript: PipelineGenerateInput["transcript"],
): number {
  const you = transcript.filter((t) => t.speaker === "You").length;
  const prospect = transcript.filter((t) => t.speaker === "Prospect").length;
  const total = you + prospect || 1;
  const youRatio = you / total;
  const balance = 1 - Math.abs(youRatio - 0.45) * 2;
  return Math.round(Math.max(35, Math.min(92, 50 + balance * 40)));
}

function computeTalkRatio(
  transcript: PipelineGenerateInput["transcript"],
): number {
  const you = transcript.filter((t) => t.speaker === "You").length;
  const total = transcript.length || 1;
  return Math.round((you / total) * 100);
}

function emptyMissing(): LandedSuggestion["missing"] {
  return {
    budget: false,
    decisionMaker: false,
    timeline: false,
    nextStep: false,
  };
}

/** Generate structured JSON (non-stream) for reliable card parsing. */
async function generateCopilotText(
  system: string,
  user: string,
  maxTokens: number,
  signal?: AbortSignal,
  onChunk?: (text: string) => void,
): Promise<string | null> {
  const apiKey = await getOpenAIKey();
  if (!apiKey) {
    console.error("[landed] OpenAI API key missing — pipeline cannot generate.");
    return null;
  }

  try {
    onChunk?.("");
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      signal,
      body: JSON.stringify({
        model: OPENAI_MODELS.chat,
        max_tokens: maxTokens,
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("[landed] Pipeline JSON generate failed:", res.status, detail);
      return null;
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = data.choices?.[0]?.message?.content?.trim() ?? "";
    if (!text) return null;
    onChunk?.(text);
    return text;
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    console.error(
      "[landed] Pipeline generate error:",
      err instanceof Error ? err.message : "failed",
    );
    return null;
  }
}

/**
 * Live suggestion pipeline (Cluely-style):
 * classify → trigger on question-end / silence / screen context → LLM → format → suppress.
 *
 * Perception: mic/ASR transcript + cached screen OCR from the session watcher.
 * The overlay does not capture inside this function — callers pass fresh OCR text.
 */
export async function runSuggestionPipeline(
  input: PipelineGenerateInput,
): Promise<PipelineGenerateResult | null> {
  const product = input.product ?? DEFAULT_PRODUCT;
  const objections = input.objections ?? DEFAULT_OBJECTIONS;
  const screenContent = input.screenContent ?? "";
  const micOnly = !input.hasSystemAudio && input.hasMic;

  const trigger = decideTrigger({
    triggerText: input.triggerText,
    line: input.line,
    transcript: input.transcript,
    screenContent,
    hasSystemAudio: input.hasSystemAudio,
    hasMic: input.hasMic,
    userSpeaking: input.userSpeaking,
    conversationPaused: input.conversationPaused,
    lastTriggerKey: input.lastTriggerKey,
    silenceMs:
      typeof input.silenceMs === "number"
        ? input.silenceMs
        : input.userSpeaking
          ? 0
          : 600,
    manual: input.manual,
  });

  if (!trigger.shouldGenerate) {
    return null;
  }

  if (!input.manual && input.lastSuggestionAt) {
    const isQuestion = isDirectQuestion(input.triggerText);
    const cooldown = isQuestion
      ? OPENAI_LIMITS.questionSuggestionCooldownMs
      : OPENAI_LIMITS.suggestionCooldownMs;
    if (Date.now() - input.lastSuggestionAt < cooldown) {
      return null;
    }
  }

  const context = buildSuggestionContext({
    triggerText: input.triggerText,
    transcript: input.transcript,
    screenContent,
    micOnly,
    classified: trigger.classified,
  });

  const prompt = constructSuggestionPrompt({
    product,
    objections,
    coachingContext: input.coachingContext,
    context,
    classified: trigger.classified,
    hint: trigger.hint,
    manualAction: input.manual ? "assist" : undefined,
  });

  const confidence = Math.min(
    trigger.classified.eventConfidence,
    trigger.classified.intentConfidence || trigger.classified.eventConfidence,
  );

  let rawText = "";
  let health = estimateDealHealth(input.transcript);
  let talkRatio = computeTalkRatio(input.transcript);
  let missing = emptyMissing();

  if (prompt.useSalesJson) {
    const { getLandedSuggestion } = await import("../landed-suggest");
    const sales = await getLandedSuggestion(input.triggerText, input.transcript, {
      product,
      objections,
      coachingContext: input.coachingContext,
      // Keep sales scripts grounded in the call; screen OCR only when useful.
      screenContent: screenContent.trim() ? screenContent : "",
      micOnly,
      signal: input.signal,
    });
    if (!sales?.suggestion) return null;
    rawText = sales.suggestion;
    health = sales.health;
    talkRatio = sales.talkRatio;
    missing = sales.missing;
    input.onChunk?.(rawText);
  } else {
    const maxTokens = Math.min(
      Math.max(maxTokensForHint(trigger.hint), OPENAI_LIMITS.assistMaxTokens),
      OPENAI_LIMITS.suggestStreamMaxTokens + 80,
    );
    const text = await generateCopilotText(
      prompt.system,
      prompt.user,
      maxTokens,
      input.signal,
      input.onChunk,
    );
    if (!text) return null;
    rawText = text;
  }

  const structured = formatStructuredSuggestion(
    rawText,
    trigger.hint,
    confidence,
  );

  if (!structured.shouldSuggest || !structured.summary.trim()) {
    return null;
  }

  const suppression = shouldSuppressSuggestion({
    userSpeaking: Boolean(input.userSpeaking) && !input.manual,
    conversationPaused: Boolean(input.conversationPaused),
    confidence: structured.confidence,
    previousSuggestion: input.lastSuggestionText,
    candidateText: structured.rawText,
    alreadyAnsweredKey: input.lastTriggerKey,
    currentTriggerKey: trigger.triggerKey,
  });

  if (suppression.suppress && !input.manual) {
    return {
      suggestion: structured.rawText,
      structured,
      health,
      talkRatio,
      missing,
      hint: trigger.hint,
      triggerKey: trigger.triggerKey,
      classified: trigger.classified,
      suppressed: true,
      suppressReason: suppression.reason,
    };
  }

  return {
    suggestion: structured.rawText,
    structured,
    health,
    talkRatio,
    missing,
    hint: trigger.hint,
    triggerKey: trigger.triggerKey,
    classified: trigger.classified,
  };
}

export { classifyUtterance } from "./classify";
export { decideTrigger } from "./trigger";
export { buildSuggestionContext, formatContextBrief } from "./context";
export { constructSuggestionPrompt } from "./prompt";
export {
  formatStructuredSuggestion,
  layoutForHint,
  layoutLabel,
  suggestionsNearlyIdentical,
} from "./format";
export { shouldSuppressSuggestion } from "./suppress";
export {
  candidateAnswerFadeMs,
  createConversationDynamicsState,
  decideSuggestionVisibility,
  endOfTurnDelayMs,
  isActionKeywordPrompt,
  isConversationChange,
  looksLikeCompletedQuestion,
  shouldDeferInterimSuggestion,
  shouldGenerateAfterSilence,
  CANDIDATE_ANSWER_FADE_MS,
  DISPLAY_STALE_MS,
  QUESTION_END_SILENCE_MS,
  type ConversationPhase,
  type ConversationDynamicsState,
} from "./conversation-dynamics";
export type * from "./types";
