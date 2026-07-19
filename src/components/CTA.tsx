import { CommandKeysGraphic } from "./CommandKeysGraphic";
import { DownloadButtons } from "./DownloadLink";

export function CTA({
  className = "bg-[#f7f8fa]",
  showGlow = true,
}: {
  className?: string;
  showGlow?: boolean;
}) {
  return (
    <section className={`relative overflow-hidden ${className}`}>
      {showGlow ? (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(191, 219, 254, 0.45) 0%, rgba(247, 248, 250, 0) 70%)",
          }}
          aria-hidden
        />
      ) : null}

      <div className="relative mx-auto flex max-w-[1200px] items-center justify-between gap-12 px-6 py-24 md:py-32">
        <div className="max-w-[560px]">
          <h2 className="text-[2rem] font-semibold leading-[1.15] tracking-[-0.03em] text-[#0a0a0a] md:text-[2.5rem]">
            Invisible AI for technical interviews.
          </h2>
          <p className="mt-4 text-[16px] text-[#6b7c93] md:text-[17px]">
            See the problem. Type the question. Stay off screen share. Download
            Landed and walk into the next round ready.
          </p>
          <div className="mt-8">
            <DownloadButtons
              className="flex flex-wrap items-center gap-3"
              buttonClassName="inline-flex h-12 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[#0a0a0a] px-6 text-[15px] font-medium text-white transition-colors hover:bg-[#1f1f1f]"
            />
          </div>
        </div>

        <CommandKeysGraphic className="relative hidden h-[200px] w-[240px] shrink-0 md:block" />
      </div>
    </section>
  );
}
