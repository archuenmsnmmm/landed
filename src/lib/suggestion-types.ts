import type { TranscriptLine } from "@/types/landed";
import {
  hasObjectionSignal,
  isDirectQuestion,
  normalizeTranscriptText,
} from "./text-utils";

export type ContentHint =
  | "behavioural"
  | "coding"
  | "math"
  | "mcq"
  | "email"
  | "interview"
  | "sales"
  | "general";

export const FALLBACK_UNCLEAR_SCREEN =
  "I'm not sure what information you're looking for.\n---\nMy guess is that you might want help with what's visible on the screen.";

export const FALLBACK_IDLE_MEETING =
  "Not sure what you need help with right now.";

const BUYING_SIGNAL_PATTERN =
  /\b(ready to move|let's do it|send the contract|when can we start|sounds good|interested|next steps|move forward|sign up|purchase|trial|pilot)\b/i;

const BEHAVIOURAL_PATTERN =
  /\b(tell me about a time|describe a situation|give me an example|walk me through a time|biggest challenge|greatest weakness|why should we hire|how do you handle conflict|star method)\b/i;

const CODING_PATTERN =
  /\b(implement|algorithm|leetcode|time complexity|space complexity|binary tree|data structure|write a (program|function)|code solution|array|string|hash\s*map|dynamic programming|recursion)\b/i;

const MATH_PATTERN =
  /\b(solve|equation|integral|derivative|probability|calculate|prove that|find the value|simplify|factor|polynomial|matrix)\b/i;

const MCQ_PATTERN =
  /\b(which of the following|select the correct|choose the best)\b|[\(\[]\s*[A-D]\s*[\)\]]|(?:^|\s)[A-D][\.\)]\s/i;

const EMAIL_PATTERN =
  /\b(dear |hi |hello |subject:|thanks for your email|following up on|hope this email|best regards)\b/i;

const INTERVIEW_PATTERN =
  /\b(interview|role|position|team|experience|strength|weakness|hire|cv|resume|job description|culture fit|tell me about yourself|why this company|salary)\b/i;

const SCREEN_DEV_PATTERN =
  /(?:function|const |import |export |class |def |typescript|javascript|\.tsx|\.ts|\.py|cursor|vscode|github|npm|error:|warning:|console\.|async |return |interface )/i;

export function isScreenUnclear(screenContent: string): boolean {
  const t = screenContent.trim();
  if (!t) return true;
  if (t.length < 40) return true;
  if (/^(no (readable )?text|unable to|error|none captured)/i.test(t)) return true;
  return false;
}

export function hasReadableScreenContext(screenContent: string): boolean {
  const t = screenContent.trim();
  if (!t || isScreenUnclear(t)) return false;
  if (SCREEN_DEV_PATTERN.test(t)) return true;
  if (CODING_PATTERN.test(t) || MATH_PATTERN.test(t) || MCQ_PATTERN.test(t)) return true;
  return t.length >= 80;
}

export function hasInterviewSignal(text: string): boolean {
  const t = normalizeTranscriptText(text);
  return (
    BEHAVIOURAL_PATTERN.test(t) ||
    INTERVIEW_PATTERN.test(t) ||
    hasObjectionSignal(t) ||
    BUYING_SIGNAL_PATTERN.test(t)
  );
}

/** @deprecated Use hasInterviewSignal */
export function hasSalesSignal(text: string): boolean {
  return hasInterviewSignal(text);
}

export function detectContentHint(
  text: string,
  screenContent = "",
  preferInterview = true,
): ContentHint {
  const t = normalizeTranscriptText(text);
  const combined = `${t}\n${screenContent}`;

  if (BEHAVIOURAL_PATTERN.test(combined)) return "behavioural";
  if (SCREEN_DEV_PATTERN.test(screenContent) || CODING_PATTERN.test(combined)) {
    return "coding";
  }
  if (MATH_PATTERN.test(combined)) return "math";
  if (MCQ_PATTERN.test(combined)) return "mcq";
  if (EMAIL_PATTERN.test(combined) && !preferInterview) return "email";
  if (hasInterviewSignal(t) || isDirectQuestion(t) || preferInterview) {
    return "interview";
  }
  return "general";
}

