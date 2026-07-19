import { LEGAL, LEGAL_ROUTES } from "@/content/legal/config";

function isLocalhost(url: string): boolean {
  return url.includes("localhost") || url.includes("127.0.0.1");
}

/** Prefer production site URL; never bake localhost into absolute legal links. */
function resolveLegalBase(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "";
  if (raw && !isLocalhost(raw)) return raw;
  return LEGAL.website;
}

const baseUrl = resolveLegalBase();

export function legalUrl(path: string) {
  return `${baseUrl}${path}`;
}

export const legalLinks = {
  terms: legalUrl(LEGAL_ROUTES.terms),
  privacy: legalUrl(LEGAL_ROUTES.privacy),
  acceptableUse: legalUrl(LEGAL_ROUTES.acceptableUse),
  cookies: legalUrl(LEGAL_ROUTES.cookies),
} as const;
