import { CommandBarPreview } from "./CommandBarPreview";

export function TryLandedPreview({
  overlayVisible = true,
}: {
  overlayVisible?: boolean;
}) {
  return (
    <div className="relative h-full w-full overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative z-10 flex h-full w-full items-start justify-center px-10 pt-16">
        <CommandBarPreview visible={overlayVisible} />
      </div>
    </div>
  );
}
