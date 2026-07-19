import { useCallback, useEffect, useRef, useState } from "react";
import type { TranscriptLine } from "../services/ai";
import { normalizeTranscriptText, speechLangFromSetting } from "../services/transcript";

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternative;
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
  let best = result[0]?.transcript ?? "";
  let bestConfidence = result[0]?.confidence ?? 0;

  for (let i = 1; i < result.length; i++) {
    const alt = result[i];
    if (!alt) continue;
    const confidence = alt.confidence ?? 0;
    if (confidence > bestConfidence) {
      best = alt.transcript;
      bestConfidence = confidence;
    }
  }

  return normalizeTranscriptText(best);
}

function createRecognition(language: string): SpeechRecognitionInstance | null {
  const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
  if (!Ctor) return null;
  const recognition = new Ctor();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 3;
  recognition.lang = language;
  return recognition;
}

export function useSpeechRecognition(
  active: boolean,
  meetingLanguage = "English",
  defaultSpeaker: TranscriptLine["speaker"] = "Prospect",
  options: { commitLines?: boolean } = {},
) {
  const commitLines = options.commitLines ?? true;
  const [lines, setLines] = useState<TranscriptLine[]>([]);
  const [interim, setInterim] = useState("");
  const [supported, setSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const activeRef = useRef(active);
  const sessionStartRef = useRef<number | null>(null);
  const language = speechLangFromSetting(meetingLanguage);
  activeRef.current = active;

  const addLine = useCallback((text: string) => {
    if (!commitLines) return;
    const trimmed = normalizeTranscriptText(text);
    if (!trimmed) return;

    setLines((prev) => {
      const last = prev[prev.length - 1];
      if (last && normalizeTranscriptText(last.text).toLowerCase() === trimmed.toLowerCase()) {
        return prev;
      }

      const start = sessionStartRef.current ?? Date.now();
      if (!sessionStartRef.current) sessionStartRef.current = start;
      const elapsedSeconds = Math.floor((Date.now() - start) / 1000);

      return [
        ...prev,
        {
          id: `${Date.now()}-${Math.random()}`,
          speaker: defaultSpeaker,
          text: trimmed,
          timestamp: elapsedSeconds,
        },
      ];
    });
  }, [commitLines, defaultSpeaker]);

  useEffect(() => {
    const recognition = createRecognition(language);
    if (!recognition) {
      setSupported(false);
      return;
    }

    recognitionRef.current = recognition;

    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i] as SpeechRecognitionResult;
        if (result.isFinal) {
          addLine(bestTranscript(result));
        }
      }

      let interimText = "";
      for (let i = event.results.length - 1; i >= 0; i--) {
        const result = event.results[i] as SpeechRecognitionResult;
        if (!result.isFinal) {
          interimText = bestTranscript(result);
          break;
        }
      }
      if (!interimText && event.results.length > 0) {
        const last = event.results[event.results.length - 1] as SpeechRecognitionResult;
        if (last.isFinal) interimText = bestTranscript(last);
      }
      setInterim(normalizeTranscriptText(interimText));
    };

    recognition.onerror = (event) => {
      if (event.error === "no-speech" || event.error === "aborted") return;

      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        void window.landed?.getPermissionStatus?.().then((status) => {
          if (status?.microphone) {
            // Web Speech often false-positives in Electron when macOS mic is already granted.
            setError(null);
            if (!activeRef.current || !recognitionRef.current) return;
            try {
              recognitionRef.current.start();
            } catch {
              // already running
            }
            return;
          }
          setError(event.error);
          activeRef.current = false;
        });
        return;
      }

      setError(event.error);
    };

    recognition.onend = () => {
      if (!activeRef.current || !recognitionRef.current) return;
      window.setTimeout(() => {
        if (!activeRef.current || !recognitionRef.current) return;
        try {
          recognitionRef.current.start();
        } catch {
          // already started
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

    void (async () => {
      await window.landed?.ensureMicrophone?.();
      if (!activeRef.current || !recognitionRef.current) return;

      const status = await window.landed?.getPermissionStatus?.();
      if (!status?.microphone) {
        setError("not-allowed");
        return;
      }

      setError(null);
      try {
        recognitionRef.current.start();
      } catch {
        // already running
      }
    })();
  }, [active]);

  const clear = useCallback(() => {
    setLines([]);
    setInterim("");
    setError(null);
    sessionStartRef.current = null;
  }, []);

  return { lines, interim, supported, error, clear };
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}