export function maxTokensForHint(hint: ContentHint): number {
  switch (hint) {
    case "coding":
      return 1600;
    case "math":
      return 900;
    case "behavioural":
    case "interview":
    case "sales":
    case "mcq":
      return 700;
    case "email":
      return 500;
    case "sales":
      return 128;
    default:
      return 600;
  }
}

export function hasStrongIntent(text: string, screenContent = ""): boolean {
  const t = normalizeTranscriptText(text);
  const combined = `${t}\n${screenContent}`.toLowerCase();
  if (!t) return false;
  if (isDirectQuestion(t)) return true;
  if (hasSalesSignal(t)) return true;
  if (BEHAVIOURAL_PATTERN.test(t)) return true;
  if (CODING_PATTERN.test(combined)) return true;
  if (MATH_PATTERN.test(combined)) return true;
  if (MCQ_PATTERN.test(combined)) return true;
  if (EMAIL_PATTERN.test(combined)) return true;
  return false;
}

export function hasMeetingContext(transcript: TranscriptLine[]): boolean {
  return transcript.some((l) => normalizeTranscriptText(l.text).length >= 8);
}

export type SuggestionTriggerDecision =
  | { kind: "generate"; hint: ContentHint }
  | { kind: "fallback"; text: string }
  | { kind: "silence" };

export interface EvaluateTriggerInput {
  triggerText: string;
  line?: TranscriptLine;
  transcript: TranscriptLine[];
  screenContent: string;
  hasSystemAudio: boolean;
  hasMic: boolean;
  manual?: boolean;
}

export function evaluateSuggestionTrigger(
  input: EvaluateTriggerInput,
): SuggestionTriggerDecision {
  const text = normalizeTranscriptText(input.triggerText);
  if (!text || text === "…" || text.length < 3) {
    return { kind: "silence" };
  }

  if (input.manual) {
    return {
      kind: "generate",
      hint: detectContentHint(text, input.screenContent, input.hasSystemAudio),
    };
  }

  const question = isDirectQuestion(text);
  const strong = hasStrongIntent(text, input.screenContent);
  const screenUsable = hasReadableScreenContext(input.screenContent);
  const preferInterview =
    input.hasSystemAudio &&
    (input.line?.speaker === "Interviewer" ||
      input.line?.speaker === "Prospect" ||
      hasSalesSignal(text));

  if (question || strong) {
    return {
      kind: "generate",
      hint: detectContentHint(text, input.screenContent, preferInterview),
    };
  }

  if (
    input.hasSystemAudio &&
    (input.line?.speaker === "Interviewer" || input.line?.speaker === "Prospect") &&
    text.length >= 8
  ) {
    return {
      kind: "generate",
      hint: detectContentHint(text, input.screenContent, true),
    };
  }

  if (screenUsable && text.length >= 5) {
    return {
      kind: "generate",
      hint: detectContentHint(text, input.screenContent, false),
    };
  }

  if (!input.hasSystemAudio && input.hasMic && question) {
    return {
      kind: "generate",
      hint: detectContentHint(text, input.screenContent, false),
    };
  }

  return { kind: "silence" };
}

export function shouldAutoSuggestLine(
  line: TranscriptLine,
  hasSystemAudio: boolean,
  hasMic: boolean,
): boolean {
  const text = normalizeTranscriptText(line.text);
  if (!text) return false;
  if (isDirectQuestion(text)) return true;
  if (hasStrongIntent(text)) return true;
  if (
    (line.speaker === "Interviewer" || line.speaker === "Prospect") &&
    hasSystemAudio
  ) {
    return text.length >= 8;
  }
  if (!hasSystemAudio && hasMic && text.length >= 8) return true;
  return false;
}

export { isDirectQuestion, normalizeTranscriptText } from "./text-utils";
