"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { LEGAL_ROUTES } from "@/content/legal/config";
import {
  COOKIE_CONSENT_EVENT,
  COOKIE_CONSENT_OPEN_EVENT,
  DEFAULT_ACCEPTED_CONSENT,
  DEFAULT_REJECTED_CONSENT,
  hasStoredConsent,
  readCookieConsent,
  saveCookieConsent,
  type CookieConsentPreferences,
} from "@/lib/cookie-consent";

type PreferenceState = Pick<
  CookieConsentPreferences,
  "functional" | "analytics" | "marketing"
>;

const preferenceOptions: {
  key: keyof PreferenceState;
  title: string;
  description: string;
}[] = [
  {
    key: "functional",
    title: "Functional",
    description: "Remember preferences such as language or region.",
  },
  {
    key: "analytics",
    title: "Analytics",
    description: "Help us understand how visitors use our website.",
  },
  {
    key: "marketing",
    title: "Marketing",
    description: "Measure campaign performance and improve relevance.",
  },
];

function InfoIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 20 20"
      className="mt-0.5 h-5 w-5 shrink-0 text-[#1a1f2c]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle cx="10" cy="10" r="7.25" />
      <path d="M10 9.25v4.5" strokeLinecap="round" />
      <circle cx="10" cy="6.75" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  );
}

