import type { ContentHint } from "../../lib/suggestion-types";
import type { TranscriptLine } from "../ai";

/** Completed-utterance event types (perception → decision). */
export type UtteranceEventType =
  | "question"
  | "technical_question"
  | "behavioral_question"
  | "greeting"
  | "command"
  | "small_talk"
  | "follow_up"
  | "objection"
  | "silence"
  | "interruption"
  | "statement";

/** Estimated speaker intent with confidence. */
export type SpeakerIntent =
  | "testing_knowledge"
  | "checking_experience"
  | "making_conversation"
  | "negotiating"
  | "giving_instructions"
  | "raising_objection"
  | "buying_signal"
  | "unknown";

export interface ClassifiedUtterance {
  text: string;
  speaker: TranscriptLine["speaker"];
  event: UtteranceEventType;
  eventConfidence: number;
  intent: SpeakerIntent;
  intentConfidence: number;
  hint: ContentHint;
}

export interface ConversationSnapshot {
  lines: TranscriptLine[];
  interim?: string;
  /** Rolling window kept for active context (seconds). */
  windowSec?: number;
}

export interface BuiltContext {
  currentQuestion: string;
  previousAnswer?: string;
  topic?: string;
  conversationSummary?: string;
  transcriptBlock: string;
  screenBlock: string;
  micOnly: boolean;
}

export type LayoutKind =
  | "short"
  | "bullets"
  | "star"
  | "code"
  | "math"
  | "mcq"
  | "email"
  | "sales"
  | "general";

export type ResponseType =
  | "direct_answer"
  | "star_story"
  | "bullets"
  | "technical"
  | "sales"
  | "negotiation"
  | "follow_up";

export interface StructuredSuggestion {
  /** Whether the client should show this card. */
  shouldSuggest: boolean;
  priority: "low" | "medium" | "high";
  responseType: ResponseType;
  /** Small label above the main text (Answer / Suggested response / …). */
  title: string;
  /** Primary speakable answer — largest text. */
  summary: string;
  /** Optional key points / STAR beats. */
  bullets?: string[];
  /** Optional “If they ask for details…” line. */
  followUp?: string;
  confidence: number;
  expiresAfterMs: number;
  replacePrevious: boolean;
  layout: LayoutKind;
  /** Flat text for storage / near-duplicate checks. */
  rawText: string;
}

export interface TriggerResult {
  shouldGenerate: boolean;
  reason: string;
  hint: ContentHint;
  classified: ClassifiedUtterance;
  triggerKey: string;
}

export interface SuppressionInput {
  userSpeaking: boolean;
  conversationPaused: boolean;
  confidence: number;
  previousSuggestion?: string;
  candidateText?: string;
  alreadyAnsweredKey?: string | null;
  currentTriggerKey?: string;
  /** Min confidence to show a suggestion (0–1). */
  minConfidence?: number;
}

export interface SuppressionResult {
  suppress: boolean;
  reason?: string;
}

export interface PipelineGenerateInput {
  triggerText: string;
  line?: TranscriptLine;
  transcript: TranscriptLine[];
  screenContent?: string;
  hasSystemAudio: boolean;
  hasMic: boolean;
  userSpeaking?: boolean;
  conversationPaused?: boolean;
  /** Milliseconds of silence after the last speech end (audio turn-taking). */
  silenceMs?: number;
  product?: string;
  objections?: string;
  coachingContext?: string;
  lastTriggerKey?: string | null;
  lastSuggestionText?: string;
  lastSuggestionAt?: number;
  manual?: boolean;
  signal?: AbortSignal;
  onChunk?: (text: string) => void;
}

export interface PipelineGenerateResult {
  suggestion: string;
  structured: StructuredSuggestion;
  health: number;
  talkRatio: number;
  missing: {
    budget: boolean;
    decisionMaker: boolean;
    timeline: boolean;
    nextStep: boolean;
  };
  hint: ContentHint;
  triggerKey: string;
  classified: ClassifiedUtterance;
  suppressed?: boolean;
  suppressReason?: string;
}
