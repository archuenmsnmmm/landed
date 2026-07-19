/** Shared compact shell for auth + onboarding funnel screens. */
export function OnboardingShell({
  children,
  footer,
}: {
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="relative flex h-screen max-h-screen w-full min-w-0 flex-col overflow-hidden bg-white">
      <div className="drag-region h-11 w-full shrink-0" aria-hidden />
      <div className="no-drag flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-8 pb-6">
        <div className="mx-auto flex min-h-full w-full min-w-0 max-w-[320px] flex-col text-center">
          <div className="flex min-w-0 flex-1 flex-col items-center justify-center py-4">
            {children}
          </div>
          {footer ? <div className="mt-6 shrink-0 pb-1">{footer}</div> : null}
        </div>
      </div>
    </div>
  );
}
