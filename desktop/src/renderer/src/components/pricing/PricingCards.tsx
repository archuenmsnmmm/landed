import type { PricingTierId } from "../../lib/pricing";
import { normalizeDisplayPlan } from "../../lib/pricing";
import type { Plan } from "../../store/types";
import {
  FreePlanLink,
  LifetimePlanCard,
  ProPlanCard,
  PricingCardColumn,
  PricingCardsRow,
} from "./PaywallPlanCards";

export function PricingCards({
  currentPlan,
  loadingTier,
  interval,
  layout = "row",
  onSelect,
  onStartFree,
}: {
  currentPlan: Plan;
  loadingTier?: PricingTierId | null;
  interval: "monthly" | "annual";
  layout?: "row" | "stack";
  onSelect: (id: PricingTierId) => void;
  onStartFree?: () => void;
}) {
  const displayPlan = normalizeDisplayPlan(currentPlan);

  return (
    <div className="flex w-full flex-col items-center">
      <PricingCardsRow
        className={layout === "stack" ? "flex-col max-w-[400px]" : "max-w-[760px]"}
      >
        <PricingCardColumn>
          <ProPlanCard
            interval={interval}
            loading={loadingTier === "pro"}
            isCurrent={displayPlan === "pro"}
            onSelect={() => onSelect("pro")}
          />
        </PricingCardColumn>
        <PricingCardColumn>
          <LifetimePlanCard
            loading={loadingTier === "lifetime"}
            isCurrent={displayPlan === "lifetime"}
            onSelect={() => onSelect("lifetime")}
          />
        </PricingCardColumn>
      </PricingCardsRow>

      <div className="mt-5">
        <FreePlanLink
          onSelect={() => {
            if (onStartFree) onStartFree();
            else onSelect("free");
          }}
          label={displayPlan === "free" ? "Current plan · Free" : "Continue with Free"}
        />
      </div>
    </div>
  );
}
