import type { StructuredSuggestion } from "../services/suggestion-pipeline";
import type { SummarySection } from "../store/types";

/** Delay before the first demo suggestion appears (ms). */
export const DEMO_FIRST_SUGGESTION_DELAY_MS = 3500;

/** Gap between successive demo suggestions (ms) — feels like natural interview pacing. */
export const DEMO_SUGGESTION_GAP_MS = 11_000;

/** Brief “Thinking…” pause before each card paints. */
export const DEMO_THINKING_MS = 900;

export interface DemoSuggestionBeat {
  /** What the interviewer “asked” — used for logging / suggestion records. */
  trigger: string;
  structured: StructuredSuggestion;
}

/**
 * One coherent technical-interview arc for demo videos.
 * Five beats: approach → complexity → edge cases → bug → explain aloud.
 */
export const DEMO_INTERVIEW_SUGGESTIONS: DemoSuggestionBeat[] = [
  {
    trigger: "How would you approach this problem?",
    structured: {
      shouldSuggest: true,
      priority: "high",
      responseType: "direct_answer",
      title: "Answer",
      summary:
        "Sort the intervals by start time, then scan once merging overlaps — keep a result list and extend the last range when the next interval overlaps.",
      bullets: [
        "State the high-level approach before coding",
        "Call out the sort step and why it’s needed",
        "Mention you’ll handle empty / single-interval edge cases",
      ],
      followUp: "Want the time and space complexity next?",
      confidence: 0.94,
      expiresAfterMs: 18_000,
      replacePrevious: true,
      layout: "bullets",
      rawText:
        "Sort the intervals by start time, then scan once merging overlaps — keep a result list and extend the last range when the next interval overlaps.",
    },
  },
  {
    trigger: "What's the time and space complexity?",
    structured: {
      shouldSuggest: true,
      priority: "high",
      responseType: "technical",
      title: "Answer",
      summary:
        "Time is O(n log n) from the sort; the merge pass is O(n). Extra space is O(n) for the output list (or O(1) beyond the sort if you mutate in place).",
      bullets: [
        "Lead with Big-O, then one-line why",
        "Separate sort cost from the linear merge",
        "Clarify whether space includes the output",
      ],
      followUp: "I can also walk through a dry run on the example.",
      confidence: 0.93,
      expiresAfterMs: 20_000,
      replacePrevious: true,
      layout: "bullets",
      rawText:
        "Time is O(n log n) from the sort; the merge pass is O(n). Extra space is O(n) for the output list (or O(1) beyond the sort if you mutate in place).",
    },
  },
  {
    trigger: "What edge cases should we watch for?",
    structured: {
      shouldSuggest: true,
      priority: "high",
      responseType: "bullets",
      title: "Answer",
      summary:
        "Empty input, a single interval, fully nested ranges, touching endpoints, and already-sorted vs reverse-sorted lists.",
      bullets: [
        "Empty / one-element arrays",
        "Touching endpoints — decide if they merge",
        "Fully contained intervals",
      ],
      followUp: "Should touching intervals count as overlapping?",
      confidence: 0.92,
      expiresAfterMs: 18_000,
      replacePrevious: true,
      layout: "bullets",
      rawText:
        "Empty input, a single interval, fully nested ranges, touching endpoints, and already-sorted vs reverse-sorted lists.",
    },
  },
  {
    trigger: "I'm getting the wrong answer on the second example.",
    structured: {
      shouldSuggest: true,
      priority: "high",
      responseType: "technical",
      title: "Debug tip",
      summary:
        "Check whether you compare against the last merged end only — off-by-one usually means you used `<` instead of `<=` when deciding overlap.",
      bullets: [
        "Print the merge list after each step",
        "Verify the overlap condition on endpoints",
        "Re-run the failing example by hand",
      ],
      followUp: "Want a corrected merge condition in one line?",
      confidence: 0.91,
      expiresAfterMs: 22_000,
      replacePrevious: true,
      layout: "bullets",
      rawText:
        "Check whether you compare against the last merged end only — off-by-one usually means you used `<` instead of `<=` when deciding overlap.",
    },
  },
  {
    trigger: "Can you explain your solution out loud?",
    structured: {
      shouldSuggest: true,
      priority: "medium",
      responseType: "direct_answer",
      title: "Answer",
      summary:
        "I’d say: sort by start, walk left to right, and either extend the current range when the next start is ≤ current end, or push a new range — that’s the whole algorithm.",
      bullets: [
        "Open with the one-sentence algorithm",
        "Mention complexity once at the end",
        "Offer to dry-run the sample input",
      ],
      followUp: "Want a 20-second spoken script?",
      confidence: 0.9,
      expiresAfterMs: 16_000,
      replacePrevious: true,
      layout: "bullets",
      rawText:
        "I’d say: sort by start, walk left to right, and either extend the current range when the next start is ≤ current end, or push a new range — that’s the whole algorithm.",
    },
  },
];

export const DEMO_SESSION_TITLE = "Coding interview";
export const DEMO_SESSION_COMPANY = "Acme";

export const DEMO_SESSION_SUMMARY =
  "Clear technical answers across approach, complexity, edge cases, debugging, and verbal explanation. You stayed structured — keep leading with the algorithm before details.";

export const DEMO_SUMMARY_SECTIONS: SummarySection[] = [
  {
    heading: "Overview",
    format: "paragraphs",
    items: [
      "You covered a clean technical interview arc: approach, complexity, edge cases, a debug fix, and a concise verbal explanation.",
    ],
  },
  {
    heading: "What went well",
    items: [
      "Opened with a clear merge-intervals approach before coding",
      "Stated time/space complexity with a short justification",
      "Named concrete edge cases the interviewer cares about",
      "Debugged the overlap condition without panicking",
    ],
  },
  {
    heading: "Polish for next time",
    items: [
      "Dry-run the sample input once before claiming done",
      "Say the complexity out loud right after the approach",
    ],
  },
  {
    heading: "Suggested next steps",
    items: [
      "Practice explaining the algorithm in under 30 seconds",
      "Rehearse one more edge-case question for similar problems",
    ],
  },
];

export const DEMO_NEXT_STEPS = [
  "Practice explaining the algorithm in under 30 seconds",
  "Rehearse one more edge-case question for similar problems",
];
