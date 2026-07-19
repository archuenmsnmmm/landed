export function SessionEmptyState({
  onStart,
  isStarting = false,
}: {
  onStart: () => void;
  isStarting?: boolean;
}) {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center px-8 py-16">
      <p className="text-[15px] font-medium text-zinc-800">
        Ready to ask about your screen?
      </p>
      <button
        type="button"
        disabled={isStarting}
        onClick={onStart}
        className="mt-6 cursor-pointer rounded-full bg-gradient-to-b from-[#5aa7f9] to-[#3b82f6] px-6 py-2.5 text-[14px] font-medium text-white shadow-[0_2px_12px_rgba(59,130,246,0.35)] transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-70"
      >
        {isStarting ? "Starting…" : "Start Landed"}
      </button>
    </div>
  );
}
