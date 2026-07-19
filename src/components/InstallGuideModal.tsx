"use client";

import { useEffect } from "react";
import Image from "next/image";
import { getDownloadHref, getDownloadInfo } from "@/lib/download";
import type { DownloadPlatform } from "@/lib/platform";

const ACCENT = "#4A90E2";
const APP_ICON_SRC = "/app-icon.png";

type InstallGuideModalProps = {
  platform: DownloadPlatform;
  open: boolean;
  onClose: () => void;
};

function CheckIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M3.5 8.5 6.5 11.5 12.5 4.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M4 4l8 8M12 4l-8 8"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function AppIcon({ size = 56 }: { size?: number }) {
  return (
    <Image
      src={APP_ICON_SRC}
      alt=""
      width={size}
      height={size}
      className="shrink-0 rounded-[22%] shadow-[0_6px_18px_rgba(15,23,42,0.18)]"
      style={{ width: size, height: size }}
      draggable={false}
      priority
    />
  );
}

function Accent({ children }: { children: React.ReactNode }) {
  return <span style={{ color: ACCENT }}>{children}</span>;
}

function StepBadge({ n }: { n: number }) {
  return (
    <span
      className="absolute -top-3 left-1/2 z-10 flex h-7 w-7 -translate-x-1/2 items-center justify-center rounded-full text-[13px] font-semibold text-white shadow-[0_4px_12px_rgba(74,144,226,0.35)]"
      style={{ backgroundColor: ACCENT }}
    >
      {n}
    </span>
  );
}

function StepCard({
  step,
  visual,
  children,
}: {
  step: number;
  visual: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col items-center">
      <div className="relative w-full">
        <StepBadge n={step} />
        <div className="flex h-[148px] items-center justify-center rounded-2xl border border-[#e8edf3] bg-[#f5f7fa] px-4">
          {visual}
        </div>
      </div>
      <p className="mt-4 max-w-[220px] text-center text-[14px] leading-[1.55] text-[#4b5563]">
        {children}
      </p>
    </div>
  );
}

function MacSteps({ filename }: { filename: string }) {
  return (
    <div className="mt-8 flex flex-col gap-8 sm:flex-row sm:gap-5">
      <StepCard
        step={1}
        visual={
          <div className="flex flex-col items-center gap-2.5">
            <AppIcon size={56} />
            <span className="text-[12px] font-medium text-[#0a0a0a]">{filename}</span>
          </div>
        }
      >
        Open <Accent>{filename}</Accent> from your <Accent>Downloads</Accent>{" "}
        folder.
      </StepCard>

      <StepCard
        step={2}
        visual={
          <div className="flex items-center gap-3">
            <AppIcon size={44} />
            <svg
              className="h-5 w-5 text-[#94a3b8]"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden
            >
              <path d="M11.3 4.3a1 1 0 0 1 1.4 0l5 5a1 1 0 0 1 0 1.4l-5 5a1 1 0 1 1-1.4-1.4L14.58 11H3a1 1 0 1 1 0-2h11.58l-3.28-3.3a1 1 0 0 1 0-1.4z" />
            </svg>
            <div
              className="flex h-11 w-11 items-center justify-center rounded-lg"
              style={{ backgroundColor: ACCENT }}
              aria-hidden
            >
              <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
              </svg>
            </div>
          </div>
        }
      >
        Drag the <Accent>Landed icon</Accent> into your{" "}
        <Accent>Applications</Accent> folder.
      </StepCard>

      <StepCard
        step={3}
        visual={
          <div className="w-full max-w-[200px] overflow-hidden rounded-xl border border-[#e8edf3] bg-white shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
            <div className="border-b border-[#eef2f6] px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-[#94a3b8]">
              Applications
            </div>
            <ul className="py-1 text-[11px]">
              <li className="flex items-center gap-2 px-3 py-1.5 text-[#64748b]">
                <span className="h-3.5 w-3.5 rounded bg-[#f97316]/80" />
                Calendar.app
              </li>
              <li
                className="flex items-center gap-2 px-3 py-1.5 font-medium text-white"
                style={{ backgroundColor: ACCENT }}
              >
                <span className="flex h-3.5 w-3.5 items-center justify-center overflow-hidden rounded-[3px]">
                  <Image
                    src={APP_ICON_SRC}
                    alt=""
                    width={14}
                    height={14}
                    className="h-3.5 w-3.5 object-cover"
                    draggable={false}
                  />
                </span>
                Landed.app
              </li>
              <li className="flex items-center gap-2 px-3 py-1.5 text-[#64748b]">
                <span className="h-3.5 w-3.5 rounded bg-[#3b82f6]/80" />
                Contacts.app
              </li>
            </ul>
          </div>
        }
      >
        Open the <Accent>Landed</Accent> app from your{" "}
        <Accent>Applications</Accent> folder.
      </StepCard>
    </div>
  );
}

