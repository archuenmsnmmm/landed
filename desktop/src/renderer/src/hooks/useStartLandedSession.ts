import { useCallback } from "react";
import {
  canStartSession,
  formatFreeQuestionsRemaining,
  getFreeQuestionsRemaining,
  isPaidPlan,
} from "../store/types";
import { syncPlanLimitsToMain, useAppStore } from "../store/useAppStore";

export function useStartLandedSession() {
  const plan = useAppStore((s) => s.plan);
  const freeQuestionsUsed = useAppStore((s) => s.freeQuestionsUsed);
  const sessionActive = useAppStore((s) => s.sessionActive);
  const setSessionActive = useAppStore((s) => s.setSessionActive);

  const canStart = canStartSession(plan, freeQuestionsUsed);
  const questionsRemaining = getFreeQuestionsRemaining(plan, freeQuestionsUsed);
  const questionsRemainingLabel = Number.isFinite(questionsRemaining)
    ? formatFreeQuestionsRemaining(questionsRemaining)
    : undefined;

  const startSession = useCallback(
    async (opts?: { quiet?: boolean }) => {
      const quiet = Boolean(opts?.quiet);
      const state = useAppStore.getState();
      if (state.sessionActive) {
        void window.landed?.show?.();
        return true;
      }

      const { plan: currentPlan, freeQuestionsUsed: used } = state;
      if (!canStartSession(currentPlan, used)) {
        console.warn("[landed] Cannot start — free question limit reached.");
        if (window.landed?.focusDashboard) {
          void window.landed.focusDashboard("/paywall");
        } else if (!window.location.hash.includes("/paywall")) {
          window.location.hash = "#/paywall";
        }
        return false;
      }

      await syncPlanLimitsToMain();

      const isDemo = !!state.settings.demoMode;
      if (!isDemo && !quiet) {
        // Explicit starts may probe + open System Settings. Quiet auto-launch
        // skips this — onboarding owns first-time permission UX; ask-time
        // retries handle grants later.
        const permissions = await window.landed?.getPermissionStatus?.();
        if (permissions && !permissions.screen) {
          const probe = await window.landed?.captureScreen?.({ light: true });
          const refreshed = await window.landed?.getPermissionStatus?.();
          if (!probe && refreshed && !refreshed.screen) {
            await window.landed?.openPermissionSettings?.("screen");
          }
        }
      }

      if (!window.landed?.startSession) {
        console.error("[landed] startSession unavailable — run inside the Electron app.");
        return false;
      }

      const started = await window.landed.startSession(
        isDemo ? { demo: true } : undefined,
      );
      if (!started) {
        console.warn("[landed] Session start blocked — check free question limit.");
        return false;
      }

      setSessionActive(true);
      return true;
    },
    [setSessionActive],
  );

  return {
    startSession,
    canStart: canStart && !sessionActive,
    sessionActive,
    questionsRemaining,
    questionsRemainingLabel,
    /** @deprecated alias for questionsRemainingLabel */
    overlayTimeRemainingLabel: questionsRemainingLabel,
    isPaid: isPaidPlan(plan),
  };
}
