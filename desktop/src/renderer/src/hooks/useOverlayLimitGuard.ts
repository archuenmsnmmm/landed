import { useEffect, useRef } from "react";
import { enforceHardPaywall } from "../lib/paywall-enforcement";
import { isFreeQuestionsExhausted, isPaidPlan } from "../store/types";
import { useAppStore } from "../store/useAppStore";

/** Stop sessions when free question limits are hit (no router required). */
export function useOverlayLimitGuard() {
  const plan = useAppStore((s) => s.plan);
  const freeQuestionsUsed = useAppStore((s) => s.freeQuestionsUsed);
  const sessionActive = useAppStore((s) => s.sessionActive);

  const prevPlanRef = useRef(plan);
  useEffect(() => {
    const prevPlan = prevPlanRef.current;
    prevPlanRef.current = plan;
    if (!isPaidPlan(prevPlan) || isPaidPlan(plan)) return;
    if (sessionActive && isFreeQuestionsExhausted(plan, freeQuestionsUsed)) {
      void enforceHardPaywall();
    }
  }, [plan, sessionActive, freeQuestionsUsed]);

  useEffect(() => {
    if (!sessionActive || isPaidPlan(plan)) return;
    if (isFreeQuestionsExhausted(plan, freeQuestionsUsed)) {
      void enforceHardPaywall();
    }
  }, [plan, sessionActive, freeQuestionsUsed]);
}
