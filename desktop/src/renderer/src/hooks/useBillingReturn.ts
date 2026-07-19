import { useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  completePurchaseReturn,
  parseBillingCallbackUrl,
} from "../lib/billing-return";
import { useAppStore } from "../store/useAppStore";

/** Handle landed://billing/* deep links after Stripe checkout or portal. */
export function useBillingReturn() {
  const navigate = useNavigate();
  const userId = useAppStore((s) => s.user?.id);

  const handleBillingReturn = useCallback(
    async (url: string) => {
      if (!userId) return;
      const { returnTo, sessionId } = parseBillingCallbackUrl(url);
      await completePurchaseReturn(userId, returnTo, navigate, sessionId);
    },
    [userId, navigate],
  );

  useEffect(() => {
    return window.landed?.onBillingCallback?.((url) => {
      void handleBillingReturn(url);
    });
  }, [handleBillingReturn]);
}
