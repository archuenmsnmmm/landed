import type { MeetingRecord, Plan } from "../store/types";
import { isPaidPlan } from "../store/types";

/** Session had enough Landed value to warrant a warm upgrade nudge. */
export function isStrongSession(meeting: MeetingRecord): boolean {
  const suggestions = meeting.suggestions?.length ?? 0;
  const uses = meeting.suggestionUses ?? 0;
  const score = meeting.dealScore ?? 0;
  return suggestions >= 2 || uses >= 2 || score >= 60;
}

/** First discovery coaching moment the rep didn't mark as used. */
export function getMissedQualifierInsight(meeting: MeetingRecord): string | null {
  const suggestions = meeting.suggestions ?? [];
  const missed = suggestions.find(
    (s) => s.tags.includes("discovery") && !s.repUsed,
  );
  if (missed) {
    return missed.text;
  }
  if (meeting.objections.length > 0) {
    return `Interviewer asked: "${meeting.objections[0]}" — worth preparing a stronger answer for next time.`;
  }
  const improvement = meeting.summarySections?.find((s) =>
    /improve|miss|gap|follow.?up|qualif/i.test(s.heading),
  );
  if (improvement?.items[0]) {
    return improvement.items[0].replace(/\*\*/g, "");
  }
  return null;
}

export function getDealScoreLabel(score: number): string {
  if (score >= 80) return "Strong interview";
  if (score >= 60) return "Solid performance";
  if (score >= 40) return "Room to improve";
  return "Keep practicing";
}

export function getWarmUpgradeMessage(meeting: MeetingRecord): string {
  const uses = meeting.suggestionUses ?? meeting.suggestions?.length ?? 0;
  if (uses >= 3) {
    return `You used ${uses} suggestions in that technical interview — Pro unlocks unlimited live help every session.`;
  }
  if ((meeting.dealScore ?? 0) >= 60) {
    return "Pro unlocks unlimited live help every technical interview.";
  }
  return "Landed is working in your technical interviews — Pro unlocks unlimited sessions and live help.";
}

export function shouldShowWarmUpgrade(
  meeting: MeetingRecord,
  plan: Plan,
  dismissedIds: string[],
): boolean {
  if (isPaidPlan(plan)) return false;
  if (dismissedIds.includes(meeting.id)) return false;
  if (meeting.status === "processing") return false;
  return isStrongSession(meeting);
}