function WindowsSteps({ filename }: { filename: string }) {
  return (
    <div className="mt-8 flex flex-col gap-8 sm:flex-row sm:gap-5">
      <StepCard
        step={1}
        visual={
          <div className="flex flex-col items-center gap-2.5">
            <AppIcon size={56} />
            <span className="max-w-[140px] truncate text-[12px] font-medium text-[#0a0a0a]">
              {filename}
            </span>
          </div>
        }
      >
        Open <Accent>{filename}</Accent> from your <Accent>Downloads</Accent>{" "}
        folder.
      </StepCard>

      <StepCard
        step={2}
        visual={
          <div className="flex w-full max-w-[200px] flex-col gap-2 rounded-xl border border-[#e8edf3] bg-white p-3 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
            <div className="flex items-center gap-2">
              <AppIcon size={28} />
              <span className="text-[11px] font-medium text-[#0a0a0a]">Landed Setup</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[#e8edf3]">
              <div
                className="h-full w-2/3 rounded-full"
                style={{ backgroundColor: ACCENT }}
              />
            </div>
            <span className="text-[10px] text-[#94a3b8]">Installing…</span>
          </div>
        }
      >
        Follow the installer prompts and choose your{" "}
        <Accent>install location</Accent>.
      </StepCard>

      <StepCard
        step={3}
        visual={
          <div className="flex flex-col items-center gap-2">
            <AppIcon size={52} />
            <span className="text-[12px] font-medium text-[#0a0a0a]">Landed</span>
            <span className="text-[10px] text-[#94a3b8]">Start menu</span>
          </div>
        }
      >
        Open <Accent>Landed</Accent> from the Start menu or desktop shortcut.
      </StepCard>
    </div>
  );
}

export function InstallGuideModal({
  platform,
  open,
  onClose,
}: InstallGuideModalProps) {
  const { filename } = getDownloadInfo(platform);
  const downloadHref = getDownloadHref(platform);
  const title =
    platform === "windows"
      ? "How to install Landed on Windows"
      : "How to install Landed";

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center p-3 sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Close install guide"
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="install-guide-title"
        className="relative w-full max-w-[860px] overflow-hidden rounded-[22px] border border-[#e8edf3] bg-white px-5 pb-6 pt-7 shadow-[0_28px_80px_rgba(15,23,42,0.18)] sm:px-8 sm:pb-8 sm:pt-8"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-[#94a3b8] transition-colors hover:bg-[#f1f5f9] hover:text-[#0a0a0a]"
        >
          <CloseIcon />
        </button>

        <div className="flex flex-col items-center text-center">
          <span
            className="inline-flex items-center gap-1.5 rounded-full border bg-[#f0f7ff] px-3 py-1 text-[12px] font-medium"
            style={{ borderColor: `${ACCENT}44`, color: ACCENT }}
          >
            <CheckIcon />
            Downloaded
          </span>

          <h2
            id="install-guide-title"
            className="mt-4 text-[1.35rem] font-semibold tracking-[-0.02em] text-[#0a0a0a] sm:text-[1.6rem]"
          >
            {title}
          </h2>
        </div>

        {platform === "windows" ? (
          <WindowsSteps filename={filename} />
        ) : (
          <MacSteps filename={filename} />
        )}

        <p className="mt-8 text-center text-[13px] text-[#94a3b8]">
          Problem?{" "}
          <a
            href={downloadHref}
            className="underline underline-offset-2 transition-opacity hover:opacity-80"
            style={{ color: ACCENT }}
          >
            Download again
          </a>
        </p>
      </div>
    </div>
  );
}
