import { useCallback, useEffect, useState } from "react";
import {
  fetchSessionPermissionStatus,
  getBlockingSessionPermissions,
  getMissingSessionPermissions,
  performSessionStart,
  type SessionPermissionKey,
} from "../../lib/start-session";

const PERMISSION_COPY: Record<
  SessionPermissionKey,
  { title: string; description: string; settingsLabel: string }
> = {
  accessibility: {
    title: "Accessibility",
    description:
      "Lets Landed appear on any screen with one hotkey and control the overlay.",
    settingsLabel: "Open Accessibility Settings",
  },
  screen: {
    title: "Screen Recording",
    description:
      "Landed needs to see your screen to answer questions about what you're looking at. Frames are only sent when you ask.",
    settingsLabel: "Open Screen Recording Settings",
  },
};

export function SessionPermissionsModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [missing, setMissing] = useState<SessionPermissionKey[]>([]);
  const [blocking, setBlocking] = useState<SessionPermissionKey[]>([]);
  const [busy, setBusy] = useState(false);
  const [opening, setOpening] = useState<SessionPermissionKey | null>(null);

  const refresh = useCallback(async () => {
    const status = await fetchSessionPermissionStatus();
    setMissing(getMissingSessionPermissions(status));
    setBlocking(getBlockingSessionPermissions(status));
  }, []);

  useEffect(() => {
    if (!open) return;

    void refresh();

    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    const id = window.setInterval(() => void refresh(), 1500);

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
      window.clearInterval(id);
    };
  }, [open, refresh]);

  const openSettings = async (key: SessionPermissionKey) => {
    setOpening(key);
    try {
      if (key === "screen") {
        await window.landed?.captureScreen?.();
      }
      await window.landed?.openPermissionSettings?.(key);
      window.setTimeout(() => void refresh(), 400);
      window.setTimeout(() => void refresh(), 1200);
    } finally {
      setOpening(null);
    }
  };

  const handleStart = async () => {
    if (busy || blocking.length > 0) return;
    setBusy(true);
    try {
      const started = await performSessionStart();
      if (started) {
        onClose();
        return;
      }
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-6">
      <div
        className="absolute inset-0 bg-zinc-900/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-labelledby="session-permissions-title"
        className="no-drag relative w-full max-w-[440px] rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
          aria-label="Close"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2
          id="session-permissions-title"
          className="pr-8 text-[20px] font-semibold tracking-tight text-zinc-900"
        >
          Allow Landed on your Mac
        </h2>
        <p className="mt-2 text-[14px] leading-relaxed text-zinc-500">
          macOS needs a couple of permissions before Landed can see your screen and help.
        </p>

        <ul className="mt-5 space-y-4">
          {(["accessibility", "screen"] as const).map((key) => {
            const granted = !missing.includes(key);
            const copy = PERMISSION_COPY[key];
            return (
              <li
                key={key}
                className={`rounded-xl border px-4 py-3.5 ${
                  granted
                    ? "border-emerald-200 bg-emerald-50/50"
                    : "border-zinc-200 bg-zinc-50/50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                      granted
                        ? "bg-emerald-500 text-white"
                        : "bg-zinc-200 text-zinc-500"
                    }`}
                    aria-hidden
                  >
                    {granted ? "✓" : "!"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-medium text-zinc-900">{copy.title}</p>
                    <p className="mt-1 text-[13px] leading-relaxed text-zinc-500">
                      {copy.description}
                    </p>
                    {!granted ? (
                      <button
                        type="button"
                        disabled={opening === key}
                        onClick={() => void openSettings(key)}
                        className="mt-3 rounded-full border border-zinc-300 bg-white px-3.5 py-1.5 text-[12px] font-medium text-zinc-800 transition-colors hover:bg-zinc-50 disabled:opacity-50"
                      >
                        {opening === key ? "Opening…" : copy.settingsLabel}
                      </button>
                    ) : (
                      <p className="mt-2 text-[12px] font-medium text-emerald-700">Allowed</p>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 flex-1 items-center justify-center rounded-full border border-zinc-200 text-[14px] font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
          >
            Not now
          </button>
          <button
            type="button"
            disabled={busy || blocking.length > 0}
            onClick={() => void handleStart()}
            className="flex h-10 flex-1 items-center justify-center rounded-full bg-gradient-to-b from-[#5aa7f9] to-[#3b82f6] text-[14px] font-medium text-white shadow-[0_2px_10px_rgba(59,130,246,0.35)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? "Starting…" : "Start Landed"}
          </button>
        </div>
      </div>
    </div>
  );
}
