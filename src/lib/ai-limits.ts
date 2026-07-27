/** Free tier hard cap on screen asks / AI responses. */
export const FREE_QUESTION_LIMIT = 10;

/** Paid plans: downgrade to economy model/detail after this many asks in a calendar month. */
export const PAID_FAIR_USE_MONTHLY_ASKS = 1_000;

/** Paid plans: hard stop for the rest of the month (abuse protection). */
export const PAID_HARD_MONTHLY_CAP = 2_500;

/** Burst limit for /api/assist per authenticated user. */
export const AI_ASSIST_BURST_PER_MINUTE = 20;

/** Default burst window for API rate limits (ms). */
export const API_RATE_LIMIT_WINDOW_MS = 60_000;

/** Short marketing line — Pro/Lifetime include generous fair use. */
export const PAID_ASKS_MARKETING =
  "Unlimited screen asks for normal daily use (fair use applies)";

/** Legal / FAQ detail with exact enforced limits. */
export const PAID_ASKS_LEGAL = `Paid plans include up to ${PAID_FAIR_USE_MONTHLY_ASKS.toLocaleString()} premium screen asks per calendar month (gpt-4.1-mini). After that threshold, the Service may use the standard model for the remainder of the month. A hard maximum of ${PAID_HARD_MONTHLY_CAP.toLocaleString()} asks per calendar month applies to all plans. Limits reset on the 1st of each month.`;
