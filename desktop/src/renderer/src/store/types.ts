export type ConversationMode =
  | "sales"
  | "discovery"
  | "demo"
  | "negotiation"
  | "enterprise"
  /** @deprecated Legacy interview modes — migrated to sales on load. */
  | "interview"
  | "behavioural"
  | "technical"
  | "graduate"
  | "management";

/** Restored sales coaching mode type (kept as an alias so existing ConversationMode consumers keep working). */
export type SalesMode = ConversationMode;

export type Plan = "free" | "solo" | "pro" | "undetectable" | "lifetime";

/** Free tier: hard cap on AI asks. Paid plans are unlimited. */
export const FREE_QUESTION_LIMIT = 15;

/**
 * Legacy free overlay-on time (seconds). Kept for migrating old accounts that
 * already exhausted the previous 10-minute free trial into question exhaustion.
 */
export const FREE_OVERLAY_LIMIT_SECONDS = 10 * 60;

/** Legacy session limit — used only when migrating persisted state. */
const LEGACY_FREE_SESSION_LIMIT = 3;

export function isPaidPlan(plan: Plan): boolean {
  return plan !== "free";
}

/** Convert legacy session counts to overlay seconds for migration. */
export function migrateLegacyFreeSessionsUsed(freeSessionsUsed: number): number {
  if (freeSessionsUsed >= LEGACY_FREE_SESSION_LIMIT) {
    return FREE_OVERLAY_LIMIT_SECONDS;
  }
  return Math.min(
    freeSessionsUsed * 600,
    FREE_OVERLAY_LIMIT_SECONDS,
  );
}

export function resolveFreeOverlaySecondsUsed(
  freeOverlaySecondsUsed: number | undefined,
  legacyFreeSessionsUsed: number | undefined,
): number {
  if (typeof freeOverlaySecondsUsed === "number" && freeOverlaySecondsUsed > 0) {
    return Math.max(0, freeOverlaySecondsUsed);
  }
  if (typeof legacyFreeSessionsUsed === "number" && legacyFreeSessionsUsed > 0) {
    return migrateLegacyFreeSessionsUsed(legacyFreeSessionsUsed);
  }
  return Math.max(0, freeOverlaySecondsUsed ?? 0);
}

/** Resolve free questions used, migrating exhausted legacy overlay time. */
export function resolveFreeQuestionsUsed(
  freeQuestionsUsed: number | undefined,
  freeOverlaySecondsUsed: number | undefined,
): number {
  if (typeof freeQuestionsUsed === "number" && freeQuestionsUsed > 0) {
    return Math.min(FREE_QUESTION_LIMIT, Math.max(0, freeQuestionsUsed));
  }
  if ((freeOverlaySecondsUsed ?? 0) >= FREE_OVERLAY_LIMIT_SECONDS) {
    return FREE_QUESTION_LIMIT;
  }
  return Math.max(0, freeQuestionsUsed ?? 0);
}

export function canStartSession(
  plan: Plan,
  freeQuestionsUsed: number,
): boolean {
  return isPaidPlan(plan) || freeQuestionsUsed < FREE_QUESTION_LIMIT;
}

export function getFreeQuestionsRemaining(
  plan: Plan,
  freeQuestionsUsed: number,
): number {
  if (isPaidPlan(plan)) return Number.POSITIVE_INFINITY;
  return Math.max(0, FREE_QUESTION_LIMIT - freeQuestionsUsed);
}

export function isFreeQuestionsExhausted(
  plan: Plan,
  freeQuestionsUsed: number,
): boolean {
  return !isPaidPlan(plan) && freeQuestionsUsed >= FREE_QUESTION_LIMIT;
}

/** @deprecated Use isFreeQuestionsExhausted — kept for older imports. */
export function isFreeOverlayExhausted(
  plan: Plan,
  freeOverlayOrQuestionsUsed: number,
): boolean {
  return isFreeQuestionsExhausted(plan, freeOverlayOrQuestionsUsed);
}

export function canBypassPaywall(
  plan: Plan,
  freeQuestionsUsed: number,
): boolean {
  return isPaidPlan(plan) || freeQuestionsUsed < FREE_QUESTION_LIMIT;
}

export function formatFreeQuestionsRemaining(remaining: number): string {
  if (remaining <= 0) return "0 questions left";
  if (remaining === 1) return "1 question left";
  return `${remaining} questions left`;
}

