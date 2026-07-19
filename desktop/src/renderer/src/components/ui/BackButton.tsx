import { useNavigate } from "react-router-dom";

export function BackButton({
  to,
  variant = "light",
}: {
  to: string;
  variant?: "light" | "dark";
}) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate(to)}
      className={`no-drag absolute left-[72px] top-[14px] z-10 flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
        variant === "dark"
          ? "text-zinc-500 hover:bg-white/8 hover:text-zinc-300"
          : "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
      }`}
      aria-label="Go back"
    >
      <svg
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
    </button>
  );
}
