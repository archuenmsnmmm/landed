import type { Speaker, TranscriptLine } from "@/types/landed";

export const MOCK_CONVERSATION: Array<{ speaker: Speaker; text: string }> = [
  { speaker: "Prospect", text: "We're already using a competitor for this, so I'm not sure what's different here." },
  { speaker: "You", text: "Thanks for taking the call — I'd love to hear what's working and what isn't." },
  { speaker: "Prospect", text: "Honestly, the reporting is clunky and support is slow." },
  { speaker: "You", text: "That's helpful context — let's walk through how we handle both of those." },
  { speaker: "Prospect", text: "What's the pricing look like compared to what we're paying now?" },
  { speaker: "Prospect", text: "Who else on our team would need to sign off on this?" },
  { speaker: "You", text: "Typically it's whoever owns the budget and the day-to-day users — who would that be for you?" },
  { speaker: "Prospect", text: "What's a realistic timeline to get this live?" },
];

const FIRST_LINE_MS = 3000;
const LINE_INTERVAL_MS = 12000;
const WORD_MS = 140;

function streamWords(
  text: string,
  onWord: (partial: string) => void,
  onDone: () => void,
): () => void {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    onDone();
    return () => {};
  }

  let index = 0;
  onWord(words[0] ?? "");

  const id = window.setInterval(() => {
    index += 1;
    if (index >= words.length) {
      window.clearInterval(id);
      onDone();
      return;
    }
    onWord(words.slice(0, index + 1).join(" "));
  }, WORD_MS);

  return () => window.clearInterval(id);
}

export function startMockConversation(options: {
  sessionStart: number;
  onInterim: (text: string) => void;
  onLine: (line: TranscriptLine) => void;
}): () => void {
  let index = 0;
  let lineTimer: number | null = null;
  let wordStop: (() => void) | null = null;
  let stopped = false;

  const scheduleNext = () => {
    if (stopped || index >= MOCK_CONVERSATION.length) return;

    const entry = MOCK_CONVERSATION[index];
    if (!entry) return;

    wordStop?.();
    wordStop = streamWords(
      entry.text,
      options.onInterim,
      () => {
        if (stopped) return;
        options.onLine({
          id: `mock-${Date.now()}-${index}`,
          speaker: entry.speaker,
          text: entry.text,
          timestamp: Math.floor((Date.now() - options.sessionStart) / 1000),
        });
        options.onInterim("");
        index += 1;
        lineTimer = window.setTimeout(scheduleNext, LINE_INTERVAL_MS);
      },
    );
  };

  lineTimer = window.setTimeout(scheduleNext, FIRST_LINE_MS);

  return () => {
    stopped = true;
    wordStop?.();
    if (lineTimer) window.clearTimeout(lineTimer);
  };
}
