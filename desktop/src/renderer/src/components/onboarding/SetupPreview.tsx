import { LandedLogo } from "../ui";

export function SetupPreview() {
  return (
    <div className="relative flex h-full w-full min-h-0 items-end justify-end p-8">
      <LandedLogo variant="mark" className="h-[min(36vh,260px)] w-[min(36vh,260px)] opacity-90" />
    </div>
  );
}
