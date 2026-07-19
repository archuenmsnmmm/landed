/**
 * Screenshot compression helpers for vision requests.
 * Uses browser Canvas — only call from the renderer.
 */

export interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: "image/jpeg" | "image/webp";
}

export interface CompressResult {
  imageBase64: string;
  width: number;
  height: number;
  mimeType: string;
  /** Approximate decoded byte length. */
  byteLength: number;
}

function stripDataUrl(dataUrlOrBase64: string): {
  base64: string;
  mime: string;
} {
  const match = /^data:([^;]+);base64,(.+)$/s.exec(dataUrlOrBase64);
  if (match) {
    return { mime: match[1]!, base64: match[2]! };
  }
  return { mime: "image/jpeg", base64: dataUrlOrBase64 };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Invalid image"));
    img.src = src;
  });
}

/** Resize + re-encode a JPEG/PNG base64 screenshot for cheaper vision calls. */
export async function compressScreenshot(
  imageBase64: string,
  options: CompressOptions = {},
): Promise<CompressResult> {
  const maxWidth = options.maxWidth ?? 1600;
  const maxHeight = options.maxHeight ?? 900;
  const quality = options.quality ?? 0.82;
  const mimeType = options.mimeType ?? "image/jpeg";

  const { base64, mime } = stripDataUrl(imageBase64);
  const dataUrl = `data:${mime};base64,${base64}`;
  const img = await loadImage(dataUrl);

  let width = img.naturalWidth || img.width;
  let height = img.naturalHeight || img.height;
  if (width <= 0 || height <= 0) {
    throw new Error("Invalid image dimensions");
  }

  const scale = Math.min(1, maxWidth / width, maxHeight / height);
  const outW = Math.max(1, Math.round(width * scale));
  const outH = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.drawImage(img, 0, 0, outW, outH);

  const outUrl = canvas.toDataURL(mimeType, quality);
  const out = stripDataUrl(outUrl);
  const byteLength = Math.ceil((out.base64.length * 3) / 4);

  return {
    imageBase64: out.base64,
    width: outW,
    height: outH,
    mimeType,
    byteLength,
  };
}

/** Decode JPEG base64 into RGBA pixels for perceptual hashing. */
export async function decodeJpegToRgba(imageBase64: string): Promise<{
  rgba: Uint8ClampedArray;
  width: number;
  height: number;
}> {
  const { base64, mime } = stripDataUrl(imageBase64);
  const img = await loadImage(`data:${mime};base64,${base64}`);
  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, width, height);
  return { rgba: data.data, width, height };
}

export function estimateBase64Bytes(base64: string): number {
  return Math.ceil((base64.length * 3) / 4);
}
