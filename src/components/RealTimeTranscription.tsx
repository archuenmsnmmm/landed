import Image from "next/image";

const highlights = [
  {
    value: "Any app",
    title: "Technical interview overlay",
    description:
      "Floats over LeetCode, CoderPad, Zoom, Meet, or Docs — stay in the round without tab-switching.",
  },
  {
    value: "0",
    title: "Mic required",
    description:
      "Type silently. Landed uses your screen for context, not your microphone — so you stay invisible on the call.",
  },
  {
    value: "On ask",
    title: "Screen context",
    description:
      "A snapshot is captured when you send a question — not a continuous recording of the technical interview.",
  },
];

export function RealTimeTranscription() {
  return (
    <section id="transcription" className="border-t border-[#f0f0f2] bg-white">
      <div className="mx-auto max-w-[1200px] px-6 py-24 md:py-32">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <AskMockup />

          <div>
            <h2 className="text-[2rem] font-semibold leading-[1.15] tracking-[-0.03em] text-[#0a0a0a] md:text-[2.5rem]">
              Ask about the problem. Get the answer in place.
            </h2>

            <div className="mt-10 divide-y divide-[#ececef]">
              {highlights.map((item) => (
                <div
                  key={item.title}
                  className="grid grid-cols-[88px_1fr] gap-6 py-7 first:pt-0 last:pb-0 md:grid-cols-[104px_1fr] md:gap-8"
                >
                  <p className="text-[1.5rem] font-semibold leading-none tracking-[-0.03em] text-[#0a0a0a] md:text-[1.75rem]">
                    {item.value}
                  </p>
                  <div>
                    <h3 className="text-[15px] font-semibold text-[#0a0a0a] md:text-[16px]">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-[14px] leading-[1.65] text-[#71717a] md:text-[15px]">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function AskMockup() {
  return (
    <div className="overflow-hidden rounded-[28px]">
      <Image
        src="/image.png"
        alt="Landed overlay showing problem statement, thoughts, and solution during a technical interview"
        width={1504}
        height={1416}
        draggable={false}
        className="h-auto w-full"
      />
    </div>
  );
}
