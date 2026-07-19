import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SplitScreenShell } from "../../components/onboarding/SplitScreenShell";
import {
  SplitScreenLeft,
  SplitScreenLeftBody,
} from "../../components/onboarding/SplitScreenLeft";
import { TryLandedPreview } from "../../components/onboarding/TryLandedPreview";
import { BackButton } from "../../components/ui";
import { notifyAppStoreChanged, useAppStore } from "../../store/useAppStore";

export function TryLandedPage() {
  const navigate = useNavigate();
  const {
    isAuthenticated,
    onboardingComplete,
    completeShortcutTutorial,
  } = useAppStore();
  const [overlayVisible, setOverlayVisible] = useState(true);
  const finishingRef = useRef(false);

  const isMac = navigator.platform.toLowerCase().includes("mac");

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/auth", { replace: true });
      return;
    }
    if (!onboardingComplete) {
      navigate("/onboarding", { replace: true });
    }
  }, [isAuthenticated, onboardingComplete, navigate]);

  useEffect(() => {
    void window.landed?.setDashboardLayout?.("onboarding");
  }, []);

  useEffect(() => {
    const unsubShortcut = window.landed?.onShortcutToggle?.(() => {
      setOverlayVisible((visible) => !visible);
    });

    return () => {
      unsubShortcut?.();
    };
  }, []);

  const finish = useCallback(() => {
    if (finishingRef.current) return;
    finishingRef.current = true;
    completeShortcutTutorial();
    notifyAppStoreChanged();
    navigate("/paywall");
  }, [completeShortcutTutorial, navigate]);

  const skip = useCallback(() => {
    if (finishingRef.current) return;
    finishingRef.current = true;
    completeShortcutTutorial();
    notifyAppStoreChanged();
    navigate("/paywall");
  }, [completeShortcutTutorial, navigate]);

  const tryShortcut = useCallback(() => {
    setOverlayVisible((visible) => !visible);
  }, []);

  return (
    <div className="relative h-screen max-h-screen w-full min-w-0 overflow-hidden">
      <BackButton to="/onboarding" />
      <SplitScreenShell
        rightVariant="grid-preview"
        left={
          <SplitScreenLeft>
            <SplitScreenLeftBody>
              <h1 className="min-w-0 break-words text-[32px] font-semibold leading-[1.12] tracking-[-0.025em] text-zinc-900">
                Hide Landed using the following hotkeys
              </h1>
              <p className="mt-3 min-w-0 break-words text-[15px] leading-relaxed text-zinc-500">
                You can open and hide Landed anytime.
              </p>

              <div className="mt-10 flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={tryShortcut}
                  aria-label={`Try hide shortcut: ${isMac ? "Command" : "Control"} backslash`}
                  className="rounded-2xl transition-transform active:scale-95"
                >
                  <KeyCap
                    symbol={isMac ? "⌘" : "Ctrl"}
                    label={isMac ? "command" : "control"}
                    pressed={!overlayVisible}
                  />
                </button>
                <span className="text-[18px] font-light text-zinc-300">+</span>
                <button
                  type="button"
                  onClick={tryShortcut}
                  aria-label="Try hide shortcut: backslash"
                  className="rounded-2xl transition-transform active:scale-95"
                >
                  <KeyCap symbol="\" pressed={!overlayVisible} />
                </button>
              </div>

              <button
                type="button"
                onClick={finish}
                className="mt-10 flex h-[48px] w-full min-w-0 items-center justify-center rounded-full border border-zinc-300 bg-white text-[15px] font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
              >
                Continue
              </button>
            </SplitScreenLeftBody>

            <button
              type="button"
              onClick={skip}
              className="mt-auto flex min-w-0 items-center gap-0.5 self-center py-2 text-[14px] font-medium text-zinc-400 transition-colors hover:text-zinc-600"
            >
              Skip
              <span aria-hidden>›</span>
            </button>
          </SplitScreenLeft>
        }
        right={<TryLandedPreview overlayVisible={overlayVisible} />}
      />
    </div>
  );
}

function KeyCap({
  symbol,
  label,
  pressed = false,
}: {
  symbol: string;
  label?: string;
  pressed?: boolean;
}) {
  return (
    <span
      className={`flex h-[88px] w-[88px] flex-col items-center justify-center gap-1 rounded-2xl border bg-gradient-to-b shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_8px_rgba(0,0,0,0.05)] transition-colors ${
        pressed
          ? "border-zinc-300 from-zinc-100 to-zinc-200"
          : "border-zinc-200 from-white to-zinc-50 hover:border-zinc-300"
      }`}
    >
      <span className="text-[22px] font-medium leading-none text-zinc-800">{symbol}</span>
      {label ? (
        <span className="text-[11px] font-medium text-zinc-400">{label}</span>
      ) : null}
    </span>
  );
}
