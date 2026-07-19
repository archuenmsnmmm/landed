import { useEffect, useRef, useState } from "react";
import { legalLinks, openLegalLink } from "../../lib/legal-urls";

export type SetupReview = {
  quote: string;
  authorHandle: string;
  authorInitials: string;
};

export function SetupReviewPreview({ quote, authorHandle, authorInitials }: SetupReview) {
  const [docsOpen, setDocsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!docsOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setDocsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [docsOpen]);

  return (
    <div className="relative flex h-full w-full min-h-0 flex-col bg-white">
      <div ref={menuRef} className="absolute right-6 top-6 z-10">
        <button
          type="button"
          onClick={() => setDocsOpen((open) => !open)}
          className="flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-[12px] font-medium text-zinc-600 shadow-sm transition-colors hover:bg-zinc-50"
        >
          <BookIcon />
          Documentation
        </button>

        {docsOpen ? (
          <div className="absolute right-0 top-full z-20 mt-1.5 min-w-[180px] overflow-hidden rounded-lg border border-zinc-200 bg-white py-1 shadow-lg">
            <button
              type="button"
              onClick={() => {
                openLegalLink(legalLinks.terms);
                setDocsOpen(false);
              }}
              className="block w-full px-3 py-2 text-left text-[12px] text-zinc-700 transition-colors hover:bg-zinc-50"
            >
              Terms of Service
            </button>
            <button
              type="button"
              onClick={() => {
                openLegalLink(legalLinks.privacy);
                setDocsOpen(false);
              }}
              className="block w-full px-3 py-2 text-left text-[12px] text-zinc-700 transition-colors hover:bg-zinc-50"
            >
              Privacy Policy
            </button>
          </div>
        ) : null}
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center px-10 py-16">
        <figure className="relative w-full max-w-[440px]">
          <span
            className="pointer-events-none absolute -left-1 -top-10 select-none text-[112px] font-serif leading-none text-zinc-200"
            aria-hidden
          >
            &ldquo;
          </span>
          <blockquote className="relative text-[26px] font-semibold leading-[1.35] tracking-[-0.02em] text-zinc-900">
            {quote}
          </blockquote>
          <figcaption className="mt-7 flex items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-[11px] font-semibold text-zinc-600">
              {authorInitials}
            </span>
            <span className="text-[13px] font-medium text-zinc-500">{authorHandle}</span>
          </figcaption>
        </figure>
      </div>
    </div>
  );
}

function BookIcon() {
  return (
    <svg
      className="h-3.5 w-3.5 text-zinc-500"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}
