import { formatScreenContextBlock } from "../screen-context";
import { normalizeTranscriptText } from "../../lib/text-utils";
import type { TranscriptLine } from "../ai";
import type { BuiltContext, ClassifiedUtterance } from "./types";

const TRANSCRIPT_WINDOW_SEC = 90;

function formatTranscriptWindow(
  transcript: Array<{ speaker: string; text: string; timestamp?: number }>,
  windowSec = TRANSCRIPT_WINDOW_SEC,
): string {
  if (!transcript.length) return "(Conversation just started)";

  const latestTs =
    transcript[transcript.length - 1]?.timestamp ?? transcript.length;
  const cutoff =
    typeof latestTs === "number" && latestTs > 1000
      ? latestTs - windowSec
      : -Infinity;

  const windowed = transcript.filter((line) => {
    if (line.timestamp == null) return true;
    if (line.timestamp <= 10000) return line.timestamp >= latestTs - windowSec;
    return line.timestamp >= cutoff;
  });

  const lines = windowed.length ? windowed : transcript.slice(-12);
  return lines.map((t) => `${t.speaker}: ${t.text}`).join("\n");
}

const TOPIC_STOPWORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "to",
  "of",
  "in",
  "on",
  "for",
  "with",
  "about",
  "your",
  "you",
  "me",
  "my",
  "we",
  "our",
  "is",
  "are",
  "was",
  "were",
  "be",
  "can",
  "could",
  "would",
  "will",
  "do",
  "does",
  "did",
  "how",
  "what",
  "why",
  "when",
  "where",
  "who",
  "which",
  "tell",
  "explain",
  "please",
]);

function inferTopic(text: string): string | undefined {
  const words = normalizeTranscriptText(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s+-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !TOPIC_STOPWORDS.has(w));
  if (!words.length) return undefined;
  return words.slice(0, 4).join(" ");
}

function findPreviousAnswer(
  transcript: TranscriptLine[],
  currentSpeaker: TranscriptLine["speaker"],
): string | undefined {
  const reversed = [...transcript].reverse();
  let sawCurrent = false;
  for (const line of reversed) {
    const text = normalizeTranscriptText(line.text);
    if (!text) continue;
    if (!sawCurrent && line.speaker === currentSpeaker) {
      sawCurrent = true;
      continue;
    }
    if (sawCurrent && line.speaker === "You") {
      return text;
    }
  }
  return undefined;
}

function summarizeRecent(transcript: TranscriptLine[], limit = 4): string | undefined {
  const recent = transcript
    .slice(-limit)
    .map((l) => `${l.speaker}: ${normalizeTranscriptText(l.text)}`)
    .filter((l) => !l.endsWith(":"));
  if (!recent.length) return undefined;
  return recent.join(" · ");
}

/**
 * Context builder — select relevant slices instead of dumping the full transcript.
 */
export function buildSuggestionContext(opts: {
  triggerText: string;
  transcript: TranscriptLine[];
  screenContent?: string;
  micOnly?: boolean;
  classified?: ClassifiedUtterance;
}): BuiltContext {
  const currentQuestion = normalizeTranscriptText(opts.triggerText);
  const speaker = opts.classified?.speaker ?? "Prospect";
  const transcriptBlock = formatTranscriptWindow(
    opts.transcript.map((l) => ({
      speaker: l.speaker,
      text: l.text,
      timestamp: l.timestamp,
    })),
  );
  const screenBlock = formatScreenContextBlock(opts.screenContent ?? "");

  return {
    currentQuestion,
    previousAnswer: findPreviousAnswer(opts.transcript, speaker),
    topic: inferTopic(currentQuestion),
    conversationSummary: summarizeRecent(opts.transcript),
    transcriptBlock,
    screenBlock,
    micOnly: opts.micOnly ?? false,
  };
}

/** Compact context block for prompts (used alongside transcript). */
export function formatContextBrief(ctx: BuiltContext, classified?: ClassifiedUtterance): string {
  const lines: string[] = [];
  if (classified) {
    lines.push(`Event: ${classified.event} (${classified.eventConfidence.toFixed(2)})`);
    lines.push(`Intent: ${classified.intent} (${classified.intentConfidence.toFixed(2)})`);
  }
  if (ctx.topic) lines.push(`Current topic: ${ctx.topic}`);
  if (ctx.currentQuestion) lines.push(`Current question: ${ctx.currentQuestion}`);
  if (ctx.previousAnswer) lines.push(`Previous answer: ${ctx.previousAnswer}`);
  if (ctx.conversationSummary) lines.push(`Recent: ${ctx.conversationSummary}`);
  return lines.join("\n");
}
