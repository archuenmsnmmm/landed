import type { Plan } from "../store/types";
import { effectiveContentProtection } from "../store/types";
import { syncPlanLimitsToMain } from "../store/useAppStore";

/** Sync plan limits to main, then apply overlay capture protection for the current plan. */
export async function applyContentProtection(
  plan: Plan,
  invisible: boolean,
): Promise<boolean> {
  if (typeof window === "undefined" || !window.landed?.setContentProtection) {
    return false;
  }

  await syncPlanLimitsToMain();
  const enabled = effectiveContentProtection(plan, invisible);
  return window.landed.setContentProtection(enabled, plan);
}
