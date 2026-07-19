import type { ReactNode } from "react";

/** Left column content wrapper — min-w-0 prevents flex overflow clipping in split layouts. */
export function SplitScreenLeft({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full min-w-0 flex-col px-8 py-10 sm:px-10">
      {children}
    </div>
  );
}

export function SplitScreenLeftBody({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col justify-center">{children}</div>
  );
}
