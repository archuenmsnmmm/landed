/** Central OpenAI model + token limits — keep bills low without hurting live UX. */
export const OPENAI_MODELS = {
  /** General asks — cheapest solid multimodal model. */
  chat: "gpt-4o-mini",
  /** Screen OCR / lightweight vision. */
  vision: "gpt-4o-mini",
  /**
   * Coding answers (Pro/Lifetime only). Free plan always uses `chat` (gpt-4o-mini).
   * Cheapest model that still writes solid interview solutions.
   */
  coding: "gpt-4.1-mini",
  whisper: "whisper-1",
} as const;

export const OPENAI_LIMITS = {
  /** Live overlay — enough for a STAR scaffold without cutting mid-sentence. */
  suggestMaxTokens: 140,
  suggestStreamMaxTokens: 160,
  /** Vision asks — enough for a full code solution when the screen shows one. */
  assistMaxTokens: 2_500,
  assistRecapMaxTokens: 400,
  /** Kept for API coding mode if used server-side. */
  codingMaxTokens: 3_500,
  summaryMaxTokens: 600,
  transcriptLinesForAssist: 8,
  transcriptCharsForSummary: 24_000,
  liveCoachingKnowledgeChars: 4_000,
  /** Overlay auto-suggest — compact coaching context budget. */
  instantCoachingKnowledgeChars: 2_000,
  /** Min gap between auto-suggestions (direct questions use questionCooldownMs). */
  suggestionCooldownMs: 1_800,
  questionSuggestionCooldownMs: 500,
} as const;

export function truncateTranscriptForPrompt(
  lines: Array<{ speaker: string; text: string }>,
  maxChars = OPENAI_LIMITS.transcriptCharsForSummary,
): string {
  if (lines.length === 0) return "(empty)";

  const formatted = lines.map((l) => `${l.speaker}: ${l.text}`);
  let total = 0;
  const kept: string[] = [];

  for (let i = formatted.length - 1; i >= 0; i--) {
    const line = formatted[i]!;
    if (total + line.length + 1 > maxChars && kept.length > 0) break;
    kept.unshift(line);
    total += line.length + 1;
  }

  return kept.join("\n");
}
