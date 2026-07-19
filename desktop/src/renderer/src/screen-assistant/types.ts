/** Types for the screen → vision AI → answer bridge. */

export type CaptureSourceType = "display" | "window" | "region";

export interface DisplayInfo {
  id: string;
  name: string;
  bounds: { x: number; y: number; width: number; height: number };
  isPrimary?: boolean;
}

export interface WindowInfo {
  id: string;
  name: string;
  thumbnailDataUrl?: string;
}

export interface CaptureRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  displayId?: string;
}

export interface ImageFrame {
  /** Raw JPEG bytes as base64 (no data-URL prefix). */
  imageBase64: string;
  width: number;
  height: number;
  timestamp: number;
  sourceId: string;
  sourceType: CaptureSourceType;
  sourceName?: string;
}

export interface CaptureScreenOptions {
  light?: boolean;
  displayId?: string;
  region?: CaptureRegion;
  windowId?: string;
}

export interface AnalyzeScreenInput {
  question: string;
  image: string;
  signal?: AbortSignal;
}

export interface AIResponse {
  text: string;
  viewedScreen: boolean;
}

/** Fallback vision prompt — overlay asks use codingSystemPrompt() via mode:"coding". */
export const SCREEN_ASSISTANT_SYSTEM_PROMPT = `You are a visual desktop assistant. A screenshot of the user's screen is attached.

Rules:
- Answer from what is visibly on screen: apps, windows, text, code, errors, documents, UI.
- IGNORE only a small dark floating Landed ask bar if present — everything else counts.
- Be specific. Never invent content that is not visible.
- If the screen shows a coding problem, respond with ## Problem / ## My Thoughts / ## Solution / ## Complexity markdown and a complete working solution in the language shown.
- Be concise by default; go longer when the question needs it (e.g. full code).`;
