import { useState } from "react";
import type { BillingInterval, PricingTierId } from "../../lib/pricing";
import {
  BillingToggle,
  FreePlanLink,
  LifetimePlanCard,
  PricingCardColumn,
  PricingCardsRow,
  ProPlanCard,
} from "./PaywallPlanCards";
import { useRegionalPricing } from "../../hooks/useRegionalPricing";
import { legalLinks, openLegalLink } from "../../lib/legal-urls";

function buildFreeCtaLabel(freeQuestionsRemaining?: number): string {
  if (freeQuestionsRemaining == null) {
    return "Continue with Free";
  }
  if (freeQuestionsRemaining <= 0) {
    return "Free questions used";
  }
  if (freeQuestionsRemaining === 1) {
    return "Continue with Free · 1 question left";
  }
  return `Continue with Free · ${freeQuestionsRemaining} questions left`;
}

export function PaywallPricing({
  loadingTier,
  onSelect,
  onStartFree,
  freeLinkLabel,
  freeQuestionsRemaining,
  freeOverlaySecondsRemaining,
  showFreeLink = true,
  variant = "page",
  headline,
  subheadline,
}: {
  loadingTier?: PricingTierId | null;
  onSelect: (id: PricingTierId, interval: BillingInterval) => void;
  onStartFree: () => void;
  freeLinkLabel?: string;
  freeQuestionsRemaining?: number;
  /** @deprecated Use freeQuestionsRemaining */
  freeOverlaySecondsRemaining?: number;
  showFreeLink?: boolean;
  variant?: "page" | "embedded";
  headline?: string;
  subheadline?: string;
}) {
  const [interval, setInterval] = useState<BillingInterval>("annual");
  const currency = useRegionalPricing();
  const embedded = variant === "embedded";
  const remaining = freeQuestionsRemaining ?? freeOverlaySecondsRemaining;
  const freeExhausted = remaining != null && remaining <= 0;
  const freeDisabled = !showFreeLink || freeExhausted;
  const freeCtaLabel = freeLinkLabel ?? buildFreeCtaLabel(remaining);

  return (
    <div className="flex w-full flex-col items-center">
      <h1
        className={`text-center font-bold tracking-[-0.03em] text-zinc-900 ${
          embedded ? "text-[20px] leading-snug" : "text-[28px] leading-[1.1]"
        }`}
      >
        {headline ?? "Simple and transparent pricing that works for you"}
      </h1>

      {subheadline ? (
        <p
          className={`max-w-lg text-center text-zinc-600 ${
            embedded ? "mt-3 text-[14px] leading-relaxed" : "mt-3 text-[14px] leading-relaxed"
          }`}
        >
          {subheadline}
        </p>
      ) : null}

      <div className={embedded ? "mt-5" : "mt-6"}>
        <BillingToggle interval={interval} onChange={setInterval} currency={currency} />
      </div>

      <PricingCardsRow
        className={embedded ? "mt-5 max-w-[720px]" : "mt-6 max-w-[760px]"}
      >
        <PricingCardColumn>
          <ProPlanCard
            interval={interval}
            loading={loadingTier === "pro"}
            currency={currency}
            onSelect={() => onSelect("pro", interval)}
            compact={!embedded}
          />
        </PricingCardColumn>
        <PricingCardColumn>
          <LifetimePlanCard
            loading={loadingTier === "lifetime"}
            currency={currency}
            onSelect={() => onSelect("lifetime", interval)}
            compact={!embedded}
          />
        </PricingCardColumn>
      </PricingCardsRow>

      {showFreeLink ? (
        <div className={embedded ? "mt-5" : "mt-6"}>
          <FreePlanLink
            onSelect={onStartFree}
            disabled={freeDisabled}
            label={freeCtaLabel}
          />
        </div>
      ) : null}

      <p className={`text-center text-[11px] leading-relaxed text-zinc-400 ${embedded ? "mt-4" : "mt-5"}`}>
        Pro subscriptions renew automatically until cancelled. Lifetime is billed once.
        By upgrading you agree to our{" "}
        <button
          type="button"
          onClick={() => openLegalLink(legalLinks.terms)}
          className="text-zinc-500 underline decoration-zinc-300 hover:text-zinc-600"
        >
          Terms of Service
        </button>
        . Payments are processed by Stripe.
      </p>
    </div>
  );
}
