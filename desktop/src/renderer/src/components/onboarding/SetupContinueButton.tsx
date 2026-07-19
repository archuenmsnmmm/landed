export function SetupContinueButton({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="mt-6 flex h-10 w-full max-w-[320px] items-center justify-center rounded-lg bg-gradient-to-b from-[#5aa7f9] to-[#3b82f6] text-[13px] font-medium text-white shadow-[0_2px_8px_rgba(59,130,246,0.3)] transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:from-zinc-200 disabled:to-zinc-200 disabled:text-zinc-400 disabled:shadow-none"
    >
      {children}
    </button>
  );
}
