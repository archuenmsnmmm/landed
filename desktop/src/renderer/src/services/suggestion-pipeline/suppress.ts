import { suggestionsNearlyIdentical } from "./format";
import type { SuppressionInput, SuppressionResult } from "./types";

/**
 * Suppression logic — avoid distracting updates.
 */
export function shouldSuppressSuggestion(input: SuppressionInput): SuppressionResult {
  const minConfidence = input.minConfidence ?? 0.45;

  if (input.conversationPaused) {
    return { suppress: true, reason: "conversation_paused" };
  }

  if (input.userSpeaking) {
    return { suppress: true, reason: "user_speaking" };
  }

  if (input.confidence < minConfidence) {
    return { suppress: true, reason: "low_confidence" };
  }

  if (
    input.alreadyAnsweredKey &&
    input.currentTriggerKey &&
    input.alreadyAnsweredKey === input.currentTriggerKey
  ) {
    return { suppress: true, reason: "already_answered" };
  }

  if (
    input.previousSuggestion &&
    input.candidateText &&
    suggestionsNearlyIdentical(input.previousSuggestion, input.candidateText)
  ) {
    return { suppress: true, reason: "nearly_identical" };
  }

  return { suppress: false };
}
