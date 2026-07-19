import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PaywallPricing } from "../../components/pricing/PaywallPricing";
import { BackButton } from "../../components/ui";
import { usePricingCheckout } from "../../hooks/usePricingCheckout";
import { useBillingSync } from "../../hooks/useBillingSync";
import { requiresPaywallRoute } from "../../lib/paywall-enforcement";
import {
  getFreeQuestionsRemaining,
  isFreeQuestionsExhausted,
  isPaidPlan,
} from "../../store/types";
import { useAppStore } from "../../store/useAppStore";

export function PaywallPage() {
  const navigate = useNavigate();
  const { isAuthenticated, paywallComplete, plan, onboardingComplete } = useAppStore();
  const freeQuestionsUsed = useAppStore((s) => s.freeQuestionsUsed);
  const freeQuestionsRemaining = getFreeQuestionsRemaining(
    plan,
    freeQuestionsUsed,
  );
  const hardPaywall = isFreeQuestionsExhausted(plan, freeQuestionsUsed);

  const finishFree = () => {
    navigate("/");
  };

  const { loadingTier, error, handleSelect } = usePricingCheckout({
    onComplete: finishFree,
    returnToAfterPurchase: "dashboard",
  });
  const { sync } = useBillingSync();

  useEffect(() => {
    void window.landed?.setDashboardLayout?.("paywall");
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/auth", { replace: true });
      return;
    }
    if (!onboardingComplete) {
      navigate("/onboarding", { replace: true });
      return;
    }
    if (isPaidPlan(plan)) {
      navigate("/", { replace: true });
      return;
    }
    if (!requiresPaywallRoute(plan, paywallComplete, freeQuestionsUsed)) {
      navigate("/", { replace: true });
      return;
    }
    // First-time / hard paywall: show the host window.
    void window.landed?.focusDashboard?.("/paywall");
  }, [
    isAuthenticated,
    onboardingComplete,
    paywallComplete,
    plan,
    freeQuestionsUsed,
    navigate,
  ]);

  useEffect(() => {
    void sync();
    const interval = window.setInterval(() => {
      void sync();
    }, 60_000);
    return () => window.clearInterval(interval);
  }, [sync]);

  const finishFreeWithPaywall = () => {
    if (hardPaywall) return;
    useAppStore.getState().completePaywall();
    finishFree();
  };

  const handleTierSelect = async (
    tierId: Parameters<typeof handleSelect>[0],
    interval: Parameters<typeof handleSelect>[1],
  ) => {
    if (tierId === "free") {
      finishFreeWithPaywall();
      return;
    }
    await handleSelect(tierId, interval);
  };

  const headline = hardPaywall
    ? "You've used your free questions"
    : "Simple and transparent pricing that works for you";
  const subheadline = hardPaywall
    ? "Upgrade to Pro or Lifetime for unlimited questions, a stronger coding model, and invisible overlay on screen share."
    : undefined;

  return (
    <div className="no-drag relative h-screen max-h-screen w-full overflow-y-auto overscroll-contain bg-gradient-to-b from-[#e4ebf3] via-[#eef2f7] to-[#f3f5f8]">
      {!hardPaywall ? <BackButton to="/" /> : null}

      <div className="mx-auto flex min-h-full w-full max-w-[1080px] flex-col items-center justify-center px-6 py-10">
        {error ? (
          <p className="mb-6 text-center text-[13px] text-red-600">{error}</p>
        ) : null}

        <PaywallPricing
          loadingTier={loadingTier}
          onSelect={(id, interval) => void handleTierSelect(id, interval)}
          onStartFree={finishFreeWithPaywall}
          showFreeLink={!hardPaywall}
          freeQuestionsRemaining={
            Number.isFinite(freeQuestionsRemaining)
              ? freeQuestionsRemaining
              : undefined
          }
          headline={headline}
          subheadline={subheadline}
        />
      </div>
    </div>
  );
}
