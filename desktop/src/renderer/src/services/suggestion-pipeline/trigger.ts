import {
  evaluateSuggestionTrigger,
  type ContentHint,
} from "../../lib/suggestion-types";
import { isDirectQuestion, normalizeTranscriptText } from "../../lib/text-utils";
import { suggestionTriggerKey } from "../transcript";
import type { TranscriptLine } from "../ai";
import { classifyUtterance } from "./classify";
import {
  isActionKeywordPrompt,
  QUESTION_END_SILENCE_MS,
} from "./conversation-dynamics";
import type { ClassifiedUtterance, TriggerResult } from "./types";

const SUGGESTABLE_EVENTS = new Set([
  "question",
  "technical_question",
  "behavioral_question",
  "follow_up",
  "objection",
  "statement",
]);

const LOW_VALUE_EVENTS = new Set(["greeting", "command", "small_talk", "silence", "interruption"]);

const IMPERATIVE_QUESTION_PATTERN =
  /^(explain|describe|define|compare|implement|design|debug|walk me through|talk (to me )?about|give me|walk through)\b/i;

function looksLikeQuestion(text: string): boolean {
  return (
    isDirectQuestion(text) ||
    IMPERATIVE_QUESTION_PATTERN.test(text) ||
    isActionKeywordPrompt(text)
  );
}

export interface DecideTriggerInput {
  triggerText: string;
  line?: TranscriptLine;
  transcript: TranscriptLine[];
  screenContent?: string;
  hasSystemAudio: boolean;
  hasMic: boolean;
  userSpeaking?: boolean;
  conversationPaused?: boolean;
  lastTriggerKey?: string | null;
  /** Silence after speech ended (ms). */
  silenceMs?: number;
  manual?: boolean;
}

function isActionableClassification(classified: ClassifiedUtterance): boolean {
  if (LOW_VALUE_EVENTS.has(classified.event)) return false;
  if (!SUGGESTABLE_EVENTS.has(classified.event)) return false;
  if (classified.eventConfidence < 0.5) return false;
  return true;
}

/**
 * Trigger engine: rules + lightweight classification.
 * Suggestions usually fire on what others say, not the user's own speech.
 */
export function decideTrigger(input: DecideTriggerInput): TriggerResult {
  const text = normalizeTranscriptText(input.triggerText);
  const speaker = input.line?.speaker ?? "Prospect";
  const preferSales = input.hasSystemAudio && speaker === "Prospect";
  const classified = classifyUtterance(text, speaker, {
    screenContent: input.screenContent,
    preferSales,
  });
  const triggerKey = suggestionTriggerKey(text) || `s:${text.toLowerCase()}`;

  if (!text || text === "…" || text.length < 3) {
    return {
      shouldGenerate: false,
      reason: "empty_utterance",
      hint: classified.hint,
      classified,
      triggerKey,
    };
  }

  if (input.conversationPaused) {
    return {
      shouldGenerate: false,
      reason: "conversation_paused",
      hint: classified.hint,
      classified,
      triggerKey,
    };
  }

  if (input.manual) {
    return {
      shouldGenerate: true,
      reason: "manual_assist",
      hint: classified.hint,
      classified,
      triggerKey,
    };
  }

  if (input.lastTriggerKey && input.lastTriggerKey === triggerKey) {
    return {
      shouldGenerate: false,
      reason: "same_question_already_answered",
      hint: classified.hint,
      classified,
      triggerKey,
    };
  }

  // Prefer other speakers; still allow mic-only / strong questions.
  if (speaker === "You" && input.hasSystemAudio && !looksLikeQuestion(text)) {
    return {
      shouldGenerate: false,
      reason: "user_speech_suppressed",
      hint: classified.hint,
      classified,
      triggerKey,
    };
  }

  if (input.userSpeaking && !looksLikeQuestion(text)) {
    return {
      shouldGenerate: false,
      reason: "user_currently_speaking",
      hint: classified.hint,
      classified,
      triggerKey,
    };
  }

  // Wait for end-of-question silence (~600ms) unless it's clearly a completed question
  // with high confidence — matches audio-only assistants that fire after speech ends.
  const minSilence = looksLikeQuestion(text)
    ? Math.min(QUESTION_END_SILENCE_MS, 450)
    : 300;
  if (
    typeof input.silenceMs === "number" &&
    input.silenceMs < minSilence &&
    !input.manual
  ) {
    return {
      shouldGenerate: false,
      reason: "silence_too_short",
      hint: classified.hint,
      classified,
      triggerKey,
    };
  }

  if (LOW_VALUE_EVENTS.has(classified.event) && !input.manual) {
    return {
      shouldGenerate: false,
      reason: `low_value_event:${classified.event}`,
      hint: classified.hint,
      classified,
      triggerKey,
    };
  }

  const gate = evaluateSuggestionTrigger({
    triggerText: text,
    line: input.line,
    transcript: input.transcript,
    screenContent: input.screenContent ?? "",
    hasSystemAudio: input.hasSystemAudio,
    hasMic: input.hasMic,
    manual: input.manual,
  });

  if (gate.kind === "silence") {
    return {
      shouldGenerate: false,
      reason: "trigger_gate_silence",
      hint: classified.hint,
      classified,
      triggerKey,
    };
  }

  if (gate.kind === "fallback") {
    return {
      shouldGenerate: false,
      reason: "trigger_gate_fallback",
      hint: classified.hint,
      classified,
      triggerKey,
    };
  }

  if (!isActionableClassification(classified) && gate.kind !== "generate") {
    return {
      shouldGenerate: false,
      reason: "not_actionable",
      hint: classified.hint,
      classified,
      triggerKey,
    };
  }

  const hint: ContentHint = gate.hint ?? classified.hint;
  return {
    shouldGenerate: true,
    reason: `event:${classified.event}|intent:${classified.intent}`,
    hint,
    classified: { ...classified, hint },
    triggerKey,
  };
}
