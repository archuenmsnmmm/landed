"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { startMockConversation } from "@/lib/mock-audio";
import type { TranscriptLine } from "@/types/landed";
import { useTabAudio } from "@/hooks/useTabAudio";
import { useWebSpeech } from "@/hooks/useWebSpeech";

export type SessionMode = "live" | "demo";

function mergeLines(...groups: TranscriptLine[][]): TranscriptLine[] {
  const map = new Map<string, TranscriptLine>();
  for (const group of groups) {
    for (const line of group) map.set(line.id, line);
  }
  return [...map.values()].sort(
    (a, b) => a.timestamp - b.timestamp || a.id.localeCompare(b.id),
  );
}

export function useLandedSession(active: boolean, mode: SessionMode) {
  const mic = useWebSpeech(active && mode === "live", "You");
  const tab = useTabAudio(active && mode === "live");

  const [mockLines, setMockLines] = useState<TranscriptLine[]>([]);
  const [mockInterim, setMockInterim] = useState("");
  const sessionStartRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active || mode !== "demo") {
      setMockInterim("");
      return;
    }

    sessionStartRef.current = Date.now();
    const stop = startMockConversation({
      sessionStart: sessionStartRef.current,
      onInterim: setMockInterim,
      onLine: (line) => setMockLines((prev) => [...prev, line]),
    });

    return stop;
  }, [active, mode]);

  const lines = useMemo(() => {
    if (mode === "demo") return mockLines;
    return mergeLines(mic.lines, tab.lines);
  }, [mode, mockLines, mic.lines, tab.lines]);

  const interim = mode === "demo" ? mockInterim : mic.interim || tab.interim;

  const clear = useCallback(() => {
    mic.clear();
    tab.clear();
    setMockLines([]);
    setMockInterim("");
    sessionStartRef.current = null;
  }, [mic, tab]);

  return {
    lines,
    interim,
    mode,
    hasMic: mic.hasMic,
    tabSharing: tab.sharing,
    tabError: tab.error,
    micError: mic.error,
    speechSupported: mic.supported,
    startTabShare: tab.startSharing,
    stopTabShare: tab.stopSharing,
    clear,
  };
}
