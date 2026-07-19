import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { OnboardingShell } from "../../components/onboarding/OnboardingShell";
import { PillButton, Switch } from "../../components/ui";
import { funnelStateFromStore, getOnboardingFunnelRoute } from "../../lib/onboarding-flow";
import { notifyAppStoreChanged, useAppStore } from "../../store/useAppStore";

export function OnboardingPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const onboardingComplete = useAppStore((s) => s.onboardingComplete);
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);
  const [granted, setGranted] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const finishingRef = useRef(false);

  const finish = useCallback(() => {
    if (finishingRef.current) return;
    finishingRef.current = true;
    completeOnboarding();
    notifyAppStoreChanged();
    const next = getOnboardingFunnelRoute({
      ...funnelStateFromStore(),
      onboardingComplete: true,
    });
    navigate(next ?? "/");
  }, [completeOnboarding, navigate]);

  const refresh = useCallback(async () => {
    const status = await window.landed?.getPermissionStatus?.();
    const screen = status?.screen ?? false;
    setGranted(screen);
    return screen;
  }, []);

  useEffect(() => {
    void window.landed?.setDashboardLayout?.("onboarding");
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/auth", { replace: true });
      return;
    }
    if (onboardingComplete) {
      const next = getOnboardingFunnelRoute(funnelStateFromStore());
      navigate(next ?? "/", { replace: true });
      return;
    }
    // First-time funnel: host must be visible for screen-permission onboarding.
    void window.landed?.focusDashboard?.("/onboarding");
  }, [isAuthenticated, onboardingComplete, navigate]);

  useEffect(() => {
    void refresh();
    const id = setInterval(() => void refresh(), 800);
    const onFocus = () => {
      void refresh();
    };
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [refresh]);

  const requestScreen = async () => {
    setError(null);
    setRequesting(true);
    try {
      // Capture once so macOS shows the Screen Recording prompt for Landed.
      await window.landed?.captureScreen?.();
      await window.landed?.openPermissionSettings?.("screen");
      const ok = await refresh();
      if (!ok) {
        setError(
          "Screen access is still off. Enable Landed in System Settings → Privacy & Security → Screen Recording.",
        );
      }
    } finally {
      setRequesting(false);
    }
  };

  const handleToggle = () => {
    if (requesting) return;
    if (granted) {
      void window.landed?.openPermissionSettings?.("screen");
      return;
    }
    void requestScreen();
  };

  return (
    <OnboardingShell>
      <div className="flex h-14 w-14 items-center justify-center rounded-[14px] bg-[#eff6ff] text-[#3b82f6]">
        <ScreenIcon className="h-7 w-7" />
      </div>

      <h1 className="mt-5 text-[24px] font-semibold leading-tight tracking-[-0.025em] text-zinc-900">
        Allow screen access
      </h1>
      <p className="mt-2 text-[14px] leading-relaxed text-zinc-500">
        Landed needs to see your screen so it can answer questions about what you&apos;re looking at.
        Frames are only sent when you ask.
      </p>

      <div
        className={`mt-7 flex w-full items-center justify-between gap-4 rounded-2xl border px-4 py-3.5 text-left transition-colors ${
          granted
            ? "border-[#dbeafe] bg-[#f8fbff]"
            : "border-zinc-200 bg-zinc-50/80"
        }`}
      >
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
              granted
                ? "bg-[#eff6ff] text-[#3b82f6]"
                : "bg-white text-zinc-500 shadow-sm"
            }`}
          >
            <ScreenIcon className="h-[18px] w-[18px]" />
          </span>
          <div className="min-w-0">
            <p className="text-[14px] font-medium text-zinc-900">Screen Recording</p>
            <p
              className={`text-[12px] font-medium ${
                granted ? "text-[#3b82f6]" : "text-zinc-400"
              }`}
            >
              {requesting ? "Requesting…" : granted ? "On" : "Off"}
            </p>
          </div>
        </div>
        <Switch
          checked={granted}
          disabled={requesting}
          onClick={handleToggle}
          aria-label={
            granted
              ? "Screen access on — open settings to turn off"
              : "Turn on screen access"
          }
          checkedClassName="bg-[#3b82f6]"
          uncheckedClassName="bg-zinc-300"
        />
      </div>

      {error ? (
        <p className="mt-4 w-full rounded-xl bg-red-50 px-3 py-2 text-left text-[12px] text-red-600">
          {error}
        </p>
      ) : null}

      {granted ? (
        <PillButton type="button" onClick={finish} className="mt-6">
          Continue
        </PillButton>
      ) : (
        <button
          type="button"
          onClick={finish}
          className="mt-6 text-[13px] text-zinc-400 transition-colors hover:text-zinc-600"
        >
          Skip for now
        </button>
      )}
    </OnboardingShell>
  );
}

function ScreenIcon({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.75}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 17.25v.75a.75.75 0 01-.75.75h-3a.75.75 0 01-.75-.75V6a1.5 1.5 0 011.5-1.5h12A1.5 1.5 0 0119.5 6v12a.75.75 0 01-.75.75h-3a.75.75 0 01-.75-.75v-.75M9 17.25h6"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}
