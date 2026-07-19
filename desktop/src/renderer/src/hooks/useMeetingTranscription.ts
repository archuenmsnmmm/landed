import { useCallback, useEffect, useRef, useState } from "react";
import type { TranscriptLine } from "../services/ai";
import {
  captureCallAudio,
  captureMicrophone,
  confirmMicrophoneAccess,
  detectLandedAudioSetup,
  getSupportedRecorderMime,
  isCallAudioSource,
  type LandedAudioSetup,
  type LandedAudioSource,
} from "../services/audio-capture";
import {
  createSpeechDetector,
  startAudioLevelMonitor,
  type SpeechDetector,
} from "../services/audio-level";
import { normalizeTranscriptText } from "../services/transcript";
import {
  bootstrapOpenAIKey,
  getOpenAIKeySync,
  MIN_SPEECH_BLOB_BYTES,
  transcribeAudioChunk,
} from "../services/whisper";
import { useSpeechRecognition } from "./useSpeechRecognition";

const CHUNK_MS = 500;
const MIN_BLOB_BYTES = 96;
const MAX_SPEECH_BUFFER_MS = 12_000;
const SPEECH_FLUSH_DELAY_MS = 280;
const PARTIAL_CAPTION_MS = 750;

export type AudioCaptureMode = "auto" | "mic" | "system";

function isDuplicateLine(prev: TranscriptLine[], text: string): boolean {
  const normalized = normalizeTranscriptText(text).toLowerCase();
  if (!normalized) return true;

  for (let i = prev.length - 1; i >= Math.max(0, prev.length - 3); i--) {
    const existing = prev[i];
    if (!existing) continue;
    const existingNorm = normalizeTranscriptText(existing.text).toLowerCase();
    if (existingNorm === normalized) return true;
    if (existingNorm.includes(normalized) || normalized.includes(existingNorm)) return true;
  }
  return false;
}


function mergeLines(...groups: TranscriptLine[][]): TranscriptLine[] {
  const map = new Map<string, TranscriptLine>();
  for (const group of groups) {
    for (const line of group) map.set(line.id, line);
  }
  return [...map.values()].sort(
    (a, b) => a.timestamp - b.timestamp || a.id.localeCompare(b.id),
  );
}

type TranscriberCallbacks = {
  onLine: (line: TranscriptLine) => void;
  onProcessing?: (active: boolean) => void;
  onChunk?: () => void;
  onLiveCaption?: (text: string) => void;
  onSpeakingChange?: (speaking: boolean) => void;
};

class StreamTranscriber {
  private recorder: MediaRecorder | null = null;
  private processing = false;
  private queue: Blob[] = [];
  private speechBuffer: Blob[] = [];
  private speechBufferStartedAt: number | null = null;
  private flushTimer: number | null = null;
  private speechDetector: SpeechDetector | null = null;
  private stopped = false;
  private mimeType = "audio/webm";
  private segmentTimer: number | null = null;
  private partialCaptionTimer: number | null = null;
  private partialCaptionInFlight = false;

  constructor(
    private stream: MediaStream,
    private meetingLanguage: string,
    private sessionStart: number,
    private speaker: TranscriptLine["speaker"],
    private callbacks: TranscriberCallbacks,
  ) {}

  start(): void {
    this.stopped = false;
    this.speechDetector = createSpeechDetector(this.stream, {
      onSpeechStart: () => {
        this.speechBufferStartedAt ??= Date.now();
        this.callbacks.onLiveCaption?.("");
        this.callbacks.onSpeakingChange?.(true);
        this.schedulePartialCaption();
      },
      onSpeechEnd: () => {
        this.callbacks.onSpeakingChange?.(false);
        this.scheduleSpeechFlush();
      },
    });
    this.beginSegment();
  }

