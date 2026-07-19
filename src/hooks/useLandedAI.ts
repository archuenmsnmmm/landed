"use client";

import { useCallback, useRef, useState } from "react";
import type { LandedSuggestion, RecapResponse, TranscriptLine } from "@/types/landed";

export function useLandedAI() {
  const [suggestion, setSuggestion] = useState<LandedSuggestion | null>(null);
  const [followUps, setFollowUps] = useState<string[]>([]);
  const [recap, setRecap] = useState<RecapResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const [recapLoading, setRecapLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchSuggestion = useCallback(
    async (prospectText: string, transcript: TranscriptLine[]) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/suggest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({ prospectText, transcript }),
        });

        if (!res.ok) {
          const detail = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(detail.error ?? `Suggest failed (${res.status})`);
        }

        const data = (await res.json()) as LandedSuggestion;
        setSuggestion(data);
        return data;
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return null;
        const message = err instanceof Error ? err.message : "Suggest failed";
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const fetchFollowUps = useCallback(async (transcript: TranscriptLine[]) => {
    setFollowUpLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/followups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });
      if (!res.ok) {
        const detail = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(detail.error ?? `Follow-ups failed (${res.status})`);
      }
      const data = (await res.json()) as { questions?: string[] };
      setFollowUps(data.questions ?? []);
      return data.questions ?? [];
    } catch (err) {
      const message = err instanceof Error ? err.message : "Follow-ups failed";
      setError(message);
      return [];
    } finally {
      setFollowUpLoading(false);
    }
  }, []);

  const fetchRecap = useCallback(async (transcript: TranscriptLine[]) => {
    setRecapLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/recap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });
      if (!res.ok) {
        const detail = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(detail.error ?? `Recap failed (${res.status})`);
      }
      const data = (await res.json()) as RecapResponse;
      setRecap(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Recap failed";
      setError(message);
      return null;
    } finally {
      setRecapLoading(false);
    }
  }, []);

  const clearSuggestion = useCallback(() => {
    abortRef.current?.abort();
    setSuggestion(null);
    setFollowUps([]);
    setRecap(null);
    setError(null);
  }, []);

  return {
    suggestion,
    followUps,
    recap,
    loading,
    followUpLoading,
    recapLoading,
    error,
    fetchSuggestion,
    fetchFollowUps,
    fetchRecap,
    clearSuggestion,
  };
}
