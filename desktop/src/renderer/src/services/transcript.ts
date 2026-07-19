import type { TranscriptLine } from "./ai";

const LANGUAGE_MAP: Record<string, string> = {
  English: "en-US",
  Spanish: "es-ES",
  French: "fr-FR",
  German: "de-DE",
  Portuguese: "pt-BR",
  Chinese: "zh-CN",
  Japanese: "ja-JP",
};

export function speechLangFromSetting(meetingLanguage: string): string {
  return LANGUAGE_MAP[meetingLanguage] ?? "en-US";
}

export function normalizeTranscriptText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

const OBJECTION_PATTERN =
  /\b(price|pricing|cost|budget|expensive|too much|concern|worried|not sure|already have|competitor|contract|security|compliance)\b/i;

/** Detect direct questions — including mid-sentence and common call phrases. */
export function isDirectQuestion(text: string): boolean {
  const t = normalizeTranscriptText(text).toLowerCase();
  if (!t || t.length < 4) return false;
  if (/\?/.test(t)) return true;
  if (
    /^(what|how|why|when|where|who|which|can|could|would|will|should|is|are|am|was|were|do|does|did|have|has|tell)\b/.test(
      t,
    )
  ) {
    return true;
  }
  if (
    /\b(can you|could you|would you|will you|do you|does it|are you|is it|what about|how much|how does|why would|tell me|hear me|you there|anyone there|still there)\b/.test(
      t,
    )
  ) {
    return true;
  }
  return false;
}

/** Heuristic for mic-only capture when speakers aren't separated. */
export function isLikelyProspectUtterance(text: string): boolean {
  const trimmed = normalizeTranscriptText(text);
  if (trimmed.length < 8) return false;
  if (isDirectQuestion(trimmed)) return true;
  if (OBJECTION_PATTERN.test(trimmed)) return true;
  return /\b(we're|we are|our team|my team|our budget|already using|competitor|gong|salesforce|hubspot|think about|check with|need to check|send over|not ready|next quarter|team first|team approval)\b/i.test(
    trimmed,
  );
}

export function pickAutoAction(text: string): import("./ai").QuickAction | null {
  const trimmed = normalizeTranscriptText(text);
  if (!trimmed) return null;
  if (OBJECTION_PATTERN.test(trimmed)) return "objection";
  if (isDirectQuestion(trimmed)) return "say";
  if (trimmed.length >= 12) return "assist";
  return null;
}

export function buildLiveDisplayText(
  lines: TranscriptLine[],
  interim?: string,
  maxChars = 120,
): string {
  const interimTrimmed = normalizeTranscriptText(interim ?? "");
  const last = lines[lines.length - 1];
  const lastText = last ? normalizeTranscriptText(last.text) : "";

  if (interimTrimmed && interimTrimmed !== "…") {
    return interimTrimmed.slice(-maxChars);
  }

  if (lastText) {
    const clipped = lastText.slice(-maxChars);
    return interimTrimmed === "…" ? `${clipped} …` : clipped;
  }

  return interimTrimmed === "…" ? "…" : "";
}

/** Whether a finalized line should trigger an auto-suggestion in the overlay. */
export function shouldAutoSuggestLine(
  line: TranscriptLine,
  hasSystemAudio: boolean,
  hasMic: boolean,
): boolean {
  const text = normalizeTranscriptText(line.text);
  if (!text) return false;
  if (line.speaker === "Prospect") return true;
  if (isDirectQuestion(text)) return true;
  // Interview task verbs spoken aloud ("implement BFS", "design an LRU cache").
  if (
    /\b(implement|design|debug|explain|compare|optimize|walk (me )?through|tell me about)\b/i.test(
      text,
    )
  ) {
    return true;
  }
  if (!hasSystemAudio && hasMic && text.length >= 15) return true;
  return false;
}

/** Stable key for deduping suggestion triggers. */
export function suggestionTriggerKey(text: string): string {
  const normalized = normalizeTranscriptText(text).toLowerCase();
  if (!normalized) return "";
  return isDirectQuestion(text) ? `q:${normalized}` : `s:${normalized}`;
}

/** Whether live/interim text should fire a suggestion while still speaking.
 * Prefer waiting for speech-end + silence; only fire early for complete questions. */
export function shouldSuggestFromInterim(text: string): boolean {
  const normalized = normalizeTranscriptText(text);
  if (normalized.length < 12) return false;
  // Require a terminal mark so we don't fire mid-question ("Can you implement…").
  if (!/[?!.]$/.test(normalized)) return false;
  return isDirectQuestion(normalized);
}

export function autoTriggerDelayMs(text: string, isInterim: boolean): number | null {
  const action = pickAutoAction(text);
  if (!action) return null;
  // Interim questions wait longer so speech can finish (~question-end silence).
  if (isDirectQuestion(text)) return isInterim ? 550 : 40;
  if (action === "objection") return isInterim ? 400 : 80;
  return isInterim ? 500 : 280;
}

/** Include in-progress speech so OpenAI can respond before final recognition. */
export function buildLiveTranscript(
  lines: TranscriptLine[],
  interim?: string,
): TranscriptLine[] {
  const trimmedInterim = normalizeTranscriptText(interim ?? "");
  if (!trimmedInterim) return lines;

  const last = lines[lines.length - 1];
  if (last && normalizeTranscriptText(last.text).toLowerCase() === trimmedInterim.toLowerCase()) {
    return lines;
  }

  return [
    ...lines,
    {
      id: "interim-live",
      speaker: "Prospect",
      text: trimmedInterim,
      timestamp: last?.timestamp ?? 0,
    },
  ];
}
