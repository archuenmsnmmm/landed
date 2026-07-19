/**
 * Screen text helpers for transcript suggestions.
 * Continuous OCR / screen watching was removed — asks send screenshots
 * directly to the vision model instead.
 */

export function peekScreenContext(): string {
  return "";
}

export function peekScreenFingerprint(): string {
  return "";
}

export function updateScreenContextCache(_text: string): string {
  return "";
}

export async function getScreenContext(
  _force = false,
  _opts?: { light?: boolean },
): Promise<string> {
  return "";
}

export function clearScreenContext(): void {
  // no-op — no OCR cache
}

export function formatScreenContextBlock(screenContent: string): string {
  const trimmed = screenContent.trim();
  if (!trimmed) return "SCREEN CONTENT:\n(none captured)";
  return `SCREEN CONTENT:\n${trimmed}`;
}