/** @deprecated Use formatFreeQuestionsRemaining. */
export function formatFreeOverlayRemaining(secondsOrQuestions: number): string {
  // Older UI passed seconds; new UI passes question counts under ~100.
  if (secondsOrQuestions > FREE_QUESTION_LIMIT) {
    if (secondsOrQuestions <= 0) return "0 min left";
    if (secondsOrQuestions < 60) return "< 1 min left";
    const mins = Math.ceil(secondsOrQuestions / 60);
    return `${mins} min${mins === 1 ? "" : "s"} left`;
  }
  return formatFreeQuestionsRemaining(secondsOrQuestions);
}

export function getFreeOverlaySecondsRemaining(
  plan: Plan,
  freeOverlaySecondsUsed: number,
): number {
  if (isPaidPlan(plan)) return Number.POSITIVE_INFINITY;
  return Math.max(0, FREE_OVERLAY_LIMIT_SECONDS - freeOverlaySecondsUsed);
}

/** Overlay hide-from-screen-share is available on Pro, Lifetime, and grandfathered plans. */
export function canUseDetectabilityToggle(plan: Plan): boolean {
  return (
    plan === "pro" ||
    plan === "lifetime" ||
    plan === "solo" ||
    plan === "undetectable"
  );
}

/** Free shows the overlay on screen share; Pro+ can hide it. */
export function normalizedInvisibleSetting(plan: Plan, invisible: boolean): boolean {
  if (!canUseDetectabilityToggle(plan)) return false;
  return invisible;
}

/** Whether Electron content protection should be enabled (overlay hidden from capture). */
export function effectiveContentProtection(plan: Plan, invisible: boolean): boolean {
  return normalizedInvisibleSetting(plan, invisible);
}

export interface ConversationModeConfig {
  id: ConversationMode;
  name: string;
  description: string;
  systemPrompt: string;
}

/** @deprecated Use ConversationModeConfig */
export type SalesModeConfig = ConversationModeConfig;

/** Other party on the call. "Interviewer" kept for legacy persisted transcripts. */
export type TranscriptSpeaker = "You" | "Prospect" | "Interviewer" | "Other";

export interface TranscriptLine {
  id: string;
  speaker: TranscriptSpeaker;
  text: string;
  timestamp: number;
}

export function isOtherPartySpeaker(speaker: string): boolean {
  return speaker === "Prospect" || speaker === "Interviewer";
}

export function speakerDisplayLabel(speaker: TranscriptSpeaker | string): string {
  if (speaker === "Prospect" || speaker === "Interviewer") return "Prospect";
  if (speaker === "You") return "You";
  return "Other";
}

export type MeetingStatus = "processing" | "ready" | "failed";

export interface SummarySection {
  heading: string;
  items: string[];
  /** When "paragraphs", items render as prose blocks instead of bullet points. */
  format?: "paragraphs" | "bullets";
}

export type SuggestionTag =
  | "objection"
  | "discovery"
  | "closing"
  | "pricing"
  | "competitive"
  | "question"
  | "general"
  /** @deprecated Legacy interview tags */
  | "star"
  | "structure"
  | "difficult_question"
  | "confidence"
  | "followup"
  | "technical";

export type SuggestionSource = "auto" | "assist";

export interface SuggestionRecord {
  id: string;
  text: string;
  tags: SuggestionTag[];
  triggerText?: string;
  transcriptLineId?: string;
  timestamp: number;
  /** Deal health / answer quality 0–100 (legacy field name: health). */
  health?: number;
  source: SuggestionSource;
  /** Whether the rep used this suggestion. */
  repUsed?: boolean;
}

export type DealOutcome = "open" | "won" | "lost" | "stalled" | "no_decision";

export interface DealLink {
  crmId?: string;
  crmType?: "salesforce" | "hubspot" | "manual";
  stage?: string;
  amount?: number;
}

export interface MeetingRecord {
  id: string;
  title: string;
  company: string;
  date: string;
  duration: number;
  mode: ConversationMode;
  summary: string;
  summarySections?: SummarySection[];
  status?: MeetingStatus;
  nextSteps: string[];
  transcript: TranscriptLine[];
  /** Deal health score 0–100 (persisted as deal_score). */
  dealScore: number;
  /** Objections raised during the call. */
  objections: string[];
  /** AI suggestions shown during the live session. */
  suggestionUses?: number;
  /** Tagged response suggestions from the live session. */
  suggestions?: SuggestionRecord[];
  dealOutcome?: DealOutcome;
  dealOutcomeAt?: string;
  dealOutcomeNotes?: string;
  dealLink?: DealLink;
  managerNotes?: string;
}

