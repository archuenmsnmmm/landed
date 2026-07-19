import { useEffect } from "react";
import { applyContentProtection } from "../services/content-protection";
import { rehydrateAppStoreFromStorage, useAppStore } from "../store/useAppStore";

/** Keep overlay content protection aligned with plan + invisibility settings. */
export function useContentProtectionSync(rehydrateOnMount = false): void {
  const plan = useAppStore((s) => s.plan);
  const invisible = useAppStore((s) => s.settings.invisible);

  useEffect(() => {
    if (!rehydrateOnMount) return;
    void rehydrateAppStoreFromStorage();
  }, [rehydrateOnMount]);

  useEffect(() => {
    void applyContentProtection(plan, invisible);
  }, [plan, invisible]);
}
