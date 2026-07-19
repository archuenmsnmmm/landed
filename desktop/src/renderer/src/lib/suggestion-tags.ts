import type {
  SuggestionRecord,
  SuggestionSource,
  SuggestionTag,
} from "../store/types";

export function classifySuggestionTags(
  triggerText: string,
  suggestionText: string,
): SuggestionTag[] {
  const combined = `${triggerText} ${suggestionText}`.toLowerCase();
  const tags = new Set<SuggestionTag>();

  if (/\b(price|pricing|budget|cost|expensive|discount|roi)\b/.test(combined)) {
    tags.add("pricing");
  }
  if (
    /\b(gong|salesforce|hubspot|competitor|already using|versus|vs\.?|alternative)\b/.test(
      combined,
    )
  ) {
    tags.add("competitive");
  }
  if (
    /\b(close|next step|sign|contract|move forward|timeline|when can|pilot|proposal)\b/.test(
      combined,
    )
  ) {
    tags.add("closing");
  }
  if (/\?|\b(what|how|why|tell me|walk me through|help me understand)\b/.test(combined)) {
    tags.add("question");
  }
  if (
    /\b(pain|challenge|problem|goal|priority|qualify|discovery|decision maker|authority|stakeholder)\b/.test(
      combined,
    )
  ) {
    tags.add("discovery");
  }
  if (
    /\b(concern|worried|not sure|objection|pushback|hesitat|barrier|blocker)\b/.test(
      combined,
    )
  ) {
    tags.add("objection");
  }

  if (tags.size === 0) tags.add("general");
  return Array.from(tags);
}

export function createSuggestionRecord(params: {
  text: string;
  triggerText?: string;
  transcriptLineId?: string;
  timestamp: number;
  health?: number;
  source: SuggestionSource;
}): SuggestionRecord {
  const text = params.text.trim();
  return {
    id: `sug-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    text,
    tags: classifySuggestionTags(params.triggerText ?? "", text),
    triggerText: params.triggerText,
    transcriptLineId: params.transcriptLineId,
    timestamp: params.timestamp,
    health: params.health,
    source: params.source,
  };
}

export const SUGGESTION_TAG_LABELS: Record<SuggestionTag, string> = {
  objection: "Objection",
  discovery: "Discovery",
  closing: "Closing",
  pricing: "Pricing",
  competitive: "Competitive",
  question: "Question",
  general: "General",
  // Legacy interview tags — kept so old persisted suggestions still render a label.
  star: "STAR",
  structure: "Structure",
  difficult_question: "Difficult question",
  confidence: "Confidence",
  followup: "Follow-up",
  technical: "Technical",
};
