import { useState } from "react";
import type { BillingInterval, PricingTierId } from "../../lib/pricing";
import { normalizeDisplayPlan } from "../../lib/pricing";
import { useRegionalPricing } from "../../hooks/useRegionalPricing";
import { isPaidPlan } from "../../store/types";
import { useAppStore } from "../../store/useAppStore";
import {
  BillingToggle,
  FreePlanLink,
  LifetimePlanCard,
  PricingCardColumn,
  PricingCardsRow,
  ProPlanCard,
} from "./PaywallPlanCards";
import { legalLinks, openLegalLink } from "../../lib/legal-urls";

export function ChoosePlanPricing({
  loadingTier,
  error,
  onSelect,
  onManageBilling,
  portalLoading,
}: {
  loadingTier?: PricingTierId | null;
  error?: string | null;
  onSelect: (id: PricingTierId, interval: BillingInterval) => void;
  onManageBilling?: () => void;
  portalLoading?: boolean;
}) {
  const plan = useAppStore((s) => s.plan);
  const [interval, setInterval] = useState<BillingInterval>("annual");
  const currency = useRegionalPricing();
  const displayPlan = normalizeDisplayPlan(plan);
  const showManageBilling = isPaidPlan(plan) && displayPlan === "pro" && onManageBilling;
  const isLifetime = displayPlan === "lifetime";
  const isPaid = displayPlan !== "free";

  return (
    <div>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-zinc-900">
            Choose your plan
          </h2>
          <p className="mt-1 text-[13px] leading-relaxed text-zinc-500">
            Unlock all features with Landed Pro
          </p>
        </div>
        <BillingToggle
          interval={interval}
          onChange={setInterval}
          currency={currency}
          compact
          tone="light"
        />
      </div>

      {error ? <p className="mb-3 text-[12px] text-red-600">{error}</p> : null}

      <PricingCardsRow className="mx-auto max-w-[640px] !gap-3">
        <PricingCardColumn>
          <ProPlanCard
            interval={interval}
            loading={loadingTier === "pro"}
            isCurrent={displayPlan === "pro"}
            currency={currency}
            onSelect={() => onSelect("pro", interval)}
            onManageBilling={showManageBilling ? onManageBilling : undefined}
            portalLoading={portalLoading}
            compact
            tone="light"
            ctaLabel={isLifetime ? "Included in Lifetime" : undefined}
          />
        </PricingCardColumn>
        <PricingCardColumn>
          <LifetimePlanCard
            loading={loadingTier === "lifetime"}
            isCurrent={isLifetime}
            currency={currency}
            onSelect={() => onSelect("lifetime", interval)}
            compact
            tone="light"
          />
        </PricingCardColumn>
      </PricingCardsRow>

      <div className="mt-4">
        <FreePlanLink
          onSelect={() => onSelect("free", interval)}
          disabled={isPaid}
          tone="light"
          label={
            displayPlan === "free"
              ? "Current plan · Free"
              : isPaid
                ? `Free included in ${isLifetime ? "Lifetime" : "Pro"}`
                : "Continue with Free"
          }
          detail={
            displayPlan === "free"
              ? "Starter — 15 AI questions."
              : undefined
          }
        />
      </div>

      <p className="mt-3 text-[10px] leading-relaxed text-zinc-500">
        Pro plans renew automatically until cancelled. Lifetime is a one-time purchase.
        {showManageBilling
          ? " Manage or cancel Pro anytime from the Pro card above."
          : " Manage Pro anytime from this page after you upgrade."}{" "}
        Payments are processed by Stripe. By upgrading you agree to our{" "}
        <button
          type="button"
          onClick={() => openLegalLink(legalLinks.terms)}
          className="text-zinc-600 underline decoration-zinc-300 hover:text-zinc-900"
        >
          Terms of Service
        </button>
        .
      </p>
    </div>
  );
}
