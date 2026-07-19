"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { detectDownloadPlatform, type DownloadPlatform } from "@/lib/platform";

function platformFromParam(value: string | null): DownloadPlatform | null {
  if (value === "windows") return "windows";
  if (value === "mac") return "mac";
  return null;
}

export function useDownloadPlatform(): DownloadPlatform {
  const searchParams = useSearchParams();
  const paramPlatform = platformFromParam(searchParams.get("platform"));
  const [platform, setPlatform] = useState<DownloadPlatform>(
    () => paramPlatform ?? detectDownloadPlatform(),
  );

  useEffect(() => {
    setPlatform(paramPlatform ?? detectDownloadPlatform());
  }, [paramPlatform]);

  return platform;
}
