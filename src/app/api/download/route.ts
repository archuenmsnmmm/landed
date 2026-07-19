import { createReadStream, existsSync, statSync } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { NextRequest, NextResponse } from "next/server";
import {
  getExternalDownloadUrl,
  getLocalDownloadPath,
  isWindowsDownloadAvailable,
  MAC_DOWNLOAD_BLOB_URL,
  MAC_DOWNLOAD_FILENAME,
  RELEASE_PAGE_URL,
  WINDOWS_DOWNLOAD_BLOB_URL,
  WINDOWS_DOWNLOAD_FILENAME,
} from "@/lib/download";
import { resolveGitHubAssetUrl } from "@/lib/github-release";
import type { DownloadPlatform } from "@/lib/platform";
import { APP_VERSION } from "@/lib/version";

function parsePlatform(value: string | null): DownloadPlatform {
  return value === "windows" ? "windows" : "mac";
}

const LOCAL_CANDIDATES: Record<DownloadPlatform, string[]> = {
  mac: [MAC_DOWNLOAD_FILENAME, `Landed-${APP_VERSION}-arm64.dmg`],
  windows: [WINDOWS_DOWNLOAD_FILENAME, `Landed-Setup-${APP_VERSION}.exe`],
};

const CONTENT_TYPES: Record<string, string> = {
  ".dmg": "application/x-apple-diskimage",
  ".exe": "application/vnd.microsoft.portable-executable",
  ".zip": "application/zip",
};

function findLocalInstaller(
  platform: DownloadPlatform,
): { filename: string; filePath: string } | null {
  for (const filename of LOCAL_CANDIDATES[platform]) {
    const filePath = path.join(process.cwd(), "public", "downloads", filename);
    if (existsSync(filePath)) return { filename, filePath };
  }
  return null;
}

async function isDownloadUrlReachable(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(8_000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

function redirectToDownload(
  url: string,
  filename: string,
  cacheControl: string,
): NextResponse {
  const response = NextResponse.redirect(url, 302);
  response.headers.set("Content-Disposition", `attachment; filename="${filename}"`);
  response.headers.set("Cache-Control", cacheControl);
  return response;
}

function serveLocalFile(
  local: { filename: string; filePath: string },
): NextResponse {
  const ext = path.extname(local.filename).toLowerCase();
  const contentType = CONTENT_TYPES[ext] ?? "application/octet-stream";
  const size = statSync(local.filePath).size;
  const stream = createReadStream(local.filePath);
  const body = Readable.toWeb(stream) as ReadableStream;

  return new NextResponse(body, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${local.filename}"`,
      "Content-Length": String(size),
      "Cache-Control": "private, max-age=3600",
    },
  });
}

async function resolvePlatformDownload(
  request: NextRequest,
  platform: DownloadPlatform,
): Promise<NextResponse> {
  const fallbackFilename =
    platform === "windows" ? WINDOWS_DOWNLOAD_FILENAME : MAC_DOWNLOAD_FILENAME;
  const configuredUrl = getExternalDownloadUrl(platform);
  const local = findLocalInstaller(platform);

  if (platform === "windows" && !isWindowsDownloadAvailable()) {
    if (local && process.env.NODE_ENV === "development") {
      return serveLocalFile(local);
    }
    return NextResponse.json(
      {
        error: "Windows installer not available yet",
        hint: "Mac is available now. Publish Landed-Setup.exe, then set NEXT_PUBLIC_WINDOWS_AVAILABLE=true (and optionally NEXT_PUBLIC_WINDOWS_DOWNLOAD_URL).",
        platform,
        releasePage: RELEASE_PAGE_URL,
      },
      { status: 404 },
    );
  }

  if (local && process.env.NODE_ENV === "development") {
    return serveLocalFile(local);
  }

  const blobCandidates = [
    platform === "windows"
      ? process.env.NEXT_PUBLIC_WINDOWS_DOWNLOAD_URL?.trim()
      : process.env.NEXT_PUBLIC_MAC_DOWNLOAD_URL?.trim(),
    platform === "windows" ? WINDOWS_DOWNLOAD_BLOB_URL : MAC_DOWNLOAD_BLOB_URL,
    configuredUrl.includes("github.com") ? "" : configuredUrl,
  ].filter(Boolean) as string[];

  for (const candidate of blobCandidates) {
    if (await isDownloadUrlReachable(candidate)) {
      return redirectToDownload(candidate, fallbackFilename, "public, max-age=3600");
    }
  }

  const githubAsset = await resolveGitHubAssetUrl(platform);
  if (githubAsset) {
    return redirectToDownload(
      githubAsset.url,
      githubAsset.filename,
      "public, max-age=300",
    );
  }

  if (local) {
    return redirectToDownload(
      new URL(getLocalDownloadPath(platform), request.url).toString(),
      local.filename,
      "public, max-age=3600",
    );
  }

  if (process.env.NODE_ENV === "development") {
    return NextResponse.json(
      {
        error: "Installer not found locally",
        hint:
          platform === "windows"
            ? "Run npm run desktop:package:win, then npm run sync-downloads at the repo root."
            : "Run npm run desktop:package, then npm run sync-downloads at the repo root.",
        platform,
        filename: fallbackFilename,
        releasePage: RELEASE_PAGE_URL,
        fallbackUrl: configuredUrl,
      },
      { status: 404 },
    );
  }

  return redirectToDownload(RELEASE_PAGE_URL, fallbackFilename, "public, max-age=300");
}

export async function GET(request: NextRequest) {
  const platform = parsePlatform(request.nextUrl.searchParams.get("platform"));
  return resolvePlatformDownload(request, platform);
}

export async function HEAD(request: NextRequest) {
  return GET(request);
}
