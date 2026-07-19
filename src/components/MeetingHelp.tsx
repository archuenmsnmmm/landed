export function MeetingHelp() {
  return (
    <section id="product" className="border-t border-[#f0f0f2] bg-white">
      <div className="mx-auto max-w-[1080px] px-6 pb-20 pt-14 md:pb-28 md:pt-20">
        <h2 className="text-[1.85rem] font-semibold leading-[1.15] tracking-[-0.03em] text-[#0a0a0a] md:text-[2.25rem]">
          Sees the technical interview. Answers before you freeze.
        </h2>

        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          <SeesCard />
          <AskCard />
        </div>
      </div>
    </section>
  );
}

function SeesCard() {
  return (
    <div className="relative flex min-h-[360px] flex-col overflow-hidden rounded-[22px] bg-[#4b8bf5] px-5 pb-7 pt-7 md:min-h-[380px] md:px-7 md:pt-8">
      <div>
        <h3 className="text-[1.1rem] font-medium leading-[1.35] tracking-[-0.02em] text-white md:text-[1.2rem]">
          Landed{" "}
          <span className="mx-1 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-0.5 align-middle text-[0.9rem] font-medium backdrop-blur-sm md:text-[0.95rem]">
            <EyeIcon className="h-3 w-3 text-white" />
            sees
          </span>{" "}
          the problem on your screen
        </h3>
        <p className="mt-2.5 max-w-[340px] text-[13px] leading-[1.55] text-white/75">
          LeetCode, system design, docs, take-homes — Landed reads what&apos;s on
          screen when you ask, so answers stay grounded in the round you&apos;re in.
        </p>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center py-5">
        <div className="flex h-20 w-28 items-center justify-center rounded-2xl border border-white/25 bg-white/10 backdrop-blur-sm">
          <EyeIcon className="h-10 w-10 text-white" />
        </div>
        <p className="mt-4 text-[13px] font-medium text-white/85">Technical interview context on ask</p>
        <p className="mt-1 text-[11px] text-white/65">Frames only leave your machine when you send a question</p>
      </div>
    </div>
  );
}

function AskCard() {
  return (
    <div className="relative flex min-h-[360px] flex-col overflow-hidden rounded-[22px] border border-[#ececef] bg-[#f7f8fa] px-5 pb-7 pt-7 md:min-h-[380px] md:px-7 md:pt-8">
      <div>
        <h3 className="text-[1.1rem] font-medium leading-[1.35] tracking-[-0.02em] text-[#0a0a0a] md:text-[1.2rem]">
          Type a question and Landed{" "}
          <span className="mx-1 inline-flex items-center gap-1.5 rounded-full border border-[#e4e4e7] bg-white px-2.5 py-0.5 align-middle text-[0.9rem] font-medium text-[#0a0a0a] shadow-sm md:text-[0.95rem]">
            <PlusIcon className="h-3 w-3 text-[#4b8bf5]" />
            answers
          </span>{" "}
          instantly
        </h3>
        <p className="mt-2.5 max-w-[340px] text-[13px] leading-[1.55] text-[#71717a]">
          No microphone. Ask for the approach, the bug, or what to say next —
          press ↵ or ⌘ Enter anytime. Stay invisible on the call.
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center py-5">
        <KeyboardShortcutGraphic />
      </div>
    </div>
  );
}

function KeyboardShortcutGraphic() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex flex-col items-center gap-1.5">
        <div
          className="flex h-[68px] w-[68px] items-center justify-center rounded-[14px] bg-gradient-to-b from-white to-[#eef2f7]"
          style={{
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.95), 0 1px 0 rgba(255,255,255,0.8), 0 12px 28px rgba(15,23,42,0.1)",
          }}
        >
          <span className="text-[1.6rem] font-medium leading-none text-[#334155]">⌘</span>
        </div>
        <span className="text-[10px] font-medium text-[#a1a1aa]">command</span>
      </div>

      <span className="mb-4 text-[16px] font-light text-[#d4d4d8]" aria-hidden>
        +
      </span>

      <div
        className="flex h-[68px] w-[84px] items-center justify-center rounded-[14px] bg-gradient-to-b from-white to-[#eef2f7]"
        style={{
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.95), 0 1px 0 rgba(255,255,255,0.8), 0 12px 28px rgba(15,23,42,0.1)",
        }}
      >
        <EnterIcon className="h-7 w-7 text-[#64748b]" />
      </div>
    </div>
  );
}

function EyeIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function PlusIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8 3v10M3 8h10" strokeLinecap="round" />
    </svg>
  );
}

function EnterIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 14l-4 4 4 4" />
      <path d="M20 4v7a4 4 0 0 1-4 4H5" />
    </svg>
  );
}
