import type { TranscriptLine } from "../services/ai";
import {
  isDirectQuestion,
  normalizeTranscriptText,
  hasObjectionSignal,
} from "./text-utils";

export type ContentHint =
  | "behavioural"
  | "coding"
  | "math"
  | "mcq"
  | "email"
  | "sales"
  | "general";

export type SuggestionTriggerDecision =
  | { kind: "generate"; hint: ContentHint }
  | { kind: "fallback"; text: string }
  | { kind: "silence" };

export const FALLBACK_UNCLEAR_SCREEN =
  "I'm not sure what information you're looking for.\n---\nMy guess is that you might want help with what's visible on the screen.";

export const FALLBACK_IDLE_MEETING =
  "Not sure what you need help with right now.";

const BUYING_SIGNAL_PATTERN =
  /\b(ready to move|let's do it|send the contract|when can we start|sounds good|interested|next steps|move forward|sign up|purchase|trial|pilot)\b/i;

const BEHAVIOURAL_PATTERN =
  /\b(tell me about a time|describe a situation|give me an example|walk me through a time|biggest challenge|greatest weakness|why should we hire|how do you handle conflict|star method)\b/i;

const CODING_PATTERN =
  /\b(implement|design|debug|algorithm|leetcode|time complexity|space complexity|binary tree|data structure|write a (program|function)|code solution|array|string|hash\s*map|dynamic programming|recursion|lru|bfs|dfs)\b/i;

const MATH_PATTERN =
  /\b(solve|equation|integral|derivative|probability|calculate|prove that|find the value|simplify|factor|polynomial|matrix)\b/i;

const MCQ_PATTERN =
  /\b(which of the following|select the correct|choose the best)\b|[\(\[]\s*[A-D]\s*[\)\]]|(?:^|\s)[A-D][\.\)]\s/i;

const EMAIL_PATTERN =
  /\b(dear |hi |hello |subject:|thanks for your email|following up on|hope this email|best regards)\b/i;

const SALES_PATTERN =
  /\b(we're|we are|our team|my team|our budget|already using|competitor|gong|salesforce|hubspot|think about|check with|need to check|send over|not ready|next quarter|team approval|decision maker|procurement)\b/i;

const SCREEN_DEV_PATTERN =
  /(?:function|const |import |export |class |def |typescript|javascript|\.tsx|\.ts|\.py|cursor|vscode|github|npm|error:|warning:|console\.|async |return |interface )/i;

export function hasReadableScreenContext(screenContent: string): boolean {
  const t = screenContent.trim();
  if (!t || isScreenUnclear(t)) return false;
  if (SCREEN_DEV_PATTERN.test(t)) return true;
  if (CODING_PATTERN.test(t) || MATH_PATTERN.test(t) || MCQ_PATTERN.test(t)) return true;
  return t.length >= 80;
}

export function isScreenUnclear(screenContent: string): boolean {
  const t = screenContent.trim();
  if (!t) return true;
  if (t.length < 40) return true;
  if (/^(no (readable )?text|unable to|error|none captured)/i.test(t)) return true;
  return false;
}

export function hasSalesSignal(text: string): boolean {
  const t = normalizeTranscriptText(text);
  return (
    hasObjectionSignal(t) ||
    BUYING_SIGNAL_PATTERN.test(t) ||
    SALES_PATTERN.test(t)
  );
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

export function detectContentHint(
  text: string,
  screenContent = "",
  preferSales = true,
): ContentHint {
  const t = normalizeTranscriptText(text);
  const combined = `${t}\n${screenContent}`;

  if (preferSales && hasSalesSignal(t)) return "sales";
  if (SCREEN_DEV_PATTERN.test(screenContent) || CODING_PATTERN.test(combined)) return "coding";
  if (MATH_PATTERN.test(combined)) return "math";
  if (MCQ_PATTERN.test(combined)) return "mcq";
  if (EMAIL_PATTERN.test(combined)) return "email";
  if (BEHAVIOURAL_PATTERN.test(t)) return "behavioural";
  if (preferSales && isDirectQuestion(t)) return "sales";
  return "general";
}

export function maxTokensForHint(hint: ContentHint): number {
  switch (hint) {
    case "coding":
      return 1600;
    case "math":
      return 900;
    case "behavioural":
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

export interface EvaluateTriggerInput {
  triggerText: string;
  line?: TranscriptLine;
  transcript: TranscriptLine[];
  screenContent: string;
  hasSystemAudio: boolean;
  hasMic: boolean;
  /** Manual Assist bypasses suppression gates. */
  manual?: boolean;
}

/**
 * Auto-suggest gate: generate real help, never push idle/unclear placeholders.
 */
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
  const preferSales =
    input.hasSystemAudio &&
    (input.line?.speaker === "Prospect" || hasSalesSignal(text));

  if (question || strong) {
    return {
      kind: "generate",
      hint: detectContentHint(text, input.screenContent, preferSales),
    };
  }

  // Sales call: prospect spoke — coach the rep (original Landed behaviour).
  if (input.hasSystemAudio && input.line?.speaker === "Prospect" && text.length >= 8) {
    return {
      kind: "generate",
      hint: detectContentHint(text, input.screenContent, true),
    };
  }

  // Mic-only / solo: screen has readable context (code, docs, etc.) + user spoke.
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

/** Whether a finalized line should enter the suggestion pipeline. */
export function shouldAutoSuggestLine(
  line: TranscriptLine,
  hasSystemAudio: boolean,
  hasMic: boolean,
): boolean {
  const text = normalizeTranscriptText(line.text);
  if (!text) return false;
  if (isDirectQuestion(text)) return true;
  if (hasStrongIntent(text)) return true;
  if (line.speaker === "Prospect" && hasSystemAudio) return text.length >= 8;
  if (!hasSystemAudio && hasMic && text.length >= 8) return true;
  return false;
}
