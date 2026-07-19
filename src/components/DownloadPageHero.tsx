"use client";

import Link from "next/link";
import { getDownloadInfo } from "@/lib/download";
import { DownloadLink } from "./DownloadLink";
import { OpenLandedButton } from "./OpenLandedButton";

export function DownloadPageHero() {
  const info = getDownloadInfo("mac");

  return (
    <>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-900 md:text-4xl">
        Run Landed on your Mac
      </h1>
      <p className="mt-4 text-[15px] leading-relaxed text-zinc-500">
        The full native app for macOS — invisible AI for technical interviews.
        Sees the problem on your screen, answers when you type, stays off screen
        share. Or try the web app in your browser.
      </p>

      <div className="mt-10 flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <DownloadLink
            platform="mac"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-zinc-900 px-6 text-[14px] font-medium text-white transition-colors hover:bg-zinc-800"
          >
            {info.longLabel}
          </DownloadLink>
          <OpenLandedButton platform="mac" />
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
