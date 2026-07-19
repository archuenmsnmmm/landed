import { useLocation, useNavigate } from "react-router-dom";
import { UserAvatar } from "../ui/UserAvatar";
import { useAppStore } from "../../store/useAppStore";

export function DashboardTopBar({
  searchQuery: _searchQuery,
  onSearchChange: _onSearchChange,
}: {
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAppStore((s) => s.user);
  const sessionActive = useAppStore((s) => s.sessionActive);
  const requestSettingsOpen = useAppStore((s) => s.requestSettingsOpen);

  const canGoBack = location.pathname !== "/";

  return (
    <header className="no-drag relative z-20 flex h-[52px] shrink-0 items-center justify-between border-b border-zinc-100 bg-white px-4 pr-4">
      <div className="drag-region absolute inset-y-0 left-0 w-[72px]" aria-hidden />

      <button
        type="button"
        onClick={() => {
          if (canGoBack) navigate(-1);
        }}
        disabled={!canGoBack}
        className={`no-drag relative z-10 ml-[72px] flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
          canGoBack
            ? "text-zinc-400 hover:bg-zinc-200/60 hover:text-zinc-700"
            : "cursor-default text-zinc-300"
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

      <div className="no-drag relative z-10 flex items-center gap-3">
        {sessionActive ? (
          <button
            type="button"
            onClick={() => void window.landed?.requestEndSession?.()}
            className="shrink-0 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-[12px] font-medium text-red-700 transition-colors hover:bg-red-100"
          >
            End session
          </button>
        ) : null}

        <button
          type="button"
          onClick={() => requestSettingsOpen("general")}
          className="shrink-0 overflow-hidden rounded-lg shadow-sm"
          aria-label="Open settings"
        >
          <UserAvatar
            avatar={user?.avatar}
            name={user?.name}
            email={user?.email}
            className="h-8 w-8 rounded-lg text-[13px]"
          />
        </button>
      </div>
    </header>
  );
}
