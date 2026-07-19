import { getOpenAIClient } from "@/lib/openai";
import { OPENAI_MODELS } from "@/lib/openai-config";
import { isDirectQuestion, hasObjectionSignal } from "@/lib/text-utils";

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
  | "general";

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
  /\b(price|pricing|cost|budget|discount|contract length|payment terms|how much (does|is|would))\b/i;

const COMPETITIVE_PATTERN =
  /\b(competitor|already using|currently use|instead of|versus|compared to|switch(ing)? from|salesforce|hubspot)\b/i;

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

export function heuristicClassify(
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

  // Sales patterns before rep-monologue short-circuit — mic-only labels the
  // prospect as "You", so objections/signals must still trigger coaching.
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

  if (options.speaker === "You" && !options.micOnly) {
    return { class: "rep_monologue", confidence: 0.85, trigger: false };
  }

  if (options.micOnly && t.length >= 12) {
    return null;
  }

  return null;
}

export function computeRepTalkRatio(
  transcript: Array<{ speaker: string }>,
): number {
  const you = transcript.filter((l) => l.speaker === "You").length;
  const other = transcript.filter((l) => l.speaker === "Prospect").length;
  const total = you + other || 1;
  return you / total;
}

export async function classifyUtterance(
  text: string,
  recentContext: string,
  options: { speaker?: string; repTalkRatio?: number; micOnly?: boolean } = {},
): Promise<ClassifierResult> {
  const heuristic = heuristicClassify(text, options);
  if (heuristic && heuristic.confidence >= 0.85) {
    return heuristic;
  }

  try {
    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: OPENAI_MODELS.chat,
      max_tokens: 60,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `Classify a sales call utterance from the prospect. Return JSON only:
{"class":"...","confidence":0.0-1.0,"trigger":true/false}

Classes: question, objection, discovery_opener, pricing_signal, buying_signal, competitive_intel, follow_up, small_talk, filler, rep_monologue, general

trigger=true for coaching-worthy prospect turns:
question, objection, discovery_opener, pricing_signal, buying_signal, competitive_intel, follow_up

trigger=false for: small_talk, filler, rep_monologue, general

${
  options.micOnly
    ? "Mic-only mode: speaker labels are unreliable — prefer trigger=true for sales-relevant content even if Speaker is You."
    : ""
}`,
        },
        {
          role: "user",
          content: `Utterance: "${text}"\nSpeaker: ${options.speaker ?? "unknown"}\nRep talk ratio: ${(options.repTalkRatio ?? 0.5).toFixed(2)}\nRecent:\n${recentContext.slice(0, 400)}`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content?.trim();
    if (!raw) return heuristic ?? { class: "general", confidence: 0.5, trigger: false };

    const parsed = JSON.parse(raw) as Partial<ClassifierResult>;
    const className = (parsed.class ?? "general") as UtteranceClass;
    const confidence = Math.max(0, Math.min(1, parsed.confidence ?? 0.7));
    const trigger =
      typeof parsed.trigger === "boolean"
        ? parsed.trigger
        : shouldTrigger(className);

    return { class: className, confidence, trigger };
  } catch (err) {
    console.error("[classify] model fallback:", err);
    return heuristic ?? { class: "general", confidence: 0.5, trigger: false };
  }
}