/** Legacy interview conversation modes → sales coaching modes. */
const LEGACY_MODE_MAP: Record<string, ConversationMode> = {
  interview: "sales",
  behavioural: "discovery",
  technical: "demo",
  graduate: "discovery",
  management: "negotiation",
};

export function normalizeConversationMode(mode: string | undefined | null): ConversationMode {
  if (!mode) return "sales";
  if (
    mode === "sales" ||
    mode === "discovery" ||
    mode === "demo" ||
    mode === "negotiation" ||
    mode === "enterprise"
  ) {
    return mode;
  }
  return LEGACY_MODE_MAP[mode] ?? "sales";
}

export function conversationModeShortLabel(mode: ConversationMode): string {
  const normalized = normalizeConversationMode(mode);
  switch (normalized) {
    case "sales":
      return "Default";
    case "discovery":
      return "Discovery";
    case "demo":
      return "Demo";
    case "negotiation":
      return "Negotiation";
    case "enterprise":
      return "Enterprise";
    default:
      return "Default";
  }
}

/** @deprecated Use conversationModeShortLabel */
export function salesModeShortLabel(mode: ConversationMode): string {
  return conversationModeShortLabel(mode);
}

export interface UpcomingCall {
  id: string;
  title: string;
  company: string;
  datetime: string;
  participants: { name: string; role: string; bio: string }[];
  agenda: string;
  talkingPoints: string[];
  previousContext: string;
}

export interface UserSettings {
  invisible: boolean;
  hideFromTaskbar: boolean;
  autoLaunch: boolean;
  outputLanguage: string;
  meetingLanguage: string;
  /** Preferred language for coding solutions. "Auto" matches the screen. */
  codeLanguage: string;
  displayId: number | null;
  screenshotCapture: boolean;
  ambientAiChat: boolean;
  colorTheme: "system" | "light" | "dark";
  /** When on, Start session plays a canned suggestion flow for demos/videos. */
  demoMode: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

export const CONVERSATION_MODES: ConversationModeConfig[] = [
  {
    id: "sales",
    name: "Technical interview assist",
    description: "Ask about the coding or system-design problem on your screen during a technical interview.",
    systemPrompt:
      "You are Landed, invisible AI for technical interviews. Answer using what’s on the user’s screen. Be concise, practical, and specific. Prefer concrete next steps. No preamble.",
  },
  {
    id: "discovery",
    name: "Coding help",
    description: "Debug errors, explain code, and suggest fixes from the technical interview screen.",
    systemPrompt:
      "You are Landed helping with coding. Use the screen context (errors, files, diffs). Explain briefly, then give the fix or next step. Prefer copy-pasteable answers.",
  },
  {
    id: "demo",
    name: "Docs & research",
    description: "Summarize and answer from what’s open on screen.",
    systemPrompt:
      "You are Landed helping with documents and research on screen. Summarize clearly, answer the question, and cite what’s visible when useful.",
  },
  {
    id: "negotiation",
    name: "Quick answers",
    description: "Short, direct answers for whatever’s on screen.",
    systemPrompt:
      "You are Landed. Give the shortest useful answer based on the screen. No fluff. Under 3 sentences unless code is required.",
  },
  {
    id: "enterprise",
    name: "Work context",
    description: "Docs, tickets, and tools open during take-homes or prep.",
    systemPrompt:
      "You are Landed helping with docs and tools on screen during technical interview prep. Be practical and action-oriented.",
  },
];

/** @deprecated Use CONVERSATION_MODES */
export const SALES_MODES = CONVERSATION_MODES;

export const DEFAULT_UPCOMING: UpcomingCall[] = [];

/** True for meetings saved from a live Landed session (not demo/placeholder data). */
export function isUserMeeting(meeting: MeetingRecord): boolean {
  return meeting.id.startsWith("mtg-");
}

export const DEFAULT_MEETINGS: MeetingRecord[] = [];

export const DEFAULT_SETTINGS: UserSettings = {
  invisible: false,
  hideFromTaskbar: true,
  autoLaunch: false,
  outputLanguage: "English",
  meetingLanguage: "English",
  codeLanguage: "Auto",
  displayId: null,
  screenshotCapture: true,
  ambientAiChat: false,
  colorTheme: "system",
  demoMode: false,
};
