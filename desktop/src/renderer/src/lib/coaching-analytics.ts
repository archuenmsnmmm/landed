import type {
  DealOutcome,
  MeetingRecord,
  SuggestionTag,
} from "../store/types";
import { isUserMeeting } from "../store/types";
import { SUGGESTION_TAG_LABELS } from "./suggestion-tags";

export interface TeamStats {
  totalCalls: number;
  avgDealScore: number;
  totalSuggestions: number;
  outcomeCounts: Record<DealOutcome, number>;
  winRate: number;
  callsNeedingOutcome: number;
}

export interface TagEffectiveness {
  tag: SuggestionTag;
  label: string;
  count: number;
  wonCount: number;
  winRate: number;
}

const OUTCOME_ORDER: DealOutcome[] = [
  "open",
  "won",
  "lost",
  "stalled",
  "no_decision",
];

export function getReviewableMeetings(meetings: MeetingRecord[]): MeetingRecord[] {
  return meetings
    .filter((m) => isUserMeeting(m))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function computeTeamStats(meetings: MeetingRecord[]): TeamStats {
  const reviewable = getReviewableMeetings(meetings);
  const outcomeCounts: Record<DealOutcome, number> = {
    open: 0,
    won: 0,
    lost: 0,
    stalled: 0,
    no_decision: 0,
  };

  let scoreSum = 0;
  let scoredCalls = 0;
  let totalSuggestions = 0;

  for (const meeting of reviewable) {
    const outcome = meeting.dealOutcome ?? "open";
    outcomeCounts[outcome] += 1;
    if (meeting.dealScore > 0) {
      scoreSum += meeting.dealScore;
      scoredCalls += 1;
    }
    totalSuggestions +=
      meeting.suggestions?.length ?? meeting.suggestionUses ?? 0;
  }

  const closed = outcomeCounts.won + outcomeCounts.lost;
  const winRate = closed > 0 ? outcomeCounts.won / closed : 0;

  return {
    totalCalls: reviewable.length,
    avgDealScore: scoredCalls > 0 ? Math.round(scoreSum / scoredCalls) : 0,
    totalSuggestions,
    outcomeCounts,
    winRate,
    callsNeedingOutcome: reviewable.filter(
      (m) => (m.dealOutcome ?? "open") === "open" && m.dealScore > 0,
    ).length,
  };
}

export function computeTagEffectiveness(
  meetings: MeetingRecord[],
): TagEffectiveness[] {
  const reviewable = getReviewableMeetings(meetings);
  const tagStats = new Map<SuggestionTag, { count: number; wonCount: number }>();

  for (const meeting of reviewable) {
    const won = meeting.dealOutcome === "won";
    for (const suggestion of meeting.suggestions ?? []) {
      for (const tag of suggestion.tags) {
        const current = tagStats.get(tag) ?? { count: 0, wonCount: 0 };
        current.count += 1;
        if (won) current.wonCount += 1;
        tagStats.set(tag, current);
      }
    }
  }

  return Array.from(tagStats.entries())
    .map(([tag, stats]) => ({
      tag,
      label: SUGGESTION_TAG_LABELS[tag],
      count: stats.count,
      wonCount: stats.wonCount,
      winRate: stats.count > 0 ? stats.wonCount / stats.count : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

export function outcomeLabel(outcome: DealOutcome): string {
  switch (outcome) {
    case "open":
      return "Open";
    case "won":
      return "Offer";
    case "lost":
      return "Declined";
    case "stalled":
      return "On hold";
    case "no_decision":
      return "No outcome";
    default:
      return "Open";
  }
}

export function outcomeColor(outcome: DealOutcome): string {
  switch (outcome) {
    case "won":
      return "bg-emerald-50 text-emerald-700";
    case "lost":
      return "bg-red-50 text-red-700";
    case "stalled":
      return "bg-amber-50 text-amber-700";
    case "no_decision":
      return "bg-zinc-100 text-zinc-600";
    default:
      return "bg-blue-50 text-blue-700";
  }
}

export { OUTCOME_ORDER };

/** Inject learned patterns into live coaching prompts. */
export function buildCoachingInsightsContext(
  meetings: MeetingRecord[],
  maxTags = 3,
): string {
  const tags = computeTagEffectiveness(meetings).filter((t) => t.count >= 2);
  if (tags.length === 0) return "";

  const top = tags
    .filter((t) => t.winRate > 0)
    .sort((a, b) => b.winRate - a.winRate || b.count - a.count)
    .slice(0, maxTags);

  if (top.length === 0) return "";

  const lines = top.map(
    (t) =>
      `${t.label} suggestions (${Math.round(t.winRate * 100)}% on successful technical interviews, n=${t.count})`,
  );

  return `Coaching patterns from your completed technical interviews: ${lines.join("; ")}. Prefer approaches aligned with these winning patterns when relevant.`;
}
