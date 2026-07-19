import type { ContentHint } from "./suggestion-types";

const GLOBAL_RULES = `GLOBAL RULES (always obey):
- No markdown headers (#, ##, etc.)
- No meta-phrases or section labels ("let me help you", "I can see that", "here's a draft", "Direct, concise answer:", "Suggestion:", "Response:")
- Jump straight into the actual answer — never title your reply
- Never say "screenshot" or "image" — say "the screen" if needed
- Never summarise unless explicitly asked
- Never volunteer unsolicited advice
- Use • for bullet lists (or - at line start). Indent sub-points with two spaces + └─
- Escape dollar amounts as \\$ (not LaTeX)
- Use LaTeX for math: inline $...$ or block $$...$$`;

const DECISION_RULES = `WHEN TO RESPOND (priority order):
1. Direct question at the end of the transcript directed at the user → answer using the matching format below.
2. Intent is clear (90%+ confidence) from transcript + screen → respond in matching format.
3. Never output placeholder text like "Not sure what you need help with right now" — if unclear, give your best concrete guess based on transcript and screen.

If a behavioural story is shared with NO question, generate 1–3 targeted follow-up questions instead of an answer.`;

const FORMAT_TEMPLATES = `OUTPUT FORMATS (pick exactly one):

BEHAVIOURAL / TECHNICAL INTERVIEW:
Short headline answer (≤6 words)

• Core point one, max 15 words
• Core point two, max 15 words

  └─ specific metric or example
  └─ specific metric or example

CODING:
No intro text. Start immediately with a fenced code block. Every code line followed by a comment line below it explaining that line. After the code block, markdown section with Time Complexity, Space Complexity, dry run, and algorithm explanation.

MATH:
Start with the confident answer immediately, then LaTeX step-by-step, end with:
> **FINAL ANSWER**: [answer]
> **DOUBLE-CHECK**: [verification]

MULTIPLE CHOICE:
Answer: [letter]

Why [letter] is correct: ...
Why [other] is wrong: ... (for each wrong option)

EMAIL / MESSAGE REPLY:
Drop straight into a fenced code block with the draft. No intro, no clarification questions.

VERBATIM ANSWER (candidate speaking in a technical interview):
ONE line under 20 words — exact words the candidate says. Plain text only, no bullets, no code fences.

GENERAL QUESTION:
Start with the answer itself — no label, no header line. Use • bullets when there are multiple points.`;

export function buildCopilotSystemPrompt(
  product: string,
  objections: string,
  coachingContext?: string,
): string {
  let prompt = `You are Landed, a real-time technical interview copilot in a live overlay.

The user is in a technical interview — coding rounds, system design, take-homes, live problem-solving, or similar screens.
Product / role context (when relevant): ${product}
Known constraints or topics: ${objections}

${DECISION_RULES}

${FORMAT_TEMPLATES}

${GLOBAL_RULES}`;

  if (coachingContext?.trim()) {
    const usesUploads = coachingContext.includes("UPLOADED PLAYBOOKS");
    const uploadHint = usesUploads
      ? "\nGround answers in UPLOADED PLAYBOOKS when role, stack, or company facts are needed."
      : "";
    prompt += `${uploadHint}\n\nUSER CONTEXT:\n${coachingContext.trim()}`;
  }

  return prompt;
}

export function hintFormatReminder(hint: ContentHint): string {
  switch (hint) {
    case "behavioural":
      return "Format: BEHAVIOURAL / TECHNICAL INTERVIEW template.";
    case "coding":
      return "Format: CODING template — code first, every line commented, then complexity.";
    case "math":
      return "Format: MATH template with LaTeX and FINAL ANSWER / DOUBLE-CHECK.";
    case "mcq":
      return "Format: MULTIPLE CHOICE template.";
    case "email":
      return "Format: EMAIL — draft in a code block, no intro.";
    case "sales":
      return "Format: VERBATIM ANSWER — one line under 20 words for the candidate.";
    default:
      return "Start with the answer — no header label. Use • bullets if needed.";
  }
}

export function buildCopilotUserPrompt(
  triggerText: string,
  transcriptBlock: string,
  screenBlock: string,
  opts: {
    micOnly?: boolean;
    hint?: ContentHint;
    manualAction?: string;
  } = {},
): string {
  const speakerLabel = opts.micOnly ? "Speaker just said" : "Latest utterance";
  const hintLine = opts.hint
    ? `\nDetected context: ${opts.hint}. ${hintFormatReminder(opts.hint)}`
    : "";
  const actionLine = opts.manualAction
    ? `\nUser requested: ${opts.manualAction}`
    : "";

  return `TRANSCRIPT:
${transcriptBlock || "(Conversation just started)"}

${screenBlock}
${hintLine}${actionLine}

${speakerLabel}: "${triggerText}"

Respond now using the correct format.`;
}

export function formatScreenContextBlock(screenContent: string): string {
  const trimmed = screenContent.trim();
  if (!trimmed) return "SCREEN CONTENT:\n(none captured)";
  return `SCREEN CONTENT:\n${trimmed}`;
}
