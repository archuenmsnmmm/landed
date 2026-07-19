"use client";

import Link from "next/link";
import { getDownloadInfo } from "@/lib/download";
import { useDownloadPlatform } from "@/hooks/useDownloadPlatform";

export function DownloadInstallGuide() {
  const platform = useDownloadPlatform();
  const { filename } = getDownloadInfo(platform);

  if (platform === "windows") {
    return (
      <div className="mt-10 space-y-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
        <div>
          <h2 className="text-[13px] font-semibold uppercase tracking-wider text-zinc-400">
            Windows install
          </h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-[14px] leading-relaxed text-zinc-600">
            <li>
              Download and run <strong>{filename}</strong>
            </li>
            <li>Follow the installer prompts and choose your install location</li>
            <li>If SmartScreen appears, choose <strong>More info</strong> then <strong>Run anyway</strong></li>
            <li>Open Landed from the Start menu or desktop shortcut</li>
            <li>Allow screen access when prompted</li>
            <li>
              Click <strong>Start Landed</strong> and ask about the problem on your screen
            </li>
          </ol>
        </div>
        <p className="text-[13px] leading-relaxed text-zinc-500">
          Prefer not to install? Use the{" "}
          <Link href="/app" className="font-medium text-zinc-800 underline decoration-zinc-300">
            web app
          </Link>{" "}
          in your browser.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-10 space-y-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <h2 className="text-[13px] font-semibold text-amber-900">macOS security prompt?</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-amber-900/80">
          Current downloads from https://landed-ai.com/download are signed and notarized. If macOS asks for confirmation,
          right-click Landed in Applications, choose <strong>Open</strong>, then confirm once.
        </p>
        <p className="mt-2 text-[13px] text-amber-900/70">
          You can also double-click <strong>Install Landed.command</strong> in the DMG to install and
          open the app automatically.
        </p>
      </div>

      <div>
        <h2 className="text-[13px] font-semibold uppercase tracking-wider text-zinc-400">
          Mac install
        </h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-[14px] leading-relaxed text-zinc-600">
          <li>
            Download and open <strong>{filename}</strong>
          </li>
          <li>Drag Landed into Applications (or run Install Landed.command)</li>
          <li>If macOS asks for confirmation, right-click Landed and choose Open</li>
          <li>Open Landed — allow Screen Recording when prompted</li>
          <li>
            Click <strong>Start Landed</strong> and ask about the problem on your screen
          </li>
        </ol>
      </div>
    </div>
  );
}
