export function CommandBarPreview({
  visible = true,
}: {
  visible?: boolean;
}) {
  return (
    <div
      className={`w-full max-w-[520px] transition-all duration-300 ease-out ${
        visible
          ? "translate-y-0 scale-100 opacity-100"
          : "pointer-events-none translate-y-2 scale-[0.98] opacity-0"
      }`}
    >
      <div
        className="overflow-hidden rounded-[22px] border border-white/12 shadow-[0_12px_40px_rgba(0,0,0,0.28)]"
        style={{
          background: "#767879",
          backdropFilter: "blur(28px)",
        }}
      >
        <div className="flex items-center justify-between px-4 py-3.5">
          <span className="flex items-center text-[15px] font-medium text-white/40">
            <span className="mr-0.5 inline-block h-[17px] w-[2px] animate-pulse bg-white/50" />
            Ask anything about your screen
          </span>
          <span className="flex h-8 w-8 items-center justify-center rounded-[10px] border border-white/10 bg-white/[0.04] text-[13px] text-white/30">
            ↵
          </span>
        </div>
      </div>
    </div>
  );
}
