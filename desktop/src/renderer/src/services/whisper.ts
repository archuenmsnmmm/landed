import { speechLangFromSetting } from "./transcript";
import { OPENAI_MODELS } from "../lib/openai-config";

const MIN_BLOB_BYTES = 96;
const MIN_SPEECH_BLOB_BYTES = 1400;

const WHISPER_LANG_MAP: Record<string, string> = {
  "en-US": "en",
  "es-ES": "es",
  "fr-FR": "fr",
  "de-DE": "de",
  "pt-BR": "pt",
  "zh-CN": "zh",
  "ja-JP": "ja",
};

const HALLUCINATION_PATTERNS = [
  /^thank you for watching\.?$/i,
  /^thanks for watching\.?$/i,
  /^please subscribe\.?$/i,
  /^subscribe\.?$/i,
  /^subtitles by\b/i,
  /^translated by\b/i,
  /^\(?music\)?\.?$/i,
  /^\(?applause\)?\.?$/i,
  /^\(?silence\)?\.?$/i,
  /^\.+$/,
  /^you\.?$/i,
  /^bye\.?$/i,
  /^goodbye\.?$/i,
];

interface WhisperSegment {
  text?: string;
  avg_logprob?: number;
  no_speech_prob?: number;
}

interface WhisperVerboseResponse {
  text?: string;
  segments?: WhisperSegment[];
}

function extensionForMime(mimeType: string): string {
  if (mimeType.includes("ogg")) return "ogg";
  if (mimeType.includes("mp4") || mimeType.includes("m4a")) return "m4a";
  return "webm";
}

export function whisperLangFromSetting(meetingLanguage: string): string | undefined {
  const bcp47 = speechLangFromSetting(meetingLanguage);
  return WHISPER_LANG_MAP[bcp47];
}

function isLikelyWhisperHallucination(text: string, segments?: WhisperSegment[]): boolean {
  const trimmed = text.trim();
  if (!trimmed) return true;

  if (segments?.length) {
    const avgNoSpeech =
      segments.reduce((sum, seg) => sum + (seg.no_speech_prob ?? 0), 0) / segments.length;
    const avgLogprob =
      segments.reduce((sum, seg) => sum + (seg.avg_logprob ?? 0), 0) / segments.length;
    if (avgNoSpeech > 0.62) return true;
    if (avgLogprob < -1.05) return true;
  }

  return HALLUCINATION_PATTERNS.some((pattern) => pattern.test(trimmed));
}

let cachedKey: string | undefined;
let bootstrapPromise: Promise<string | undefined> | null = null;

function readBuiltInKey(): string | undefined {
  const key = import.meta.env.VITE_OPENAI_API_KEY?.trim();
  return key || undefined;
}

export function getOpenAIKeySync(): string | undefined {
  return cachedKey || readBuiltInKey();
}

export async function bootstrapOpenAIKey(): Promise<string | undefined> {
  if (cachedKey) return cachedKey;

  const builtIn = readBuiltInKey();
  if (builtIn) {
    cachedKey = builtIn;
    return cachedKey;
  }

  if (!bootstrapPromise) {
    bootstrapPromise = window.landed
      ?.getOpenAIKey?.()
      .then((key) => {
        const trimmed = key?.trim();
        cachedKey = trimmed || undefined;
        return cachedKey;
      })
      .catch(() => undefined)
      .finally(() => {
        bootstrapPromise = null;
      });
  }

  return bootstrapPromise;
}

export async function getOpenAIKey(): Promise<string | undefined> {
  const existing = getOpenAIKeySync();
  if (existing) return existing;
  return bootstrapOpenAIKey();
}

export async function transcribeAudioChunk(
  blob: Blob,
  meetingLanguage: string,
  mimeType = "audio/webm",
): Promise<string | null> {
  const apiKey = await getOpenAIKey();
  if (!apiKey || blob.size < MIN_BLOB_BYTES) return null;

  const ext = extensionForMime(mimeType);
  const formData = new FormData();
  formData.append("file", blob, `audio.${ext}`);
  formData.append("model", OPENAI_MODELS.whisper);
  formData.append("response_format", "verbose_json");
  formData.append("temperature", "0");

  const lang = whisperLangFromSetting(meetingLanguage);
  if (lang) formData.append("language", lang);

  try {
    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: formData,
    });

    if (!res.ok) {
      console.warn("[landed] Whisper failed:", res.status, await res.text().catch(() => ""));
      return null;
    }

    const data = (await res.json()) as WhisperVerboseResponse;
    const text = data.text?.trim();
    if (!text || isLikelyWhisperHallucination(text, data.segments)) return null;
    return text;
  } catch (err) {
    console.warn("[landed] Whisper error:", err);
    return null;
  }
}

export { MIN_SPEECH_BLOB_BYTES };
