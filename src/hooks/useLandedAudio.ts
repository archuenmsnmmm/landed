"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { startMockConversation } from "@/lib/mock-audio";
import type { TranscriptLine } from "@/types/landed";

export function useLandedAudio(active: boolean) {
  const [lines, setLines] = useState<TranscriptLine[]>([]);
  const [interim, setInterim] = useState("");
  const sessionStartRef = useRef(Date.now());

  const clear = useCallback(() => {
    setLines([]);
    setInterim("");
  }, []);

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

  return { lines, interim, clear };
}
