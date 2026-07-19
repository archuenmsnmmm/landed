import { DOWNLOAD_RELEASE_TAG } from "./version";
import type { DownloadPlatform } from "./platform";
import { APP_VERSION } from "./version";

/** Must match the GitHub remote that publishes Desktop Release tags. */
const GITHUB_REPO =
  process.env.GITHUB_RELEASE_REPO?.trim() ?? "archuenmsnmmm/landed";

/** Preferred asset names per platform (first match wins). */
const ASSET_PREFERENCES: Record<DownloadPlatform, string[]> = {
  mac: [
    "Landed.dmg",
    `Landed-${APP_VERSION}-arm64.dmg`,
    `Landed-${APP_VERSION}.dmg`,
    "Landed.zip",
  ],
  windows: [
    "Landed-Setup.exe",
    `Landed-Setup-${APP_VERSION}.exe`,
    "Landed-Windows.zip",
  ],
};

type GitHubReleaseAsset = {
  name: string;
  browser_download_url: string;
};

type GitHubRelease = {
  assets?: GitHubReleaseAsset[];
};

let cachedRelease: { fetchedAt: number; assets: GitHubReleaseAsset[] } | null =
  null;

const CACHE_MS = 5 * 60 * 1000;

const GITHUB_HEADERS = {
  Accept: "application/vnd.github+json",
  "User-Agent": "landed-download",
} as const;

async function fetchReleaseAssets(
  endpoint: "latest" | `tags/${string}`,
): Promise<GitHubReleaseAsset[]> {
  if (!GITHUB_REPO) return [];

  const response = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/releases/${endpoint}`,
    {
      headers: GITHUB_HEADERS,
      next: { revalidate: 300 },
    },
  );

  if (!response.ok) return [];

  const release = (await response.json()) as GitHubRelease;
  return release.assets ?? [];
}

async function fetchLatestReleaseAssets(): Promise<GitHubReleaseAsset[]> {
  if (cachedRelease && Date.now() - cachedRelease.fetchedAt < CACHE_MS) {
    return cachedRelease.assets;
  }

  let assets = await fetchReleaseAssets("latest");
  if (assets.length === 0) {
    assets = await fetchReleaseAssets(`tags/${DOWNLOAD_RELEASE_TAG}`);
  }

  if (assets.length > 0) {
    cachedRelease = { fetchedAt: Date.now(), assets };
  }

  return assets.length > 0 ? assets : (cachedRelease?.assets ?? []);
}

/** Resolve the best GitHub Release download URL for a platform. */
export async function resolveGitHubAssetUrl(
  platform: DownloadPlatform,
): Promise<{ url: string; filename: string } | null> {
  const assets = await fetchLatestReleaseAssets();
  if (assets.length === 0) return null;

  const preferences = ASSET_PREFERENCES[platform];
  for (const preferred of preferences) {
    const match = assets.find((asset) => asset.name === preferred);
    if (match) {
      return { url: match.browser_download_url, filename: match.name };
    }
  }

  // Only Landed-branded assets — never fall back to legacy Replii installers.
  const fallback = assets.find((asset) =>
    platform === "windows"
      ? /^Landed.*\.exe$/i.test(asset.name)
      : /^Landed.*\.(dmg|zip)$/i.test(asset.name),
  );

  if (!fallback) return null;
  return { url: fallback.browser_download_url, filename: fallback.name };
}
