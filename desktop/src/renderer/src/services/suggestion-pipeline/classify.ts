import {
  detectContentHint,
  hasSalesSignal,
  type ContentHint,
} from "../../lib/suggestion-types";
import {
  hasObjectionSignal,
  isDirectQuestion,
  normalizeTranscriptText,
} from "../../lib/text-utils";
import type { TranscriptLine } from "../ai";
import type { ClassifiedUtterance, SpeakerIntent, UtteranceEventType } from "./types";

const GREETING_PATTERN =
  /\b(hi|hello|hey|good (morning|afternoon|evening)|how are you|nice to (meet|see) you)\b/i;

const COMMAND_PATTERN =
  /\b(can you (send|share|mute|unmute)|please (send|share|mute)|let'?s (start|begin|wrap|end)|hold on|one (sec|second|moment))\b/i;

const SMALL_TALK_PATTERN =
  /\b(weather|weekend|traffic|how'?s (your|the) (day|week)|crazy (times|week))\b/i;

const FOLLOW_UP_PATTERN =
  /\b(and (what|how|why)|what about|how about|can you (also|expand)|tell me more|go (on|deeper)|compared (to|with)|and compare)\b/i;

const TECHNICAL_PATTERN =
  /\b(polymorphism|dependency injection|algorithm|api|database|latency|throughput|concurrency|typescript|javascript|python|java|react|kubernetes|microservice|oauth|sql|index|cache|distributed|design pattern|big.?o|complexity|lru|bfs|dfs|binary tree|hash\s*map|leetcode)\b/i;

/** Imperative / coding task keywords that act as interview prompts from audio alone. */
const ACTION_KEYWORD_PATTERN =
  /\b(implement|design|debug|optimize|refactor|write (a |an )?(function|class|method)|build (a |an )?|code (up |out )?)\b/i;

const BEHAVIOURAL_PATTERN =
  /\b(tell me about a time|describe a situation|give me an example|walk me through a time|biggest challenge|greatest weakness|why should we hire|how do you handle conflict|star method)\b/i;

const BUYING_PATTERN =
  /\b(ready to move|let's do it|send the contract|when can we start|sounds good|interested|next steps|move forward|sign up|purchase|trial|pilot)\b/i;

/** Imperative prompts that act as questions in interviews/calls. */
const IMPERATIVE_QUESTION_PATTERN =
  /^(explain|describe|define|compare|implement|design|debug|walk me through|talk (to me )?about|give me|walk through)\b/i;

const INTERRUPTION_MAX_WORDS = 3;

function looksLikeQuestion(text: string): boolean {
  return (
    isDirectQuestion(text) ||
    IMPERATIVE_QUESTION_PATTERN.test(text) ||
    ACTION_KEYWORD_PATTERN.test(text)
  );
}

function scoreEvent(text: string): { event: UtteranceEventType; confidence: number } {
  const t = normalizeTranscriptText(text);
  if (!t || t.length < 2) return { event: "silence", confidence: 0.95 };

  if (BEHAVIOURAL_PATTERN.test(t)) {
    return { event: "behavioral_question", confidence: 0.92 };
  }
  if (
    (looksLikeQuestion(t) || ACTION_KEYWORD_PATTERN.test(t)) &&
    TECHNICAL_PATTERN.test(t)
  ) {
    return { event: "technical_question", confidence: 0.92 };
  }
  if (ACTION_KEYWORD_PATTERN.test(t) && t.length >= 10) {
    return { event: "technical_question", confidence: 0.88 };
  }
  if (FOLLOW_UP_PATTERN.test(t) && (looksLikeQuestion(t) || t.length >= 12)) {
    return { event: "follow_up", confidence: 0.85 };
  }
  if (hasObjectionSignal(t)) {
    return { event: "objection", confidence: 0.88 };
  }
  if (looksLikeQuestion(t)) {
    return { event: "question", confidence: 0.9 };
  }
  if (GREETING_PATTERN.test(t) && t.split(/\s+/).length <= 10) {
    return { event: "greeting", confidence: 0.85 };
  }
  if (COMMAND_PATTERN.test(t)) {
    return { event: "command", confidence: 0.8 };
  }
  if (SMALL_TALK_PATTERN.test(t)) {
    return { event: "small_talk", confidence: 0.75 };
  }
  if (t.split(/\s+/).length <= INTERRUPTION_MAX_WORDS && !/[.!?]$/.test(t)) {
    return { event: "interruption", confidence: 0.55 };
  }
  return { event: "statement", confidence: 0.65 };
}

function scoreIntent(
  text: string,
  event: UtteranceEventType,
): { intent: SpeakerIntent; confidence: number } {
  const t = normalizeTranscriptText(text);

  if (BUYING_PATTERN.test(t)) {
    return { intent: "buying_signal", confidence: 0.88 };
  }
  if (event === "objection" || hasObjectionSignal(t)) {
    return { intent: "raising_objection", confidence: 0.9 };
  }
  if (event === "behavioral_question") {
    return { intent: "checking_experience", confidence: 0.9 };
  }
  if (event === "technical_question") {
    return { intent: "testing_knowledge", confidence: 0.9 };
  }
  if (event === "question" && TECHNICAL_PATTERN.test(t)) {
    return { intent: "testing_knowledge", confidence: 0.8 };
  }
  if (event === "question" || event === "follow_up") {
    if (hasSalesSignal(t)) {
      return { intent: "negotiating", confidence: 0.75 };
    }
    return { intent: "testing_knowledge", confidence: 0.7 };
  }
  if (event === "command") {
    return { intent: "giving_instructions", confidence: 0.85 };
  }
  if (event === "greeting" || event === "small_talk") {
    return { intent: "making_conversation", confidence: 0.85 };
  }
  if (hasSalesSignal(t)) {
    return { intent: "negotiating", confidence: 0.7 };
  }
  return { intent: "unknown", confidence: 0.4 };
}

function hintFromClassification(
  text: string,
  event: UtteranceEventType,
  screenContent: string,
  preferSales: boolean,
): ContentHint {
  if (event === "behavioral_question") return "behavioural";
  if (event === "technical_question") {
    const detected = detectContentHint(text, screenContent, false);
    return detected === "general" ? "coding" : detected;
  }
  if (event === "objection" || (preferSales && hasSalesSignal(text))) return "sales";
  return detectContentHint(text, screenContent, preferSales);
}

/**
 * Event detection + intent classification for a completed (or live) utterance.
 */
export function classifyUtterance(
  text: string,
  speaker: TranscriptLine["speaker"] = "Prospect",
  opts: { screenContent?: string; preferSales?: boolean } = {},
): ClassifiedUtterance {
  const normalized = normalizeTranscriptText(text);
  const { event, confidence: eventConfidence } = scoreEvent(normalized);
  const { intent, confidence: intentConfidence } = scoreIntent(normalized, event);
  const preferSales = opts.preferSales ?? speaker === "Prospect";
  const hint = hintFromClassification(
    normalized,
    event,
    opts.screenContent ?? "",
    preferSales,
  );

  return {
    text: normalized,
    speaker,
    event,
    eventConfidence,
    intent,
    intentConfidence,
    hint,
  };
}
