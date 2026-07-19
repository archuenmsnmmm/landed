import { useState } from "react";
import { ChoosePlanPricing } from "../pricing/ChoosePlanPricing";
import { useBillingSync } from "../../hooks/useBillingSync";
import { usePricingCheckout } from "../../hooks/usePricingCheckout";
import { openStripeBillingPortal } from "../../services/billing";
import { useAppStore } from "../../store/useAppStore";

export function BillingPanel() {
  const user = useAppStore((s) => s.user);
  const { loadingTier, error, handleSelect } = usePricingCheckout({
    returnToAfterPurchase: "billing",
  });
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);
  useBillingSync();

  const handleManageBilling = async () => {
    if (!user?.id) {
      setPortalError("Sign in to manage billing.");
      return;
    }
    setPortalError(null);
    setPortalLoading(true);
    try {
      const result = await openStripeBillingPortal(user.id);
      if (!result.ok) {
        setPortalError(result.error);
      }
    } catch (err) {
      const message =
        err instanceof Error && err.message.trim()
          ? err.message
          : "Could not open billing portal. Try again.";
      setPortalError(message);
    } finally {
      setPortalLoading(false);
    }
  };

  return (
    <ChoosePlanPricing
      loadingTier={loadingTier}
      error={error ?? portalError}
      onSelect={(id, interval) => void handleSelect(id, interval)}
      onManageBilling={() => void handleManageBilling()}
      portalLoading={portalLoading}
    />
  );
}
