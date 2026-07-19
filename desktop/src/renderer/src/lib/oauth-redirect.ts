import { LANDED_MARKETING_ORIGIN } from "./landed-urls";

/** Must match desktop/src/main/index.ts OAUTH_LOOPBACK_PORT */
export const OAUTH_LOOPBACK_PORT = 42817;

/** Browser OAuth redirects here; Electron loopback server forwards to landed://auth/callback. */
export const OAUTH_LOOPBACK_CALLBACK = `http://127.0.0.1:${OAUTH_LOOPBACK_PORT}/auth/callback`;

function resolveMarketingBase(): string {
  const raw = (import.meta.env.VITE_LEGAL_BASE_URL ?? "").trim().replace(/\/$/, "");
  if (raw && !raw.includes("localhost") && !raw.includes("127.0.0.1")) {
    return raw;
  }
  return LANDED_MARKETING_ORIGIN;
}

/** Redirect URL passed to Supabase signInWithOAuth from the desktop app. */
export function getOAuthRedirectTo(): string {
  return OAUTH_LOOPBACK_CALLBACK;
}

/** HTTPS bridge when the browser must land on the marketing site first (fallback). */
export function getWebOAuthBridgeUrl(): string {
  if (import.meta.env.DEV) {
    return "http://localhost:3000/auth/callback";
  }
  return `${resolveMarketingBase()}/auth/callback`;
}
