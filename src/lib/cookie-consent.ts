export const COOKIE_CONSENT_VERSION = 1;
export const COOKIE_CONSENT_STORAGE_KEY = "landed-cookie-consent";
export const COOKIE_CONSENT_EVENT = "landed-cookie-consent-updated";
export const COOKIE_CONSENT_OPEN_EVENT = "landed-cookie-consent-open";

export type CookieCategory = "functional" | "analytics" | "marketing";

export type CookieConsentPreferences = {
  version: number;
  timestamp: string;
  necessary: true;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
};

export const DEFAULT_REJECTED_CONSENT: CookieConsentPreferences = {
  version: COOKIE_CONSENT_VERSION,
  timestamp: "",
  necessary: true,
  functional: false,
  analytics: false,
  marketing: false,
};

export const DEFAULT_ACCEPTED_CONSENT: CookieConsentPreferences = {
  version: COOKIE_CONSENT_VERSION,
  timestamp: "",
  necessary: true,
  functional: true,
  analytics: true,
  marketing: true,
};

export function hasStoredConsent(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as CookieConsentPreferences;
    return parsed.version === COOKIE_CONSENT_VERSION;
  } catch {
    return false;
  }
}

export function readCookieConsent(): CookieConsentPreferences | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CookieConsentPreferences;
    if (parsed.version !== COOKIE_CONSENT_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveCookieConsent(
  preferences: Omit<CookieConsentPreferences, "version" | "timestamp" | "necessary">,
): CookieConsentPreferences {
  const consent: CookieConsentPreferences = {
    version: COOKIE_CONSENT_VERSION,
    timestamp: new Date().toISOString(),
    necessary: true,
    functional: preferences.functional,
    analytics: preferences.analytics,
    marketing: preferences.marketing,
  };

  localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(consent));
  window.dispatchEvent(
    new CustomEvent(COOKIE_CONSENT_EVENT, { detail: consent }),
  );

  return consent;
}

export function hasConsent(category: CookieCategory): boolean {
  const consent = readCookieConsent();
  if (!consent) return false;
  return consent[category];
}

export function openCookiePreferences() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_OPEN_EVENT));
}
