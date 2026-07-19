import type { DownloadPlatform } from "./platform";
import { LANDED_PRODUCTION_ORIGIN } from "./landed-urls";
import { DOWNLOAD_RELEASE_TAG } from "./version";

export { DOWNLOAD_RELEASE_TAG };

/** Primary production host for static installers and billing API. */
export const VERCEL_APP_ORIGIN =
  process.env.NEXT_PUBLIC_APP_URL?.trim() || LANDED_PRODUCTION_ORIGIN;

export const RELEASE_PAGE_URL =
  "https://github.com/archuenmsnmmm/landed/releases/latest";

/** Notarized Mac installer — hosted on Vercel Blob (exceeds Vercel deploy file limit). */
export const MAC_DOWNLOAD_BLOB_URL =
  "https://koen8vbjbnttgldm.public.blob.vercel-storage.com/downloads/Landed.dmg";

/** Windows installer — hosted on Vercel Blob when Landed-Setup.exe is published. */
export const WINDOWS_DOWNLOAD_BLOB_URL =
  process.env.NEXT_PUBLIC_WINDOWS_DOWNLOAD_URL?.trim() ||
  "https://koen8vbjbnttgldm.public.blob.vercel-storage.com/downloads/Landed-Setup.exe";

/** Explicit override (Vercel Blob or GitHub asset URL). Empty = resolve via /api/download. */
export const MAC_DOWNLOAD_GITHUB_URL =
  process.env.NEXT_PUBLIC_MAC_DOWNLOAD_URL?.trim() || "";

export const WINDOWS_DOWNLOAD_GITHUB_URL =
  process.env.NEXT_PUBLIC_WINDOWS_DOWNLOAD_URL?.trim() || "";

export const MAC_DOWNLOAD_FILENAME = "Landed.dmg";
export const WINDOWS_DOWNLOAD_FILENAME = "Landed-Setup.exe";

/**
 * Windows downloads are disabled until installer + permission parity are ready.
 * Re-enable later with NEXT_PUBLIC_WINDOWS_AVAILABLE=true after Landed-Setup.exe
 * is published (Blob URL and/or GitHub Release asset).
 */
export function isWindowsDownloadAvailable(): boolean {
  return false;
}

/** @deprecated Use DOWNLOAD_RELEASE_TAG */
export const MAC_DOWNLOAD_RELEASE_TAG = DOWNLOAD_RELEASE_TAG;

export function getExternalDownloadUrl(platform: DownloadPlatform): string {
  if (platform === "windows") {
    return WINDOWS_DOWNLOAD_GITHUB_URL || WINDOWS_DOWNLOAD_BLOB_URL || RELEASE_PAGE_URL;
  }
  return MAC_DOWNLOAD_GITHUB_URL || MAC_DOWNLOAD_BLOB_URL || RELEASE_PAGE_URL;
}

/** Local dev file path (served from public/downloads after npm run sync-downloads). */
export function getLocalDownloadPath(platform: DownloadPlatform): string {
  const filename =
    platform === "windows" ? WINDOWS_DOWNLOAD_FILENAME : MAC_DOWNLOAD_FILENAME;
  return `/downloads/${filename}`;
}

/** Direct asset URL for server-side redirects. */
export function getDownloadAssetUrl(platform: DownloadPlatform): string {
  return getLocalDownloadPath(platform);
}

/**
 * User-facing download href.
 * - Local / Vercel: same-origin API (serves local files in dev, redirects to GitHub in prod).
 * - External fallback: direct GitHub when host blocks API routes.
 */
export function getDownloadHref(platform: DownloadPlatform): string {
  return `/api/download?platform=${platform}`;
}

/** Pick the best download URL in the browser. */
export function resolveDownloadHref(platform: DownloadPlatform): string {
  return getDownloadHref(platform);
}

export function getDownloadInfo(platform: DownloadPlatform) {
  const externalUrl = getExternalDownloadUrl(platform);

  if (platform === "windows") {
    const available = isWindowsDownloadAvailable();
    return {
      platform,
      url: getDownloadHref(platform),
      externalUrl,
      filename: WINDOWS_DOWNLOAD_FILENAME,
      isAvailable: available,
      label: available ? "Get for Windows" : "Windows soon",
      longLabel: available
        ? "Download Landed for Windows"
        : "Windows installer coming soon",
      unavailableMessage: available
        ? null
        : "Windows build coming soon — Mac is available now.",
    } as const;
  }

  return {
    platform,
    url: getDownloadHref(platform),
    externalUrl,
    filename: MAC_DOWNLOAD_FILENAME,
    isAvailable: true,
    label: "Download for macOS",
    longLabel: "Download Landed for macOS",
    unavailableMessage: null,
  } as const;
}
