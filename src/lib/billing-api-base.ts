import { LANDED_API_ORIGIN, LANDED_MARKETING_ORIGIN } from "./landed-urls";

/** Live billing API (Next.js on landed-ai.com). */
export const DEFAULT_BILLING_API_BASE = LANDED_API_ORIGIN;

export function resolveBillingOrigin(request: Request): string {
  const requestOrigin = new URL(request.url).origin;
  const configured = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (!configured || configured === LANDED_MARKETING_ORIGIN) {
    return requestOrigin;
  }
  return configured;
}
