import { LANDED_MARKETING_ORIGIN } from "./landed-urls";

function isLocalhost(url: string): boolean {
  return url.includes("localhost") || url.includes("127.0.0.1");
}

/**
 * Legal pages always open on the production site.
 * Ignore localhost VITE_LEGAL_BASE_URL — packaged builds must not
 * point Terms / Privacy at a local Next.js server.
 */
function resolveLegalBase(): string {
  const raw = (import.meta.env.VITE_LEGAL_BASE_URL ?? "").trim().replace(/\/$/, "");
  if (raw && !isLocalhost(raw)) return raw;
  return LANDED_MARKETING_ORIGIN;
}

const baseUrl = resolveLegalBase();

export const legalLinks = {
  terms: `${baseUrl}/legal/terms`,
  privacy: `${baseUrl}/legal/privacy`,
  acceptableUse: `${baseUrl}/legal/acceptable-use`,
  cookies: `${baseUrl}/legal/cookies`,
  dpa: `${baseUrl}/legal/dpa`,
} as const;

export function openLegalLink(url: string) {
  void window.landed?.openExternal?.(url);
}
