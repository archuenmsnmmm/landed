import { DashboardMockup } from "./DashboardMockup";

const columns = [
  {
    title: "Screen-aware answers",
    description:
      "Ask about the technical interview problem on your display and get a direct answer.",
    icon: BoltIcon,
  },
  {
    title: "Session history",
    description:
      "Review past asks and answers from practice and live rounds anytime.",
    icon: ChartIcon,
  },
  {
    title: "Your context",
    description:
      "Add notes and files so Landed answers in your stack and style.",
    icon: BookIcon,
  },
  {
    title: "Stay invisible",
    description:
      "Overlay answers without switching windows — hide from screen share on Pro.",
    icon: ChartIcon,
  },
];

export function TeamPerformance() {
  return (
    <section id="use-cases" className="border-t border-[#f0f0f2] bg-[#fafafa]">
      <div className="mx-auto max-w-[1100px] px-6 py-24 md:py-32">
        <h2 className="mx-auto max-w-[640px] text-center text-[2rem] font-semibold leading-[1.15] tracking-[-0.03em] text-[#0a0a0a] md:text-[2.5rem]">
          Ask about the problem. Stay in the technical interview.
        </h2>

        <div className="mt-14">
          <DashboardMockup />
        </div>

        <div className="mt-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {columns.map((col) => (
            <div key={col.title}>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e8f0fe]">
                <col.icon className="h-[16px] w-[16px] text-[#4b8bf5]" />
              </div>
              <h3 className="mt-4 text-[15px] font-semibold text-[#0a0a0a]">
                {col.title}
              </h3>
              <p className="mt-2 text-[14px] leading-[1.6] text-[#52525b]">
                {col.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function BoltIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}

function BookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}
