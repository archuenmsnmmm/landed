import { useEffect, type ReactNode } from "react";

export function SplitScreenShell({
  left,
  right,
  variant = "light",
  rightVariant = "default",
}: {
  left: ReactNode;
  right: ReactNode;
  variant?: "light" | "dark";
  rightVariant?: "default" | "grid" | "grid-preview" | "edge-image" | "white";
}) {
  useEffect(() => {
    void window.landed?.setDashboardLayout?.("onboarding");
  }, []);

  const isDark = variant === "dark";

  return (
    <div
      className={`flex h-screen max-h-screen w-full min-w-0 overflow-hidden ${isDark ? "bg-[#0a0a0a]" : "bg-white"}`}
    >
      <div className="no-drag flex h-full min-h-0 w-[46%] min-w-0 max-w-[520px] shrink-0 flex-col overflow-x-hidden overflow-y-auto overscroll-contain">
        {left}
      </div>
      <div
        className={`no-drag flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden overscroll-contain ${
          rightVariant === "edge-image"
            ? "bg-white"
            : rightVariant === "white"
              ? "items-center justify-center overflow-y-auto bg-white px-10 py-8"
              : rightVariant === "grid-preview"
                ? "bg-[#f5f5f7]"
                : rightVariant === "grid"
                  ? "items-center justify-center overflow-y-auto bg-[#f5f5f7] px-10 py-8"
                  : `items-center justify-center overflow-y-auto px-10 py-8 ${
                      isDark ? "bg-black" : "bg-[#f5f5f7]"
                    }`
        }`}
      >
        {right}
      </div>
    </div>
  );
}
