const features = [
  {
    title: "Sees",
    description:
      "Landed reads the technical interview problem on your display when you ask — coding pads, prompts, docs.",
    icon: EyeIcon,
  },
  {
    title: "Answers",
    description:
      "Type a question in the overlay and get a practical answer without leaving the round.",
    icon: SparkleIcon,
  },
  {
    title: "No mic",
    description:
      "Text-first by design so you stay silent on the call. Screen Recording is the permission that matters.",
    icon: BookIcon,
  },
  {
    title: "Invisible",
    description:
      "On Pro, hide the overlay from screen share so only you see Landed.",
    icon: ShieldIcon,
  },
];

export function InTheMoment() {
  return (
    <section id="product" className="bg-white">
      <div className="mx-auto max-w-[720px] px-6 py-24 md:py-32">
        <h2 className="text-center text-[2rem] font-semibold leading-[1.15] tracking-[-0.03em] text-[#0a0a0a] md:text-[2.5rem]">
          Invisible AI for the technical interview that decides the offer.
        </h2>

        <ul className="mt-16 space-y-10">
          {features.map((feature) => (
            <li key={feature.title} className="flex gap-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e8f0fe]">
                <feature.icon className="h-[18px] w-[18px] text-[#4b8bf5]" />
              </div>
              <div>
                <h3 className="text-[16px] font-semibold text-[#0a0a0a]">
                  {feature.title}
                </h3>
                <p className="mt-1.5 text-[15px] leading-relaxed text-[#71717a]">
                  {feature.description}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l1.5 5.5L19 9l-5.5 1.5L12 16l-1.5-5.5L5 9l5.5-1.5L12 2z" />
    </svg>
  );
}

function BookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 19.5A2.5 2.5 0 016.5 17H20" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
    </svg>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
