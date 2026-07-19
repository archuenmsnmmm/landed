function CommandKey() {
  return (
    <div className="absolute bottom-2 left-0">
      <div
        className="flex h-[88px] w-[88px] items-center justify-center rounded-[18px] bg-[#f8fafc]"
        style={{
          boxShadow:
            "0 0 0 1px rgba(255,255,255,0.9), 0 0 0 2px rgba(255,255,255,0.65), 0 0 24px rgba(255,255,255,0.95), 0 0 48px rgba(255,255,255,0.55), 0 18px 40px rgba(15,23,42,0.12)",
        }}
      >
        <span className="text-[2rem] font-medium leading-none text-[#334155]">⌘</span>
      </div>
    </div>
  );
}

function EnterKey() {
  return (
    <div className="absolute right-0 top-0">
      <div
        className="flex h-[92px] w-[112px] items-center justify-center rounded-[18px] bg-gradient-to-b from-[#ffffff] to-[#eef2f7]"
        style={{
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.95), 0 1px 0 rgba(255,255,255,0.8), 0 16px 36px rgba(15,23,42,0.14)",
        }}
      >
        <svg
          className="h-9 w-9 text-[#64748b]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M9 14l-4 4 4 4" />
          <path d="M20 4v7a4 4 0 0 1-4 4H5" />
        </svg>
      </div>
    </div>
  );
}

export function CommandKeysGraphic({
  className = "relative h-[200px] w-[240px] shrink-0",
}: {
  className?: string;
}) {
  return (
    <div className={className} aria-hidden>
      <CommandKey />
      <EnterKey />
    </div>
  );
}
