"use client";

import { Analytics } from "@vercel/analytics/next";
import { useEffect, useState } from "react";
import {
  COOKIE_CONSENT_EVENT,
  hasConsent,
} from "@/lib/cookie-consent";

/** Loads Vercel Analytics only after the user consents to analytics cookies. */
export function AnalyticsGate() {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const sync = () => setAllowed(hasConsent("analytics"));
    sync();
    window.addEventListener(COOKIE_CONSENT_EVENT, sync);
    return () => window.removeEventListener(COOKIE_CONSENT_EVENT, sync);
  }, []);

  if (!allowed) return null;
  return <Analytics />;
}
