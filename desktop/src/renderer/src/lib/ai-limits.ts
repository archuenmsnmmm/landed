/** Keep in sync with `src/lib/ai-limits.ts`. */
export const FREE_QUESTION_LIMIT = 10;
export const PAID_FAIR_USE_MONTHLY_ASKS = 1_000;
export const PAID_HARD_MONTHLY_CAP = 2_500;
export const AI_ASSIST_BURST_PER_MINUTE = 20;

/** Short marketing line — Pro/Lifetime include generous fair use. */
export const PAID_ASKS_MARKETING =
  "Unlimited screen asks for normal daily use (fair use applies)";

/** Help-center / paywall detail. */
export const PAID_ASKS_DETAIL = `Pro and Lifetime include up to ${PAID_FAIR_USE_MONTHLY_ASKS.toLocaleString()} premium asks per month on gpt-4.1-mini, with a ${PAID_HARD_MONTHLY_CAP.toLocaleString()}-ask monthly maximum. Beyond the premium threshold, Landed continues with the standard model until the next month.`;
