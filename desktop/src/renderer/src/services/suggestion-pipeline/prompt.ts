import {
  buildCopilotSystemPrompt,
  buildCopilotUserPrompt,
  hintFormatReminder,
} from "../../lib/copilot-prompts";
import type { ContentHint } from "../../lib/suggestion-types";
import type { BuiltContext, ClassifiedUtterance } from "./types";
import { formatContextBrief } from "./context";

export interface ConstructedPrompt {
  system: string;
  user: string;
  hint: ContentHint;
  /** Sales path keeps JSON scoring via /api/suggest. */
  useSalesJson: boolean;
}

/**
 * Prompt construction — style/length live in the prompt, not the UI.
 */
export function constructSuggestionPrompt(opts: {
  product: string;
  objections: string;
  coachingContext?: string;
  context: BuiltContext;
  classified: ClassifiedUtterance;
  hint: ContentHint;
  manualAction?: string;
}): ConstructedPrompt {
  const hint = opts.hint;
  const useSalesJson = hint === "sales";

  const system = buildCopilotSystemPrompt(
    opts.product,
    opts.objections,
    opts.coachingContext,
  );

  const brief = formatContextBrief(opts.context, opts.classified);
  const baseUser = buildCopilotUserPrompt(
    opts.context.currentQuestion,
    opts.context.transcriptBlock,
    opts.context.screenBlock || "SCREEN CONTENT:\n(none captured)",
    {
      micOnly: opts.context.micOnly,
      hint,
      manualAction: opts.manualAction,
    },
  );

  const user = `${baseUser}

CONTEXT BRIEF:
${brief}

Format reminder: ${hintFormatReminder(hint)}

OUTPUT SCHEMA (return ONLY valid JSON, no markdown fences):
{
  "shouldSuggest": true,
  "priority": "high" | "medium" | "low",
  "responseType": "direct_answer" | "star_story" | "bullets" | "technical" | "sales" | "negotiation" | "follow_up",
  "title": "Answer",
  "mainResponse": "Primary speakable answer, 15–50 words",
  "supportingPoints": ["optional short bullet", "optional short bullet"],
  "followUp": "Optional one-line hint if they ask for details",
  "confidence": 0.0,
  "expiresAfterMs": 12000,
  "replacePrevious": true
}

Rules for fields:
- mainResponse is what the candidate should say or do in a technical interview (largest UI text). Keep 15–50 words.
- supportingPoints: 0–4 brief bullets (a few words each). Use for approach / complexity / edge-case lists.
- followUp: optional single short sentence for “If they ask for details…”
- title: short label only (Answer, Suggested response, Quick answer, Response)
- Never invent company, role, or problem facts not in USER CONTEXT or on screen
- If the moment is not worth coaching, set shouldSuggest to false and leave mainResponse empty`;

  return { system, user, hint, useSalesJson };
}
