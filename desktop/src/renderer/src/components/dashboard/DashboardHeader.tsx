export function DashboardHeader({
  onStartSession,
  onEndSession,
  onRequestUpgrade,
  onHardPaywall,
  canStartSession = true,
  sessionActive = false,
  isStarting = false,
  overlayTimeRemainingLabel,
  isPaid = false,
}: {
  onStartSession: () => void;
  onEndSession?: () => void;
  onRequestUpgrade: () => void;
  onHardPaywall?: () => void;
  canStartSession?: boolean;
  sessionActive?: boolean;
  isStarting?: boolean;
  overlayTimeRemainingLabel?: string;
  isPaid?: boolean;
}) {
  return (
    <div className="no-drag shrink-0 border-b border-zinc-100 bg-white px-8 py-4">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1.5">
          <h1 className="shrink-0 text-[20px] font-semibold tracking-tight text-zinc-900">
            Settings
          </h1>
          <p className="text-[13px] text-zinc-500">
            {sessionActive
              ? "Landed is open — ask about what’s on your screen from the overlay."
              : "Account, billing, and preferences. The overlay opens automatically."}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {!isPaid && overlayTimeRemainingLabel ? (
            <span className="hidden text-[12px] text-zinc-500 sm:inline">
              {canStartSession || sessionActive
                ? overlayTimeRemainingLabel
                : "Free questions used up"}
            </span>
          ) : null}
          {sessionActive && onEndSession ? (
            <button
              type="button"
              onClick={onEndSession}
              className="flex h-9 items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 text-[13px] font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
            >
              End session
            </button>
          ) : null}
          <button
            type="button"
            disabled={isStarting}
            onClick={() => {
              if (sessionActive) {
                onStartSession();
                return;
              }
              if (!canStartSession) {
                if (onHardPaywall) {
                  onHardPaywall();
                } else {
                  onRequestUpgrade();
                }
                return;
              }
              onStartSession();
            }}
            title={
              sessionActive
                ? "Show overlay"
                : isStarting
                  ? "Starting…"
                  : canStartSession
                    ? "Open Landed"
                    : "Upgrade for unlimited questions"
            }
            className="flex h-9 items-center gap-2 rounded-full bg-gradient-to-b from-[#4d9cf8] to-[#3b82f6] px-4 text-[13px] font-medium text-white shadow-[0_2px_8px_rgba(59,130,246,0.3)] transition-opacity hover:opacity-95 disabled:cursor-wait disabled:opacity-70"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden
            >
              <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71L12 2z" />
            </svg>
            {sessionActive
              ? "Show overlay"
              : isStarting
                ? "Starting…"
                : "Open Landed"}
          </button>
        </div>
      </div>
    </div>
  );
}
