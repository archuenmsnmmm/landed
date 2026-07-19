import type { Metadata } from "next";
import { CommandKeysGraphic } from "@/components/CommandKeysGraphic";

export const metadata: Metadata = {
  title: "Landed",
  description: "Landed keyboard shortcut",
};

export default function CommandPage() {
  return (
    <div
      className="relative flex min-h-screen items-center justify-end overflow-hidden px-8 md:px-16 lg:px-24"
      style={{
        background: "linear-gradient(180deg, #ffffff 0%, #f5f7fa 100%)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 75% 45%, rgba(191, 219, 254, 0.35) 0%, rgba(245, 247, 250, 0) 65%)",
        }}
        aria-hidden
      />

      <div className="relative mr-[8vw] md:mr-[12vw]">
        <CommandKeysGraphic className="relative h-[220px] w-[260px] shrink-0 md:h-[240px] md:w-[280px]" />
      </div>
    </div>
  );
}
