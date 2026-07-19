import { isDirectQuestion, normalizeTranscriptText } from "../../lib/text-utils";
import type { TranscriptLine } from "../ai";
import { classifyUtterance } from "./classify";
import type { ClassifiedUtterance } from "./types";

/**
 * Conversation state machine for overlay suggestions.
 *
 * Listening → Question detected → Generate → Display → Wait for speech → Update / fade / hide
 *
 * Timing is driven by speech events (question completion, pauses, interruptions).
 * Screen OCR is supplied separately by the session screen watcher and consumed
 * when generating suggestions — not used for show/hide timing.
 */

export type ConversationPhase =
  | "listening"
  | "question_pending"
  | "generating"
  | "displaying"
  | "fading";

/** Silence after speech ends before treating an utterance as complete. */
export const QUESTION_END_SILENCE_MS = 600;
export const STATEMENT_END_SILENCE_MS = 750;
export const LONG_PAUSE_MS = 2200;

/** How long a suggestion stays after the candidate starts answering. */
export const CANDIDATE_ANSWER_FADE_MS = 3500;
export const CANDIDATE_ANSWER_FADE_MIN_MS = 2000;
export const CANDIDATE_ANSWER_FADE_MAX_MS = 5000;

/**
 * Soft stale timeout while displaying with no new speech.
 * Primary hide/replace is event-driven; this is a safety net only.
 */
export const DISPLAY_STALE_MS = 45_000;

/** Minimum classification confidence to treat as a completed question. */
export const QUESTION_CONFIDENCE_THRESHOLD = 0.75;

/** Interview / coding keywords that should trigger even without "?". */
const ACTION_KEYWORD_PATTERN =
  /\b(implement|design|debug|explain|compare|optimize|refactor|walk (me )?through|tell me about|describe|define|write (a |an )?(function|class|method)|time complexity|space complexity|big.?o)\b/i;