function Toggle({
  checked,
  disabled,
  onChange,
  label,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
        checked ? "bg-[#4b8bf5]" : "bg-[#d7dce5]"
      } ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<PreferenceState>({
    functional: false,
    analytics: false,
    marketing: false,
  });

  const closeAll = useCallback(() => {
    setShowPreferences(false);
    if (!hasStoredConsent()) {
      setShowBanner(true);
      return;
    }
    setShowBanner(false);
  }, []);

  const applyConsent = useCallback(
    (next: PreferenceState) => {
      saveCookieConsent(next);
      closeAll();
    },
    [closeAll],
  );

  const acceptAll = useCallback(() => {
    applyConsent({
      functional: DEFAULT_ACCEPTED_CONSENT.functional,
      analytics: DEFAULT_ACCEPTED_CONSENT.analytics,
      marketing: DEFAULT_ACCEPTED_CONSENT.marketing,
    });
  }, [applyConsent]);

  const rejectAll = useCallback(() => {
    applyConsent({
      functional: DEFAULT_REJECTED_CONSENT.functional,
      analytics: DEFAULT_REJECTED_CONSENT.analytics,
      marketing: DEFAULT_REJECTED_CONSENT.marketing,
    });
  }, [applyConsent]);

  const savePreferences = useCallback(() => {
    applyConsent(preferences);
  }, [applyConsent, preferences]);

  useEffect(() => {
    if (!hasStoredConsent()) {
      setShowBanner(true);
      return;
    }

    const stored = readCookieConsent();
    if (stored) {
      setPreferences({
        functional: stored.functional,
        analytics: stored.analytics,
        marketing: stored.marketing,
      });
    }
  }, []);

  useEffect(() => {
    const handleOpen = () => {
      const stored = readCookieConsent();
      if (stored) {
        setPreferences({
          functional: stored.functional,
          analytics: stored.analytics,
          marketing: stored.marketing,
        });
      }
      setShowPreferences(true);
      setShowBanner(false);
    };

    window.addEventListener(COOKIE_CONSENT_OPEN_EVENT, handleOpen);
    return () => window.removeEventListener(COOKIE_CONSENT_OPEN_EVENT, handleOpen);
  }, []);

  useEffect(() => {
    const handleUpdated = () => {
      const stored = readCookieConsent();
      if (stored) {
        setPreferences({
          functional: stored.functional,
          analytics: stored.analytics,
          marketing: stored.marketing,
        });
      }
    };

    window.addEventListener(COOKIE_CONSENT_EVENT, handleUpdated);
    return () => window.removeEventListener(COOKIE_CONSENT_EVENT, handleUpdated);
  }, []);

  if (!showBanner && !showPreferences) return null;

  return (
    <>
      {showBanner ? (
        <div
          role="dialog"
          aria-label="Cookie consent"
          className="fixed bottom-4 left-4 z-[100] w-[calc(100%-2rem)] max-w-[420px] rounded-xl border border-[#e4e7ec] bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.08)] sm:bottom-6 sm:left-6 sm:p-6"
        >
          <div className="flex gap-3">
            <InfoIcon />
            <p className="text-[14px] leading-relaxed text-[#1a1f2c]">
              We use cookies to improve your experience and for marketing. Read
              our{" "}
              <Link
                href={LEGAL_ROUTES.cookies}
                className="underline underline-offset-2 hover:text-[#0a0a0a]"
              >
                cookie policy
              </Link>{" "}
              or{" "}
              <button
                type="button"
                onClick={() => {
                  setShowPreferences(true);
                  setShowBanner(false);
                }}
                className="underline underline-offset-2 hover:text-[#0a0a0a]"
              >
                manage cookies
              </button>
              .
            </p>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={acceptAll}
              className="rounded-lg border border-[#d7dce5] px-4 py-2 text-[14px] font-medium text-[#1a1f2c] transition-colors hover:border-[#b8c0cc] hover:bg-[#f7f8fa]"
            >
              Accept all
            </button>
            <button
              type="button"
              onClick={rejectAll}
              className="rounded-lg border border-[#d7dce5] px-4 py-2 text-[14px] font-medium text-[#1a1f2c] transition-colors hover:border-[#b8c0cc] hover:bg-[#f7f8fa]"
            >
              Reject all
            </button>
          </div>
        </div>
      ) : null}

      {showPreferences ? (
        <div className="fixed inset-0 z-[110] flex items-end justify-start p-4 sm:items-center sm:justify-center sm:p-6">
          <button
            type="button"
            aria-label="Close cookie preferences"
            className="absolute inset-0 bg-[#0a0a0a]/30"
            onClick={closeAll}
          />
          <div
            role="dialog"
            aria-labelledby="cookie-preferences-title"
            className="relative w-full max-w-[480px] rounded-xl border border-[#e4e7ec] bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.16)]"
          >
            <h2
              id="cookie-preferences-title"
              className="text-[18px] font-semibold text-[#0a0a0a]"
            >
              Manage cookies
            </h2>
            <p className="mt-2 text-[14px] leading-relaxed text-[#5f6b7a]">
              Choose which optional cookies we can use. Strictly necessary
              cookies are always active because they are required for the site
              to work.
            </p>

            <div className="mt-5 space-y-4">
              <div className="flex items-start justify-between gap-4 rounded-lg border border-[#eef1f5] p-4">
                <div>
                  <p className="text-[14px] font-medium text-[#0a0a0a]">
                    Strictly necessary
                  </p>
                  <p className="mt-1 text-[13px] leading-relaxed text-[#5f6b7a]">
                    Required for security, load balancing, and core site
                    functionality.
                  </p>
                </div>
                <Toggle
                  checked
                  disabled
                  onChange={() => undefined}
                  label="Strictly necessary cookies"
                />
              </div>

              {preferenceOptions.map((option) => (
                <div
                  key={option.key}
                  className="flex items-start justify-between gap-4 rounded-lg border border-[#eef1f5] p-4"
                >
                  <div>
                    <p className="text-[14px] font-medium text-[#0a0a0a]">
                      {option.title}
                    </p>
                    <p className="mt-1 text-[13px] leading-relaxed text-[#5f6b7a]">
                      {option.description}
                    </p>
                  </div>
                  <Toggle
                    checked={preferences[option.key]}
                    onChange={(checked) =>
                      setPreferences((current) => ({
                        ...current,
                        [option.key]: checked,
                      }))
                    }
                    label={`${option.title} cookies`}
                  />
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={savePreferences}
                className="rounded-lg border border-[#d7dce5] px-4 py-2 text-[14px] font-medium text-[#1a1f2c] transition-colors hover:border-[#b8c0cc] hover:bg-[#f7f8fa]"
              >
                Save preferences
              </button>
              <button
                type="button"
                onClick={acceptAll}
                className="rounded-lg border border-[#d7dce5] px-4 py-2 text-[14px] font-medium text-[#1a1f2c] transition-colors hover:border-[#b8c0cc] hover:bg-[#f7f8fa]"
              >
                Accept all
              </button>
              <button
                type="button"
                onClick={rejectAll}
                className="rounded-lg border border-[#d7dce5] px-4 py-2 text-[14px] font-medium text-[#1a1f2c] transition-colors hover:border-[#b8c0cc] hover:bg-[#f7f8fa]"
              >
                Reject all
              </button>
            </div>

            <p className="mt-4 text-[13px] text-[#5f6b7a]">
              Learn more in our{" "}
              <Link
                href={LEGAL_ROUTES.cookies}
                className="underline underline-offset-2 hover:text-[#0a0a0a]"
              >
                Cookie Policy
              </Link>
              .
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