  private clearFlushTimer(): void {
    if (this.flushTimer) {
      window.clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
  }

  private scheduleSpeechFlush(): void {
    this.clearFlushTimer();
    this.flushTimer = window.setTimeout(() => {
      this.flushTimer = null;
      void this.flushSpeechBuffer();
    }, SPEECH_FLUSH_DELAY_MS);
  }

  private async flushSpeechBuffer(): Promise<void> {
    if (this.speechBuffer.length === 0) return;

    const blob = new Blob(this.speechBuffer, { type: this.mimeType });
    this.speechBuffer = [];
    this.speechBufferStartedAt = null;

    if (blob.size < MIN_SPEECH_BLOB_BYTES) return;
    await this.enqueue(blob);
  }

  private clearSegmentTimer(): void {
    if (this.segmentTimer) {
      window.clearTimeout(this.segmentTimer);
      this.segmentTimer = null;
    }
  }

  private clearPartialCaptionTimer(): void {
    if (this.partialCaptionTimer) {
      window.clearTimeout(this.partialCaptionTimer);
      this.partialCaptionTimer = null;
    }
  }

  private schedulePartialCaption(): void {
    if (!this.speechDetector?.isSpeaking() || this.partialCaptionTimer) return;
    this.partialCaptionTimer = window.setTimeout(() => {
      this.partialCaptionTimer = null;
      void this.runPartialCaption();
      if (!this.stopped && this.speechDetector?.isSpeaking()) {
        this.schedulePartialCaption();
      }
    }, PARTIAL_CAPTION_MS);
  }

  private async runPartialCaption(): Promise<void> {
    if (this.partialCaptionInFlight || this.stopped || this.speechBuffer.length === 0) return;

    const blob = new Blob(this.speechBuffer, { type: this.mimeType });
    if (blob.size < MIN_SPEECH_BLOB_BYTES) return;

    this.partialCaptionInFlight = true;
    try {
      const text = await transcribeAudioChunk(blob, this.meetingLanguage, this.mimeType);
      if (!text || this.stopped) return;
      const normalized = normalizeTranscriptText(text);
      if (normalized) this.callbacks.onLiveCaption?.(normalized);
    } finally {
      this.partialCaptionInFlight = false;
    }
  }

  private beginSegment(): void {
    if (this.stopped) return;

    const preferredMime = getSupportedRecorderMime();

    try {
      this.recorder = preferredMime
        ? new MediaRecorder(this.stream, {
            mimeType: preferredMime,
            audioBitsPerSecond: 64_000,
          })
        : new MediaRecorder(this.stream);
      this.mimeType = this.recorder.mimeType || preferredMime || "audio/webm";
    } catch (err) {
      console.warn("[landed] MediaRecorder init failed:", err);
      try {
        this.recorder = new MediaRecorder(this.stream);
        this.mimeType = this.recorder.mimeType || "audio/webm";
      } catch (fallbackErr) {
        console.warn("[landed] MediaRecorder fallback failed:", fallbackErr);
        return;
      }
    }

    this.recorder.ondataavailable = (event) => {
      if (this.stopped || event.data.size < MIN_BLOB_BYTES) return;

      const speaking = this.speechDetector?.isSpeaking() ?? false;
      const capturingTail = this.speechBuffer.length > 0;
      if (!speaking && !capturingTail) return;

      if (this.speechBuffer.length === 0) {
        this.speechBufferStartedAt = Date.now();
      }
      this.speechBuffer.push(event.data);
      this.callbacks.onChunk?.();
      this.schedulePartialCaption();

      if (
        this.speechBufferStartedAt &&
        Date.now() - this.speechBufferStartedAt >= MAX_SPEECH_BUFFER_MS
      ) {
        void this.flushSpeechBuffer();
        return;
      }

      if (!speaking && capturingTail) {
        this.scheduleSpeechFlush();
      }
    };

    this.recorder.onstop = () => {
      if (!this.stopped) {
        window.setTimeout(() => this.beginSegment(), 30);
      }
    };

    try {
      this.recorder.start();
      this.clearSegmentTimer();
      this.segmentTimer = window.setTimeout(() => {
        if (this.stopped || !this.recorder || this.recorder.state !== "recording") return;
        try {
          this.recorder.requestData();
          this.recorder.stop();
        } catch (err) {
          console.warn("[landed] MediaRecorder segment stop failed:", err);
        }
      }, CHUNK_MS);
    } catch (err) {
      console.warn("[landed] MediaRecorder start failed:", err);
    }
  }

  private async enqueue(blob: Blob): Promise<void> {
    this.queue.push(blob);
    if (this.processing) return;
    this.processing = true;
    this.callbacks.onProcessing?.(true);

    while (this.queue.length > 0) {
      const chunk = this.queue.shift();
      if (!chunk || this.stopped) continue;

      const text = await transcribeAudioChunk(chunk, this.meetingLanguage, this.mimeType);
      if (!text) continue;

      const normalized = normalizeTranscriptText(text);
      this.callbacks.onLiveCaption?.(normalized);
      this.callbacks.onLine({
        id: `${Date.now()}-${Math.random()}`,
        speaker: this.speaker,
        text: normalized,
        timestamp: Math.floor((Date.now() - this.sessionStart) / 1000),
      });
    }

    this.processing = false;
    this.callbacks.onProcessing?.(false);
  }

  stop(): void {
    this.stopped = true;
    this.clearSegmentTimer();
    this.clearPartialCaptionTimer();
    this.clearFlushTimer();
    this.speechBuffer = [];
    this.speechBufferStartedAt = null;
    this.callbacks.onSpeakingChange?.(false);
    this.speechDetector?.stop();
    this.speechDetector = null;
    if (this.recorder?.state !== "inactive") {
      try {
        this.recorder?.stop();
      } catch {
        // ignore
      }
    }
    this.stream.getTracks().forEach((t) => t.stop());
  }
}

export interface MeetingTranscriptionState {
  lines: TranscriptLine[];
  interim: string;
  supported: boolean;
  error: string | null;
  mode: "hybrid" | "webspeech" | "whisper" | "call-audio" | "idle";
  hasSystemAudio: boolean;
  hasMic: boolean;
  aiReady: boolean;
  hearingAudio: boolean;
  isSpeaking: boolean;
  audioCaptureMode: AudioCaptureMode;
  audioSource: LandedAudioSource;
  audioSetup: LandedAudioSetup | null;
}

export function useMeetingTranscription(
  active: boolean,
  meetingLanguage = "English",
  audioCaptureMode: AudioCaptureMode = "auto",
): MeetingTranscriptionState & { clear: () => void } {
  const [whisperLines, setWhisperLines] = useState<TranscriptLine[]>([]);
  const [audioSource, setAudioSource] = useState<LandedAudioSource>(null);
  const [audioSetup, setAudioSetup] = useState<LandedAudioSetup | null>(null);
  const [hasMicCapture, setHasMicCapture] = useState(false);
  const [hasCallCapture, setHasCallCapture] = useState(false);
  const [captureError, setCaptureError] = useState<string | null>(null);
  const [captureProcessing, setCaptureProcessing] = useState(false);
  const [callAudioActive, setCallAudioActive] = useState(false);
  const [micAudioActive, setMicAudioActive] = useState(false);
  const [liveCaption, setLiveCaption] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speakingRef = useRef<Partial<Record<TranscriptLine["speaker"], boolean>>>({});
  const transcribersRef = useRef<StreamTranscriber[]>([]);
  const audioLevelStopRef = useRef<(() => void) | null>(null);
  const sessionStartRef = useRef<number | null>(null);
  const [aiReady, setAiReady] = useState(!!getOpenAIKeySync());

  const [captureRetry, setCaptureRetry] = useState(0);
  const [micAccessGranted, setMicAccessGranted] = useState<boolean | null>(null);
  const useMicPath = audioCaptureMode !== "system";
  const useCallAudioPath = audioCaptureMode === "system";

  // Web Speech gives instant interim captions; Whisper still owns finalized lines.
  const useMicSpeech = useMicPath;
  const micSpeech = useSpeechRecognition(active && useMicSpeech, meetingLanguage, "You", {
    commitLines: false,
  });

  const addWhisperLine = useCallback((line: TranscriptLine) => {
    setWhisperLines((prev) => {
      if (isDuplicateLine(prev, line.text)) return prev;
      return [...prev, line];
    });
  }, []);

  const setSpeakerSpeaking = useCallback((speaker: TranscriptLine["speaker"], speaking: boolean) => {
    speakingRef.current[speaker] = speaking;
    setIsSpeaking(Object.values(speakingRef.current).some(Boolean));
  }, []);

  const clear = useCallback(() => {
    transcribersRef.current.forEach((t) => t.stop());
    transcribersRef.current = [];
    setWhisperLines([]);
    setAudioSource(null);
    setHasMicCapture(false);
    setHasCallCapture(false);
    setCaptureError(null);
    setCaptureProcessing(false);
    setCallAudioActive(false);
    setMicAudioActive(false);
    setLiveCaption("");
    setIsSpeaking(false);
    speakingRef.current = {};
    audioLevelStopRef.current?.();
    audioLevelStopRef.current = null;
    sessionStartRef.current = null;
    micSpeech.clear();
  }, [micSpeech]);

  const startTranscriber = useCallback(
    (stream: MediaStream, sessionStart: number, speaker: TranscriptLine["speaker"]) => {
      const transcriber = new StreamTranscriber(
        stream,
        meetingLanguage,
        sessionStart,
        speaker,
        {
          onLine: addWhisperLine,
          onProcessing: setCaptureProcessing,
          onChunk: () => setCallAudioActive(true),
          onLiveCaption: setLiveCaption,
          onSpeakingChange: (speaking) => setSpeakerSpeaking(speaker, speaking),
        },
      );
      transcribersRef.current.push(transcriber);
      transcriber.start();
    },
    [addWhisperLine, meetingLanguage, setSpeakerSpeaking],
  );

  useEffect(() => {
    void bootstrapOpenAIKey().then((key) => {
      if (key) setAiReady(true);
    });
  }, []);

  useEffect(() => {
    return window.landed?.onMicGranted?.(() => {
      setMicAccessGranted(true);
      setCaptureError(null);
      setCaptureRetry((n) => n + 1);
    });
  }, []);

  useEffect(() => {
    if (!active || !useMicPath) {
      setMicAccessGranted(null);
      return;
    }

    let cancelled = false;
    const refresh = async () => {
      const granted = await confirmMicrophoneAccess();
      if (cancelled) return;
      setMicAccessGranted(granted);
      if (granted) setCaptureError(null);
    };

    void refresh();
    const id = window.setInterval(() => void refresh(), 2000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [active, useMicPath, captureRetry]);

  useEffect(() => {
    if (!active) {
      transcribersRef.current.forEach((t) => t.stop());
      transcribersRef.current = [];
      setHasMicCapture(false);
      setHasCallCapture(false);
      setCallAudioActive(false);
      return;
    }

    if (!sessionStartRef.current) sessionStartRef.current = Date.now();
    const sessionStart = sessionStartRef.current;
    let cancelled = false;

    void (async () => {
      setCaptureError(null);
      void detectLandedAudioSetup().then((setup) => {
        if (!cancelled) setAudioSetup(setup);
      });

      if (useMicPath) {
        try {
          const micStream = await captureMicrophone();
          if (cancelled) {
            micStream.getTracks().forEach((t) => t.stop());
            return;
          }
          setHasMicCapture(true);
          setMicAccessGranted(true);
          setAudioSource("microphone");
          if (!getOpenAIKeySync()) setCaptureError("no-api-key");

          const levelStream =
            typeof micStream.clone === "function" ? micStream.clone() : micStream;
          audioLevelStopRef.current?.();
          audioLevelStopRef.current = startAudioLevelMonitor(levelStream, (level) => {
            if (level > 0.006) setMicAudioActive(true);
          });
          // Let Web Speech claim the mic first so interim captions stay instant.
          await new Promise((resolve) => window.setTimeout(resolve, 220));
          if (cancelled) {
            micStream.getTracks().forEach((t) => t.stop());
            return;
          }
          startTranscriber(micStream, sessionStart, "You");
        } catch {
          if (!cancelled) {
            setMicAccessGranted(false);
            setCaptureError("not-allowed");
          }
        }
      }

      if (useCallAudioPath && !cancelled) {
        const callAudio = await captureCallAudio();
        if (cancelled) {
          callAudio?.stream.getTracks().forEach((t) => t.stop());
        } else if (callAudio) {
          setAudioSource(callAudio.source);
          setHasCallCapture(true);
          startTranscriber(callAudio.stream, sessionStart, "Prospect");
        } else {
          setCaptureError("screen-blocked");
        }
      }
    })();

    return () => {
      cancelled = true;
      transcribersRef.current.forEach((t) => t.stop());
      transcribersRef.current = [];
      audioLevelStopRef.current?.();
      audioLevelStopRef.current = null;
    };
  }, [active, audioCaptureMode, startTranscriber, useCallAudioPath, useMicPath, captureRetry]);

  useEffect(() => {
    if (!active || !captureError) return;
    const id = window.setInterval(async () => {
      const status = await window.landed?.getPermissionStatus?.();
      if (!status) return;
      if (captureError === "not-allowed" && status.microphone) {
        setMicAccessGranted(true);
        setCaptureError(null);
        setCaptureRetry((n) => n + 1);
      }
      if (captureError === "screen-blocked" && status.screen) {
        setCaptureRetry((n) => n + 1);
      }
    }, 2000);
    return () => window.clearInterval(id);
  }, [active, captureError]);

  const lines = mergeLines(micSpeech.lines, whisperLines);

  const interim = normalizeTranscriptText(
    micSpeech.interim ||
      liveCaption ||
      (isSpeaking ? "…" : "") ||
      (captureProcessing ? "…" : ""),
  );

  const hasCallAudio = hasCallCapture || isCallAudioSource(audioSource) || callAudioActive;
  const micBlocked =
    micAccessGranted === false &&
    !hasMicCapture &&
    micSpeech.lines.length === 0 &&
    whisperLines.length === 0;

  const error =
    captureError === "screen-blocked"
      ? "screen-blocked"
      : captureError === "no-api-key"
        ? "no-api-key"
        : micBlocked
          ? "not-allowed"
          : null;

  const hearingAudio =
    isSpeaking ||
    !!micSpeech.interim.trim() ||
    captureProcessing ||
    callAudioActive ||
    micAudioActive ||
    !!liveCaption.trim() ||
    lines.length > 0;

  const mode: MeetingTranscriptionState["mode"] = !active
    ? "idle"
    : hasCallAudio && hasMicCapture
      ? "hybrid"
      : hasCallAudio
        ? "call-audio"
        : aiReady
          ? "whisper"
          : "webspeech";

  return {
    lines,
    interim,
    supported: micSpeech.supported,
    error,
    mode,
    hasSystemAudio: hasCallAudio,
    hasMic:
      hasMicCapture ||
      !!micSpeech.interim.trim() ||
      micSpeech.lines.length > 0,
    aiReady,
    hearingAudio,
    isSpeaking,
    audioCaptureMode,
    audioSource,
    audioSetup,
    clear,
  };
}
