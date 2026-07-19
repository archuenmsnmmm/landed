import type { Plan } from "../store/types";
import { isFreeQuestionsExhausted, isPaidPlan } from "../store/types";
import { syncPlanLimitsToMain, useAppStore } from "../store/useAppStore";

/** Whether the user must see the paywall before using the product. */
export function requiresPaywallRoute(
  plan: Plan,
  paywallComplete: boolean,
  freeQuestionsUsed: number,
): boolean {
  if (isPaidPlan(plan)) return false;
  if (!paywallComplete) return true;
  return isFreeQuestionsExhausted(plan, freeQuestionsUsed);
}

/** Stop any active session and route the user to the hard paywall. */
export async function enforceHardPaywall(): Promise<void> {
  useAppStore.getState().setSessionActive(false);
  await syncPlanLimitsToMain();

  try {
    window.landed?.setSessionListening?.(false);
    await window.landed?.requestEndSession?.();
    await window.landed?.stopSession?.();
    await window.landed?.hideMicHelper?.();
  } catch {
    // Best effort — main process may already have stopped the session.
  }

  if (window.landed?.focusDashboard) {
    await window.landed.focusDashboard("/paywall");
    return;
  }

  if (!window.location.hash.includes("/paywall")) {
    window.location.hash = "#/paywall";
  }
}
