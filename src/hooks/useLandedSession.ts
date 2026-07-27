"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { startMockConversation } from "@/lib/mock-audio";
import type { TranscriptLine } from "@/types/landed";

/** Scripted demo transcript — no mic, tab audio, or Whisper. */
export function useLandedSession(active: boolean) {
  const [lines, setLines] = useState<TranscriptLine[]>([]);
  const [interim, setInterim] = useState("");
  const sessionStartRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) {
      setInterim("");
      return;
    }

    sessionStartRef.current = Date.now();
    const stop = startMockConversation({
      sessionStart: sessionStartRef.current,
      onInterim: setInterim,
      onLine: (line) => setLines((prev) => [...prev, line]),
    });

    return stop;
  }, [active]);

  const clear = useCallback(() => {
    setLines([]);
    setInterim("");
    sessionStartRef.current = null;
  }, []);

  return { lines, interim, clear };
}
