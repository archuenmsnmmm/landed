import { useCallback, useEffect, useRef } from "react";
import {
  FREE_OVERLAY_LIMIT_SECONDS,
  isPaidPlan,
} from "../store/types";
import { syncPlanLimitsToMain, useAppStore } from "../store/useAppStore";

const SYNC_EVERY_SECONDS = 5;

/**
 * Tracks free-plan overlay-on time while the session UI is active and visible.
 * Pauses when the overlay is hidden (Cmd+\) and stops the session at the limit.
 */
export function useFreeOverlayUsageTracker(
  active: boolean,
  onLimitReached: () => void,
): void {
  const plan = useAppStore((s) => s.plan);
  const addFreeOverlaySeconds = useAppStore((s) => s.addFreeOverlaySeconds);
  const overlayVisibleRef = useRef(true);
  const intervalRef = useRef<number | null>(null);
  const secondsSinceSyncRef = useRef(0);
  const onLimitReachedRef = useRef(onLimitReached);

  onLimitReachedRef.current = onLimitReached;

  const clearTicker = useCallback(() => {
    if (intervalRef.current != null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    secondsSinceSyncRef.current = 0;
  }, []);

  const handleLimitReached = useCallback(() => {
    clearTicker();
    onLimitReachedRef.current();
  }, [clearTicker]);

  const tick = useCallback(() => {
    if (isPaidPlan(useAppStore.getState().plan)) return;

    const used = useAppStore.getState().freeOverlaySecondsUsed;
    if (used >= FREE_OVERLAY_LIMIT_SECONDS) {
      handleLimitReached();
      return;
    }

    addFreeOverlaySeconds(1);
    secondsSinceSyncRef.current += 1;

    if (useAppStore.getState().freeOverlaySecondsUsed >= FREE_OVERLAY_LIMIT_SECONDS) {
      handleLimitReached();
      return;
    }

    if (secondsSinceSyncRef.current >= SYNC_EVERY_SECONDS) {
      secondsSinceSyncRef.current = 0;
      void syncPlanLimitsToMain();
    }
  }, [addFreeOverlaySeconds, handleLimitReached]);

  const updateTicker = useCallback(() => {
    const shouldTick =
      !isPaidPlan(plan) &&
      active &&
      overlayVisibleRef.current;

    if (shouldTick && intervalRef.current == null) {
      intervalRef.current = window.setInterval(tick, 1000);
      return;
    }

    if (!shouldTick) {
      clearTicker();
    }
  }, [active, clearTicker, plan, tick]);

  useEffect(() => {
    return window.landed?.onVisibility?.((visible) => {
      overlayVisibleRef.current = visible;
      updateTicker();
    });
  }, [updateTicker]);

  useEffect(() => {
    updateTicker();
    return clearTicker;
  }, [clearTicker, updateTicker]);
}
