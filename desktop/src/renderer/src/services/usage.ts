import { apiJson } from "../lib/api-client";
import {
  FREE_OVERLAY_LIMIT_SECONDS,
  FREE_QUESTION_LIMIT,
  isFreeQuestionsExhausted,
  isPaidPlan,
} from "../store/types";
import { syncPlanLimitsToMain, useAppStore } from "../store/useAppStore";

function applyServerQuestionsUsed(serverUsed: number): void {
  const clamped = Math.max(0, Math.min(FREE_QUESTION_LIMIT, serverUsed));
  const store = useAppStore.getState();
  if (clamped === store.freeQuestionsUsed) return;
  useAppStore.setState({ freeQuestionsUsed: clamped });
  void syncPlanLimitsToMain();
}

export async function syncOverlayUsageToServer(
  secondsUsed: number,
): Promise<void> {
  const userId = useAppStore.getState().user?.id;
  if (!userId) return;

  const result = await apiJson<{
    freeOverlaySecondsUsed: number;
    limitReached: boolean;
  }>("/api/usage/overlay", {
    method: "POST",
    body: JSON.stringify({ secondsUsed }),
  });

  if (!result.ok) return;

  const store = useAppStore.getState();
  const serverUsed = Math.max(
    0,
    Math.min(FREE_OVERLAY_LIMIT_SECONDS, result.data.freeOverlaySecondsUsed),
  );
  if (serverUsed > store.freeOverlaySecondsUsed) {
    useAppStore.setState({ freeOverlaySecondsUsed: serverUsed });
  }
}

export async function syncQuestionUsageToServer(
  questionsUsed: number,
): Promise<void> {
  const userId = useAppStore.getState().user?.id;
  if (!userId) return;

  const result = await apiJson<{
    freeQuestionsUsed: number;
    limitReached: boolean;
  }>("/api/usage/questions", {
    method: "POST",
    body: JSON.stringify({ questionsUsed }),
  });

  if (!result.ok) return;

  applyServerQuestionsUsed(result.data.freeQuestionsUsed);
}

export type ConsumeQuestionResult =
  | { ok: true; freeQuestionsUsed: number; limitReached: boolean }
  | { ok: false; reason: "exhausted" | "error" };

/**
 * Hard-reserve one free question before an AI ask.
 * Server is source of truth when reachable; local cap always applies.
 */
export async function consumeFreeQuestionHard(): Promise<ConsumeQuestionResult> {
  const state = useAppStore.getState();
  if (isPaidPlan(state.plan)) {
    return {
      ok: true,
      freeQuestionsUsed: state.freeQuestionsUsed,
      limitReached: false,
    };
  }

  if (isFreeQuestionsExhausted(state.plan, state.freeQuestionsUsed)) {
    await syncPlanLimitsToMain();
    return { ok: false, reason: "exhausted" };
  }

  const userId = state.user?.id;
  if (!userId) {
    // Not signed in to API — still enforce local hard cap.
    state.consumeFreeQuestion();
    const after = useAppStore.getState();
    return {
      ok: true,
      freeQuestionsUsed: after.freeQuestionsUsed,
      limitReached: isFreeQuestionsExhausted(after.plan, after.freeQuestionsUsed),
    };
  }

  const result = await apiJson<{
    freeQuestionsUsed: number;
    limitReached: boolean;
    paid?: boolean;
  }>("/api/usage/consume", {
    method: "POST",
    body: JSON.stringify({ questionsUsed: state.freeQuestionsUsed }),
  });

  if (result.ok) {
    applyServerQuestionsUsed(result.data.freeQuestionsUsed);
    const after = useAppStore.getState();
    if (
      !result.data.paid &&
      isFreeQuestionsExhausted(after.plan, after.freeQuestionsUsed)
    ) {
      // Consumed the final question — allow this ask, caller enforces after.
      return {
        ok: true,
        freeQuestionsUsed: after.freeQuestionsUsed,
        limitReached: true,
      };
    }
    return {
      ok: true,
      freeQuestionsUsed: after.freeQuestionsUsed,
      limitReached: Boolean(result.data.limitReached),
    };
  }

  if (result.status === 402) {
    applyServerQuestionsUsed(FREE_QUESTION_LIMIT);
    return { ok: false, reason: "exhausted" };
  }

  // Network / server error: fall back to local hard consume so limits still apply offline.
  useAppStore.getState().consumeFreeQuestion();
  void syncQuestionUsageToServer(useAppStore.getState().freeQuestionsUsed);
  const after = useAppStore.getState();
  return {
    ok: true,
    freeQuestionsUsed: after.freeQuestionsUsed,
    limitReached: isFreeQuestionsExhausted(after.plan, after.freeQuestionsUsed),
  };
}
