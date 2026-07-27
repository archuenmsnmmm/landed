export const TERMS_VERSION = "2026-07-20" as const;

export const LEGAL = {
  productName: "Landed",
  /** Trading name — not a limited company. */
  legalEntity: "Landed",
  businessStructure:
    "Landed is operated by its founder as a sole trader. Landed is not a limited company (Ltd), partnership, or corporation.",
  website: "https://landed-ai.com",
  effectiveDate: "July 20, 2026",
  lastUpdated: "July 20, 2026",
  termsVersion: TERMS_VERSION,
  aiDisclaimerShort:
    "This is an AI-powered conversation, not human. It may make mistakes.",
  aiDisclaimerLearnMorePath: "/legal/terms#ai-disclaimer",
  contact: {
    legal: "landed.support@gmail.com",
    privacy: "landed.support@gmail.com",
    support: "landed.support@gmail.com",
    dpo: "landed.support@gmail.com",
  },
  jurisdiction: {
    region: "England and Wales",
    country: "United Kingdom",
    courts: "courts of England and Wales",
  },
  arbitration: {
    provider: "London Court of International Arbitration (LCIA)",
    rules: "LCIA Arbitration Rules",
    seat: "London, England",
  },
} as const;

export const LEGAL_ROUTES = {
  terms: "/legal/terms",
  privacy: "/legal/privacy",
  acceptableUse: "/legal/acceptable-use",
  cookies: "/legal/cookies",
  subprocessors: "/legal/subprocessors",
  dpa: "/legal/dpa",
  refund: "/legal/refund",
  eula: "/legal/eula",
  legalNotice: "/legal/legal-notice",
} as const;

/** Canonical related-policy set for every legal page footer. */
export const CORE_LEGAL_LINKS = [
  { href: LEGAL_ROUTES.terms, label: "Terms of Service" },
  { href: LEGAL_ROUTES.privacy, label: "Privacy Policy" },
  { href: LEGAL_ROUTES.eula, label: "EULA" },
  { href: LEGAL_ROUTES.refund, label: "Refund Policy" },
  { href: LEGAL_ROUTES.acceptableUse, label: "Acceptable Use Policy" },
  { href: LEGAL_ROUTES.cookies, label: "Cookie Policy" },
  { href: LEGAL_ROUTES.dpa, label: "Data Processing Addendum" },
  { href: LEGAL_ROUTES.subprocessors, label: "Subprocessors" },
  { href: LEGAL_ROUTES.legalNotice, label: "Legal Notice" },
] as const;

export function legalRelatedLinks(excludeHref?: string) {
  return CORE_LEGAL_LINKS.filter((link) => link.href !== excludeHref).map(
    (link) => ({ href: link.href, label: link.label }),
  );
}

export const SUPPORT_ROUTES = {
  helpCenter: "/help-center",
  contact: "/contact",
} as const;
