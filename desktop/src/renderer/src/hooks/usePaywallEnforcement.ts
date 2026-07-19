import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { requiresPaywallRoute } from "../lib/paywall-enforcement";
import { useAppStore } from "../store/useAppStore";
import { useOverlayLimitGuard } from "./useOverlayLimitGuard";

/**
 * Enforces hard paywall redirects when free questions are exhausted.
 * Use in dashboard shell (inside HashRouter).
 */
export function usePaywallEnforcement(options?: { navigateOnBlock?: boolean }) {
  const navigate = useNavigate();
  const location = useLocation();
  const navigateOnBlock = options?.navigateOnBlock ?? true;

  const plan = useAppStore((s) => s.plan);
  const paywallComplete = useAppStore((s) => s.paywallComplete);
  const freeQuestionsUsed = useAppStore((s) => s.freeQuestionsUsed);

  useOverlayLimitGuard();

  useEffect(() => {
    if (!navigateOnBlock) return;
    if (location.pathname === "/paywall") return;
    if (requiresPaywallRoute(plan, paywallComplete, freeQuestionsUsed)) {
      navigate("/paywall", { replace: true });
    }
  }, [
    navigateOnBlock,
    location.pathname,
    plan,
    paywallComplete,
    freeQuestionsUsed,
    navigate,
  ]);
}
