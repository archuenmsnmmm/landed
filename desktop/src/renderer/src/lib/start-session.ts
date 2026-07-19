import { canStartSession } from "../store/types";
import { syncPlanLimitsToMain, useAppStore } from "../store/useAppStore";

export type SessionPermissionKey = "accessibility" | "screen";

export interface SessionPermissionStatus {
  accessibility: boolean;
  screen: boolean;
}

export function getMissingSessionPermissions(
  status: SessionPermissionStatus | null | undefined,
): SessionPermissionKey[] {
  if (!status) return ["accessibility", "screen"];
  const missing: SessionPermissionKey[] = [];
  if (!status.accessibility) missing.push("accessibility");
  if (!status.screen) missing.push("screen");
  return missing;
}

export function getBlockingSessionPermissions(
  status: SessionPermissionStatus | null | undefined,
): SessionPermissionKey[] {
  return getMissingSessionPermissions(status);
}

export async function fetchSessionPermissionStatus(): Promise<SessionPermissionStatus | null> {
  const status = await window.landed?.getPermissionStatus?.();
  if (!status) return null;
  return {
    accessibility: status.accessibility,
    screen: status.screen,
  };
}

export async function performSessionStart(): Promise<boolean> {
  const state = useAppStore.getState();
  if (state.sessionActive) {
    const { plan, freeQuestionsUsed } = state;
    if (!canStartSession(plan, freeQuestionsUsed)) {
      useAppStore.getState().setSessionActive(false);
      return false;
    }

    if (!window.landed?.startSession) {
      console.error("[landed] startSession unavailable — run inside the Electron app.");
      return false;
    }
    const recovered = await window.landed.startSession();
    if (recovered) return true;
    // Stale session flag or main process blocked — fall through to a fresh start.
    useAppStore.getState().setSessionActive(false);
  }

  const { plan, freeQuestionsUsed } = useAppStore.getState();
  if (!canStartSession(plan, freeQuestionsUsed)) {
    console.warn("[landed] Cannot start — free question limit reached.");
    if (window.landed?.focusDashboard) {
      void window.landed.focusDashboard("/paywall");
    } else if (!window.location.hash.includes("/paywall")) {
      window.location.hash = "#/paywall";
    }
    return false;
  }

  await syncPlanLimitsToMain();

  if (!window.landed?.startSession) {
    console.error("[landed] startSession unavailable — run inside the Electron app.");
    return false;
  }

  const isDemo = !!useAppStore.getState().settings.demoMode;
  const started = await window.landed.startSession(
    isDemo ? { demo: true } : undefined,
  );
  if (!started) {
    console.warn("[landed] Session start blocked — check free question limit.");
    return false;
  }

  useAppStore.getState().setSessionActive(true);
  return true;
}

/** Convenience wrapper used by newer call sites. */
export async function startLandedSession(opts?: {
  demo?: boolean;
}): Promise<boolean> {
  if (opts?.demo) {
    useAppStore.getState().updateSettings({ demoMode: true });
  }
  return performSessionStart();
}

export function canStartLandedSessionNow(): boolean {
  const { plan, freeQuestionsUsed } = useAppStore.getState();
  return canStartSession(plan, freeQuestionsUsed);
}
