import type { TranscriptLine } from "./ai";

/** Kept for dev test script — not used at runtime. */
export const MOCK_CONVERSATION: Array<{
  speaker: TranscriptLine["speaker"];
  text: string;
}> = [
  { speaker: "Prospect", text: "How would you approach merge intervals?" },
  { speaker: "You", text: "I'd sort by start time, then merge overlapping ranges in one pass." },
  { speaker: "Prospect", text: "What's the time complexity?" },
  { speaker: "You", text: "O(n log n) from the sort, then O(n) to merge." },
  { speaker: "Prospect", text: "What edge cases should we handle?" },
  { speaker: "Prospect", text: "Can you walk through the second example?" },
  { speaker: "You", text: "Sure — after sorting, each next interval either extends the last or starts a new one." },
  { speaker: "Prospect", text: "How would you explain that out loud in the interview?" },
];

export function isMockAudioEnabled(): boolean {
  return false;
}

export function shouldUseMockAudio(_mode: string): boolean {
  return false;
}
