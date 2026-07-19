import Image from "next/image";

export function DashboardMockup() {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#e4e4e7] bg-white shadow-[0_24px_80px_rgba(0,0,0,0.08)]">
      <Image
        src="/live-session-summary.png"
        alt="Live session summary with transcript and coaching insights"
        width={1024}
        height={642}
        sizes="(max-width: 1100px) 100vw, 1100px"
        className="block h-auto w-full"
        draggable={false}
      />
    </div>
  );
}
