export const TERMS_VERSION = "2026-06-18" as const;

export const LEGAL = {
  productName: "Landed",
  /** Trading name — not a limited company. */
  legalEntity: "Landed",
  businessStructure:
    "Landed is operated by its founder as a sole trader. Landed is not a limited company (Ltd), partnership, or corporation.",
  website: "https://landed-ai.com",
  effectiveDate: "June 18, 2026",
  lastUpdated: "July 15, 2026",
  termsVersion: TERMS_VERSION,
  aiDisclaimerShort:
    "AI can make mistakes. Always review suggestions before you use or repeat them.",
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
} as const;

export const SUPPORT_ROUTES = {
  helpCenter: "/help-center",
  contact: "/contact",
} as const;
