"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getDownloadInfo } from "@/lib/download";
import { useDownloadPlatform } from "@/hooks/useDownloadPlatform";
import { DownloadLink } from "./DownloadLink";
import { OpenLandedButton } from "./OpenLandedButton";
import type { DownloadPlatform } from "@/lib/platform";

function PlatformToggle({
  platform,
  onChange,
}: {
  platform: DownloadPlatform;
  onChange: (platform: DownloadPlatform) => void;
}) {
  return (
    <div className="mt-6 inline-flex rounded-full border border-zinc-200 bg-white p-1">
      {(["mac", "windows"] as const).map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => onChange(value)}
          className={`rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors ${
            platform === value
              ? "bg-zinc-900 text-white"
              : "text-zinc-600 hover:text-zinc-900"
          }`}
        >
          {value === "mac" ? "macOS" : "Windows"}
        </button>
      ))}
    </div>
  );
}

export function DownloadPageHero() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const platform = useDownloadPlatform();
  const info = getDownloadInfo(platform);
  const isWindows = platform === "windows";
  const windowsReady = info.isAvailable;

  function setPlatform(next: DownloadPlatform) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("platform", next);
    router.replace(`/download?${params.toString()}`, { scroll: false });
  }

  return (
    <>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-900 md:text-4xl">
        {isWindows
          ? windowsReady
            ? "Run Landed on Windows"
            : "Windows coming soon"
          : "Run Landed on your Mac"}
      </h1>
      <p className="mt-4 text-[15px] leading-relaxed text-zinc-500">
        {isWindows
          ? windowsReady
            ? "The full native app for Windows — invisible AI for technical interviews. Sees the problem on your screen, answers when you type, stays off screen share. Or try the web app in your browser."
            : "We’re finishing the Windows installer. Download Landed for Mac now, or try the web app in your browser."
          : "The full native app — invisible AI for technical interviews. Sees the problem on your screen, answers when you type, stays off screen share. Or try the web app in your browser."}
      </p>

      <PlatformToggle platform={platform} onChange={setPlatform} />

      <div className="mt-10 flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <DownloadLink
            platform={platform}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-zinc-900 px-6 text-[14px] font-medium text-white transition-colors hover:bg-zinc-800"
          >
            {info.longLabel}
          </DownloadLink>
          <OpenLandedButton platform={platform} />
          <Link
            href="/app"
            className="inline-flex h-11 items-center justify-center rounded-full border border-zinc-200 bg-white px-6 text-[14px] font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
          >
            Open web app
          </Link>
        </div>
      </div>
    </>
  );
}
