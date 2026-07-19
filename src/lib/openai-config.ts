/** Server-side OpenAI model + token limits. */
export const OPENAI_MODELS = {
  chat: "gpt-4o-mini",
  whisper: "whisper-1",
  vision: "gpt-4o-mini",
  /** Paid coding answers — cheapest solid interview model. */
  coding: "gpt-4.1-mini",
  /** Async endpoints with no latency pressure. */
  summary: "gpt-4o",
  embedding: "text-embedding-3-small",
} as const;

export const OPENAI_LIMITS = {
  suggestMaxTokens: 160,
  suggestStreamMaxTokens: 160,
  followUpMaxTokens: 160,
  recapMaxTokens: 300,
  /** Vision asks — enough for a full code solution when the screen shows one. */
  assistMaxTokens: 2_500,
  assistRecapMaxTokens: 400,
  codingMaxTokens: 3_500,
  summaryMaxTokens: 600,
  screenOcrMaxTokens: 500,
  screenOcrMaxChars: 2_400,
  /** Max JPEG payload for vision assist (~2 MB decoded). */
  assistMaxImageBytes: 2 * 1024 * 1024,
  transcriptLines: 6,
  transcriptChars: 12_000,
} as const;

export function formatRecentTranscript<
  T extends { speaker: string; text: string },
>(transcript: T[], limit = OPENAI_LIMITS.transcriptLines): string {
  return transcript
    .slice(-limit)
    .map((t) => `${t.speaker}: ${t.text}`)
    .join("\n");
}

export function truncateTranscriptForPrompt<
  T extends { speaker: string; text: string },
>(transcript: T[], maxChars = OPENAI_LIMITS.transcriptChars): string {
  if (transcript.length === 0) return "(empty)";

  const formatted = transcript.map((t) => `${t.speaker}: ${t.text}`);
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
