import { useState } from "react";
import {
  getWarmUpgradeMessage,
  shouldShowWarmUpgrade,
} from "../../lib/session-value";
import {
  FREE_OVERLAY_LIMIT_SECONDS,
  formatFreeOverlayRemaining,
  getFreeOverlaySecondsRemaining,
  type MeetingRecord,
  type Plan,
} from "../../store/types";

const DISMISS_KEY = "landed-warm-upgrade-dismissed";

function loadDismissed(): string[] {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function dismissMeeting(meetingId: string) {
  const ids = loadDismissed();
  if (ids.includes(meetingId)) return;
  localStorage.setItem(DISMISS_KEY, JSON.stringify([...ids, meetingId]));
}

export function WarmUpgradePrompt({
  meeting,
  plan,
  freeOverlaySecondsUsed,
  onUpgrade,
}: {
  meeting: MeetingRecord;
  plan: Plan;
  freeOverlaySecondsUsed: number;
  onUpgrade: (message: string) => void;
}) {
  const [dismissed, setDismissed] = useState(loadDismissed);

  if (!shouldShowWarmUpgrade(meeting, plan, dismissed)) {
    return null;
  }

  const remainingSeconds = getFreeOverlaySecondsRemaining(
    plan,
    freeOverlaySecondsUsed,
  );
  const message = getWarmUpgradeMessage(meeting);
  const usedSeconds = FREE_OVERLAY_LIMIT_SECONDS - remainingSeconds;

  const handleDismiss = () => {
    dismissMeeting(meeting.id);
    setDismissed((prev) => [...prev, meeting.id]);
  };

  return (
    <div className="mb-8 rounded-2xl border border-[#3b82f6]/20 bg-gradient-to-r from-[#3b82f6]/[0.06] to-[#3b82f6]/[0.02] p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-[12px] font-semibold uppercase tracking-wider text-[#3b82f6]">
            You&apos;re on a roll
          </p>
          <p className="mt-1 text-[15px] font-medium leading-snug text-zinc-900">
            {message}
          </p>
          {Number.isFinite(remainingSeconds) &&
          remainingSeconds > 0 &&
          remainingSeconds < FREE_OVERLAY_LIMIT_SECONDS ? (
            <p className="mt-1.5 text-[13px] text-zinc-500">
              {formatFreeOverlayRemaining(remainingSeconds)} on the free plan
              {usedSeconds > 0
                ? ` (${Math.ceil(usedSeconds / 60)} min used)`
                : ""}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={handleDismiss}
            className="rounded-lg px-3 py-2 text-[13px] font-medium text-zinc-500 transition-colors hover:text-zinc-700"
          >
            Not now
          </button>
          <button
            type="button"
            onClick={() => onUpgrade(message)}
            className="rounded-xl bg-gradient-to-b from-[#5aa7f9] to-[#3b82f6] px-4 py-2.5 text-[13px] font-medium text-white shadow-[0_2px_8px_rgba(59,130,246,0.3)] transition-opacity hover:opacity-90"
          >
            See plans
          </button>
        </div>
      </div>
    </div>
  );
}
