import { ActionIcon, KeyHint, QUICK_ACTIONS } from "../../overlay/overlay-ui";
import { LandedLogo } from "../ui";

export function OverlayPreview({
  showTagline = true,
  overlayVisible = true,
}: {
  showTagline?: boolean;
  overlayVisible?: boolean;
}) {
  return (
    <div className="flex w-full max-w-[480px] shrink-0 flex-col items-center">
      <div className="flex items-center gap-0.5 rounded-full border border-black/[0.08] bg-white/90 px-1.5 py-1 shadow-[0_4px_24px_rgba(0,0,0,0.10)] backdrop-blur-xl">
        <div className="pl-0.5">
          <LandedLogo />
        </div>
        <span className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-gray-600">
          Hide
          <svg
            className="h-3 w-3 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </span>
        <span
          className={`mr-0.5 flex h-6 w-6 items-center justify-center rounded-full transition-colors ${
            overlayVisible ? "bg-[#3b82f6]/15" : "bg-black/[0.05]"
          }`}
          aria-hidden
        >
          <span
            className={`inline-block h-2.5 w-2.5 rounded-[2px] transition-colors ${
              overlayVisible ? "bg-[#3b82f6]" : "bg-gray-400"
            }`}
          />
        </span>
      </div>

      <div className="mt-2 w-full overflow-hidden rounded-[20px] border border-black/[0.07] bg-white/92 shadow-[0_8px_40px_rgba(0,0,0,0.10)] backdrop-blur-xl">
        <div className="flex flex-wrap items-center gap-x-1 px-3 py-2.5">
          {QUICK_ACTIONS.map((action, i) => (
            <span key={action.id} className="flex items-center gap-1">
              {i > 0 && (
                <span className="mx-0.5 text-[10px] text-gray-300" aria-hidden>
                  ·
                </span>
              )}
              <span
                className={`flex items-center gap-1 px-1 py-0.5 text-[10px] font-medium ${
                  action.id === "assist" ? "text-gray-800" : "text-gray-400"
                }`}
              >
                <ActionIcon type={action.icon} />
                {action.label}
              </span>
            </span>
          ))}
        </div>

        <div className="space-y-2 px-3 pb-2">
          <div className="flex justify-end">
            <div className="max-w-[85%] rounded-2xl rounded-br-md bg-[#1e3a5f] px-3.5 py-2 text-[12px] leading-snug text-white/90">
              Is it secure? We handle pretty sensitive info.
            </div>
          </div>
          <p className="px-1 text-[13px] leading-[1.6] text-gray-700">
            We&apos;re SOC2 compliant, use end-to-end encryption, and your data is
            private to your org. Plus, you control what&apos;s stored.
          </p>
        </div>

        <div className="px-3 pb-3">
          <div className="relative flex min-h-[88px] flex-col rounded-[14px] bg-gray-50 px-3.5 pb-2.5 pt-3 border border-black/[0.05]">
            <p className="text-[12px] leading-[1.55] text-gray-400">
              Suggestions appear automatically — or type to override,{" "}
              <KeyHint>⌘</KeyHint>
              <KeyHint>↵</KeyHint>
              for Assist
            </p>

            <div className="mt-auto flex items-center justify-between pt-6">
              <div className="flex items-center gap-1">
                <span className="rounded-full bg-black/[0.07] px-2.5 py-0.5 text-[10px] font-medium text-gray-600">
                  Smart
                </span>
                <span className="flex h-6 w-6 items-center justify-center text-gray-400">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="5" cy="12" r="2" />
                    <circle cx="12" cy="12" r="2" />
                    <circle cx="19" cy="12" r="2" />
                  </svg>
                </span>
              </div>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#3b82f6] text-white shadow-[0_2px_12px_rgba(59,130,246,0.35)]">
                <svg
                  className="h-3.5 w-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 12h14M13 6l6 6-6 6"
                  />
                </svg>
              </span>
            </div>
          </div>
        </div>
      </div>

      {showTagline ? (
        <p className="mt-7 text-center text-[15px] font-semibold tracking-[-0.01em] text-zinc-400">
          Sees your screen,
          <br />
          answers when you ask
        </p>
      ) : null}
    </div>
  );
}
