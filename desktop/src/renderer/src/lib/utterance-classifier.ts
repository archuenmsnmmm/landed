import { isDirectQuestion, hasObjectionSignal } from "./text-utils";
import { isOtherPartySpeaker } from "../store/types";

export type UtteranceClass =
  | "question"
  | "objection"
  | "discovery_opener"
  | "pricing_signal"
  | "buying_signal"
  | "competitive_intel"
  | "follow_up"
  | "small_talk"
  | "filler"
  | "rep_monologue"
  | "general"
  /** @deprecated Legacy interview classes still accepted from API */
  | "difficult_question"
  | "behavioural_probe"
  | "technical_question"
  | "motivation_probe"
  | "weakness_probe"
  | "candidate_monologue";

export type ClassifierResult = {
  class: UtteranceClass;
  confidence: number;
  trigger: boolean;
};

const FILLER_PATTERN =
  /^(yeah|yes|yep|okay|ok|mm|uh|um|right|sure|got it|i see|mhm|hmm|alright|cool|thanks|thank you)\.?$/i;

const DISCOVERY_PATTERN =
  /\b(walk me through|how (do|does) (your|this) (team|process|company)|what('s| is) your (current|typical)|what does .* look like|how are you (currently|today) handling)\b/i;

const BUYING_PATTERN =
  /\b(ready to move|let's do it|send the contract|when can we start|sounds good|interested|next steps|move forward|sign up|purchase|trial|pilot)\b/i;

const PRICING_PATTERN =
  /\b(price|pricing|cost|budget|expensive|discount|contract length|payment terms|how much (does|is|would))\b/i;

const COMPETITIVE_PATTERN =
  /\b(competitor|already using|currently use|instead of|versus|compared to|switch(ing)? from)\b/i;

const FOLLOW_UP_PATTERN =
  /\b(can you (say|tell) more|elaborate|go deeper|what happened next|and then|anything else)\b/i;

const SMALL_TALK_PATTERN =
  /\b(how are you|how's your day|weather|weekend|holiday|nice to meet|good morning|good afternoon)\b/i;

function shouldTrigger(className: UtteranceClass): boolean {
  switch (className) {
    case "question":
    case "objection":
    case "discovery_opener":
    case "pricing_signal":
    case "buying_signal":
    case "competitive_intel":
    case "follow_up":
      return true;
    default:
      return false;
  }
}

export function computeRepTalkRatio(
  transcript: Array<{ speaker: string }>,
): number {
  const you = transcript.filter((l) => l.speaker === "You").length;
  const other = transcript.filter((l) => isOtherPartySpeaker(l.speaker)).length;
  const total = you + other || 1;
  return you / total;
}

export function heuristicClassifyUtterance(
  text: string,
  options: { speaker?: string; repTalkRatio?: number; micOnly?: boolean } = {},
): ClassifierResult | null {
  const t = text.replace(/\s+/g, " ").trim();
  if (!t || t.length < 3) {
    return { class: "filler", confidence: 1, trigger: false };
  }

  if (FILLER_PATTERN.test(t)) {
    return { class: "filler", confidence: 0.95, trigger: false };
  }

  if (SMALL_TALK_PATTERN.test(t) && t.length < 60) {
    return { class: "small_talk", confidence: 0.9, trigger: false };
  }

  // Sales patterns before the rep-monologue short-circuit. Mic-only capture
  // labels prospect speech as "You", so probes and objections must still
  // trigger coaching.
  if (BUYING_PATTERN.test(t)) {
    return { class: "buying_signal", confidence: 0.9, trigger: true };
  }

  if (PRICING_PATTERN.test(t)) {
    return { class: "pricing_signal", confidence: 0.9, trigger: true };
  }

  if (hasObjectionSignal(t)) {
    return { class: "objection", confidence: 0.88, trigger: true };
  }

  if (COMPETITIVE_PATTERN.test(t)) {
    return { class: "competitive_intel", confidence: 0.86, trigger: true };
  }

  if (DISCOVERY_PATTERN.test(t)) {
    return { class: "discovery_opener", confidence: 0.85, trigger: true };
  }

  if (isDirectQuestion(t)) {
    return { class: "question", confidence: 0.92, trigger: true };
  }

  if (FOLLOW_UP_PATTERN.test(t)) {
    return {
      class: "follow_up",
      confidence: 0.82,
      trigger: shouldTrigger("follow_up"),
    };
  }

  // Only suppress rep monologue when we can tell speakers apart.
  if (options.speaker === "You" && !options.micOnly) {
    return { class: "rep_monologue", confidence: 0.85, trigger: false };
  }

  // Mic-only: longer utterances may be prospect content — let the API decide.
  if (options.micOnly && t.length >= 12) {
    return null;
  }

  return null;
}

export const SUBPROMPTS: Record<string, string> = {
  question:
    "Answer the interviewer's question directly for a technical interview. Max 2 short sentences the candidate can say.",
  objection:
    "Acknowledge the hard part briefly, clarify constraints if needed, then give a concise technical reframe.",
  discovery_opener:
    "Suggest ONE sharp clarifying question about constraints, inputs, or edge cases. Under 15 words.",
  pricing_signal:
    "If asked about tradeoffs or cost of an approach, compare options briefly and recommend one. Short.",
  buying_signal:
    "Reinforce a strong answer and propose a concrete next step (complexity, dry run, or code).",
  competitive_intel:
    "Compare approaches calmly with honest tradeoffs — never invent facts.",
  follow_up:
    "Deepen the previous answer with one concrete detail, complexity note, or example. Under 20 words.",
  general: "Exact words or scaffold the candidate uses next — keep it tight.",
};

export function subpromptForClass(utteranceClass: UtteranceClass): string {
  return SUBPROMPTS[utteranceClass] ?? SUBPROMPTS.general;
}
