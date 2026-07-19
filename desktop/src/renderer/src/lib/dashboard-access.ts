import type { Plan } from "../store/types";
import { isPaidPlan } from "../store/types";

/** User may enter the dashboard after onboarding when paywall was completed or they are on a paid plan. */
export function hasDashboardAccess(plan: Plan, paywallComplete: boolean): boolean {
  return paywallComplete || isPaidPlan(plan);
}
