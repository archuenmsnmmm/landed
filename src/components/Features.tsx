const features = [
  {
    title: "Sees the bug",
    description:
      "When you ask, Landed captures the stack trace, IDE, or error so fixes stay grounded in what’s on your screen.",
    icon: "👁",
  },
  {
    title: "Type to ask",
    description:
      "Ask in the overlay by typing. Screen Recording is required; microphone is optional for live transcription.",
    icon: "⌨",
  },
  {
    title: "Stays on top",
    description:
      "A lightweight overlay over LeetCode, CoderPad, Zoom, Meet, or Docs.",
    icon: "↔",
  },
  {
    title: "Invisible on screen share",
    description:
      "On Pro, hide the overlay from screen share so only you see Landed.",
    icon: "⚡",
  },
];

export function Features() {
  return (
    <section id="features" className="border-t border-zinc-200">
      <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-zinc-900 md:text-4xl">
            Built so you never have to debug alone
          </h2>
          <div className="mx-auto my-5 h-px w-12 bg-zinc-300" />
          <p className="text-[15px] leading-relaxed text-zinc-500">
            AI that sees the bug on your screen — and stays off theirs.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-zinc-200 bg-white p-8 transition-shadow hover:shadow-md"
            >
              <span className="text-2xl">{feature.icon}</span>
              <h3 className="mt-4 text-lg font-semibold text-zinc-900">
                {feature.title}
              </h3>
              <p className="mt-2 text-[14px] leading-relaxed text-zinc-500">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const stats = [
  { value: "0", label: "Mic required", detail: "Type silently during the round" },
  { value: "On ask", label: "Screen context", detail: "Frames only when you send a question" },
  { value: "Pro", label: "Invisible share", detail: "Hide overlay from screen share" },
];

export function Stats() {
  return (
    <section className="border-t border-zinc-200 bg-zinc-50/50">
      <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-zinc-900 md:text-4xl">
            Built to stay invisible on screen share
          </h2>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl font-semibold tracking-tight text-zinc-900">
                {stat.value}
              </p>
              <p className="mt-2 text-[15px] font-medium text-zinc-800">{stat.label}</p>
              <p className="mt-1 text-[13px] text-zinc-500">{stat.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
