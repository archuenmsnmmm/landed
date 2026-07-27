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
  aiDisclaimer: legalUrl(LEGAL.aiDisclaimerLearnMorePath),
  privacy: legalUrl(LEGAL_ROUTES.privacy),
  acceptableUse: legalUrl(LEGAL_ROUTES.acceptableUse),
  cookies: legalUrl(LEGAL_ROUTES.cookies),
  refund: legalUrl(LEGAL_ROUTES.refund),
  eula: legalUrl(LEGAL_ROUTES.eula),
  dpa: legalUrl(LEGAL_ROUTES.dpa),
  subprocessors: legalUrl(LEGAL_ROUTES.subprocessors),
  legalNotice: legalUrl(LEGAL_ROUTES.legalNotice),
  security: legalUrl("/security"),
} as const;
