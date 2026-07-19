export type DownloadPlatform = "mac" | "windows";

function platformFromHints(platformHint: string, userAgent: string): DownloadPlatform | null {
  if (/Win/i.test(platformHint) || /Windows|Win64|Win32|WOW64/i.test(userAgent)) {
    return "windows";
  }
  if (/Mac|iPhone|iPad|iPod|Macintosh/i.test(platformHint) || /Mac OS X|Macintosh/i.test(userAgent)) {
    return "mac";
  }
  return null;
}

/** Detect the visitor's desktop OS for download CTAs. Defaults to Mac during SSR. */
export function detectDownloadPlatform(userAgent?: string): DownloadPlatform {
  if (typeof navigator !== "undefined") {
    const nav = navigator as Navigator & {
      userAgentData?: { platform?: string };
    };
    const platformHint = nav.userAgentData?.platform || nav.platform || "";
    const ua = userAgent ?? nav.userAgent ?? "";
    const detected = platformFromHints(platformHint, ua);
    if (detected) return detected;
  }

  const ua = userAgent ?? "";
  if (/Windows|Win64|Win32|WOW64/i.test(ua)) return "windows";
  return "mac";
}
