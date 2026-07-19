import type { ReactNode } from "react";
import { SetupReviewPreview, type SetupReview } from "./SetupReviewPreview";
import { SplitScreenShell } from "./SplitScreenShell";

export function SetupShell({
  back,
  children,
  review,
}: {
  back: ReactNode;
  children: ReactNode;
  review: SetupReview;
}) {
  return (
    <div className="relative h-screen max-h-screen w-full min-w-0 overflow-hidden bg-white">
      {back}
      <SplitScreenShell
        rightVariant="white"
        left={
          <div className="flex min-h-full min-w-0 flex-col px-8 py-8 sm:px-12">
            <div className="flex min-w-0 flex-1 flex-col justify-center pb-8">
              <div className="w-full max-w-[360px]">{children}</div>
            </div>
          </div>
        }
        right={<SetupReviewPreview {...review} />}
      />
    </div>
  );
}
