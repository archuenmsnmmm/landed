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

const askLines = [
  { label: "You", text: "What’s the optimal approach for merge intervals?" },
  { label: "Landed", text: "Sort by start time, then merge overlapping ranges in one pass — O(n log n)." },
  { label: "You", text: "How do I explain that out loud?" },
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
    <div className="rounded-[28px] bg-[#eef2f7] p-5 md:p-7">
      <div className="overflow-hidden rounded-[22px] border border-[#e4e4e7] bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
        <div className="border-b border-[#f0f0f2] px-5 py-4 md:px-6">
          <p className="text-[12px] font-medium text-[#a1a1aa]">Ask during the technical interview</p>
          <p className="mt-2 text-[13px] text-[#71717a]">
            Landed reads the problem on screen, then answers in the overlay.
          </p>
        </div>

        <div className="space-y-4 px-5 py-5 md:px-6 md:py-6">
          {askLines.map((line) => (
            <div key={line.text}>
              <p
                className={`text-[11px] font-semibold uppercase tracking-wider ${
                  line.label === "Landed" ? "text-[#4b8bf5]" : "text-[#a1a1aa]"
                }`}
              >
                {line.label}
              </p>
              <p className="mt-1 text-[13px] leading-[1.65] text-[#52525b]">{line.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
