const steps = [
  {
    title: "Start Landed before the round",
    description:
      "Open the desktop app and click Start Landed. Allow Screen Recording so Landed can see the problem when you ask.",
  },
  {
    title: "Ask about what’s on screen",
    description:
      "Type a question in the overlay — approach, edge cases, bugs, what to say next. Press Enter to send.",
  },
  {
    title: "Stay invisible on the call",
    description:
      "Landed streams the answer in the overlay. On Pro, hide it from screen share so only you see it. No mic needed.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-white">
      <div className="mx-auto max-w-[720px] px-6 py-24 md:py-32">
        <h2 className="text-center text-[2rem] font-semibold leading-[1.15] tracking-[-0.03em] text-[#0a0a0a] md:text-[2.5rem]">
          How Landed works in a technical interview
        </h2>

        <ol className="mt-16 space-y-10">
          {steps.map((step, i) => (
            <li key={step.title} className="flex gap-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e8f0fe] text-[14px] font-semibold text-[#4b8bf5]">
                {i + 1}
              </span>
              <div>
                <h3 className="text-[16px] font-semibold text-[#0a0a0a]">
                  {step.title}
                </h3>
                <p className="mt-1.5 text-[15px] leading-relaxed text-[#71717a]">
                  {step.description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
