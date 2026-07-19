import type {
  CaptureRegion,
  CaptureScreenOptions,
  DisplayInfo,
  ImageFrame,
  WindowInfo,
} from "./types";

export interface ScreenCaptureProvider {
  getDisplays(): Promise<DisplayInfo[]>;
  getWindows(): Promise<WindowInfo[]>;
  captureDisplay(displayId: string): Promise<ImageFrame | null>;
  captureWindow(windowId: string): Promise<ImageFrame | null>;
  captureRegion(region: CaptureRegion): Promise<ImageFrame | null>;
  /** Capture the default/active display (MVP entry point). */
  captureActive(options?: CaptureScreenOptions): Promise<ImageFrame | null>;
}

type NativeCaptureResult = {
  imageBase64: string;
  width?: number;
  height?: number;
  sourceId?: string;
  sourceType?: "display" | "window" | "region";
  sourceName?: string;
};

function frameFromNative(
  result: NativeCaptureResult | string | null | undefined,
  fallback: Partial<ImageFrame> = {},
): ImageFrame | null {
  if (!result) return null;
  if (typeof result === "string") {
    const imageBase64 = result.trim();
    if (!imageBase64) return null;
    return {
      imageBase64,
      width: fallback.width ?? 0,
      height: fallback.height ?? 0,
      timestamp: Date.now(),
      sourceId: fallback.sourceId ?? "display:active",
      sourceType: fallback.sourceType ?? "display",
      sourceName: fallback.sourceName,
    };
  }
  const imageBase64 = result.imageBase64?.trim();
  if (!imageBase64) return null;
  return {
    imageBase64,
    width: result.width ?? fallback.width ?? 0,
    height: result.height ?? fallback.height ?? 0,
    timestamp: Date.now(),
    sourceId: result.sourceId ?? fallback.sourceId ?? "display:active",
    sourceType: result.sourceType ?? fallback.sourceType ?? "display",
    sourceName: result.sourceName ?? fallback.sourceName,
  };
}

/** Electron bridge implementation of ScreenCaptureProvider. */
export class ElectronScreenCaptureProvider implements ScreenCaptureProvider {
  async getDisplays(): Promise<DisplayInfo[]> {
    const list = await window.landed?.getDisplays?.();
    if (!list?.length) return [];
    return list.map((d) => ({
      id: String(d.id),
      name: d.label || `Display ${d.id}`,
      bounds: d.bounds,
    }));
  }

  async getWindows(): Promise<WindowInfo[]> {
    const list = await window.landed?.listWindows?.();
    if (!list?.length) return [];
    return list.map((w) => ({
      id: w.id,
      name: w.name,
      thumbnailDataUrl: w.thumbnailDataUrl,
    }));
  }

  async captureDisplay(displayId: string): Promise<ImageFrame | null> {
    const result = await window.landed?.captureFrame?.({ displayId });
    return frameFromNative(result, {
      sourceId: `display:${displayId}`,
      sourceType: "display",
    });
  }

  async captureWindow(windowId: string): Promise<ImageFrame | null> {
    const result = await window.landed?.captureFrame?.({ windowId });
    return frameFromNative(result, {
      sourceId: `window:${windowId}`,
      sourceType: "window",
    });
  }

  async captureRegion(region: CaptureRegion): Promise<ImageFrame | null> {
    const result = await window.landed?.captureFrame?.({ region });
    return frameFromNative(result, {
      sourceId: "region",
      sourceType: "region",
    });
  }

  async captureActive(
    options: CaptureScreenOptions = {},
  ): Promise<ImageFrame | null> {
    if (options.windowId) return this.captureWindow(options.windowId);
    if (options.region) return this.captureRegion(options.region);
    if (options.displayId) return this.captureDisplay(options.displayId);

    // Prefer rich captureFrame; fall back to legacy string capture.
    if (window.landed?.captureFrame) {
      const result = await window.landed.captureFrame({
        light: options.light,
      });
      const native = frameFromNative(result);
      if (native) return native;
    }

    const legacy = await window.landed?.captureScreen?.(
      options.light ? { light: true } : undefined,
    );
    const fromLegacy = frameFromNative(legacy);
    if (fromLegacy) return fromLegacy;

    // Last resort: Electron display-media stream → canvas frame.
    return captureViaDisplayMedia();
  }
}

/**
 * Capture via getDisplayMedia (Electron routes this through desktopCapturer).
 * Useful when native screencapture/thumbnail paths return blank frames.
 */
export async function captureViaDisplayMedia(): Promise<ImageFrame | null> {
  if (!navigator.mediaDevices?.getDisplayMedia) return null;

  let stream: MediaStream | null = null;
  try {
    stream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        frameRate: { ideal: 5 },
      },
      audio: false,
    });

    const track = stream.getVideoTracks()[0];
    if (!track) return null;

    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.srcObject = stream;
    await video.play();

    // Wait for a real frame.
    for (let i = 0; i < 20; i++) {
      if (video.videoWidth > 16 && video.videoHeight > 16) break;
      await new Promise((r) => setTimeout(r, 50));
    }
    if (video.videoWidth < 16 || video.videoHeight < 16) return null;

    await new Promise((r) => setTimeout(r, 120));

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    const imageBase64 = dataUrl.replace(/^data:image\/jpeg;base64,/, "");
    if (!imageBase64 || imageBase64.length < 2_000) return null;

    return {
      imageBase64,
      width: canvas.width,
      height: canvas.height,
      timestamp: Date.now(),
      sourceId: "display:media",
      sourceType: "display",
      sourceName: track.label || "Display media",
    };
  } catch (err) {
    console.warn("[landed] display-media capture failed:", err);
    return null;
  } finally {
    stream?.getTracks().forEach((t) => t.stop());
  }
}

let defaultProvider: ScreenCaptureProvider | null = null;

export function getScreenCaptureProvider(): ScreenCaptureProvider {
  if (!defaultProvider) {
    defaultProvider = new ElectronScreenCaptureProvider();
  }
  return defaultProvider;
}

export function setScreenCaptureProvider(provider: ScreenCaptureProvider): void {
  defaultProvider = provider;
}

export function frameToDataUrl(frame: ImageFrame): string {
  return `data:image/jpeg;base64,${frame.imageBase64}`;
}
