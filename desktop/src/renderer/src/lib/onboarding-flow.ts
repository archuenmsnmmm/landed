import type { Plan } from "../store/types";
import { requiresPaywallRoute } from "./paywall-enforcement";
import { useAppStore } from "../store/useAppStore";

export interface OnboardingFlowState {
  onboardingComplete: boolean;
  paywallComplete: boolean;
  plan: Plan;
  freeQuestionsUsed?: number;
}

/** Mark removed shortcut tutorial complete for accounts from older funnels. */
export function ensureLegacyOnboardingSkipped(): void {
  const state = useAppStore.getState();
  if (!state.shortcutTutorialComplete) state.completeShortcutTutorial();
}

export function funnelStateFromStore(): OnboardingFlowState {
  const state = useAppStore.getState();
  return {
    onboardingComplete: state.onboardingComplete,
    paywallComplete: state.paywallComplete,
    plan: state.plan,
    freeQuestionsUsed: state.freeQuestionsUsed,
  };
}

/** Next required route in signup funnel, or null if user may use the dashboard. */
export function getOnboardingFunnelRoute(
  state: OnboardingFlowState,
): string | null {
  if (!state.onboardingComplete) return "/onboarding";
  if (
    requiresPaywallRoute(
      state.plan,
      state.paywallComplete,
      state.freeQuestionsUsed ?? 0,
    )
  ) {
    return "/paywall";
  }
  return null;
}
