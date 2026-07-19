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

export function hasObjectionSignal(text: string): boolean {
  return OBJECTION_PATTERN.test(normalizeTranscriptText(text));
}
