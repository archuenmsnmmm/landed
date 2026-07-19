"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { normalizeTranscriptText } from "@/lib/transcript";
import type { TranscriptLine } from "@/types/landed";

const CHUNK_MS = 2000;
const MIN_BYTES = 80;

function getRecorderMime(): string | null {
  for (const mime of ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"]) {
    if (MediaRecorder.isTypeSupported(mime)) return mime;
  }
  return null;
}

export function useTabAudio(active: boolean) {
  const [lines, setLines] = useState<TranscriptLine[]>([]);
  const [interim, setInterim] = useState("");
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const sessionStartRef = useRef<number | null>(null);
  const processingRef = useRef(false);
  const queueRef = useRef<Blob[]>([]);

  const addLine = useCallback((text: string) => {
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
          id: `tab-${Date.now()}-${Math.random()}`,
          speaker: "Prospect" as const,
          text: trimmed,
          timestamp: Math.floor((Date.now() - start) / 1000),
        },
      ];
    });
  }, []);

  const processQueue = useCallback(async (mimeType: string) => {
    if (processingRef.current) return;
    processingRef.current = true;

    while (queueRef.current.length > 0) {
      const blob = queueRef.current.shift();
      if (!blob || blob.size < MIN_BYTES) continue;

      setInterim("Transcribing…");
      try {
        const formData = new FormData();
        formData.append("file", blob, "audio.webm");
        formData.append("language", "en");

        const res = await fetch("/api/transcribe", { method: "POST", body: formData });
        if (!res.ok) continue;

        const data = (await res.json()) as { text?: string };
        if (data.text) addLine(data.text);
      } catch {
        /* retry next chunk */
      }
    }

    setInterim("");
    processingRef.current = false;
  }, [addLine]);

  const startSharing = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      stream.getVideoTracks().forEach((t) => t.stop());

      if (stream.getAudioTracks().length === 0) {
        stream.getTracks().forEach((t) => t.stop());
        setError("no-audio");
        return;
      }

      streamRef.current = stream;
      setSharing(true);
      if (!sessionStartRef.current) sessionStartRef.current = Date.now();

      const mimeType = getRecorderMime();
      if (!mimeType) {
        setError("unsupported");
        return;
      }

      const recorder = new MediaRecorder(stream, { mimeType });
      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size < MIN_BYTES) return;
        queueRef.current.push(event.data);
        void processQueue(mimeType);
      };

      recorder.start(CHUNK_MS);

      stream.getAudioTracks()[0]?.addEventListener("ended", () => {
        setSharing(false);
      });
    } catch {
      setError("denied");
    }
  }, [processQueue]);

  const stopSharing = useCallback(() => {
    recorderRef.current?.stop();
    recorderRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setSharing(false);
  }, []);

  useEffect(() => {
    if (!active) {
      stopSharing();
      return;
    }
    return stopSharing;
  }, [active, stopSharing]);

  const clear = useCallback(() => {
    setLines([]);
    setInterim("");
    setError(null);
    sessionStartRef.current = null;
    stopSharing();
  }, [stopSharing]);

  return {
    lines,
    interim,
    sharing,
    error,
    startSharing,
    stopSharing,
    clear,
  };
}
