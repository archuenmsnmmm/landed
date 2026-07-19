import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { BillingInterval, PricingTierId } from "../lib/pricing";
import type { PurchaseReturnTo } from "../lib/billing-return";
import { completePurchaseReturn } from "../lib/billing-return";
import {
  startPricingCheckout,
  syncBillingState,
} from "../services/billing";
import { useAppStore } from "../store/useAppStore";

export function usePricingCheckout({
  onComplete,
  returnToAfterPurchase = "dashboard",
}: {
  onComplete?: () => void;
  returnToAfterPurchase?: PurchaseReturnTo;
} = {}) {
  const { user } = useAppStore();
  const navigate = useNavigate();
  const [loadingTier, setLoadingTier] = useState<PricingTierId | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSelect = async (tierId: PricingTierId, interval: BillingInterval) => {
    setError(null);

    if (tierId === "free") {
      onComplete?.();
      return;
    }

    setLoadingTier(tierId);

    try {
      if (!user?.id || !user.email) {
        setError("Sign in to upgrade.");
        setLoadingTier(null);
        return;
      }

      const result = await startPricingCheckout(
        tierId,
        user.id,
        user.email,
        interval,
        returnToAfterPurchase,
      );
      if (!result.ok) {
        setError(result.error);
        setLoadingTier(null);
        return;
      }

      const poll = window.setInterval(async () => {
        const remotePlan = await syncBillingState(user.id);
        if (remotePlan && remotePlan !== "free") {
          window.clearInterval(poll);
          setLoadingTier(null);
          await completePurchaseReturn(user.id, returnToAfterPurchase, navigate);
          onComplete?.();
        }
      }, 3000);
      window.setTimeout(() => {
        window.clearInterval(poll);
        setLoadingTier(null);
      }, 300_000);
    } catch (err) {
      const message =
        err instanceof Error && err.message.trim()
          ? err.message
          : "Could not start checkout. Try again or continue on the free plan.";
      setError(message);
      setLoadingTier(null);
    }
  };

  return { loadingTier, error, handleSelect };
}
