import type { UtteranceClass } from "@/lib/utterance-classifier";

export const SUBPROMPTS: Record<string, string> = {
  question: `The prospect asked a direct question. Reply with the exact words the rep should say — under 20 words. No quotes, labels, or preamble. Never invent product or pricing facts.`,

  objection: `Use LAARC: acknowledge briefly, ask one clarifying question, then respond with a concise reframe — not a defensive rebuttal.`,

  discovery_opener: `Suggest ONE sharp discovery question to qualify pain, budget, authority, or timeline. Under 15 words.`,

  pricing_signal: `Anchor on value before price. Ask what's driving the concern, then reconnect to ROI in their terms. Short.`,

  buying_signal: `Positive signal: reinforce fit with one proof point and ask a closing question.`,

  competitive_intel: `Differentiate calmly with honest, specific strengths — never invent facts about the competitor.`,

  follow_up: `Deepen the previous answer with one concrete detail or metric. Under 20 words.`,

  general: `Give ONE thing to say right now — under 20 words. No preamble.`,
};

export function subpromptForClass(utteranceClass: UtteranceClass): string {
  return SUBPROMPTS[utteranceClass] ?? SUBPROMPTS.general;
}

export function formatRagBlock(
  chunks: Array<{ documentName: string; content: string }>,
): string {
  if (!chunks.length) return "";
  const body = chunks
    .map((c, i) => `[${i + 1}] (${c.documentName})\n${c.content}`)
    .join("\n\n");
  return `RELEVANT PLAYBOOK EXCERPTS (ground every factual claim in these — do not invent beyond them):\n${body}`;
}
