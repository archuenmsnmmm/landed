import { useCallback, useEffect, useRef, useState } from "react";
import { useOverlayBarDrag } from "../hooks/useOverlayBarDrag";
import { useOverlayClickThrough } from "../hooks/useOverlayClickThrough";
import { enforceHardPaywall } from "../lib/paywall-enforcement";
import {
  askAboutScreen,
  ScreenAssistantError,
} from "../screen-assistant";
import { syncQuestionUsageToServer } from "../services/usage";
import { isFreeQuestionsExhausted } from "../store/types";
import { useAppStore } from "../store/useAppStore";
import { AskCommandBar, type OverlayChatTurn } from "./overlay-ui";

/**
 * Screen-aware overlay — Phase 1 MVP
 *
 *   User question
 *        +
 *   Screenshot (OS screen capture)
 *        ↓
 *   Vision AI
 *        ↓
 *   Answer in chat UI
 *
 * No OCR, continuous monitoring, or suggestion pipeline.
 */
export function OverlayApp() {
  const topPanelRef = useRef<HTMLDivElement>(null);
  const controlBarRef = useRef<HTMLDivElement>(null);
  const askAbortRef = useRef<AbortController | null>(null);
  const askInFlightRef = useRef(false);

  const [visible, setVisible] = useState(false);
  const [barHidden, setBarHidden] = useState(false);
  const [askDraft, setAskDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingQuestion, setPendingQuestion] = useState("");
  const [pendingAnswer, setPendingAnswer] = useState("");
  const [chatTurns, setChatTurns] = useState<OverlayChatTurn[]>([]);

  const {
    dragging: barDragging,
    capturing: barCapturing,
    style: barPositionStyle,
    onPointerDown: onBarPointerDown,
    nudge: nudgeBar,
    resetToTopCenter: resetBarToTopCenter,
    isDragging: isBarDragging,
  } = useOverlayBarDrag(controlBarRef);

  useOverlayClickThrough(
    visible,
    topPanelRef,
    controlBarRef,
    barHidden,
    barCapturing,
  );

  const showActiveUi = useCallback(async () => {
    // Fresh session always opens the ask bar at top-center.
    resetBarToTopCenter();
    document.documentElement.classList.add("active-mode");
    document.body.classList.add("active-mode");
    await window.landed?.setOverlayMode?.("active");
    setVisible(true);
  }, [resetBarToTopCenter]);

  const hideActiveUi = useCallback(() => {
    askAbortRef.current?.abort();
    askAbortRef.current = null;
    askInFlightRef.current = false;
    setAskDraft("");
    setLoading(false);
    setPendingQuestion("");
    setPendingAnswer("");
    setChatTurns([]);
    setVisible(false);
    resetBarToTopCenter();
    void window.landed?.setOverlayMode?.("pill");
    document.documentElement.classList.remove("active-mode");
    document.body.classList.remove("active-mode");
  }, [resetBarToTopCenter]);

  useEffect(() => {
    return window.landed?.onNudgeOverlay?.((dx, dy) => {
      nudgeBar(dx, dy);
    });
  }, [nudgeBar]);

  useEffect(() => {
    document.documentElement.classList.add("overlay");
    document.body.classList.add("overlay");
    void window.landed?.getSettings?.().then((s) => {
      if (s.sessionActive) void showActiveUi();
    });
    return () => {
      document.documentElement.classList.remove("overlay", "active-mode");
      document.body.classList.remove("overlay", "active-mode");
    };
  }, [showActiveUi]);

  useEffect(() => {
    return window.landed?.onSessionStarted?.(() => void showActiveUi());
  }, [showActiveUi]);

  useEffect(() => {
    return window.landed?.onSessionStopped?.(() => hideActiveUi());
  }, [hideActiveUi]);

  useEffect(() => {
    return window.landed?.onShortcutToggle?.(() => {
      setBarHidden((hidden) => !hidden);
    });
  }, []);

  useEffect(() => {
    return () => {
      askAbortRef.current?.abort();
    };
  }, []);

  const commitTurn = useCallback(
    (question: string, answer: string, viewedScreen: boolean) => {
      setChatTurns((prev) => [
        ...prev,
        {
          id: `turn-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          question,
          answer,
          viewedScreen,
        },
      ]);
      setPendingQuestion("");
      setPendingAnswer("");
    },
    [],
  );

  /**
   * MVP: capture screen → send image + question to vision model → show answer.
   */
  const submitAsk = useCallback(
    async (rawQuestion?: string) => {
      const question = (rawQuestion ?? askDraft).trim();
      if (!question || askInFlightRef.current) return;

      const { plan, freeQuestionsUsed } = useAppStore.getState();
      if (isFreeQuestionsExhausted(plan, freeQuestionsUsed)) {
        void enforceHardPaywall();
        return;
      }

      askInFlightRef.current = true;
      askAbortRef.current?.abort();
      const controller = new AbortController();
      askAbortRef.current = controller;

      setAskDraft("");
      setPendingQuestion(question);
      setPendingAnswer("");
      setLoading(true);

      try {
        const { text, viewedScreen } = await askAboutScreen({
          question,
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;

        useAppStore.getState().consumeFreeQuestion();
        void syncQuestionUsageToServer(1);

        commitTurn(question, text, viewedScreen);
      } catch (err) {
        if (controller.signal.aborted) return;

        const message =
          err instanceof ScreenAssistantError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Something went wrong. Try again.";

        commitTurn(question, message, false);
      } finally {
        if (askAbortRef.current === controller) {
          askAbortRef.current = null;
        }
        askInFlightRef.current = false;
        setLoading(false);
      }
    },
    [askDraft, commitTurn],
  );

  if (!visible) return null;

  if (barHidden) {
    return <div className="pointer-events-none fixed inset-0 h-full w-full bg-transparent" />;
  }

  return (
    <div className="pointer-events-none fixed inset-0 h-full w-full bg-transparent">
      <div
        ref={controlBarRef}
        className={`pointer-events-auto absolute w-max max-w-[calc(100vw-32px)] ${
          barDragging ? "cursor-grabbing select-none" : "cursor-grab"
        }`}
        style={barPositionStyle}
        onPointerDown={onBarPointerDown}
        onMouseEnter={() => void window.landed?.setIgnoreMouseEvents?.(false)}
        onMouseLeave={() => {
          if (isBarDragging()) return;
          void window.landed?.setIgnoreMouseEvents?.(true, { forward: true });
        }}
      >
        <div ref={topPanelRef}>
          <AskCommandBar
            value={askDraft}
            onChange={setAskDraft}
            onSubmit={(q) => void submitAsk(q)}
            loading={loading}
            chatTurns={chatTurns}
            pendingQuestion={pendingQuestion}
            pendingAnswer={pendingAnswer}
            onOpenSettings={() => {
              void window.landed?.openSettings?.("general");
            }}
          />
        </div>
      </div>
    </div>
  );
}
