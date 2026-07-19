"use client";

import { useState } from "react";

export type FaqItem = {
  q: string;
  a: string;
};

const defaultFaqs: FaqItem[] = [
  {
    q: "What is Landed?",
    a: "Landed is invisible AI for technical interviews. It sees the problem on your screen, answers when you type, and can stay hidden from screen share — so you get help without leaving the round.",
  },
  {
    q: "How does Landed see my screen?",
    a: "When you ask a question, Landed captures what’s on your display (the coding pad, prompt, or doc) and uses that context to answer. Frames are only sent when you ask — not continuously recorded.",
  },
  {
    q: "Do I need a microphone?",
    a: "No. Landed is text-first: type into the overlay during the technical interview and get answers about what’s on screen. Screen Recording permission is what you need — not a mic.",
  },
  {
    q: "Who is Landed for?",
    a: "Candidates in technical interviews — coding rounds, system design, take-homes, and live problem-solving — who want screen-aware answers without switching windows or talking to a mic.",
  },
  {
    q: "Is Landed free?",
    a: "Yes. Free includes 15 AI questions on gpt-4o-mini. Pro and Lifetime unlock unlimited questions, a stronger coding model, invisible overlay on screen share, and 24/7 support. Lifetime is a one-time purchase.",
  },
  {
    q: "Can the interviewer see the overlay if I share my screen?",
    a: "On Pro and Lifetime, you can hide the Landed overlay from screen share so only you see it — that’s the invisible part.",
  },
  {
    q: "Can I talk to customer support?",
    a: "Yes. Pro and Lifetime customers get 24/7 support. Email us anytime at landed.support@gmail.com.",
  },
];

export function FAQ({
  faqs = defaultFaqs,
  id = "faq",
  className = "bg-white",
}: {
  faqs?: readonly FaqItem[];
  id?: string;
  className?: string;
}) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id={id} className={className}>
      <div className="mx-auto max-w-[1200px] px-6 py-24 md:py-32">
        <h2 className="text-[2rem] font-semibold tracking-[-0.03em] text-[#0a0a0a] md:text-[2.5rem]">
          Frequently asked questions
        </h2>

        <div className="mt-12 border-t border-[#ececef]">
          {faqs.map((faq, i) => (
            <div key={faq.q} className="border-b border-[#ececef]">
              <button
                type="button"
                onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center justify-between gap-6 py-5 text-left md:py-6"
              >
                <span className="text-[15px] font-normal text-[#0a0a0a] md:text-[16px]">
                  {faq.q}
                </span>
                <ChevronIcon
                  className={`h-4 w-4 shrink-0 text-[#a1a1aa] transition-transform duration-200 ${
                    open === i ? "rotate-180" : ""
                  }`}
                />
              </button>
              {open === i ? (
                <p className="pb-5 pr-10 text-[14px] leading-[1.65] text-[#71717a] md:pb-6 md:text-[15px]">
                  {faq.a}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}
