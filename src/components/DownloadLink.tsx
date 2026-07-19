"use client";

import { Suspense, useState } from "react";
import {
  getDownloadInfo,
  getDownloadHref,
  isWindowsDownloadAvailable,
  resolveDownloadHref,
} from "@/lib/download";
import { detectDownloadPlatform, type DownloadPlatform } from "@/lib/platform";
import { useDownloadPlatform } from "@/hooks/useDownloadPlatform";
import { InstallGuideModal } from "./InstallGuideModal";

/** Prefer Mac while the Landed Windows installer is unpublished. */
function resolveAvailablePlatform(platform: DownloadPlatform): DownloadPlatform {
  if (platform === "windows" && !isWindowsDownloadAvailable()) return "mac";
  return platform;
}

const baseClassName =
  "inline-flex items-center justify-center rounded-full bg-[#4A90E2] font-medium text-white shadow-[0_4px_14px_rgba(74,144,226,0.35)] transition-colors hover:bg-[#3B7FD4]";

const sizeClassName = {
  default: "h-11 gap-2.5 px-6 text-[15px]",
  sm: "h-10 gap-2 px-4 text-[13px] sm:px-5 sm:text-[14px]",
};

function AppleIcon() {
  return (
    <svg className="h-[17px] w-[17px]" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}

function WindowsIcon() {
  return (
    <svg className="h-[17px] w-[17px]" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M3 5.5 10.5 4.2v7.1H3V5.5zm0 8.4h7.5v7.3L3 19.5v-5.6zm9-9.3L21 3v8.2h-9V4.6zm0 9.2H21V21l-9-1.4v-6.8z" />
    </svg>
  );
}

type DownloadLinkProps = {
  className?: string;
  size?: "default" | "sm";
  hideIcon?: boolean;
  platform?: DownloadPlatform;
  children?: React.ReactNode;
  onDownloadClick?: (platform: DownloadPlatform) => void;
};

function DownloadLinkContent({
  className,
  size = "default",
  hideIcon = false,
  platform: platformProp,
  children,
  onDownloadClick,
}: DownloadLinkProps) {
  const detectedPlatform = useDownloadPlatform();
  const requested = platformProp ?? detectedPlatform;
  // Explicit Windows CTA stays disabled until publish; auto-detect falls back to Mac.
  const platform =
    platformProp === "windows" ? requested : resolveAvailablePlatform(requested);
  const { label, filename, isAvailable, unavailableMessage } = getDownloadInfo(platform);
  const href = resolveDownloadHref(platform);
  const isSameOrigin = href.startsWith("/");
  const classes = className ?? `${baseClassName} ${sizeClassName[size]}`;

  if (!isAvailable) {
    return (
      <span
        aria-disabled="true"
        title={unavailableMessage ?? undefined}
        className={`${classes} cursor-not-allowed opacity-60`}
      >
        {!hideIcon && <WindowsIcon />}
        {children ?? label}
      </span>
    );
  }

  return (
    <a
      href={href}
      {...(isSameOrigin ? { download: filename } : { rel: "noopener noreferrer" })}
      className={classes}
      onClick={() => onDownloadClick?.(platform)}
    >
      {!hideIcon && (platform === "windows" ? <WindowsIcon /> : <AppleIcon />)}
      {children ?? label}
    </a>
  );
}

function DownloadLinkFallback({
  className,
  size = "default",
  hideIcon = false,
  platform: platformProp,
  children,
  onDownloadClick,
}: DownloadLinkProps) {
  const requested = platformProp ?? detectDownloadPlatform();
  const platform =
    platformProp === "windows" ? requested : resolveAvailablePlatform(requested);
  const { label, filename, isAvailable, unavailableMessage } = getDownloadInfo(platform);
  const href = getDownloadHref(platform);
  const isSameOrigin = href.startsWith("/");
  const classes = className ?? `${baseClassName} ${sizeClassName[size]}`;

  if (!isAvailable) {
    return (
      <span
        aria-disabled="true"
        title={unavailableMessage ?? undefined}
        className={`${classes} cursor-not-allowed opacity-60`}
      >
        {!hideIcon && (platform === "windows" ? <WindowsIcon /> : <AppleIcon />)}
        {children ?? label}
      </span>
    );
  }

  return (
    <a
      href={href}
      {...(isSameOrigin ? { download: filename } : { rel: "noopener noreferrer" })}
      className={classes}
      onClick={() => onDownloadClick?.(platform)}
    >
      {!hideIcon && (platform === "windows" ? <WindowsIcon /> : <AppleIcon />)}
      {children ?? label}
    </a>
  );
}

export function DownloadLink(props: DownloadLinkProps) {
  return (
    <Suspense fallback={<DownloadLinkFallback {...props} />}>
      <DownloadLinkContent {...props} />
    </Suspense>
  );
}

/** macOS download CTA (launch is Mac-only). */
export function DetectedDownloadButton({
  className,
  size = "default",
  showInstallGuide = true,
}: {
  className?: string;
  size?: "default" | "sm";
  showInstallGuide?: boolean;
}) {
  const [guidePlatform, setGuidePlatform] = useState<DownloadPlatform | null>(null);
  const resolvedClassName =
    className ??
    `${baseClassName} ${sizeClassName[size]} shrink-0 whitespace-nowrap`;

  return (
    <>
      <DownloadLink
        platform="mac"
        size={size}
        className={resolvedClassName}
        onDownloadClick={showInstallGuide ? setGuidePlatform : undefined}
      />
      {showInstallGuide && guidePlatform ? (
        <InstallGuideModal
          platform={guidePlatform}
          open
          onClose={() => setGuidePlatform(null)}
        />
      ) : null}
    </>
  );
}

/** macOS download CTA for launch (Windows unpublished). */
export function DownloadButtons({
  className,
  buttonClassName,
  size = "default",
  showInstallGuide = true,
}: {
  className?: string;
  buttonClassName?: string;
  size?: "default" | "sm";
  showInstallGuide?: boolean;
}) {
  const [guidePlatform, setGuidePlatform] = useState<DownloadPlatform | null>(null);
  const resolvedButtonClassName =
    buttonClassName ??
    `${baseClassName} ${sizeClassName[size]} shrink-0 whitespace-nowrap`;

  return (
    <>
      <div className={className ?? "flex flex-wrap items-center gap-3"}>
        <DownloadLink
          platform="mac"
          size={size}
          className={resolvedButtonClassName}
          onDownloadClick={showInstallGuide ? setGuidePlatform : undefined}
        />
      </div>
      {showInstallGuide && guidePlatform ? (
        <InstallGuideModal
          platform={guidePlatform}
          open
          onClose={() => setGuidePlatform(null)}
        />
      ) : null}
    </>
  );
}

/** @deprecated Use DownloadLink */
export const MacDownloadLink = DownloadLink;
