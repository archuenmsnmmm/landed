"use client";

import { openCookiePreferences } from "@/lib/cookie-consent";

export function CookieSettingsLink({
  className = "text-[14px] text-[#5f6b7a] transition-colors hover:text-[#0a0a0a]",
}: {
  className?: string;
}) {
  return (
    <button type="button" onClick={openCookiePreferences} className={className}>
      Cookie settings
    </button>
  );
}
