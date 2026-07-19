import { useCallback, useEffect } from "react";
import { syncBillingState } from "../services/billing";
import { useAppStore } from "../store/useAppStore";

/** Keep local plan in sync with Supabase after Stripe checkout, portal, or app focus. */
export function useBillingSync(enabled = true) {
  const userId = useAppStore((s) => s.user?.id);

  const sync = useCallback(async () => {
    if (!enabled || !userId) return null;
    return syncBillingState(userId);
  }, [enabled, userId]);

  useEffect(() => {
    if (!enabled || !userId) return;
    void sync();
  }, [enabled, userId, sync]);

  useEffect(() => {
    if (!enabled || !userId) return;
    const onFocus = () => {
      void sync();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [enabled, userId, sync]);

  return { sync };
}