const TOPIC_SHIFT_PATTERN =
  /\b(next|moving on|another question|let'?s talk about|switch(ing)? to|different (topic|question)|now (can you|let'?s|i'?d like))\b/i;

export interface ConversationDynamicsState {
  phase: ConversationPhase;
  lastTriggerKey: string | null;
  lastSuggestionText: string;
  displayedAt: number | null;
  fadeStartedAt: number | null;
  speechEndedAt: number | null;
  pendingText: string | null;
  pendingConfidence: number;
}

export function createConversationDynamicsState(): ConversationDynamicsState {
  return {
    phase: "listening",
    lastTriggerKey: null,
    lastSuggestionText: "",
    displayedAt: null,
    fadeStartedAt: null,
    speechEndedAt: null,
    pendingText: null,
    pendingConfidence: 0,
  };
}

export function isActionKeywordPrompt(text: string): boolean {
  return ACTION_KEYWORD_PATTERN.test(normalizeTranscriptText(text));
}

export function looksLikeCompletedQuestion(
  text: string,
  classified?: ClassifiedUtterance,
): boolean {
  const t = normalizeTranscriptText(text);
  if (!t || t.length < 5) return false;

  if (classified) {
    const isQuestionEvent =
      classified.event === "question" ||
      classified.event === "technical_question" ||
      classified.event === "behavioral_question" ||
      classified.event === "follow_up";
    if (isQuestionEvent && classified.eventConfidence >= QUESTION_CONFIDENCE_THRESHOLD) {
      return true;
    }
  }

  if (isDirectQuestion(t)) return true;
  if (isActionKeywordPrompt(t)) return true;
  return false;
}

/** Debounce after VAD speech-end before generating. */
export function endOfTurnDelayMs(text: string): number {
  if (looksLikeCompletedQuestion(text)) return QUESTION_END_SILENCE_MS;
  if (isActionKeywordPrompt(text)) return QUESTION_END_SILENCE_MS;
  return STATEMENT_END_SILENCE_MS;
}

export function candidateAnswerFadeMs(suggestionLength = 40): number {
  // Longer cards get a bit more reading time before fade completes.
  const scaled = CANDIDATE_ANSWER_FADE_MS + Math.min(1500, suggestionLength * 12);
  return Math.min(
    CANDIDATE_ANSWER_FADE_MAX_MS,
    Math.max(CANDIDATE_ANSWER_FADE_MIN_MS, scaled),
  );
}

/** Detect a meaningful topic / question change vs the last shown trigger. */
export function isConversationChange(
  nextText: string,
  previousTriggerKey: string | null,
  previousSuggestionText: string,
): boolean {
  const next = normalizeTranscriptText(nextText).toLowerCase();
  if (!next) return false;
  if (TOPIC_SHIFT_PATTERN.test(next)) return true;
  if (!previousTriggerKey) return true;

  const prevQ = previousTriggerKey.replace(/^[qs]:/, "");
  if (!prevQ) return true;

  // Rough lexical overlap — low overlap ⇒ new question / topic.
  const nextTokens = new Set(next.split(/\s+/).filter((w) => w.length > 3));
  const prevTokens = new Set(prevQ.split(/\s+/).filter((w) => w.length > 3));
  if (nextTokens.size === 0 || prevTokens.size === 0) return true;

  let overlap = 0;
  for (const tok of nextTokens) {
    if (prevTokens.has(tok)) overlap += 1;
  }
  const ratio = overlap / Math.min(nextTokens.size, prevTokens.size);
  if (ratio < 0.35) return true;

  // If they asked something new that doesn't match the suggestion content.
  if (
    previousSuggestionText &&
    looksLikeCompletedQuestion(next) &&
    !previousSuggestionText.toLowerCase().includes(next.slice(0, 24))
  ) {
    return ratio < 0.55;
  }

  return false;
}

export interface VisibilityDecision {
  /** Keep the current card visible. */
  keep: boolean;
  /** Start / continue fade-out because the candidate is answering. */
  startFade: boolean;
  /** Clear immediately (new question will replace, or hard reset). */
  clear: boolean;
  /** Regenerate because the conversation moved on. */
  regenerate: boolean;
  reason: string;
}

/**
 * Event-driven visibility while a suggestion is on screen.
 * Prefer speech events over fixed timers.
 */
export function decideSuggestionVisibility(input: {
  phase: ConversationPhase;
  isSpeaking: boolean;
  wasSpeaking: boolean;
  hasActiveSuggestion: boolean;
  newTranscriptArrived: boolean;
  newTextLooksLikeQuestion: boolean;
  conversationChanged: boolean;
  displayedAt: number | null;
  now?: number;
}): VisibilityDecision {
  const now = input.now ?? Date.now();

  if (!input.hasActiveSuggestion) {
    return { keep: false, startFade: false, clear: false, regenerate: false, reason: "none" };
  }

  // New question / topic → replace (caller regenerates).
  if (input.newTranscriptArrived && input.newTextLooksLikeQuestion) {
    return {
      keep: false,
      startFade: false,
      clear: true,
      regenerate: true,
      reason: "new_question",
    };
  }

  if (input.newTranscriptArrived && input.conversationChanged) {
    return {
      keep: false,
      startFade: false,
      clear: true,
      regenerate: true,
      reason: "conversation_changed",
    };
  }

  // Candidate starts answering → fade over a few seconds (not instant clear).
  if (input.isSpeaking && !input.wasSpeaking && input.phase === "displaying") {
    return {
      keep: true,
      startFade: true,
      clear: false,
      regenerate: false,
      reason: "candidate_answering",
    };
  }

  // While fading, keep until fade timer fires.
  if (input.phase === "fading") {
    return {
      keep: true,
      startFade: true,
      clear: false,
      regenerate: false,
      reason: "fading",
    };
  }

  // No new transcript / still reading → keep visible.
  if (!input.newTranscriptArrived) {
    const stale =
      input.displayedAt != null && now - input.displayedAt >= DISPLAY_STALE_MS;
    if (stale) {
      return {
        keep: false,
        startFade: false,
        clear: true,
        regenerate: false,
        reason: "stale_timeout",
      };
    }
    return {
      keep: true,
      startFade: false,
      clear: false,
      regenerate: false,
      reason: "hold_no_new_speech",
    };
  }

  // Non-question chatter while displaying — hold unless it clearly changes topic.
  return {
    keep: true,
    startFade: false,
    clear: false,
    regenerate: false,
    reason: "hold_while_reading",
  };
}

/**
 * Whether we should generate after speech ended + silence debounce.
 * Prefer completed questions / keyword prompts with high confidence.
 */
export function shouldGenerateAfterSilence(input: {
  text: string;
  silenceMs: number;
  speaker?: TranscriptLine["speaker"];
  hasSystemAudio: boolean;
  hasMic: boolean;
  lastTriggerKey?: string | null;
}): { generate: boolean; classified: ClassifiedUtterance; reason: string } {
  const text = normalizeTranscriptText(input.text);
  const speaker = input.speaker ?? "Prospect";
  const micOnly = !input.hasSystemAudio && input.hasMic;
  const classified = classifyUtterance(text, speaker, {
    preferSales: input.hasSystemAudio && speaker === "Prospect",
  });

  if (!text || text.length < 5) {
    return { generate: false, classified, reason: "empty" };
  }

  const questionLike = looksLikeCompletedQuestion(text, classified);
  const requiredSilence = questionLike
    ? QUESTION_END_SILENCE_MS
    : STATEMENT_END_SILENCE_MS;

  if (input.silenceMs < requiredSilence) {
    return { generate: false, classified, reason: "silence_too_short" };
  }

  // Long pause after substantial utterance → gentle coach opportunity.
  if (
    !questionLike &&
    input.silenceMs >= LONG_PAUSE_MS &&
    text.length >= 20 &&
    classified.event !== "greeting" &&
    classified.event !== "small_talk" &&
    classified.event !== "command"
  ) {
    // Only for other-party / mic-only ambiguity — not clear candidate monologue.
    if (speaker === "Prospect" || micOnly) {
      return { generate: true, classified, reason: "long_pause" };
    }
  }

  if (!questionLike && !isActionKeywordPrompt(text)) {
    // Prospect statements can still trigger (sales / objections).
    if (speaker === "Prospect" && text.length >= 8) {
      return { generate: true, classified, reason: "prospect_turn" };
    }
    if (micOnly && text.length >= 15 && classified.eventConfidence >= 0.65) {
      return { generate: true, classified, reason: "mic_only_turn" };
    }
    return { generate: false, classified, reason: "not_actionable" };
  }

  if (classified.eventConfidence < 0.5 && !questionLike) {
    return { generate: false, classified, reason: "low_confidence" };
  }

  return {
    generate: true,
    classified,
    reason: questionLike ? "question_complete" : "keyword_prompt",
  };
}

/** Interim speech should not fire early — wait for silence + completion. */
export function shouldDeferInterimSuggestion(text: string): boolean {
  const t = normalizeTranscriptText(text);
  if (!t) return true;
  // Incomplete fragments ending mid-phrase.
  if (!/[.!?]$/.test(t) && t.split(/\s+/).length < 6 && !isActionKeywordPrompt(t)) {
    return true;
  }
  return false;
}
