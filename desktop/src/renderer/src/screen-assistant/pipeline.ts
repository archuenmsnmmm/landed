/**
 * Screen-aware assistant — Phase 1 MVP:
 *
 *   captureScreen() → compress → vision AI → text answer
 *
 * No OCR, no continuous monitoring, no context memory.
 * Hotkey / button invokes askAboutScreen(question).
 */

import { compressScreenshot } from "./compress";
import { getAIProvider, ScreenAssistantError } from "./ai-provider";
import { captureViaDisplayMedia, getScreenCaptureProvider } from "./capture";
import { assessFrameQuality, sanitizeVisionAnswer } from "./frame-quality";
import type { CaptureScreenOptions, ImageFrame } from "./types";

export type AskAboutScreenResult = {
  text: string;
  viewedScreen: boolean;
  frame: ImageFrame | null;
};

let lastFrame: ImageFrame | null = null;

export function getLastCapturedFrame(): ImageFrame | null {
  return lastFrame;
}

export function clearLastCapturedFrame(): void {
  lastFrame = null;
}

/** Capture the active display (full-screen). Alias for the MVP entry point. */
export async function captureScreen(
  options: CaptureScreenOptions = {},
): Promise<ImageFrame> {
  return captureForAssistant(options);
}

/**
 * Capture → quality-check → compress.
 *
 * Prefer light capture (content-protection, overlay stays visible) so asks
 * show message → Thinking… → answer without the window closing/reopening.
 * Only hide the overlay when light frames are blank/unusable.
 */
export async function captureForAssistant(
  options: CaptureScreenOptions = {},
): Promise<ImageFrame> {
  if (!window.landed?.captureFrame && !window.landed?.captureScreen) {
    throw new ScreenAssistantError(
      "Screen capture is only available in the Landed desktop app (not the website). Run: npm run desktop:dev",
      "capture",
    );
  }

  const provider = getScreenCaptureProvider();
  const preferLight = options.light !== false;

  // Keep the overlay on screen for the common ask path.
  let frame = preferLight
    ? await provider.captureActive({ ...options, light: true })
    : null;

  if (frame) {
    const quality = await assessFrameQuality(frame);
    console.log("[landed] Light capture quality:", quality);
    if (!quality.ok) {
      console.warn("[landed] Light capture unusable:", quality.reason);
      frame = null;
    }
  }

  // Last resort: hide overlay briefly for a clean grab (causes a flicker).
  if (!frame) {
    console.warn("[landed] Falling back to hide-overlay capture…");
    frame = await provider.captureActive({ ...options, light: false });
    if (!frame) {
      await new Promise((r) => setTimeout(r, 300));
      frame = await provider.captureActive({ ...options, light: false });
    }
    if (frame) {
      const quality = await assessFrameQuality(frame);
      console.log("[landed] Hide-overlay capture quality:", quality);
      if (!quality.ok) {
        console.warn("[landed] Hide-overlay capture unusable:", quality.reason);
        frame = null;
      }
    }
  }

  if (!frame) {
    console.warn("[landed] Trying display-media capture fallback…");
    frame = await captureViaDisplayMedia();
    if (frame) {
      const quality = await assessFrameQuality(frame);
      console.log("[landed] Display-media quality:", quality);
      if (!quality.ok) frame = null;
    }
  }

  if (!frame) {
    const permissions = await window.landed?.getPermissionStatus?.();
    try {
      await window.landed?.openPermissionSettings?.("screen");
    } catch {
      // ignore
    }
    if (permissions && permissions.screen === false) {
      throw new ScreenAssistantError(
        "Screen Recording is off for Landed. Enable it in System Settings → Privacy & Security → Screen Recording, then quit fully (Cmd+Q) and reopen.",
        "permission",
      );
    }
    throw new ScreenAssistantError(
      "Screenshot came back blank. Enable Landed in Screen Recording, quit with Cmd+Q, and reopen.",
      "capture",
    );
  }

  try {
    const compressed = await compressScreenshot(frame.imageBase64, {
      maxWidth: 1600,
      maxHeight: 900,
      quality: 0.82,
    });
    const next = {
      ...frame,
      imageBase64: compressed.imageBase64,
      width: compressed.width || frame.width,
      height: compressed.height || frame.height,
    };
    const q = await assessFrameQuality(next);
    if (q.ok) frame = next;
  } catch {
    // Keep original if canvas compress fails.
  }

  lastFrame = frame;
  return frame;
}

/**
 * MVP flow:
 *   capture → compress → send image + question to vision model → answer
 */
export async function askAboutScreen(options: {
  question: string;
  frame?: ImageFrame | null;
  captureOptions?: CaptureScreenOptions;
  signal?: AbortSignal;
}): Promise<AskAboutScreenResult> {
  let frame = options.frame ?? null;
  if (!frame) {
    frame = await captureForAssistant(options.captureOptions);
  }

  const question =
    options.question.trim() || "What is happening on this screen?";

  const ai = getAIProvider();
  const response = await ai.analyze({
    question,
    image: frame.imageBase64,
    signal: options.signal,
  });

  const text = sanitizeVisionAnswer(response.text) || response.text.trim();
  if (!text) {
    throw new ScreenAssistantError(
      "Couldn't get a readable screenshot. Enable Landed in Screen Recording, then quit (Cmd+Q) and reopen.",
      "capture",
    );
  }

  return {
    text,
    viewedScreen: response.viewedScreen,
    frame,
  };
}
