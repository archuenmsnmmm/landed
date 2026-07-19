import { decodeJpegToRgba } from "./compress";
import type { ImageFrame } from "./types";

export type FrameQuality = {
  ok: boolean;
  reason?: string;
  width: number;
  height: number;
  mean: number;
  variance: number;
  byteLength: number;
};

/** Reject empty / black / white / tiny frames before sending to vision. */
export async function assessFrameQuality(
  frame: ImageFrame,
): Promise<FrameQuality> {
  const byteLength = Math.ceil((frame.imageBase64.length * 3) / 4);
  if (byteLength < 4_000) {
    return {
      ok: false,
      reason: "too_small",
      width: 0,
      height: 0,
      mean: 0,
      variance: 0,
      byteLength,
    };
  }

  // JPEG magic: /9j/ in base64 for ffd8
  if (!frame.imageBase64.startsWith("/9j/")) {
    return {
      ok: false,
      reason: "not_jpeg",
      width: 0,
      height: 0,
      mean: 0,
      variance: 0,
      byteLength,
    };
  }

  try {
    const { rgba, width, height } = await decodeJpegToRgba(frame.imageBase64);
    if (width < 32 || height < 32) {
      return {
        ok: false,
        reason: "tiny_dimensions",
        width,
        height,
        mean: 0,
        variance: 0,
        byteLength,
      };
    }

    let sum = 0;
    let sumSq = 0;
    let samples = 0;
    const step = Math.max(4, Math.floor((width * height) / 1500)) * 4;
    for (let i = 0; i + 3 < rgba.length; i += step) {
      const lum = 0.299 * (rgba[i] ?? 0) + 0.587 * (rgba[i + 1] ?? 0) + 0.114 * (rgba[i + 2] ?? 0);
      sum += lum;
      sumSq += lum * lum;
      samples += 1;
    }
    const mean = samples ? sum / samples : 0;
    const variance = samples ? sumSq / samples - mean * mean : 0;

    // Black / white / flat frames are useless to vision models.
    // Keep thresholds lenient — Retina UI and dark themes still have real variance.
    if (variance < 12 && (mean < 10 || mean > 248)) {
      return { ok: false, reason: "flat_frame", width, height, mean, variance, byteLength };
    }
    if (variance < 4) {
      return { ok: false, reason: "no_detail", width, height, mean, variance, byteLength };
    }

    return { ok: true, width, height, mean, variance, byteLength };
  } catch {
    return {
      ok: false,
      reason: "decode_failed",
      width: 0,
      height: 0,
      mean: 0,
      variance: 0,
      byteLength,
    };
  }
}

/** Never show model diagnostic tokens to the user. */
export function sanitizeVisionAnswer(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase();
  if (
    lower === "capture_failed" ||
    lower === "capture_failed." ||
    /^capture[_\s-]?failed\.?$/i.test(trimmed)
  ) {
    return null;
  }
  if (
    /cannot see|can't see|unable to see|don't see|do not see|nothing (is )?visible|no screenshot|not able to see|i'm unable to view|i am unable to view/i.test(
      lower,
    ) &&
    /screen|app|image|screenshot|display/i.test(lower)
  ) {
    return null;
  }
  return trimmed;
}
