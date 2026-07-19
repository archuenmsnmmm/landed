const SPEECH_START_LEVEL = 0.014;
const SPEECH_END_LEVEL = 0.007;
const SPEECH_SILENCE_MS = 400;

export interface SpeechDetector {
  isSpeaking: () => boolean;
  stop: () => void;
}

/** Tracks voice activity with hysteresis so Whisper only runs on real speech. */
export function createSpeechDetector(
  stream: MediaStream,
  callbacks: { onSpeechStart?: () => void; onSpeechEnd?: () => void } = {},
): SpeechDetector {
  const ctx = new AudioContext();
  void ctx.resume();

  const source = ctx.createMediaStreamSource(stream);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 512;
  source.connect(analyser);

  const data = new Uint8Array(analyser.fftSize);
  let speaking = false;
  let silenceSince: number | null = null;
  let raf = 0;

  const tick = () => {
    analyser.getByteTimeDomainData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      const sample = ((data[i] ?? 128) - 128) / 128;
      sum += sample * sample;
    }
    const level = Math.sqrt(sum / data.length);
    const now = performance.now();

    if (level >= SPEECH_START_LEVEL) {
      silenceSince = null;
      if (!speaking) {
        speaking = true;
        callbacks.onSpeechStart?.();
      }
    } else if (level <= SPEECH_END_LEVEL) {
      if (speaking) {
        if (silenceSince === null) {
          silenceSince = now;
        } else if (now - silenceSince >= SPEECH_SILENCE_MS) {
          speaking = false;
          silenceSince = null;
          callbacks.onSpeechEnd?.();
        }
      }
    }

    raf = requestAnimationFrame(tick);
  };

  raf = requestAnimationFrame(tick);

  return {
    isSpeaking: () => speaking,
    stop: () => {
      cancelAnimationFrame(raf);
      source.disconnect();
      void ctx.close();
    },
  };
}

export function startAudioLevelMonitor(
  stream: MediaStream,
  onLevel: (level: number) => void,
): () => void {
  const ctx = new AudioContext();
  void ctx.resume();

  const source = ctx.createMediaStreamSource(stream);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 512;
  source.connect(analyser);

  const data = new Uint8Array(analyser.fftSize);
  let raf = 0;

  const tick = () => {
    analyser.getByteTimeDomainData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      const sample = ((data[i] ?? 128) - 128) / 128;
      sum += sample * sample;
    }
    onLevel(Math.sqrt(sum / data.length));
    raf = requestAnimationFrame(tick);
  };

  raf = requestAnimationFrame(tick);

  return () => {
    cancelAnimationFrame(raf);
    source.disconnect();
    void ctx.close();
  };
}
