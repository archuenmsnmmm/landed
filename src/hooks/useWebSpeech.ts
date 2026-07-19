"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { normalizeTranscriptText, speechLangFromSetting } from "@/lib/transcript";
import type { Speaker, TranscriptLine } from "@/types/landed";

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

function bestTranscript(result: SpeechRecognitionResult): string {
  const alt = result[0];
  return normalizeTranscriptText(alt?.transcript ?? "");
}

export function useWebSpeech(
  active: boolean,
  speaker: Speaker = "You",
  meetingLanguage = "English",
) {
  const [lines, setLines] = useState<TranscriptLine[]>([]);
  const [interim, setInterim] = useState("");
  const [supported, setSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMic, setHasMic] = useState(false);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const activeRef = useRef(active);
  const sessionStartRef = useRef<number | null>(null);
  const language = speechLangFromSetting(meetingLanguage);
  activeRef.current = active;

  const addLine = useCallback(
    (text: string) => {
      const trimmed = normalizeTranscriptText(text);
      if (!trimmed) return;

      setLines((prev) => {
        const last = prev[prev.length - 1];
        if (last && last.text.toLowerCase() === trimmed.toLowerCase()) return prev;

        const start = sessionStartRef.current ?? Date.now();
        if (!sessionStartRef.current) sessionStartRef.current = start;

        return [
          ...prev,
          {
            id: `${Date.now()}-${Math.random()}`,
            speaker,
            text: trimmed,
            timestamp: Math.floor((Date.now() - start) / 1000),
          },
        ];
      });
    },
    [speaker],
  );

  useEffect(() => {
    const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Ctor) {
      setSupported(false);
      return;
    }

    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.lang = language;
    recognitionRef.current = recognition;

    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result?.isFinal) addLine(bestTranscript(result));
      }

      let interimText = "";
      for (let i = event.results.length - 1; i >= 0; i--) {
        const result = event.results[i];
        if (result && !result.isFinal) {
          interimText = bestTranscript(result);
          break;
        }
      }
      setInterim(normalizeTranscriptText(interimText));
    };

    recognition.onerror = (event) => {
      if (event.error === "no-speech" || event.error === "aborted") return;
      setError(event.error);
    };

    recognition.onend = () => {
      if (!activeRef.current || !recognitionRef.current) return;
      window.setTimeout(() => {
        if (!activeRef.current || !recognitionRef.current) return;
        try {
          recognitionRef.current.start();
        } catch {
          /* already started */
        }
      }, 40);
    };

    return () => {
      recognition.abort();
      recognitionRef.current = null;
    };
  }, [addLine, language]);

  useEffect(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    if (!active) {
      recognition.stop();
      setInterim("");
      return;
    }

    setError(null);
    if (!sessionStartRef.current) sessionStartRef.current = Date.now();

    void navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        stream.getTracks().forEach((t) => t.stop());
        setHasMic(true);
        if (!activeRef.current || !recognitionRef.current) return;
        try {
          recognitionRef.current.start();
        } catch {
          /* already running */
        }
      })
      .catch(() => {
        setHasMic(false);
        setError("not-allowed");
      });
  }, [active]);

  const clear = useCallback(() => {
    setLines([]);
    setInterim("");
    setError(null);
    sessionStartRef.current = null;
  }, []);

  return { lines, interim, supported, error, hasMic, clear };
}
