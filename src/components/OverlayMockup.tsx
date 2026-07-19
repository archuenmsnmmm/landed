import { lightPillTheme } from "@/lib/pill-theme";

export function OverlayMockup({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <ControlBar />
      <ResponsePanel />
    </div>
  );
}

function ControlBar() {
  return (
    <div
      className="flex items-center gap-3 rounded-full px-3 py-2"
      style={{
        background: "rgba(255, 255, 255, 0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255, 255, 255, 0.9)",
        boxShadow: "0 4px 24px rgba(0, 0, 0, 0.08)",
      }}
    >
      <div className="flex items-center gap-2 rounded-full bg-[#3b82f6] px-2.5 py-1.5">
        <MicIcon />
        <span className="text-[12px] font-medium tabular-nums text-white">
          00:00
        </span>
      </div>

      <div className="hidden items-center gap-4 sm:flex">
        <span className="text-[12px] text-[#52525b]">
          Ask AI{" "}
          <kbd className="ml-0.5 rounded bg-[#f4f4f5] px-1 py-0.5 text-[10px] font-medium text-[#71717a]">
            ⌘ ↵
          </kbd>
        </span>
        <span className="text-[12px] text-[#52525b]">
          Show/Hide{" "}
          <kbd className="ml-0.5 rounded bg-[#f4f4f5] px-1 py-0.5 text-[10px] font-medium text-[#71717a]">
            ⌘ \
          </kbd>
        </span>
      </div>

      <button
        type="button"
        className="ml-1 flex h-7 w-7 items-center justify-center rounded-full text-[#71717a] transition-colors hover:bg-[#f4f4f5]"
        aria-label="Settings"
      >
        <GearIcon />
      </button>
    </div>
  );
}

function ResponsePanel() {
  return (
    <div
      className="w-full max-w-[680px] rounded-[20px] p-5 text-left"
      style={{
        ...lightPillTheme.glass,
        background: "rgba(255, 255, 255, 0.72)",
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
        boxShadow: "0 8px 40px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)",
      }}
    >
      <div className="mb-3 flex items-center gap-2">
        <SparkleIcon />
        <span className="text-[13px] font-semibold text-[#0a0a0a]">
          AI Response
        </span>
      </div>

      <div className="space-y-3 text-[13px] leading-[1.65] text-[#3f3f46]">
        <p>
          I can see you&apos;re currently viewing the Landed website homepage.
          This page introduces Landed as invisible AI for technical interviews —
          screen-aware answers when you type, hidden from screen share.
        </p>

        <div>
          <p className="font-semibold text-[#0a0a0a]">What is Landed?</p>
          <p className="mt-1">
            Landed is a desktop overlay for technical interviews that captures
            screen context when you ask, then answers in place — no microphone required.
          </p>
        </div>

        <div>
          <p className="font-semibold text-[#0a0a0a]">Features:</p>
          <ol className="mt-1 list-decimal space-y-1 pl-4">
            <li>Sees the problem on your screen when you ask</li>
            <li>Type silently — no mic needed</li>
            <li>Invisible on screen share (Pro)</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

function MicIcon() {
  return (
    <svg
      className="h-3.5 w-3.5 text-white"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
      <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg
      className="h-4 w-4 text-[#3b82f6]"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M12 2l1.09 3.36L16.5 6.5l-3.36 1.09L12 11l-1.09-3.41L7.5 6.5l3.41-1.14L12 2zM5 14l.72 2.22L8 17l-2.28.78L5 20l-.72-2.22L2 17l2.28-.78L5 14zm14 0l.72 2.22L22 17l-2.28.78L19 20l-.72-2.22L16 17l2.28-.78L19 14z" />
    </svg>
  );
}

export function OverlayMockupCompact() {
  return (
    <div className="mx-auto max-w-md rounded-xl border border-zinc-200 bg-zinc-50 p-4">
      <ControlBar />
    </div>
  );
}
