/** Canonical production origin (custom domain on Vercel). */
export const LANDED_PRODUCTION_ORIGIN = "https://landed-ai.com";

/**
 * Production API origin — same as the marketing site once custom DNS is live.
 */
export const LANDED_API_ORIGIN = LANDED_PRODUCTION_ORIGIN;

/**
 * Public site URL used for links, sitemap, and OG metadata.
 * Override with NEXT_PUBLIC_SITE_URL when needed (e.g. preview deployments).
 */
export const LANDED_MARKETING_ORIGIN = LANDED_PRODUCTION_ORIGIN;
